import { Injectable, Logger } from '@nestjs/common';

export interface WebhookAlertPayload {
  id: string;
  title: string;
  message: string;
  significance: string;
  competitorId: string;
  changeId?: string | null;
}

const SEVERITY_LEVELS: Record<string, number> = {
  HIGH: 3,
  MEDIUM: 2,
  LOW: 1,
  NONE: 0,
};

@Injectable()
export class WebhookNotifierService {
  private readonly logger = new Logger(WebhookNotifierService.name);
  private readonly recentlyDispatched = new Set<string>();

  /**
   * Dispatches external notifications (Slack/Discord) for qualifying alerts.
   * Never throws; failures are logged with masked secrets.
   */
  async notifyAlert(alert: WebhookAlertPayload): Promise<void> {
    const slackUrl = process.env.SLACK_WEBHOOK_URL;
    const discordUrl = process.env.DISCORD_WEBHOOK_URL;

    if (!slackUrl && !discordUrl) {
      // No external webhooks configured; in-app alerts handle display
      return;
    }

    // 1. Severity Threshold Check
    const minSeverity = (process.env.WEBHOOK_MIN_SEVERITY || 'HIGH').toUpperCase();
    const alertLevel = SEVERITY_LEVELS[alert.significance.toUpperCase()] ?? 1;
    const minLevel = SEVERITY_LEVELS[minSeverity] ?? 3;

    if (alertLevel < minLevel) {
      this.logger.debug(
        `Alert ${alert.id} (${alert.significance}) below configured threshold (${minSeverity}). Skipping external webhook.`,
      );
      return;
    }

    // 2. Deduplication Check
    const dedupeKey = alert.changeId ? `change:${alert.changeId}` : `alert:${alert.id}`;
    if (this.recentlyDispatched.has(dedupeKey)) {
      this.logger.warn(`Webhook already dispatched for ${dedupeKey}. Skipping duplicate.`);
      return;
    }
    this.recentlyDispatched.add(dedupeKey);

    // Keep deduplication set bounded
    if (this.recentlyDispatched.size > 1000) {
      const first = this.recentlyDispatched.values().next().value;
      if (first) this.recentlyDispatched.delete(first);
    }

    // 3. Dispatch to Slack if configured
    if (slackUrl) {
      await this.sendToSlack(slackUrl, alert);
    }

    // 4. Dispatch to Discord if configured
    if (discordUrl) {
      await this.sendToDiscord(discordUrl, alert);
    }
  }

  private async sendToSlack(webhookUrl: string, alert: WebhookAlertPayload): Promise<void> {
    const payload = {
      text: `🚨 *[${alert.significance} SEVERITY]* ${alert.title}\n${alert.message}`,
      attachments: [
        {
          color: alert.significance === 'HIGH' ? '#dc2626' : '#f59e0b',
          fields: [
            { title: 'Severity', value: alert.significance, short: true },
            { title: 'Alert ID', value: alert.id, short: true },
          ],
          ts: Math.floor(Date.now() / 1000).toString(),
        },
      ],
    };

    await this.postWithRetry('Slack', webhookUrl, payload);
  }

  private async sendToDiscord(webhookUrl: string, alert: WebhookAlertPayload): Promise<void> {
    const payload = {
      embeds: [
        {
          title: `🚨 [${alert.significance}] ${alert.title}`,
          description: alert.message,
          color: alert.significance === 'HIGH' ? 0xdc2626 : 0xf59e0b,
          fields: [
            { name: 'Severity', value: alert.significance, inline: true },
            { name: 'Alert ID', value: alert.id, inline: true },
          ],
          timestamp: new Date().toISOString(),
        },
      ],
    };

    await this.postWithRetry('Discord', webhookUrl, payload);
  }

  private async postWithRetry(
    providerName: string,
    webhookUrl: string,
    payload: Record<string, any>,
    maxRetries = 2,
  ): Promise<void> {
    const maskedUrl = this.maskWebhookUrl(webhookUrl);

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const response = await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          signal: AbortSignal.timeout(5000), // 5-second strict timeout
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status} ${response.statusText}`);
        }

        this.logger.log(`Successfully dispatched ${providerName} alert notification to ${maskedUrl}`);
        return;
      } catch (error: any) {
        this.logger.warn(
          `Failed attempt ${attempt}/${maxRetries} sending ${providerName} webhook to ${maskedUrl}: ${error?.message}`,
        );
        if (attempt < maxRetries) {
          await new Promise((r) => setTimeout(r, attempt * 500));
        }
      }
    }

    this.logger.error(`Exhausted retries for ${providerName} webhook notification (${maskedUrl})`);
  }

  private maskWebhookUrl(url: string): string {
    try {
      const parsed = new URL(url);
      const pathSegments = parsed.pathname.split('/').filter(Boolean);
      const maskedPath = pathSegments.length > 0 ? `/${pathSegments[0]}/.../***` : '/***';
      return `${parsed.protocol}//${parsed.host}${maskedPath}`;
    } catch {
      return 'https://***';
    }
  }
}
