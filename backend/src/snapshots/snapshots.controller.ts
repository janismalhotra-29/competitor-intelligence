import { Controller, Post, Get, Param } from '@nestjs/common';
import { SnapshotsService } from './snapshots.service.js';

@Controller('competitors/:competitorId/snapshots')
export class SnapshotsController {
  constructor(private readonly snapshotsService: SnapshotsService) {}

  @Post('collect')
  async triggerCollection(@Param('competitorId') competitorId: string) {
    return this.snapshotsService.triggerCollection(competitorId);
  }

  @Get()
  async getSnapshots(@Param('competitorId') competitorId: string) {
    return this.snapshotsService.getSnapshots(competitorId);
  }
}
