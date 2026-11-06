import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ScreenshotsController } from './screenshots.controller.js';
import { ScreenshotService } from './screenshot.service.js';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import * as fs from 'fs';

vi.mock('fs', async () => {
  const actual = await vi.importActual<typeof import('fs')>('fs');
  return {
    ...actual,
    existsSync: vi.fn(),
    createReadStream: vi.fn(),
  };
});

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
    vi.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should throw NotFoundException if screenshot file not found', async () => {
    serviceMock.getScreenshotPathBySnapshotId.mockReturnValue(null);
    const mockRes = { setHeader: vi.fn() } as any;

    await expect(controller.getScreenshot('invalid-snap', mockRes)).rejects.toThrow(
      NotFoundException,
    );
  });

  it('should stream file with appropriate headers if screenshot exists', async () => {
    serviceMock.getScreenshotPathBySnapshotId.mockReturnValue('/path/to/screenshot.png');
    vi.mocked(fs.existsSync).mockReturnValue(true);
    const mockPipe = vi.fn();
    vi.mocked(fs.createReadStream).mockReturnValue({ pipe: mockPipe } as any);

    const mockRes = {
      setHeader: vi.fn(),
    } as any;

    await controller.getScreenshot('valid-snap', mockRes);

    expect(mockRes.setHeader).toHaveBeenCalledWith('Content-Type', 'image/png');
    expect(mockRes.setHeader).toHaveBeenCalledWith('Cache-Control', 'public, max-age=86400');
    expect(fs.createReadStream).toHaveBeenCalledWith('/path/to/screenshot.png');
    expect(mockPipe).toHaveBeenCalledWith(mockRes);
  });

  describe('getVisualDiff', () => {
    it('should throw BadRequestException if snapshot ids are missing in query parameters', async () => {
      const mockRes = { setHeader: vi.fn() } as any;
      await expect(controller.getVisualDiff('', '', '', '', mockRes)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw NotFoundException if diff path and generation both fail', async () => {
      serviceMock.getVisualDiffPath.mockReturnValue(null);
      serviceMock.generateVisualDiff.mockResolvedValue(null);
      const mockRes = { setHeader: vi.fn() } as any;

      await expect(controller.getVisualDiff('snap-1', 'snap-2', '', '', mockRes)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should serve visual diff image with correct headers via query params', async () => {
      serviceMock.getVisualDiffPath.mockReturnValue('/path/to/diff.png');
      vi.mocked(fs.existsSync).mockReturnValue(true);
      const mockPipe = vi.fn();
      vi.mocked(fs.createReadStream).mockReturnValue({ pipe: mockPipe } as any);

      const mockRes = {
        setHeader: vi.fn(),
      } as any;

      await controller.getVisualDiff('snap-1', 'snap-2', '', '', mockRes);

      expect(mockRes.setHeader).toHaveBeenCalledWith('Content-Type', 'image/png');
      expect(mockRes.setHeader).toHaveBeenCalledWith('Cache-Control', 'public, max-age=86400');
      expect(fs.createReadStream).toHaveBeenCalledWith('/path/to/diff.png');
      expect(mockPipe).toHaveBeenCalledWith(mockRes);
    });

    it('should also work with base and compare aliases', async () => {
      serviceMock.getVisualDiffPath.mockReturnValue('/path/to/diff.png');
      vi.mocked(fs.existsSync).mockReturnValue(true);
      const mockPipe = vi.fn();
      vi.mocked(fs.createReadStream).mockReturnValue({ pipe: mockPipe } as any);

      const mockRes = { setHeader: vi.fn() } as any;
      await controller.getVisualDiff('', '', 'snap-1', 'snap-2', mockRes);

      expect(fs.createReadStream).toHaveBeenCalledWith('/path/to/diff.png');
    });
  });

  describe('getVisualDiffMeta', () => {
    it('should throw BadRequestException if snapshot ids are missing in query parameters', async () => {
      await expect(controller.getVisualDiffMeta('', '', '', '')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should return metadata if diff generated successfully', async () => {
      const mockMeta = {
        diffImageUrl: '/snapshots/visual-diff?oldSnapshotId=s1&newSnapshotId=s2',
        diffPercentage: 3.45,
        diffPixels: 500,
        totalPixels: 10000,
        width: 100,
        height: 100,
      };
      serviceMock.generateVisualDiff.mockResolvedValue(mockMeta);

      const result = await controller.getVisualDiffMeta('s1', 's2', '', '');
      expect(result).toEqual(mockMeta);
    });

    it('should throw NotFoundException if diff meta is unavailable', async () => {
      serviceMock.generateVisualDiff.mockResolvedValue(null);
      await expect(controller.getVisualDiffMeta('s1', 's2', '', '')).rejects.toThrow(NotFoundException);
    });
  });
});
