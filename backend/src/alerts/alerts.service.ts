import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { WebhookNotifierService } from './webhook-notifier.service.js';

@Injectable()
export class AlertsService {
  private readonly logger = new Logger(AlertsService.name);

  constructor(
    private prisma: PrismaService,
    private webhookNotifier: WebhookNotifierService,
  ) {}

  async createAlert(data: {
    competitorId: string;
    changeId?: string;
    title: string;
    message: string;
    significance?: string;
  }) {
    // Prevent duplicate alert for the same change event
    if (data.changeId) {
      const existing = await this.prisma.alert.findFirst({
        where: { changeId: data.changeId },
      });
      if (existing) {
        this.logger.warn(`Alert already exists for change ${data.changeId}. Skipping duplicate creation.`);
        return existing;
      }
    }

    const alert = await this.prisma.alert.create({
      data: {
        competitorId: data.competitorId,
        changeId: data.changeId,
        title: data.title,
        message: data.message,
        significance: data.significance || 'MEDIUM',
        isRead: false,
      },
    });

    // Asynchronously dispatch external webhooks (Slack/Discord) if configured
    this.webhookNotifier
      .notifyAlert({
        id: alert.id,
        title: alert.title,
        message: alert.message,
        significance: alert.significance,
        competitorId: alert.competitorId,
        changeId: alert.changeId,
      })
      .catch((err) => {
        this.logger.error('Failed to dispatch webhook notification', err);
      });

    return alert;
  }

  async findAll(unreadOnly = false) {
    return this.prisma.alert.findMany({
      where: unreadOnly ? { isRead: false } : undefined,
      include: {
        competitor: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async markAsRead(id: string) {
    return this.prisma.alert.update({
      where: { id },
      data: { isRead: true },
    });
  }

  async markAllAsRead() {
    return this.prisma.alert.updateMany({
      where: { isRead: false },
      data: { isRead: true },
    });
  }
}
