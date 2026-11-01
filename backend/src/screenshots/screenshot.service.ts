import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import * as path from 'path';
import * as fs from 'fs';
import { chromium, Browser } from 'playwright';
import pixelmatch from 'pixelmatch';
import { PNG } from 'pngjs';
import { validatePublicUrl } from '../common/url-validator.js';

export interface VisualDiffResult {
  diffImageUrl: string;
  diffPercentage: number;
  diffPixels: number;
  totalPixels: number;
  width: number;
  height: number;
}

@Injectable()
export class ScreenshotService implements OnModuleDestroy {
  private readonly logger = new Logger(ScreenshotService.name);
  private browser: Browser | null = null;
  private readonly storageDir = path.resolve(process.cwd(), 'uploads', 'screenshots');

  constructor() {
    if (!fs.existsSync(this.storageDir)) {
      fs.mkdirSync(this.storageDir, { recursive: true });
    }
  }

  async onModuleDestroy() {
    if (this.browser) {
      await this.browser.close().catch(() => {});
      this.browser = null;
    }
  }

  private async getBrowser(): Promise<Browser> {
    if (!this.browser || !this.browser.isConnected()) {
      this.browser = await chromium.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
        ],
      });
    }
    return this.browser;
  }

  /**
   * Captures a desktop viewport screenshot for a validated public URL.
   * Returns the relative endpoint path (e.g., /snapshots/:id/screenshot) or null on failure.
   */
  async captureScreenshot(url: string, snapshotId: string): Promise<string | null> {
    // 1. SSRF Validation Guard
    const validation = await validatePublicUrl(url);
    if (!validation.valid) {
      this.logger.warn(`Skipping screenshot capture for prohibited URL: ${url}`);
      return null;
    }

    const filename = `screenshot-${snapshotId}.png`;
    const filePath = path.join(this.storageDir, filename);

    try {
      this.logger.log(`Capturing visual screenshot for snapshot ${snapshotId}: ${url}`);
      const browser = await this.getBrowser();
      const context = await browser.newContext({
        viewport: { width: 1280, height: 720 },
        userAgent:
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      });

      const page = await context.newPage();

      // Block heavy resources (media, fonts) to minimize memory and CPU
      await page.route('**/*', (route) => {
        const type = route.request().resourceType();
        if (type === 'media' || type === 'font') {
          return route.abort();
        }
        return route.continue();
      });

      await page.goto(url, {
        waitUntil: 'domcontentloaded',
        timeout: 15000,
      });

      // Brief stabilization delay for initial client-side rendering
      await page.waitForTimeout(1000);

      await page.screenshot({
        path: filePath,
        fullPage: false,
        type: 'png',
      });

      await context.close().catch(() => {});
      this.logger.log(`Screenshot saved successfully: ${filename}`);

      return `/snapshots/${snapshotId}/screenshot`;
    } catch (error: any) {
      this.logger.warn(`Screenshot capture failed gracefully for ${url}: ${error?.message}`);
      return null;
    }
  }

  /**
   * Securely resolves a screenshot file path by snapshotId, preventing directory traversal.
   */
  getScreenshotPathBySnapshotId(snapshotId: string): string | null {
    if (!/^[a-zA-Z0-9\-_]+$/.test(snapshotId)) {
      return null;
    }

    const filename = `screenshot-${snapshotId}.png`;
    const resolvedPath = path.join(this.storageDir, filename);

    if (!resolvedPath.startsWith(this.storageDir)) {
      return null;
    }

    if (!fs.existsSync(resolvedPath)) {
      return null;
    }

    return resolvedPath;
  }

  /**
   * Pads an image to the target dimensions if width/height differ between snapshots.
   */
  private padPng(src: PNG, targetWidth: number, targetHeight: number): PNG {
    if (src.width === targetWidth && src.height === targetHeight) {
      return src;
    }
    const dst = new PNG({ width: targetWidth, height: targetHeight });
    dst.data.fill(255); // initialize with white background
    for (let y = 0; y < src.height; y++) {
      for (let x = 0; x < src.width; x++) {
        const srcIdx = (y * src.width + x) * 4;
        const dstIdx = (y * targetWidth + x) * 4;
        dst.data[dstIdx] = src.data[srcIdx];
        dst.data[dstIdx + 1] = src.data[srcIdx + 1];
        dst.data[dstIdx + 2] = src.data[srcIdx + 2];
        dst.data[dstIdx + 3] = src.data[srcIdx + 3];
      }
    }
    return dst;
  }

  /**
   * Generates a pixel-level visual difference heatmap between two snapshots.
   * Renders onto the 100% sharp current screenshot with fluorescent neon red on altered areas,
   * avoiding blurry ghosting or overlapping text artifacts.
   */
  async generateVisualDiff(oldSnapshotId: string, newSnapshotId: string): Promise<VisualDiffResult | null> {
    if (!/^[a-zA-Z0-9\-_]+$/.test(oldSnapshotId) || !/^[a-zA-Z0-9\-_]+$/.test(newSnapshotId)) {
      return null;
    }

    const diffFilename = `diff-${oldSnapshotId}-${newSnapshotId}.png`;
    const metaFilename = `diff-${oldSnapshotId}-${newSnapshotId}.json`;
    const diffPath = path.join(this.storageDir, diffFilename);
    const metaPath = path.join(this.storageDir, metaFilename);

    // Return cached diff if both image and metadata exist
    if (fs.existsSync(diffPath) && fs.existsSync(metaPath)) {
      try {
        const cachedMeta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
        return {
          diffImageUrl: `/snapshots/diff/${oldSnapshotId}/${newSnapshotId}/visual-diff`,
          ...cachedMeta,
        };
      } catch {
        this.logger.warn(`Failed to parse cached visual diff meta: ${metaPath}`);
      }
    }

    const oldPath = this.getScreenshotPathBySnapshotId(oldSnapshotId);
    const newPath = this.getScreenshotPathBySnapshotId(newSnapshotId);

    if (!oldPath || !newPath) {
      return null;
    }

    try {
      this.logger.log(`Generating visual pixel diff between ${oldSnapshotId} and ${newSnapshotId}`);

      const oldBuf = fs.readFileSync(oldPath);
      const newBuf = fs.readFileSync(newPath);

      const oldImg = PNG.sync.read(oldBuf);
      const newImg = PNG.sync.read(newBuf);

      const width = Math.max(oldImg.width, newImg.width);
      const height = Math.max(oldImg.height, newImg.height);

      const oldPadded = this.padPng(oldImg, width, height);
      const newPadded = this.padPng(newImg, width, height);

      // Create a clean, crisp background using the sharp current screenshot (slightly dimmed for readability)
      const diffImg = new PNG({ width, height });
      for (let i = 0; i < newPadded.data.length; i += 4) {
        const r = newPadded.data[i];
        const g = newPadded.data[i + 1];
        const b = newPadded.data[i + 2];
        const a = newPadded.data[i + 3];

        // Soft contrast preservation: keeps background sharp and perfectly legible
        diffImg.data[i] = Math.round(r * 0.75);
        diffImg.data[i + 1] = Math.round(g * 0.75);
        diffImg.data[i + 2] = Math.round(b * 0.75);
        diffImg.data[i + 3] = a;
      }

      // Compute exact diff mask using pixelmatch
      const maskImg = new PNG({ width, height });
      const diffPixels = pixelmatch(
        oldPadded.data,
        newPadded.data,
        maskImg.data,
        width,
        height,
        {
          threshold: 0.2, // Clean threshold eliminates fuzzy sub-pixel anti-aliasing noise
          includeAA: false,
          diffMask: true,
        }
      );

      // Paint changed pixels with high-visibility fluorescent neon red
      for (let i = 0; i < maskImg.data.length; i += 4) {
        if (maskImg.data[i + 3] > 0 && (maskImg.data[i] > 0 || maskImg.data[i + 1] > 0 || maskImg.data[i + 2] > 0)) {
          diffImg.data[i] = 255;
          diffImg.data[i + 1] = 0;
          diffImg.data[i + 2] = 80;
          diffImg.data[i + 3] = 255;
        }
      }

      const totalPixels = width * height;
      const diffPercentage = Number(((diffPixels / totalPixels) * 100).toFixed(2));

      // Save diff image and meta
      const diffBuffer = PNG.sync.write(diffImg);
      fs.writeFileSync(diffPath, diffBuffer);

      const meta = {
        diffPercentage,
        diffPixels,
        totalPixels,
        width,
        height,
      };
      fs.writeFileSync(metaPath, JSON.stringify(meta), 'utf8');

      this.logger.log(`Visual diff completed: ${diffPercentage}% visual pixels changed (${diffPixels} / ${totalPixels})`);

      return {
        diffImageUrl: `/snapshots/diff/${oldSnapshotId}/${newSnapshotId}/visual-diff`,
        ...meta,
      };
    } catch (err: any) {
      this.logger.error(`Error generating visual diff between ${oldSnapshotId} and ${newSnapshotId}: ${err?.message}`);
      return null;
    }
  }

  /**
   * Securely resolves a visual diff screenshot file path, preventing directory traversal.
   */
  getVisualDiffPath(oldSnapshotId: string, newSnapshotId: string): string | null {
    if (!/^[a-zA-Z0-9\-_]+$/.test(oldSnapshotId) || !/^[a-zA-Z0-9\-_]+$/.test(newSnapshotId)) {
      return null;
    }

    const diffFilename = `diff-${oldSnapshotId}-${newSnapshotId}.png`;
    const resolvedPath = path.join(this.storageDir, diffFilename);

    if (!resolvedPath.startsWith(this.storageDir) || !fs.existsSync(resolvedPath)) {
      return null;
    }

    return resolvedPath;
  }
}
