import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ScreenshotService } from './screenshot.service.js';
import * as fs from 'fs';
import * as path from 'path';
import { PNG } from 'pngjs';

describe('ScreenshotService', () => {
  let service: ScreenshotService;
  const storageDir = path.resolve(process.cwd(), 'uploads', 'screenshots');

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

  describe('Visual Diff Heatmap generation', () => {
    it('should reject path traversal in snapshot IDs', async () => {
      const res = await service.generateVisualDiff('../snap-1', 'snap-2');
      expect(res).toBeNull();

      const pathRes = service.getVisualDiffPath('snap-1', '../../snap-2');
      expect(pathRes).toBeNull();
    });

    it('should return null if either screenshot does not exist', async () => {
      const res = await service.generateVisualDiff('missing-1', 'missing-2');
      expect(res).toBeNull();
    });

    it('should successfully compute visual pixel diff between two valid screenshots', async () => {
      if (!fs.existsSync(storageDir)) {
        fs.mkdirSync(storageDir, { recursive: true });
      }

      const snap1Id = 'test-snap-1';
      const snap2Id = 'test-snap-2';
      const file1 = path.join(storageDir, `screenshot-${snap1Id}.png`);
      const file2 = path.join(storageDir, `screenshot-${snap2Id}.png`);

      // Create image 1 (white 20x20)
      const img1 = new PNG({ width: 20, height: 20 });
      img1.data.fill(255);
      fs.writeFileSync(file1, PNG.sync.write(img1));

      // Create image 2 (white 20x20 with 5x5 black box = 25 diff pixels)
      const img2 = new PNG({ width: 20, height: 20 });
      img2.data.fill(255);
      for (let y = 0; y < 5; y++) {
        for (let x = 0; x < 5; x++) {
          const idx = (y * 20 + x) * 4;
          img2.data[idx] = 0;
          img2.data[idx + 1] = 0;
          img2.data[idx + 2] = 0;
          img2.data[idx + 3] = 255;
        }
      }
      fs.writeFileSync(file2, PNG.sync.write(img2));

      try {
        const diffResult = await service.generateVisualDiff(snap1Id, snap2Id);
        expect(diffResult).toBeDefined();
        expect(diffResult?.diffImageUrl).toBe(`/snapshots/diff/${snap1Id}/${snap2Id}/visual-diff`);
        expect(diffResult?.totalPixels).toBe(400);
        expect(diffResult?.diffPixels).toBe(25);
        expect(diffResult?.diffPercentage).toBe(6.25);

        // Verify file path
        const diffPath = service.getVisualDiffPath(snap1Id, snap2Id);
        expect(diffPath).toBeTruthy();
        expect(fs.existsSync(diffPath!)).toBe(true);
      } finally {
        // Clean up test files
        [file1, file2].forEach((f) => {
          if (fs.existsSync(f)) fs.unlinkSync(f);
        });
        const diffFile = path.join(storageDir, `diff-${snap1Id}-${snap2Id}.png`);
        const metaFile = path.join(storageDir, `diff-${snap1Id}-${snap2Id}.json`);
        if (fs.existsSync(diffFile)) fs.unlinkSync(diffFile);
        if (fs.existsSync(metaFile)) fs.unlinkSync(metaFile);
      }
    });
  });
});
