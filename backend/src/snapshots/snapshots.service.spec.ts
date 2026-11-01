import { Test, TestingModule } from '@nestjs/testing';
import { SnapshotsService } from './snapshots.service';
import { PrismaService } from '../prisma/prisma.service';
import { CrawlerService } from '../crawler/crawler.service';
import { ChangeDetectionService } from '../change-detection/change-detection.service';
import { PricingService } from '../pricing/pricing.service';
import { ScreenshotService } from '../screenshots/screenshot.service.js';
import { NotFoundException } from '@nestjs/common';

describe('SnapshotsService', () => {
  let service: SnapshotsService;
  let prisma: PrismaService;
  let crawler: CrawlerService;
  let screenshotService: ScreenshotService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SnapshotsService,
        {
          provide: PrismaService,
          useValue: {
            competitor: {
              findUnique: vi.fn(),
            },
            snapshot: {
              create: vi.fn(),
              update: vi.fn(),
              findMany: vi.fn(),
            },
          },
        },
        {
          provide: CrawlerService,
          useValue: {
            crawlPublicPage: vi.fn(),
          },
        },
        {
          provide: ChangeDetectionService,
          useValue: {
            detectChangesForNewSnapshot: vi.fn().mockResolvedValue(undefined),
          },
        },
        {
          provide: PricingService,
          useValue: {
            extractPricingFromText: vi.fn().mockResolvedValue([]),
          },
        },
        {
          provide: ScreenshotService,
          useValue: {
            captureScreenshot: vi.fn().mockResolvedValue('/snapshots/snap-1/screenshot'),
          },
        },
      ],
    }).compile();

    service = module.get<SnapshotsService>(SnapshotsService);
    prisma = module.get<PrismaService>(PrismaService);
    crawler = module.get<CrawlerService>(CrawlerService);
    screenshotService = module.get<ScreenshotService>(ScreenshotService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should throw NotFoundException if competitor not found', async () => {
    vi.mocked(prisma.competitor.findUnique).mockResolvedValue(null);
    await expect(service.triggerCollection('invalid-id')).rejects.toThrow(NotFoundException);
  });

  it('should create snapshot correctly for existing competitor', async () => {
    vi.mocked(prisma.competitor.findUnique).mockResolvedValue({
      id: 'comp-1',
      url: 'https://example.com',
      createdAt: new Date(),
    });
    
    vi.mocked(crawler.crawlPublicPage).mockResolvedValue({
      url: 'https://example.com',
      pageTitle: 'Test Title',
      extractedText: 'Test text',
      metadata: { desc: 'test' },
      status: 'SUCCESS',
      capturedAt: new Date(),
    });

    vi.mocked(prisma.snapshot.create).mockResolvedValue({
      id: 'snap-1',
      competitorId: 'comp-1',
      url: 'https://example.com',
      pageTitle: 'Test Title',
      extractedText: 'Test text',
      metadata: '{"desc":"test"}',
      status: 'SUCCESS',
      capturedAt: new Date(),
    });

    const result = await service.triggerCollection('comp-1');
    expect(result.id).toBe('snap-1');
    expect(prisma.snapshot.create).toHaveBeenCalled();
    expect(screenshotService.captureScreenshot).toHaveBeenCalledWith('https://example.com', 'snap-1');
  });
});
