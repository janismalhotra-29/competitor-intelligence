import { Module } from '@nestjs/common';
import { SnapshotsController } from './snapshots.controller.js';
import { SnapshotsService } from './snapshots.service.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { CrawlerModule } from '../crawler/crawler.module.js';
import { ChangeDetectionModule } from '../change-detection/change-detection.module.js';
import { PricingModule } from '../pricing/pricing.module.js';

@Module({
  imports: [PrismaModule, CrawlerModule, ChangeDetectionModule, PricingModule],
  controllers: [SnapshotsController],
  providers: [SnapshotsService],
  exports: [SnapshotsService],
})
export class SnapshotsModule {}
