import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { WebhookNotifierService } from './webhook-notifier.service.js';

describe('WebhookNotifierService', () => {
  let service: WebhookNotifierService;
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    delete process.env.SLACK_WEBHOOK_URL;
    delete process.env.DISCORD_WEBHOOK_URL;
    delete process.env.WEBHOOK_MIN_SEVERITY;
    service = new WebhookNotifierService();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should do nothing when no webhook URLs are configured', async () => {
    const fetchSpy = vi.spyOn(global, 'fetch');
    await service.notifyAlert({
      id: 'alert-1',
      title: 'Test Alert',
      message: 'Test message',
      significance: 'HIGH',
      competitorId: 'comp-1',
    });

    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('should skip sending if significance is below configured threshold', async () => {
    process.env.SLACK_WEBHOOK_URL = 'https://hooks.slack.com/services/T00/B00/SECRET123';
    process.env.WEBHOOK_MIN_SEVERITY = 'HIGH';

    const fetchSpy = vi.spyOn(global, 'fetch');

    await service.notifyAlert({
      id: 'alert-low',
      title: 'Low Impact Change',
      message: 'Minor cosmetic tweak',
      significance: 'LOW',
      competitorId: 'comp-1',
    });

    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('should dispatch formatted payload to Slack for HIGH severity alert', async () => {
    process.env.SLACK_WEBHOOK_URL = 'https://hooks.slack.com/services/T00/B00/SECRET123';
    const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue(new Response('ok', { status: 200 }));

    await service.notifyAlert({
      id: 'alert-high',
      title: 'High Impact: https://example.com',
      message: 'Competitor dropped prices by 50%',
      significance: 'HIGH',
      competitorId: 'comp-1',
    });

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const [calledUrl, calledOptions] = fetchSpy.mock.calls[0];
    expect(calledUrl).toBe('https://hooks.slack.com/services/T00/B00/SECRET123');
    const parsedBody = JSON.parse(calledOptions?.body as string);
    expect(parsedBody.text).toContain('[HIGH SEVERITY]');
    expect(parsedBody.text).toContain('Competitor dropped prices by 50%');
  });

  it('should dispatch formatted payload to Discord when configured', async () => {
    process.env.DISCORD_WEBHOOK_URL = 'https://discord.com/api/webhooks/123/SECRET456';
    const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue(new Response(null, { status: 204 }));

    await service.notifyAlert({
      id: 'alert-discord',
      title: 'Discord Notification Test',
      message: 'New enterprise plan announced',
      significance: 'HIGH',
      competitorId: 'comp-1',
    });

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const [calledUrl, calledOptions] = fetchSpy.mock.calls[0];
    expect(calledUrl).toBe('https://discord.com/api/webhooks/123/SECRET456');
    const parsedBody = JSON.parse(calledOptions?.body as string);
    expect(parsedBody.embeds[0].title).toContain('Discord Notification Test');
  });

  it('should prevent duplicate webhook notifications for same change event', async () => {
    process.env.SLACK_WEBHOOK_URL = 'https://hooks.slack.com/services/T00/B00/SECRET123';
    const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue(new Response('ok', { status: 200 }));

    const alertData = {
      id: 'alert-first',
      changeId: 'change-unique-1',
      title: 'Repeated Alert Test',
      message: 'Duplicate event check',
      significance: 'HIGH',
      competitorId: 'comp-1',
    };

    await service.notifyAlert(alertData);
    await service.notifyAlert({ ...alertData, id: 'alert-second' });

    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });
});
