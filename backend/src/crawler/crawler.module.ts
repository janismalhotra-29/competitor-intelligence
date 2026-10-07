import { Module } from '@nestjs/common';
import { CrawlerService } from './crawler.service.js';

@Module({
  providers: [CrawlerService],
  exports: [CrawlerService]
})
export class CrawlerModule {}
