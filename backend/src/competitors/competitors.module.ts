import { Module } from '@nestjs/common';
import { CompetitorsService } from './competitors.service.js';
import { CompetitorsController } from './competitors.controller.js';

@Module({
  controllers: [CompetitorsController],
  providers: [CompetitorsService],
  exports: [CompetitorsService],
})
export class CompetitorsModule {}
