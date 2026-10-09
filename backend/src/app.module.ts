import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { CompetitorsModule } from './competitors/competitors.module.js';
import { SnapshotsModule } from './snapshots/snapshots.module.js';
import { CrawlerModule } from './crawler/crawler.module.js';
import { ChangeDetectionModule } from './change-detection/change-detection.module.js';
import { AiAnalysisModule } from './ai-analysis/ai-analysis.module.js';

@Module({
  imports: [PrismaModule, CompetitorsModule, SnapshotsModule, CrawlerModule, ChangeDetectionModule, AiAnalysisModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
