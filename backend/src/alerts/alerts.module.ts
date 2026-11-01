import { Module } from '@nestjs/common';
import { AlertsService } from './alerts.service.js';
import { AlertsController } from './alerts.controller.js';
import { WebhookNotifierService } from './webhook-notifier.service.js';
import { PrismaModule } from '../prisma/prisma.module.js';

@Module({
  imports: [PrismaModule],
  controllers: [AlertsController],
  providers: [AlertsService, WebhookNotifierService],
  exports: [AlertsService, WebhookNotifierService],
})
export class AlertsModule {}
