'use client';

import React from 'react';
import { Surface, Group, Text, Badge, Divider, Icon } from '@xenon-kit/web';
import { Globe, GitDiff, CurrencyDollar, Waveform } from '@phosphor-icons/react';

interface MetricsRibbonProps {
  competitorsCount: number;
  totalSnapshots: number;
  totalChanges: number;
  totalPricingPlans: number;
  isLive: boolean;
}

export function MetricsRibbon({
  competitorsCount,
  totalSnapshots,
  totalChanges,
  totalPricingPlans,
  isLive,
}: MetricsRibbonProps) {
  return (
    <Surface
      variant="default"
      padding={0}
      style={{
        borderRadius: 'var(--x-radius)',
        border: '1px solid var(--x-border)',
        overflow: 'hidden',
        backgroundColor: 'var(--x-surface-1)',
      }}
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          alignItems: 'center',
        }}
      >
        {/* Metric 1: Monitored Competitors */}
        <div style={{ padding: '14px 20px' }}>
          <Group justify="space-between" align="center">
            <div>
              <Text styleKey="caption2" weight={400} style={{ color: 'var(--x-text-muted)', letterSpacing: '0.04em' }}>
                COMPETITORS
              </Text>
              <Group align="center" gap={8} style={{ marginTop: '4px' }}>
                <Text styleKey="title2" weight={400} style={{ color: 'var(--x-text)' }}>
                  {competitorsCount}
                </Text>
                <Badge variant="subtle" tone={isLive ? 'accent' : 'neutral'} size="sm">
                  {isLive ? 'Live' : 'Active'}
                </Badge>
              </Group>
            </div>
            <Icon size="sm" style={{ color: 'var(--x-accent)' }}>
              <Globe weight="thin" />
            </Icon>
          </Group>
        </div>

        <Divider orientation="vertical" />

        {/* Metric 2: Screenshots Captured */}
        <div style={{ padding: '14px 20px' }}>
          <Group justify="space-between" align="center">
            <div>
              <Text styleKey="caption2" weight={400} style={{ color: 'var(--x-text-muted)', letterSpacing: '0.04em' }}>
                SCREENSHOTS
              </Text>
              <Group align="center" gap={8} style={{ marginTop: '4px' }}>
                <Text styleKey="title2" weight={400} style={{ color: 'var(--x-text)' }}>
                  {totalSnapshots}
                </Text>
                <Badge variant="outline" tone="neutral" size="sm">
                  Saved
                </Badge>
              </Group>
            </div>
            <Icon size="sm" style={{ color: 'var(--x-accent)' }}>
              <GitDiff weight="thin" />
            </Icon>
          </Group>
        </div>

        <Divider orientation="vertical" />

        {/* Metric 3: Updates Found */}
        <div style={{ padding: '14px 20px' }}>
          <Group justify="space-between" align="center">
            <div>
              <Text styleKey="caption2" weight={400} style={{ color: 'var(--x-text-muted)', letterSpacing: '0.04em' }}>
                UPDATES FOUND
              </Text>
              <Group align="center" gap={8} style={{ marginTop: '4px' }}>
                <Text styleKey="title2" weight={400} style={{ color: 'var(--x-text)' }}>
                  {totalChanges}
                </Text>
                <Badge variant={totalChanges > 0 ? 'subtle' : 'outline'} tone={totalChanges > 0 ? 'accent' : 'neutral'} size="sm">
                  {totalChanges > 0 ? 'Detected' : 'None'}
                </Badge>
              </Group>
            </div>
            <Icon size="sm" style={{ color: 'var(--x-accent)' }}>
              <Waveform weight="thin" />
            </Icon>
          </Group>
        </div>

        <Divider orientation="vertical" />

        {/* Metric 4: Pricing Plans */}
        <div style={{ padding: '14px 20px' }}>
          <Group justify="space-between" align="center">
            <div>
              <Text styleKey="caption2" weight={400} style={{ color: 'var(--x-text-muted)', letterSpacing: '0.04em' }}>
                PRICING PLANS
              </Text>
              <Group align="center" gap={8} style={{ marginTop: '4px' }}>
                <Text styleKey="title2" weight={400} style={{ color: 'var(--x-text)' }}>
                  {totalPricingPlans}
                </Text>
                <Badge variant="subtle" tone="accent" size="sm">
                  Tracked
                </Badge>
              </Group>
            </div>
            <Icon size="sm" style={{ color: 'var(--x-accent)' }}>
              <CurrencyDollar weight="thin" />
            </Icon>
          </Group>
        </div>
      </div>
    </Surface>
  );
}
