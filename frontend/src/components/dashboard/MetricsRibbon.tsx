'use client';

import React from 'react';
import { Surface, Group, Stack, Text, Badge, Divider, Icon } from '@xenon-kit/web';
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
      }}
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          alignItems: 'stretch',
        }}
      >
        {/* Metric 1: Tracked Domains */}
        <div style={{ padding: '20px 24px' }}>
          <Stack gap={8}>
            <Group justify="space-between" align="center">
              <Text styleKey="caption1" weight={300} style={{ color: 'var(--x-text-muted)' }}>
                TRACKED DOMAINS
              </Text>
              <Icon size="sm" style={{ color: 'var(--x-accent)' }}>
                <Globe weight="thin" />
              </Icon>
            </Group>
            <Group align="baseline" gap={8}>
              <Text styleKey="title1" weight={300} style={{ color: 'var(--x-text)' }}>
                {competitorsCount}
              </Text>
              <Badge variant="subtle" tone="accent" size="sm">
                Active
              </Badge>
            </Group>
            <Text styleKey="caption2" weight={300} style={{ color: 'var(--x-text-muted)' }}>
              Autonomous continuous observation
            </Text>
          </Stack>
        </div>

        <Divider orientation="vertical" />

        {/* Metric 2: Visual Snapshots */}
        <div style={{ padding: '20px 24px' }}>
          <Stack gap={8}>
            <Group justify="space-between" align="center">
              <Text styleKey="caption1" weight={300} style={{ color: 'var(--x-text-muted)' }}>
                TOTAL SNAPSHOTS
              </Text>
              <Icon size="sm" style={{ color: 'var(--x-accent)' }}>
                <GitDiff weight="thin" />
              </Icon>
            </Group>
            <Group align="baseline" gap={8}>
              <Text styleKey="title1" weight={300} style={{ color: 'var(--x-text)' }}>
                {totalSnapshots}
              </Text>
              <Badge variant="outline" tone="neutral" size="sm">
                Pixel-diff ready
              </Badge>
            </Group>
            <Text styleKey="caption2" weight={300} style={{ color: 'var(--x-text-muted)' }}>
              Headless Chromium viewports captured
            </Text>
          </Stack>
        </div>

        <Divider orientation="vertical" />

        {/* Metric 3: Detected Changes */}
        <div style={{ padding: '20px 24px' }}>
          <Stack gap={8}>
            <Group justify="space-between" align="center">
              <Text styleKey="caption1" weight={300} style={{ color: 'var(--x-text-muted)' }}>
                CHANGES DETECTED
              </Text>
              <Icon size="sm" style={{ color: 'var(--x-accent)' }}>
                <Waveform weight="thin" />
              </Icon>
            </Group>
            <Group align="baseline" gap={8}>
              <Text styleKey="title1" weight={300} style={{ color: 'var(--x-text)' }}>
                {totalChanges}
              </Text>
              <Badge variant="subtle" tone={totalChanges > 0 ? 'accent' : 'neutral'} size="sm">
                {totalChanges > 0 ? 'AI Classified' : 'Stable'}
              </Badge>
            </Group>
            <Text styleKey="caption2" weight={300} style={{ color: 'var(--x-text-muted)' }}>
              Layout, DOM structure & copy deltas
            </Text>
          </Stack>
        </div>

        <Divider orientation="vertical" />

        {/* Metric 4: Pricing Plans */}
        <div style={{ padding: '20px 24px' }}>
          <Stack gap={8}>
            <Group justify="space-between" align="center">
              <Text styleKey="caption1" weight={300} style={{ color: 'var(--x-text-muted)' }}>
                PRICING PLANS
              </Text>
              <Icon size="sm" style={{ color: 'var(--x-accent)' }}>
                <CurrencyDollar weight="thin" />
              </Icon>
            </Group>
            <Group align="baseline" gap={8}>
              <Text styleKey="title1" weight={300} style={{ color: 'var(--x-text)' }}>
                {totalPricingPlans}
              </Text>
              <Badge variant="subtle" tone="accent" size="sm">
                {isLive ? '15s Cadence' : 'Standby'}
              </Badge>
            </Group>
            <Text styleKey="caption2" weight={300} style={{ color: 'var(--x-text-muted)' }}>
              Extracted tier rates & feature maps
            </Text>
          </Stack>
        </div>
      </div>
    </Surface>
  );
}
