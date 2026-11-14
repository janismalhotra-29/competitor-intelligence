'use client';

import { useState, useRef, useEffect } from 'react';
import type { Alert } from '@/types';
import { Surface, Heading, Text, Badge, Button, IconButton, Icon, Group, Stack, Divider } from '@xenon-kit/web';
import { Bell, Check, CheckCircle } from '@phosphor-icons/react';

interface Props {
  alerts: Alert[];
  unreadCount: number;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
}

export function AlertsDropdown({ alerts, unreadCount, markAsRead, markAllAsRead }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <div className="relative">
        <IconButton
          ariaLabel="View Alerts"
          variant={isOpen ? 'accent' : 'subtle'}
          size="md"
          onClick={() => setIsOpen(!isOpen)}
        >
          <Icon size="sm">
            <Bell weight="thin" />
          </Icon>
        </IconButton>
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 pointer-events-none">
            <Badge tone="danger" size="sm" count={unreadCount} />
          </span>
        )}
      </div>

      {isOpen && (
        <div className="absolute right-0 mt-3 w-80 sm:w-96 z-50">
          <Surface variant="glass" padding={16} style={{ border: '1px solid var(--x-border)' }}>
            <Stack gap={12}>
              <Group justify="space-between" align="center">
                <Group gap={8} align="center">
                  <Heading level={4} styleKey="headline" weight={300}>
                    Notifications & Alerts
                  </Heading>
                  {unreadCount > 0 && (
                    <Badge tone="danger" size="sm">
                      {unreadCount} unread
                    </Badge>
                  )}
                </Group>
                {unreadCount > 0 && (
                  <Button variant="ghost" size="sm" onClick={() => markAllAsRead()}>
                    <Icon size="sm">
                      <Check weight="thin" />
                    </Icon>
                    <span>Mark all read</span>
                  </Button>
                )}
              </Group>

              <Divider />

              <div className="max-h-80 overflow-y-auto space-y-2 pr-1">
                {alerts.length === 0 ? (
                  <div className="py-8 text-center">
                    <Icon size="lg" color="var(--x-text-muted)">
                      <CheckCircle weight="thin" />
                    </Icon>
                    <Text styleKey="body" tone="muted" weight={300} style={{ marginTop: '8px' }}>
                      All caught up!
                    </Text>
                    <Text styleKey="caption1" tone="muted" weight={200}>
                      No alerts recorded yet.
                    </Text>
                  </div>
                ) : (
                  alerts.map((alert) => (
                    <Surface
                      key={alert.id}
                      variant={!alert.isRead ? 'subtle' : 'default'}
                      padding={12}
                      style={{
                        border: '1px solid var(--x-border)',
                        opacity: !alert.isRead ? 1 : 0.75,
                      }}
                    >
                      <Stack gap={6}>
                        <Group justify="space-between" align="center">
                          <Group gap={6} align="center">
                            <Badge
                              tone={
                                alert.significance === 'HIGH'
                                  ? 'danger'
                                  : alert.significance === 'MEDIUM'
                                  ? 'warning'
                                  : 'neutral'
                              }
                              size="sm"
                            >
                              {alert.significance}
                            </Badge>
                            {!alert.isRead && (
                              <span
                                style={{
                                  width: '6px',
                                  height: '6px',
                                  borderRadius: '9999px',
                                  background: 'var(--x-accent)',
                                }}
                              />
                            )}
                          </Group>
                          <Text styleKey="caption2" tone="muted" weight={200}>
                            {new Date(alert.createdAt).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </Text>
                        </Group>

                        <Text styleKey="subhead" weight={400}>
                          {alert.title}
                        </Text>
                        <Text styleKey="caption1" tone="muted" weight={300}>
                          {alert.message}
                        </Text>

                        {!alert.isRead && (
                          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '4px' }}>
                            <Button variant="ghost" size="sm" onClick={() => markAsRead(alert.id)}>
                              Mark as read
                            </Button>
                          </div>
                        )}
                      </Stack>
                    </Surface>
                  ))
                )}
              </div>
            </Stack>
          </Surface>
        </div>
      )}
    </div>
  );
}
