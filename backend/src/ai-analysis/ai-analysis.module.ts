import { Module } from '@nestjs/common';
import { AiAnalysisService } from './ai-analysis.service.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { AlertsModule } from '../alerts/alerts.module.js';

@Module({
  imports: [PrismaModule, AlertsModule],
  providers: [AiAnalysisService],
  exports: [AiAnalysisService]
})
export class AiAnalysisModule {}
