import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { CompetitorsModule } from './competitors/competitors.module.js';
import { SnapshotsModule } from './snapshots/snapshots.module.js';
import { CrawlerModule } from './crawler/crawler.module.js';

@Module({
  imports: [PrismaModule, CompetitorsModule, SnapshotsModule, CrawlerModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
