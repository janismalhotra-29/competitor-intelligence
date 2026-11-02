import { Controller, Get, Param, Query, Res, NotFoundException, BadRequestException } from '@nestjs/common';
import type { Response } from 'express';
import * as fs from 'fs';
import { ScreenshotService } from './screenshot.service.js';

@Controller('snapshots')
export class ScreenshotsController {
  constructor(private readonly screenshotService: ScreenshotService) {}

  @Get(':snapshotId/screenshot')
  async getScreenshot(@Param('snapshotId') snapshotId: string, @Res() res: Response) {
    const filePath = this.screenshotService.getScreenshotPathBySnapshotId(snapshotId);
    if (!filePath || !fs.existsSync(filePath)) {
      throw new NotFoundException('Screenshot not found for this snapshot');
    }

    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    fs.createReadStream(filePath).pipe(res);
  }

  /**
   * Serves the visual diff image using query parameters (?oldSnapshotId=...&newSnapshotId=...)
   * Also accepts ?base=...&compare=... or ?old=...&new=... for convenience.
   */
  @Get('visual-diff')
  async getVisualDiff(
    @Query('oldSnapshotId') oldSnapshotId: string,
    @Query('newSnapshotId') newSnapshotId: string,
    @Query('base') base: string,
    @Query('compare') compare: string,
    @Res() res: Response,
  ) {
    const oldId = oldSnapshotId || base;
    const newId = newSnapshotId || compare;

    if (!oldId || !newId) {
      throw new BadRequestException('Both oldSnapshotId and newSnapshotId query parameters are required');
    }

    let filePath = this.screenshotService.getVisualDiffPath(oldId, newId);
    if (!filePath) {
      const diffResult = await this.screenshotService.generateVisualDiff(oldId, newId);
      if (diffResult) {
        filePath = this.screenshotService.getVisualDiffPath(oldId, newId);
      }
    }

    if (!filePath || !fs.existsSync(filePath)) {
      throw new NotFoundException('Visual diff not found or screenshots unavailable');
    }

    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    fs.createReadStream(filePath).pipe(res);
  }

  /**
   * Serves visual diff metadata using query parameters (?oldSnapshotId=...&newSnapshotId=...)
   */
  @Get('visual-diff/meta')
  async getVisualDiffMeta(
    @Query('oldSnapshotId') oldSnapshotId: string,
    @Query('newSnapshotId') newSnapshotId: string,
    @Query('base') base: string,
    @Query('compare') compare: string,
  ) {
    const oldId = oldSnapshotId || base;
    const newId = newSnapshotId || compare;

    if (!oldId || !newId) {
      throw new BadRequestException('Both oldSnapshotId and newSnapshotId query parameters are required');
    }

    const meta = await this.screenshotService.generateVisualDiff(oldId, newId);
    if (!meta) {
      throw new NotFoundException('Visual diff metadata not available');
    }
    return meta;
  }

  /**
   * Legacy path-parameter routes maintained for backwards compatibility
   */
  @Get('diff/:oldSnapshotId/:newSnapshotId/visual-diff')
  async getVisualDiffByPath(
    @Param('oldSnapshotId') oldSnapshotId: string,
    @Param('newSnapshotId') newSnapshotId: string,
    @Res() res: Response,
  ) {
    return this.getVisualDiff(oldSnapshotId, newSnapshotId, '', '', res);
  }

  @Get('diff/:oldSnapshotId/:newSnapshotId/meta')
  async getVisualDiffMetaByPath(
    @Param('oldSnapshotId') oldSnapshotId: string,
    @Param('newSnapshotId') newSnapshotId: string,
  ) {
    return this.getVisualDiffMeta(oldSnapshotId, newSnapshotId, '', '');
  }
}
