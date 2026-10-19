import { Controller, Get, Param, Res, NotFoundException } from '@nestjs/common';
import type { Response } from 'express';
import { ScreenshotService } from './screenshot.service.js';

@Controller('snapshots')
export class ScreenshotsController {
  constructor(private readonly screenshotService: ScreenshotService) {}

  @Get(':snapshotId/screenshot')
  async getScreenshot(@Param('snapshotId') snapshotId: string, @Res() res: Response) {
    const filePath = this.screenshotService.getScreenshotPathBySnapshotId(snapshotId);
    if (!filePath) {
      throw new NotFoundException('Screenshot not found for this snapshot');
    }

    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    return res.sendFile(filePath);
  }
}
