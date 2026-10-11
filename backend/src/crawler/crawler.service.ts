import { Injectable, Logger } from '@nestjs/common';
import * as cheerio from 'cheerio';

export interface CrawlResult {
  url: string;
  pageTitle: string | null;
  extractedText: string | null;
  metadata: Record<string, any> | null;
  status: 'SUCCESS' | 'FAILED';
  capturedAt: Date;
}

@Injectable()
export class CrawlerService {
  private readonly logger = new Logger(CrawlerService.name);

  async crawlPublicPage(url: string): Promise<CrawlResult> {
    const timestamp = new Date();
    try {
      this.logger.log(`Fetching public page: ${url}`);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
        },
        signal: AbortSignal.timeout(10000)
      });

      if (!response.ok) {
        this.logger.warn(`Failed to fetch ${url}, status: ${response.status}`);
        return this.createFailedResult(url, timestamp);
      }

      const html = await response.text();
      const $ = cheerio.load(html);

      const pageTitle = $('title').text()?.trim() || null;
      
      $('script, style, noscript, iframe, img, svg, video').remove();
      
      const extractedText = $('body').text().replace(/\s+/g, ' ').trim() || null;
      
      const metadata: Record<string, string> = {};
      $('meta').each((_, element) => {
        const name = $(element).attr('name') || $(element).attr('property');
        const content = $(element).attr('content');
        if (name && content) {
          metadata[name] = content;
        }
      });

      return {
        url,
        pageTitle,
        extractedText,
        metadata,
        status: 'SUCCESS',
        capturedAt: timestamp
      };

    } catch (error) {
      this.logger.error(`Error crawling ${url}`, error);
      return this.createFailedResult(url, timestamp);
    }
  }

  private createFailedResult(url: string, timestamp: Date): CrawlResult {
    return {
      url,
      pageTitle: null,
      extractedText: null,
      metadata: null,
      status: 'FAILED',
      capturedAt: timestamp
    };
  }
}
