import { Test, TestingModule } from '@nestjs/testing';
import { vi } from 'vitest';
import * as dns from 'dns';
import { CrawlerService } from './crawler.service.js';

describe('CrawlerService', () => {
  let service: CrawlerService;

  beforeEach(async () => {
    vi.spyOn(dns.promises, 'lookup').mockResolvedValue([{ address: '93.184.216.34', family: 4 }] as any);

    const module: TestingModule = await Test.createTestingModule({
      providers: [CrawlerService],
    }).compile();

    service = module.get<CrawlerService>(CrawlerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should collect a valid public URL', async () => {
    const originalFetch = global.fetch;
    global.fetch = vi.fn().mockImplementation(async (url: string) => {
      if (url.includes('robots.txt')) {
        return new Response('User-agent: *\nAllow: /', { status: 200 });
      }
      return new Response('<html><head><title>Example Domain</title></head><body>This domain is for use in examples.</body></html>', { status: 200 });
    }) as any;

    try {
      const result = await service.crawlPublicPage('https://example.com');
      expect(result.status).toBe('SUCCESS');
      expect(result.url).toBe('https://example.com');
      expect(result.pageTitle).toContain('Example Domain');
      expect(result.extractedText).toBeDefined();
    } finally {
      global.fetch = originalFetch;
    }
  });

  it('should immediately reject SSRF attempts to localhost/private IP', async () => {
    const result = await service.crawlPublicPage('http://127.0.0.1:3001/alerts');
    expect(result.status).toBe('FAILED');
    expect(result.pageTitle).toBeNull();
    expect(result.metadata?.error).toBeDefined();
  });

  it('should handle invalid or unresolvable URL', async () => {
    const result = await service.crawlPublicPage('http://invalid.local');
    expect(result.status).toBe('FAILED');
    expect(result.pageTitle).toBeNull();
  });

  it('should handle unavailable page gracefully', async () => {
    const result = await service.crawlPublicPage('https://httpstat.us/404');
    expect(result.status).toBe('FAILED');
  }, 15000);
});
