'use client';

import React from 'react';
import {
  Surface,
  Group,
  Stack,
  Text,
  Badge,
  Button,
  Icon,
  Divider,
} from '@xenon-kit/web';
import { Bell, Check, Warning, Shield, CalendarBlank } from '@phosphor-icons/react';
import type { Alert } from '@/types';

interface AlertsTrailProps {
  alerts: Alert[];
  onMarkRead: (id: string) => Promise<void>;
  onMarkAllRead: () => Promise<void>;
}

export function AlertsTrail({ alerts, onMarkRead, onMarkAllRead }: AlertsTrailProps) {
  const unreadCount = alerts.filter((a) => !a.isRead).length;

  return (
    <Surface
      variant="default"
      padding={0}
      style={{
        borderRadius: 'var(--x-radius)',
        border: '1px solid var(--x-border)',
        overflow: 'hidden',
      }}
    >
      <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--x-border)' }}>
        <Group justify="space-between" align="center">
          <div>
            <Text styleKey="headline" weight={300}>
              Activity & Notification Feed
            </Text>
            <Text styleKey="caption1" weight={300} style={{ color: 'var(--x-text-muted)', marginTop: '2px' }}>
              Recent alerts, detected website updates, and completed screenshot checks
            </Text>
          </div>
          <Group gap={12} align="center">
            {unreadCount > 0 && (
              <Badge variant="subtle" tone="accent">
                {unreadCount} Unread
              </Badge>
            )}
            {unreadCount > 0 && (
              <Button variant="ghost" size="sm" onClick={() => void onMarkAllRead()}>
                <Icon size="sm">
                  <Check weight="thin" />
                </Icon>
                Mark all read
              </Button>
            )}
          </Group>
        </Group>
      </div>

      {alerts.length === 0 ? (
        <div style={{ padding: '40px 24px', textAlign: 'center' }}>
          <Stack gap={12} align="center">
            <Icon size="lg" style={{ color: 'var(--x-text-muted)' }}>
              <Bell weight="thin" />
            </Icon>
            <Text styleKey="callout" weight={300} style={{ color: 'var(--x-text-muted)' }}>
              No alerts in the system log. All monitoring pipelines operating normally.
            </Text>
          </Stack>
        </div>
      ) : (
        <Stack gap={0}>
          {alerts.map((alert, idx) => {
            const sig = alert.significance ? alert.significance.toLowerCase() : 'low';
            const isHigh = sig === 'high';
            const isMedium = sig === 'medium';
            const badgeTone = isHigh ? 'danger' : isMedium ? 'accent' : 'neutral';

            return (
              <React.Fragment key={alert.id}>
                {idx > 0 && <Divider />}
                <div
                  style={{
                    padding: '18px 24px',
                    backgroundColor: alert.isRead ? 'transparent' : 'var(--x-surface-1)',
                    transition: 'background-color 0.2s ease',
                  }}
                >
                  <Group justify="space-between" align="center">
                    <Group gap={16} align="center">
                      <div
                        style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: 'var(--x-radius)',
                          border: '1px solid var(--x-border)',
                          backgroundColor: 'var(--x-surface-2)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: isHigh ? 'var(--x-danger)' : 'var(--x-accent)',
                        }}
                      >
                        <Icon size="sm">
                          {isHigh ? <Warning weight="thin" /> : <Shield weight="thin" />}
                        </Icon>
                      </div>

                      <div>
                        <Group gap={8} align="center">
                          <Text styleKey="callout" weight={alert.isRead ? 300 : 400} style={{ color: 'var(--x-text)' }}>
                            {alert.title || alert.message}
                          </Text>
                          <Badge variant="subtle" tone={badgeTone} size="sm">
                            {alert.significance || 'info'}
                          </Badge>
                          {!alert.isRead && (
                            <Badge variant="outline" tone="accent" size="sm">
                              New
                            </Badge>
                          )}
                        </Group>
                        {alert.title && alert.message !== alert.title && (
                          <Text styleKey="caption1" weight={300} style={{ color: 'var(--x-text-muted)', marginTop: '2px' }}>
                            {alert.message}
                          </Text>
                        )}
                        <Group gap={6} align="center" style={{ marginTop: '4px', color: 'var(--x-text-muted)' }}>
                          <Icon size="sm">
                            <CalendarBlank weight="thin" />
                          </Icon>
                          <Text styleKey="caption2" weight={300}>
                            {new Date(alert.createdAt).toLocaleString()}
                          </Text>
                        </Group>
                      </div>
                    </Group>

                    {!alert.isRead && (
                      <Button variant="ghost" size="sm" onClick={() => void onMarkRead(alert.id)}>
                        <Icon size="sm">
                          <Check weight="thin" />
                        </Icon>
                        Dismiss
                      </Button>
                    )}
                  </Group>
                </div>
              </React.Fragment>
            );
          })}
        </Stack>
      )}
    </Surface>
  );
}
