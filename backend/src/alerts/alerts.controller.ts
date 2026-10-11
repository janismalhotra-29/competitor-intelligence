import { Controller, Get, Patch, Param, Query } from '@nestjs/common';
import { AlertsService } from './alerts.service.js';

@Controller('alerts')
export class AlertsController {
  constructor(private alertsService: AlertsService) {}

  @Get()
  async getAlerts(@Query('unread') unread?: string) {
    const unreadOnly = unread === 'true';
    return this.alertsService.findAll(unreadOnly);
  }

  @Patch('read-all')
  async markAllAsRead() {
    return this.alertsService.markAllAsRead();
  }

  @Patch(':id/read')
  async markAsRead(@Param('id') id: string) {
    return this.alertsService.markAsRead(id);
  }
}
