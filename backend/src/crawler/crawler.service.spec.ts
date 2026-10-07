import { Test, TestingModule } from '@nestjs/testing';
import { CrawlerService } from './crawler.service';

describe('CrawlerService', () => {
  let service: CrawlerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CrawlerService],
    }).compile();

    service = module.get<CrawlerService>(CrawlerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should collect a valid public URL', async () => {
    const result = await service.crawlPublicPage('https://example.com');
    expect(result.status).toBe('SUCCESS');
    expect(result.url).toBe('https://example.com');
    expect(result.pageTitle).toContain('Example Domain');
    expect(result.extractedText).toBeDefined();
  });

  it('should handle invalid URL', async () => {
    const result = await service.crawlPublicPage('http://invalid.local');
    expect(result.status).toBe('FAILED');
    expect(result.pageTitle).toBeNull();
  }, 15000);

  it('should handle unavailable page gracefully', async () => {
    const result = await service.crawlPublicPage('https://httpstat.us/404');
    expect(result.status).toBe('FAILED');
  });
});
