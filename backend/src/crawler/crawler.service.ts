import { Injectable, Logger } from '@nestjs/common';
import * as cheerio from 'cheerio';
import { validatePublicUrl } from '../common/url-validator.js';

export interface CrawlResult {
  url: string;
  pageTitle: string | null;
  extractedText: string | null;
  metadata: Record<string, any> | null;
  status: 'SUCCESS' | 'FAILED';
  capturedAt: Date;
}

interface RobotsCacheEntry {
  disallowedPaths: string[];
  expiresAt: number;
}

const MAX_BODY_BYTES = 5 * 1024 * 1024; // 5 MB limit
const MIN_DOMAIN_REQUEST_INTERVAL_MS = 1000; // 1 second rate limit per domain
const ROBOTS_CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour cache

@Injectable()
export class CrawlerService {
  private readonly logger = new Logger(CrawlerService.name);
  private readonly lastDomainRequestTimes = new Map<string, number>();
  private readonly robotsCache = new Map<string, RobotsCacheEntry>();

  async crawlPublicPage(url: string): Promise<CrawlResult> {
    const timestamp = new Date();

    // 1. SSRF and Protocol Validation
    const validation = await validatePublicUrl(url);
    if (!validation.valid || !validation.parsedUrl) {
      this.logger.warn(`Blocked crawling to unsafe or non-public URL ${url}: ${validation.reason}`);
      return this.createFailedResult(url, timestamp, { error: validation.reason || 'Blocked by SSRF protection' });
    }

    const targetUrl = validation.parsedUrl;
    const origin = targetUrl.origin;

    // 2. Domain-Level Rate Limiting
    await this.enforceRateLimit(origin);

    // 3. Robots.txt Compliance Check
    const isAllowed = await this.isAllowedByRobots(targetUrl);
    if (!isAllowed) {
      this.logger.warn(`Crawling disallowed by robots.txt directive for: ${url}`);
      return this.createFailedResult(url, timestamp, { error: 'Blocked by target robots.txt policy' });
    }

    // 4. Safe Fetch with Retry and Size Limits
    return this.fetchWithRetry(url, targetUrl, timestamp, 1);
  }

  private async fetchWithRetry(
    url: string,
    parsedUrl: URL,
    timestamp: Date,
    retriesRemaining: number,
  ): Promise<CrawlResult> {
    try {
      this.logger.log(`Fetching public page: ${url}`);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
        signal: AbortSignal.timeout(10000),
        redirect: 'manual', // Check redirects to prevent redirect-based SSRF
      });

      // Handle Redirects Safely
      if (response.status >= 300 && response.status < 400) {
        const location = response.headers.get('location');
        if (!location) {
          return this.createFailedResult(url, timestamp, { error: 'Redirect location missing' });
        }

        const resolvedRedirect = new URL(location, parsedUrl.origin).toString();
        const redirectCheck = await validatePublicUrl(resolvedRedirect);
        if (!redirectCheck.valid) {
          this.logger.warn(`Blocked redirect to unsafe target: ${resolvedRedirect}`);
          return this.createFailedResult(url, timestamp, { error: 'Redirected to private or prohibited address' });
        }

        if (retriesRemaining > 0) {
          return this.fetchWithRetry(resolvedRedirect, new URL(resolvedRedirect), timestamp, retriesRemaining - 1);
        } else {
          return this.createFailedResult(url, timestamp, { error: 'Too many redirects' });
        }
      }

      if (!response.ok) {
        this.logger.warn(`Failed to fetch ${url}, status: ${response.status}`);
        return this.createFailedResult(url, timestamp, { httpStatus: response.status });
      }

      // Check Content-Type (Only parse text/html/xml)
      const contentType = response.headers.get('content-type') || '';
      if (
        !contentType.includes('text/html') &&
        !contentType.includes('application/xhtml+xml') &&
        !contentType.includes('text/plain') &&
        !contentType.includes('application/xml')
      ) {
        this.logger.warn(`Skipping non-HTML/text content-type: ${contentType} for ${url}`);
        return this.createFailedResult(url, timestamp, { error: `Unsupported content-type: ${contentType}` });
      }

