import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ScreenshotsController } from './screenshots.controller.js';
import { ScreenshotService } from './screenshot.service.js';
import { NotFoundException } from '@nestjs/common';

describe('ScreenshotsController', () => {
  let controller: ScreenshotsController;
  let serviceMock: any;

  beforeEach(() => {
    serviceMock = {
      getScreenshotPathBySnapshotId: vi.fn(),
    };
    controller = new ScreenshotsController(serviceMock as unknown as ScreenshotService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should throw NotFoundException if screenshot file not found', async () => {
    serviceMock.getScreenshotPathBySnapshotId.mockReturnValue(null);
    const mockRes = { setHeader: vi.fn(), sendFile: vi.fn() } as any;

    await expect(controller.getScreenshot('invalid-snap', mockRes)).rejects.toThrow(
      NotFoundException,
    );
  });

  it('should send file with appropriate headers if screenshot exists', async () => {
    serviceMock.getScreenshotPathBySnapshotId.mockReturnValue('/path/to/screenshot.png');
    const mockRes = {
      setHeader: vi.fn(),
      sendFile: vi.fn().mockReturnValue(undefined),
    } as any;

    await controller.getScreenshot('valid-snap', mockRes);

    expect(mockRes.setHeader).toHaveBeenCalledWith('Content-Type', 'image/png');
    expect(mockRes.setHeader).toHaveBeenCalledWith('Cache-Control', 'public, max-age=86400');
    expect(mockRes.sendFile).toHaveBeenCalledWith('/path/to/screenshot.png');
  });
});
