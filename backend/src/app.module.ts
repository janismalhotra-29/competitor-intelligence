import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { CompetitorsModule } from './competitors/competitors.module.js';
import { SnapshotsModule } from './snapshots/snapshots.module.js';
import { CrawlerModule } from './crawler/crawler.module.js';
import { ChangeDetectionModule } from './change-detection/change-detection.module.js';
import { AiAnalysisModule } from './ai-analysis/ai-analysis.module.js';
import { AutomationModule } from './automation/automation.module.js';
import { AlertsModule } from './alerts/alerts.module.js';
import { PricingModule } from './pricing/pricing.module.js';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    PrismaModule, 
    CompetitorsModule, 
    SnapshotsModule, 
    CrawlerModule, 
    ChangeDetectionModule, 
    AiAnalysisModule,
    AutomationModule,
    AlertsModule,
    PricingModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
