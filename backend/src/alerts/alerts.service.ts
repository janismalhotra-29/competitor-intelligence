import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class AlertsService {
  private readonly logger = new Logger(AlertsService.name);

  constructor(private prisma: PrismaService) {}

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

    return this.prisma.alert.create({
      data: {
        competitorId: data.competitorId,
        changeId: data.changeId,
        title: data.title,
        message: data.message,
        significance: data.significance || 'MEDIUM',
        isRead: false,
      },
    });
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
