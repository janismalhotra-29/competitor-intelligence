import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CrawlerService } from '../crawler/crawler.service.js';

@Injectable()
export class SnapshotsService {
  constructor(
    private prisma: PrismaService,
    private crawler: CrawlerService
  ) {}

  async triggerCollection(competitorId: string) {
    const competitor = await this.prisma.competitor.findUnique({
      where: { id: competitorId }
    });

    if (!competitor) {
      throw new NotFoundException('Competitor not found');
    }

    const result = await this.crawler.crawlPublicPage(competitor.url);

    return this.prisma.snapshot.create({
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
  }

  async getSnapshots(competitorId: string) {
    return this.prisma.snapshot.findMany({
      where: { competitorId },
      orderBy: { capturedAt: 'desc' }
    });
  }
}
