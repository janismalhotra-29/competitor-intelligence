import { Module } from '@nestjs/common';
import { ChangeDetectionService } from './change-detection.service.js';
import { ChangeDetectionController } from './change-detection.controller.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { AiAnalysisModule } from '../ai-analysis/ai-analysis.module.js';
import { ScreenshotsModule } from '../screenshots/screenshots.module.js';

@Module({
  imports: [PrismaModule, AiAnalysisModule, ScreenshotsModule],
  controllers: [ChangeDetectionController],
  providers: [ChangeDetectionService],
  exports: [ChangeDetectionService],
})
export class ChangeDetectionModule {}
