import { Module } from '@nestjs/common';
import { SnapshotsController } from './snapshots.controller.js';
import { SnapshotsService } from './snapshots.service.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { CrawlerModule } from '../crawler/crawler.module.js';
import { ChangeDetectionModule } from '../change-detection/change-detection.module.js';

@Module({
  imports: [PrismaModule, CrawlerModule, ChangeDetectionModule],
  controllers: [SnapshotsController],
  providers: [SnapshotsService],
})
export class SnapshotsModule {}
