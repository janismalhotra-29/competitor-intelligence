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
        {/* Metric 1: Monitored Competitors */}
        <div style={{ padding: '20px 24px' }}>
          <Stack gap={8}>
            <Group justify="space-between" align="center">
              <Text styleKey="caption1" weight={300} style={{ color: 'var(--x-text-muted)' }}>
                COMPETITORS
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
              Websites currently being monitored
            </Text>
          </Stack>
        </div>

        <Divider orientation="vertical" />

        {/* Metric 2: Screenshots Captured */}
        <div style={{ padding: '20px 24px' }}>
          <Stack gap={8}>
            <Group justify="space-between" align="center">
              <Text styleKey="caption1" weight={300} style={{ color: 'var(--x-text-muted)' }}>
                SCREENSHOTS
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
                Saved
              </Badge>
            </Group>
            <Text styleKey="caption2" weight={300} style={{ color: 'var(--x-text-muted)' }}>
              Visual snapshots available for comparison
            </Text>
          </Stack>
        </div>

        <Divider orientation="vertical" />

        {/* Metric 3: Updates Found */}
        <div style={{ padding: '20px 24px' }}>
          <Stack gap={8}>
            <Group justify="space-between" align="center">
              <Text styleKey="caption1" weight={300} style={{ color: 'var(--x-text-muted)' }}>
                UPDATES FOUND
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
                {totalChanges > 0 ? 'New Updates' : 'No Changes'}
              </Badge>
            </Group>
            <Text styleKey="caption2" weight={300} style={{ color: 'var(--x-text-muted)' }}>
              Website design, copy, or layout shifts
            </Text>
          </Stack>
        </div>

        <Divider orientation="vertical" />

        {/* Metric 4: Pricing Plans Monitored */}
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
                {isLive ? 'Auto-checking' : 'Paused'}
              </Badge>
            </Group>
            <Text styleKey="caption2" weight={300} style={{ color: 'var(--x-text-muted)' }}>
              Competitor pricing tiers extracted
            </Text>
          </Stack>
        </div>
      </div>
    </Surface>
  );
}
