import { Module } from '@nestjs/common';
import { AiAnalysisService } from './ai-analysis.service.js';
import { PrismaModule } from '../prisma/prisma.module.js';

@Module({
  imports: [PrismaModule],
  providers: [AiAnalysisService],
  exports: [AiAnalysisService]
})
export class AiAnalysisModule {}
