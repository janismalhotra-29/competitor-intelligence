import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { CompetitorsService } from '../competitors/competitors.service.js';
import { SnapshotsService } from '../snapshots/snapshots.service.js';

@Injectable()
export class AutomationService {
  private readonly logger = new Logger(AutomationService.name);
  private isRunning = false;

  constructor(
    private competitorsService: CompetitorsService,
    private snapshotsService: SnapshotsService,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleCron() {
    if (this.isRunning) {
      this.logger.warn('Automated crawl is already executing. Skipping overlapping run.');
      return;
    }

    this.isRunning = true;
    this.logger.log('Starting automated crawl for all tracked competitors');

    try {
      const competitors = await this.competitorsService.findAll();
      for (const competitor of competitors) {
        this.logger.log(`Triggering collection for competitor ${competitor.url}`);
        await this.snapshotsService.triggerCollection(competitor.id).catch((err) => {
          this.logger.error(`Failed to collect for ${competitor.url}:`, err);
        });
      }
      this.logger.log('Completed automated crawl for all tracked competitors');
    } catch (error) {
      this.logger.error('Error during automated crawl execution:', error);
    } finally {
      this.isRunning = false;
    }
  }

  isCrawlRunning(): boolean {
    return this.isRunning;
  }
}
