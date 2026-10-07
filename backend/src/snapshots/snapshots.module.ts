import { Module } from '@nestjs/common';
import { SnapshotsController } from './snapshots.controller.js';
import { SnapshotsService } from './snapshots.service.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { CrawlerModule } from '../crawler/crawler.module.js';

@Module({
  imports: [PrismaModule, CrawlerModule],
  controllers: [SnapshotsController],
  providers: [SnapshotsService],
})
export class SnapshotsModule {}
