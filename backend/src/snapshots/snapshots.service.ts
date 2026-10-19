import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CrawlerService } from '../crawler/crawler.service.js';
import { ChangeDetectionService } from '../change-detection/change-detection.service.js';
import { PricingService } from '../pricing/pricing.service.js';
import { ScreenshotService } from '../screenshots/screenshot.service.js';

@Injectable()
export class SnapshotsService {
  constructor(
    private prisma: PrismaService,
    private crawler: CrawlerService,
    private changeDetection: ChangeDetectionService,
    private pricingService: PricingService,
    private screenshotService: ScreenshotService,
  ) {}

  async triggerCollection(competitorId: string) {
    const competitor = await this.prisma.competitor.findUnique({
      where: { id: competitorId }
    });

    if (!competitor) {
      throw new NotFoundException('Competitor not found');
    }

    const result = await this.crawler.crawlPublicPage(competitor.url);

    const snapshot = await this.prisma.snapshot.create({
      data: {
        competitorId,
        url: result.url,
        pageTitle: result.pageTitle,
        extractedText: result.extractedText,
        metadata: result.metadata ? JSON.stringify(result.metadata) : null,
        status: result.status,
        capturedAt: result.capturedAt
      }
    });

    if (snapshot.status === 'SUCCESS') {
      // Capture desktop screenshot in the background
      this.screenshotService.captureScreenshot(competitor.url, snapshot.id).then(async (screenshotUrl) => {
        if (screenshotUrl) {
          await this.prisma.snapshot.update({
            where: { id: snapshot.id },
            data: { screenshotUrl },
          });
        }
      }).catch(err => {
        console.error('Visual screenshot capture failed:', err);
      });

      // Run change detection asynchronously so we don't block the API response
      this.changeDetection.detectChangesForNewSnapshot(snapshot.id, competitorId).catch(err => {
        console.error('Change detection failed:', err);
      });

      // Extract pricing tiers in the background
      this.pricingService.extractPricingFromText(competitorId, snapshot.id, snapshot.extractedText || '').catch(err => {
        console.error('Pricing extraction failed:', err);
      });
    }

    return snapshot;
  }

  async getSnapshots(competitorId: string) {
    return this.prisma.snapshot.findMany({
      where: { competitorId },
      orderBy: { capturedAt: 'desc' }
    });
  }
}
