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
import { GitDiff, ArrowsLeftRight, CalendarBlank } from '@phosphor-icons/react';
import type { Competitor, Change } from '@/types';

function extractDomain(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return url.replace(/https?:\/\//, '').split('/')[0];
  }
}

interface VisualDiffGalleryProps {
  competitors: Competitor[];
  changesMap: Record<string, Change[]>;
  onInspectDiff: (competitorId: string, changeId: string) => void;
  diffLoading: boolean;
}

export function VisualDiffGallery({
  competitors,
  changesMap,
  onInspectDiff,
  diffLoading,
}: VisualDiffGalleryProps) {
  // Aggregate all changes across all competitors
  const allChanges: Array<{ competitor: Competitor; change: Change }> = [];

  for (const comp of competitors) {
    const list = changesMap[comp.id] || [];
    for (const ch of list) {
      allChanges.push({ competitor: comp, change: ch });
    }
  }

  // Sort descending by timestamp
  allChanges.sort((a, b) => new Date(b.change.detectedAt).getTime() - new Date(a.change.detectedAt).getTime());

  if (allChanges.length === 0) {
    return (
      <Surface
        variant="default"
        padding={32}
        style={{
          borderRadius: 'var(--x-radius)',
          border: '1px solid var(--x-border)',
          textAlign: 'center',
        }}
      >
        <Stack gap={16} align="center">
          <Icon size="lg" style={{ color: 'var(--x-text-muted)' }}>
            <GitDiff weight="thin" />
          </Icon>
          <Text styleKey="headline" weight={300}>
            No visual diffs detected yet
          </Text>
          <Text styleKey="callout" weight={300} style={{ color: 'var(--x-text-muted)', maxWidth: '440px' }}>
            Trigger a crawl on any tracked competitor to capture consecutive viewports and generate pixel-diff heatmaps.
          </Text>
        </Stack>
      </Surface>
    );
  }

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
              Website Design & Content Changes
            </Text>
            <Text styleKey="caption1" weight={300} style={{ color: 'var(--x-text-muted)', marginTop: '2px' }}>
              Review visual changes across competitor websites with side-by-side snapshots and split-slider comparison
            </Text>
          </div>
          <Badge variant="subtle" tone="accent">
            {allChanges.length} Updates Found
          </Badge>
        </Group>
      </div>

      <Stack gap={0}>
        {allChanges.map(({ competitor, change }, idx) => {
          const sig = change.aiSummary?.significance?.toLowerCase() || 'medium';
          const isHigh = sig === 'high';
          const isMedium = sig === 'medium';
          const badgeTone = isHigh ? 'danger' : isMedium ? 'accent' : 'neutral';
          const domain = extractDomain(competitor.url);

          return (
            <React.Fragment key={change.id}>
              {idx > 0 && <Divider />}
              <div style={{ padding: '20px 24px' }}>
                <Group justify="space-between" align="center">
                  <Group gap={16} align="center">
                    <div
                      style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: 'var(--x-radius)',
                        border: '1px solid var(--x-border)',
                        backgroundColor: 'var(--x-surface-2)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--x-accent)',
                      }}
                    >
                      <Icon size="md">
                        <GitDiff weight="thin" />
                      </Icon>
                    </div>

                    <div>
                      <Group gap={8} align="center">
                        <Text styleKey="callout" weight={400} style={{ color: 'var(--x-text)' }}>
                          {domain}
                        </Text>
                        <Badge variant="subtle" tone={badgeTone} size="sm">
                          DIFF DETECTED
                        </Badge>
                        <Badge variant="outline" tone="neutral" size="sm">
                          {change.aiSummary?.significance || 'Analyzed'}
                        </Badge>
                      </Group>
                      <Text
                        styleKey="caption1"
                        weight={300}
                        style={{ color: 'var(--x-text-muted)', marginTop: '4px', maxWidth: '640px' }}
                      >
                        {change.aiSummary?.analysis || change.diffSummary || 'Visual diff captured between consecutive crawl snapshots.'}
                      </Text>
                      <Group gap={6} align="center" style={{ marginTop: '6px', color: 'var(--x-text-muted)' }}>
                        <Icon size="sm">
                          <CalendarBlank weight="thin" />
                        </Icon>
                        <Text styleKey="caption2" weight={300}>
                          {new Date(change.detectedAt).toLocaleString()}
                        </Text>
                      </Group>
                    </div>
                  </Group>

                  <Button
                    variant="accent"
                    size="sm"
                    disabled={diffLoading}
                    onClick={() => onInspectDiff(competitor.id, change.id)}
                  >
                    <Icon size="sm">
                      <ArrowsLeftRight weight="thin" />
                    </Icon>
                    Compare Diff
                  </Button>
                </Group>
              </div>
            </React.Fragment>
          );
        })}
      </Stack>
    </Surface>
  );
}
