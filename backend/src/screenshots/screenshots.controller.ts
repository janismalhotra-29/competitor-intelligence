import { Controller, Get, Param, Res, NotFoundException } from '@nestjs/common';
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

  @Get('diff/:oldSnapshotId/:newSnapshotId/visual-diff')
  async getVisualDiff(
    @Param('oldSnapshotId') oldSnapshotId: string,
    @Param('newSnapshotId') newSnapshotId: string,
    @Res() res: Response,
  ) {
    let filePath = this.screenshotService.getVisualDiffPath(oldSnapshotId, newSnapshotId);
    if (!filePath) {
      const diffResult = await this.screenshotService.generateVisualDiff(oldSnapshotId, newSnapshotId);
      if (diffResult) {
        filePath = this.screenshotService.getVisualDiffPath(oldSnapshotId, newSnapshotId);
      }
    }

    if (!filePath || !fs.existsSync(filePath)) {
      throw new NotFoundException('Visual diff not found or screenshots unavailable');
    }

    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    fs.createReadStream(filePath).pipe(res);
  }

  @Get('diff/:oldSnapshotId/:newSnapshotId/meta')
  async getVisualDiffMeta(
    @Param('oldSnapshotId') oldSnapshotId: string,
    @Param('newSnapshotId') newSnapshotId: string,
  ) {
    const meta = await this.screenshotService.generateVisualDiff(oldSnapshotId, newSnapshotId);
    if (!meta) {
      throw new NotFoundException('Visual diff metadata not available');
    }
    return meta;
  }
}
