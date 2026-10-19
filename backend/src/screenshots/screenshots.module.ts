import { Module } from '@nestjs/common';
import { ScreenshotService } from './screenshot.service.js';
import { ScreenshotsController } from './screenshots.controller.js';

@Module({
  controllers: [ScreenshotsController],
  providers: [ScreenshotService],
  exports: [ScreenshotService],
})
export class ScreenshotsModule {}
