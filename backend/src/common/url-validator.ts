import * as dns from 'dns';
import * as net from 'net';

/**
 * Validates whether an IP address belongs to private, loopback, link-local,
 * multicast, or reserved ranges that should never be reached via SSRF.
 */
export function isPrivateOrReservedIp(ip: string): boolean {
  // Normalize IPv4-mapped IPv6 addresses (e.g. ::ffff:127.0.0.1)
  if (ip.startsWith('::ffff:')) {
    ip = ip.substring(7);
  }

  if (net.isIPv4(ip)) {
    const parts = ip.split('.').map((p) => parseInt(p, 10));
    if (parts.length !== 4 || parts.some((p) => isNaN(p) || p < 0 || p > 255)) {
      return true; // malformed, treat as unsafe
    }

    const [a, b] = parts;

    // 0.0.0.0/8 - Current network
    if (a === 0) return true;

    // 127.0.0.0/8 - Loopback
    if (a === 127) return true;

    // 10.0.0.0/8 - Private network (RFC 1918)
    if (a === 10) return true;

    // 172.16.0.0/12 - Private network (RFC 1918: 172.16.0.0 - 172.31.255.255)
    if (a === 172 && b >= 16 && b <= 31) return true;

    // 192.168.0.0/16 - Private network (RFC 1918)
    if (a === 192 && b === 168) return true;

    // 169.254.0.0/16 - Link-local / Cloud Metadata (169.254.169.254)
    if (a === 169 && b === 254) return true;

    // 100.64.0.0/10 - Carrier-grade NAT
    if (a === 100 && b >= 64 && b <= 127) return true;

    // 198.18.0.0/15 - Network benchmark tests
    if (a === 198 && (b === 18 || b === 19)) return true;

    // 224.0.0.0/4 - Multicast
    if (a >= 224 && a <= 239) return true;

    // 240.0.0.0/4 - Reserved for future use & 255.255.255.255 broadcast
    if (a >= 240) return true;

    return false;
  }

  if (net.isIPv6(ip)) {
    const lower = ip.toLowerCase();

    // ::1 loopback
    if (lower === '::1' || lower === '0:0:0:0:0:0:0:1') return true;

    // :: unspecified
    if (lower === '::' || lower === '0:0:0:0:0:0:0:0') return true;

    // fe80::/10 link-local
    if (lower.startsWith('fe8') || lower.startsWith('fe9') || lower.startsWith('fea') || lower.startsWith('feb')) {
      return true;
    }

    // fc00::/7 unique local address (ULA - IPv6 private)
    if (lower.startsWith('fc') || lower.startsWith('fd')) {
      return true;
    }

    // ff00::/8 multicast
    if (lower.startsWith('ff')) {
      return true;
    }

    return false;
  }

  // Not a valid IP
  return true;
}

/**
 * Validates a target URL against SSRF vulnerabilities:
 * - Must be http or https
 * - Disallows private/reserved IP addresses and internal hostnames
 * - Resolves hostname via DNS and checks all returned IPs
 */
export async function validatePublicUrl(urlString: string): Promise<{ valid: boolean; reason?: string; parsedUrl?: URL }> {
  try {
    const parsed = new URL(urlString);

    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return { valid: false, reason: 'Only HTTP and HTTPS protocols are allowed.' };
    }

    const hostname = parsed.hostname.toLowerCase();

    // Block localhost and standard internal hostnames
    if (
      hostname === 'localhost' ||
      hostname.endsWith('.localhost') ||
      hostname.endsWith('.local') ||
      hostname.endsWith('.internal') ||
      hostname.endsWith('.lan') ||
      hostname === 'metadata.google.internal'
    ) {
      return { valid: false, reason: 'Access to internal or local hostnames is strictly forbidden.' };
    }

    // If hostname is directly an IP literal
    if (net.isIP(hostname)) {
      if (isPrivateOrReservedIp(hostname)) {
        return { valid: false, reason: 'Target IP is in a private or reserved network range.' };
      }
      return { valid: true, parsedUrl: parsed };
    }

    // Resolve DNS to verify all associated IP addresses
    try {
      const addresses = await dns.promises.lookup(hostname, { all: true });
      if (!addresses || addresses.length === 0) {
        return { valid: false, reason: 'Could not resolve domain name via DNS.' };
      }

      for (const record of addresses) {
        if (isPrivateOrReservedIp(record.address)) {
          return {
            valid: false,
            reason: `Domain resolved to private or internal IP (${record.address}), which is not permitted.`,
          };
        }
      }
    } catch {
      return { valid: false, reason: 'DNS resolution failed for the provided domain.' };
    }

    return { valid: true, parsedUrl: parsed };
  } catch {
    return { valid: false, reason: 'Invalid URL format.' };
  }
}
