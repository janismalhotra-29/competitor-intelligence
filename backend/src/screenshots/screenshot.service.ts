import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import * as path from 'path';
import * as fs from 'fs';
import { chromium, Browser } from 'playwright';
import { validatePublicUrl } from '../common/url-validator.js';

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
}
