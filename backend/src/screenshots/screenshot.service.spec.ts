import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ScreenshotService } from './screenshot.service.js';

describe('ScreenshotService', () => {
  let service: ScreenshotService;

  beforeEach(() => {
    service = new ScreenshotService();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('captureScreenshot SSRF protection', () => {
    it('should immediately reject private or internal URLs without taking screenshot', async () => {
      const result = await service.captureScreenshot('http://127.0.0.1:3001', 'snap-1');
      expect(result).toBeNull();
    });

    it('should reject non-HTTP schemes', async () => {
      const result = await service.captureScreenshot('file:///etc/passwd', 'snap-2');
      expect(result).toBeNull();
    });
  });

  describe('getScreenshotPathBySnapshotId security', () => {
    it('should reject path traversal attempts in snapshotId', () => {
      expect(service.getScreenshotPathBySnapshotId('../../../etc/passwd')).toBeNull();
      expect(service.getScreenshotPathBySnapshotId('..\\..\\windows\\system32')).toBeNull();
      expect(service.getScreenshotPathBySnapshotId('snap/id')).toBeNull();
    });

    it('should return null for non-existent screenshot', () => {
      expect(service.getScreenshotPathBySnapshotId('non-existent-snap-id')).toBeNull();
    });
  });
});
