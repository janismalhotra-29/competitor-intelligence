import { Controller, Get, Param } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Controller('competitors/:competitorId/changes')
export class ChangeDetectionController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async getChanges(@Param('competitorId') competitorId: string) {
    return this.prisma.change.findMany({
      where: { competitorId },
      orderBy: { detectedAt: 'desc' },
      include: { aiSummary: true }
    });
  }
}
