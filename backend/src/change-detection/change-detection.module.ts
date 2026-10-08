import { Module } from '@nestjs/common';
import { ChangeDetectionService } from './change-detection.service.js';
import { ChangeDetectionController } from './change-detection.controller.js';
import { PrismaModule } from '../prisma/prisma.module.js';

@Module({
  imports: [PrismaModule],
  controllers: [ChangeDetectionController],
  providers: [ChangeDetectionService],
  exports: [ChangeDetectionService],
})
export class ChangeDetectionModule {}
