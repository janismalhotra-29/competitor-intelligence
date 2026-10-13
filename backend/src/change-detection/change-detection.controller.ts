import { Controller, Get, Param } from '@nestjs/common';
import { ChangeDetectionService } from './change-detection.service.js';

@Controller('competitors/:competitorId/changes')
export class ChangeDetectionController {
  constructor(private readonly changeDetectionService: ChangeDetectionService) {}

  @Get()
  async getChanges(@Param('competitorId') competitorId: string) {
    return this.changeDetectionService.getChangesByCompetitorId(competitorId);
  }

  @Get(':changeId/diff')
  async getChangeDiff(@Param('changeId') changeId: string) {
    return this.changeDetectionService.getChangeDiff(changeId);
  }
}
