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
      getVisualDiffPath: vi.fn(),
      generateVisualDiff: vi.fn(),
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

  describe('getVisualDiff', () => {
    it('should throw NotFoundException if diff path and generation both fail', async () => {
      serviceMock.getVisualDiffPath.mockReturnValue(null);
      serviceMock.generateVisualDiff.mockResolvedValue(null);
      const mockRes = { setHeader: vi.fn(), sendFile: vi.fn() } as any;

      await expect(controller.getVisualDiff('snap-1', 'snap-2', mockRes)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should serve visual diff image with correct headers', async () => {
      serviceMock.getVisualDiffPath.mockReturnValue('/path/to/diff.png');
      const mockRes = {
        setHeader: vi.fn(),
        sendFile: vi.fn().mockReturnValue(undefined),
      } as any;

      await controller.getVisualDiff('snap-1', 'snap-2', mockRes);

      expect(mockRes.setHeader).toHaveBeenCalledWith('Content-Type', 'image/png');
      expect(mockRes.setHeader).toHaveBeenCalledWith('Cache-Control', 'public, max-age=86400');
      expect(mockRes.sendFile).toHaveBeenCalledWith('/path/to/diff.png');
    });
  });

  describe('getVisualDiffMeta', () => {
    it('should return metadata if diff generated successfully', async () => {
      const mockMeta = {
        diffImageUrl: '/snapshots/diff/s1/s2/visual-diff',
        diffPercentage: 3.45,
        diffPixels: 500,
        totalPixels: 10000,
        width: 100,
        height: 100,
      };
      serviceMock.generateVisualDiff.mockResolvedValue(mockMeta);

      const result = await controller.getVisualDiffMeta('s1', 's2');
      expect(result).toEqual(mockMeta);
    });

    it('should throw NotFoundException if diff meta is unavailable', async () => {
      serviceMock.generateVisualDiff.mockResolvedValue(null);
      await expect(controller.getVisualDiffMeta('s1', 's2')).rejects.toThrow(NotFoundException);
    });
  });
});
