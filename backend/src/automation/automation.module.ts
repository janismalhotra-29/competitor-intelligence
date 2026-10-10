import { Module } from '@nestjs/common';
import { AutomationService } from './automation.service.js';
import { CompetitorsModule } from '../competitors/competitors.module.js';
import { SnapshotsModule } from '../snapshots/snapshots.module.js';

@Module({
  imports: [CompetitorsModule, SnapshotsModule],
  providers: [AutomationService],
})
export class AutomationModule {}