      // Check Content-Length if provided
      const contentLength = response.headers.get('content-length');
      if (contentLength && parseInt(contentLength, 10) > MAX_BODY_BYTES) {
        this.logger.warn(`Payload exceeds maximum allowed size (${contentLength} bytes) for ${url}`);
        return this.createFailedResult(url, timestamp, { error: 'Payload exceeds size limit' });
      }

      const html = await response.text();
      if (html.length > MAX_BODY_BYTES) {
        return this.createFailedResult(url, timestamp, { error: 'Response body exceeds size limit' });
      }

      const $ = cheerio.load(html);

      const pageTitle = $('title').text()?.trim() || null;

      $('script, style, noscript, iframe, img, svg, video, audio, link, meta').remove();

      const extractedText = $('body').text().replace(/\s+/g, ' ').trim() || null;

      const metadata: Record<string, string> = {};
      // Re-read meta tags from original html if needed, or basic info
      metadata['contentLength'] = String(html.length);

      return {
        url,
        pageTitle,
        extractedText,
        metadata,
        status: 'SUCCESS',
        capturedAt: timestamp,
      };
    } catch (error: any) {
      if (retriesRemaining > 0 && error?.name !== 'AbortError') {
        this.logger.warn(`Retrying fetch for ${url} after transient error: ${error?.message}`);
        await new Promise((r) => setTimeout(r, 1000));
        return this.fetchWithRetry(url, parsedUrl, timestamp, retriesRemaining - 1);
      }

      this.logger.error(`Error crawling ${url}: ${error?.message}`);
      return this.createFailedResult(url, timestamp, { error: error?.message || 'Crawl failed' });
    }
  }

  private async enforceRateLimit(origin: string): Promise<void> {
    const now = Date.now();
    const lastRequest = this.lastDomainRequestTimes.get(origin) || 0;
    const elapsed = now - lastRequest;

    if (elapsed < MIN_DOMAIN_REQUEST_INTERVAL_MS) {
      const waitTime = MIN_DOMAIN_REQUEST_INTERVAL_MS - elapsed;
      await new Promise((resolve) => setTimeout(resolve, waitTime));
    }

    this.lastDomainRequestTimes.set(origin, Date.now());
  }

  private async isAllowedByRobots(url: URL): Promise<boolean> {
    const origin = url.origin;
    const now = Date.now();

    let entry = this.robotsCache.get(origin);
    if (!entry || entry.expiresAt < now) {
      const disallowedPaths: string[] = [];
      try {
        const robotsUrl = `${origin}/robots.txt`;
        const res = await fetch(robotsUrl, {
          method: 'GET',
          headers: { 'User-Agent': 'Mozilla/5.0' },
          signal: AbortSignal.timeout(3000),
        });

        if (res.ok) {
          const text = await res.text();
          const lines = text.split('\n').map((l) => l.trim());
          let isTargetAgent = false;

          for (const line of lines) {
            if (line.toLowerCase().startsWith('user-agent:')) {
              const agent = line.split(':')[1]?.trim().toLowerCase();
              isTargetAgent = agent === '*' || agent.includes('bot') || agent.includes('mozilla');
            } else if (isTargetAgent && line.toLowerCase().startsWith('disallow:')) {
              const path = line.split(':')[1]?.trim();
              if (path && path.length > 0) {
                disallowedPaths.push(path);
              }
            }
          }
        }
      } catch {
        // If robots.txt cannot be fetched, default to permissive (standard web practice)
      }

      entry = {
        disallowedPaths,
        expiresAt: now + ROBOTS_CACHE_TTL_MS,
      };
      this.robotsCache.set(origin, entry);
    }

    const currentPath = url.pathname;
    for (const disallowed of entry.disallowedPaths) {
      if (disallowed === '/') return false;
      if (currentPath.startsWith(disallowed)) return false;
    }

    return true;
  }

  private createFailedResult(
    url: string,
    timestamp: Date,
    metadata: Record<string, any> | null = null,
  ): CrawlResult {
    return {
      url,
      pageTitle: null,
      extractedText: null,
      metadata,
      status: 'FAILED',
      capturedAt: timestamp,
    };
  }
}
