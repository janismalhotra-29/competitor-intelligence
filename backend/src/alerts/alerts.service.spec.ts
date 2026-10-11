import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AlertsService } from './alerts.service.js';
import { PrismaService } from '../prisma/prisma.service.js';

describe('AlertsService', () => {
  let service: AlertsService;
  let prismaMock: any;

  beforeEach(() => {
    prismaMock = {
      alert: {
        create: vi.fn(),
        findMany: vi.fn(),
        update: vi.fn(),
        updateMany: vi.fn(),
      },
    };
    service = new AlertsService(prismaMock as unknown as PrismaService);
  });

  it('should create an alert', async () => {
    const mockData = {
      competitorId: 'comp-1',
      title: 'High Impact: https://example.com',
      message: 'Price dropped from $50 to $25',
      significance: 'HIGH',
    };

    prismaMock.alert.create.mockResolvedValue({ id: 'alert-1', ...mockData, isRead: false });

    const result = await service.createAlert(mockData);
    expect(result.id).toBe('alert-1');
    expect(prismaMock.alert.create).toHaveBeenCalledWith({
      data: {
        ...mockData,
        changeId: undefined,
        isRead: false,
      },
    });
  });

  it('should find all alerts', async () => {
    prismaMock.alert.findMany.mockResolvedValue([{ id: 'alert-1' }]);
    const result = await service.findAll(false);
    expect(result).toHaveLength(1);
    expect(prismaMock.alert.findMany).toHaveBeenCalledWith({
      where: undefined,
      include: { competitor: true },
      orderBy: { createdAt: 'desc' },
    });
  });

  it('should find only unread alerts when unreadOnly is true', async () => {
    prismaMock.alert.findMany.mockResolvedValue([{ id: 'alert-2', isRead: false }]);
    const result = await service.findAll(true);
    expect(result).toHaveLength(1);
    expect(prismaMock.alert.findMany).toHaveBeenCalledWith({
      where: { isRead: false },
      include: { competitor: true },
      orderBy: { createdAt: 'desc' },
    });
  });

  it('should mark an alert as read', async () => {
    prismaMock.alert.update.mockResolvedValue({ id: 'alert-1', isRead: true });
    const result = await service.markAsRead('alert-1');
    expect(result.isRead).toBe(true);
    expect(prismaMock.alert.update).toHaveBeenCalledWith({
      where: { id: 'alert-1' },
      data: { isRead: true },
    });
  });

  it('should mark all alerts as read', async () => {
    prismaMock.alert.updateMany.mockResolvedValue({ count: 5 });
    const result = await service.markAllAsRead();
    expect(result.count).toBe(5);
    expect(prismaMock.alert.updateMany).toHaveBeenCalledWith({
      where: { isRead: false },
      data: { isRead: true },
    });
  });
});
