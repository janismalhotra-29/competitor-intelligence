import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AutomationService } from './automation.service.js';
import { CompetitorsService } from '../competitors/competitors.service.js';
import { SnapshotsService } from '../snapshots/snapshots.service.js';

describe('AutomationService', () => {
  let service: AutomationService;
  let competitorsServiceMock: any;
  let snapshotsServiceMock: any;

  beforeEach(() => {
    competitorsServiceMock = {
      findAll: vi.fn(),
    };
    snapshotsServiceMock = {
      triggerCollection: vi.fn(),
    };

    service = new AutomationService(
      competitorsServiceMock as unknown as CompetitorsService,
      snapshotsServiceMock as unknown as SnapshotsService,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
    expect(service.isCrawlRunning()).toBe(false);
  });

  it('should execute automated crawl for all competitors and reset running flag', async () => {
    competitorsServiceMock.findAll.mockResolvedValue([
      { id: 'comp-1', url: 'https://example.com' },
      { id: 'comp-2', url: 'https://test.com' },
    ]);
    snapshotsServiceMock.triggerCollection.mockResolvedValue({ id: 'snap-1' });

    await service.handleCron();

    expect(competitorsServiceMock.findAll).toHaveBeenCalledTimes(1);
    expect(snapshotsServiceMock.triggerCollection).toHaveBeenCalledWith('comp-1');
    expect(snapshotsServiceMock.triggerCollection).toHaveBeenCalledWith('comp-2');
    expect(service.isCrawlRunning()).toBe(false);
  });

  it('should prevent overlapping crawl when another execution is already active', async () => {
    competitorsServiceMock.findAll.mockImplementation(async () => {
      // Simulate slow crawl
      await new Promise((r) => setTimeout(r, 50));
      return [{ id: 'comp-1', url: 'https://example.com' }];
    });
    snapshotsServiceMock.triggerCollection.mockResolvedValue({ id: 'snap-1' });

    // Start first run
    const firstRun = service.handleCron();
    expect(service.isCrawlRunning()).toBe(true);

    // Trigger overlapping run immediately
    await service.handleCron();

    await firstRun;

    // findAll should only have been called by the first run
    expect(competitorsServiceMock.findAll).toHaveBeenCalledTimes(1);
    expect(service.isCrawlRunning()).toBe(false);
  });

  it('should reset isRunning even if findAll throws an error', async () => {
    competitorsServiceMock.findAll.mockRejectedValue(new Error('Database disconnected'));

    await service.handleCron();

    expect(service.isCrawlRunning()).toBe(false);
  });
});
