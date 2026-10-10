import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { CompetitorsService } from '../competitors/competitors.service.js';
import { SnapshotsService } from '../snapshots/snapshots.service.js';

@Injectable()
export class AutomationService {
  private readonly logger = new Logger(AutomationService.name);

  constructor(
    private competitorsService: CompetitorsService,
    private snapshotsService: SnapshotsService,
  ) {}

  // Changed to EVERY_DAY_AT_MIDNIGHT for production tracking
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleCron() {
    this.logger.log('Running automated crawl for all competitors');
    try {
      const competitors = await this.competitorsService.findAll();
      for (const competitor of competitors) {
        this.logger.log(`Triggering collection for competitor ${competitor.url}`);
        await this.snapshotsService.triggerCollection(competitor.id).catch(err => {
          this.logger.error(`Failed to collect for ${competitor.url}:`, err);
        });
      }
      this.logger.log('Completed automated crawl');
    } catch (error) {
      this.logger.error('Error running automated crawl:', error);
    }
  }
}
