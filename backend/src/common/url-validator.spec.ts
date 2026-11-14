import { describe, it, expect, vi } from 'vitest';
import * as dns from 'dns';
import { isPrivateOrReservedIp, validatePublicUrl } from './url-validator.js';

describe('url-validator SSRF protection', () => {
  describe('isPrivateOrReservedIp', () => {
    it('should identify loopback IPs as private', () => {
      expect(isPrivateOrReservedIp('127.0.0.1')).toBe(true);
      expect(isPrivateOrReservedIp('127.0.0.2')).toBe(true);
      expect(isPrivateOrReservedIp('::1')).toBe(true);
    });

    it('should identify AWS / cloud metadata IP 169.254.169.254 as private/reserved', () => {
      expect(isPrivateOrReservedIp('169.254.169.254')).toBe(true);
      expect(isPrivateOrReservedIp('169.254.1.1')).toBe(true);
    });

    it('should identify RFC 1918 private subnets as private', () => {
      expect(isPrivateOrReservedIp('10.0.0.1')).toBe(true);
      expect(isPrivateOrReservedIp('172.16.0.1')).toBe(true);
      expect(isPrivateOrReservedIp('172.31.255.255')).toBe(true);
      expect(isPrivateOrReservedIp('192.168.1.1')).toBe(true);
    });

    it('should identify public IPs as non-private', () => {
      expect(isPrivateOrReservedIp('8.8.8.8')).toBe(false);
      expect(isPrivateOrReservedIp('1.1.1.1')).toBe(false);
      expect(isPrivateOrReservedIp('93.184.216.34')).toBe(false); // example.com
    });
  });

  describe('validatePublicUrl', () => {
    it('should reject file:// and ftp:// schemes', async () => {
      const res1 = await validatePublicUrl('file:///etc/passwd');
      expect(res1.valid).toBe(false);

      const res2 = await validatePublicUrl('ftp://ftp.example.com');
      expect(res2.valid).toBe(false);
    });

    it('should reject localhost and internal hostnames', async () => {
      const res1 = await validatePublicUrl('http://localhost:3001');
      expect(res1.valid).toBe(false);

      const res2 = await validatePublicUrl('http://backend.internal/api');
      expect(res2.valid).toBe(false);

      const res3 = await validatePublicUrl('http://metadata.google.internal');
      expect(res3.valid).toBe(false);
    });

    it('should reject private IP literals', async () => {
      const res1 = await validatePublicUrl('http://127.0.0.1:8080');
      expect(res1.valid).toBe(false);

      const res2 = await validatePublicUrl('http://169.254.169.254/latest/meta-data');
      expect(res2.valid).toBe(false);

      const res3 = await validatePublicUrl('http://192.168.1.1');
      expect(res3.valid).toBe(false);
    });

    it('should accept valid public URLs', async () => {
      vi.spyOn(dns.promises, 'lookup').mockResolvedValueOnce([{ address: '93.184.216.34', family: 4 }] as any);
      const res = await validatePublicUrl('https://example.com');
      expect(res.valid).toBe(true);
      expect(res.parsedUrl?.hostname).toBe('example.com');
    });
  });
});
