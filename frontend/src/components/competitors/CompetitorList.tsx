'use client';

import { useEffect, useState } from 'react';
import type { Competitor, Snapshot, Change, PricingPlan } from '@/types';
import {
  Surface,
  Heading,
  Text,
  Badge,
  Button,
  IconButton,
  Icon,
  Group,
  Stack,
  Divider,
} from '@xenon-kit/web';
import {
  Globe,
  ArrowsClockwise,
  ClockCounterClockwise,
  FileText,
  Trash,
  Eye,
  Sparkle,
  Tag,
  WarningCircle,
} from '@phosphor-icons/react';

interface Props {
  competitors: Competitor[];
  loading: boolean;
  onDelete: (id: string) => void;
  onCollect: (id: string) => void;
  collectingMap: Record<string, boolean>;
  snapshotsMap: Record<string, Snapshot[]>;
  loadSnapshots: (id: string) => void;
  changesMap?: Record<string, Change[]>;
  loadChanges?: (id: string) => void;
  onInspectDiff?: (competitorId: string, changeId: string) => void;
  pricingMap?: Record<string, PricingPlan[]>;
  loadPricing?: (id: string) => void;
  onDownloadReport?: (id: string, url: string) => void;
}

export function CompetitorList({
  competitors,
  loading,
  onDelete,
  onCollect,
  collectingMap,
  snapshotsMap,
  loadSnapshots,
  changesMap,
  loadChanges,
  onInspectDiff,
  pricingMap,
  loadPricing,
  onDownloadReport,
}: Props) {
  useEffect(() => {
    competitors.forEach((comp) => {
      if (!snapshotsMap[comp.id]) {
        loadSnapshots(comp.id);
      }
      if (loadChanges && (!changesMap || !changesMap[comp.id])) {
        loadChanges(comp.id);
      }
      if (loadPricing && (!pricingMap || !pricingMap[comp.id])) {
        loadPricing(comp.id);
      }
    });
  }, [competitors, loadSnapshots, snapshotsMap, loadChanges, changesMap, loadPricing, pricingMap]);

  const [expandedHistory, setExpandedHistory] = useState<Record<string, boolean>>({});

  const toggleHistory = (id: string) => {
    setExpandedHistory((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  if (loading) {
    return (
      <div style={{ padding: '32px', textAlign: 'center' }}>
        <Text styleKey="body" tone="muted" weight={300}>
          Loading competitors...
        </Text>
      </div>
    );
  }

  if (competitors.length === 0) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <Icon size="lg" color="var(--x-text-muted)">
          <Globe weight="thin" />
        </Icon>
        <Text styleKey="body" tone="muted" weight={300} style={{ marginTop: '8px' }}>
          No competitors tracked yet.
        </Text>
        <Text styleKey="caption1" tone="muted" weight={200}>
          Add a URL above to start monitoring.
        </Text>
      </div>
    );
  }

  return (
    <Stack gap={16}>
      {competitors.map((comp) => {
        const snapshots = snapshotsMap[comp.id] || [];
        const latestSnapshot = snapshots.length > 0 ? snapshots[0] : null;
        const changes = (changesMap && changesMap[comp.id]) || [];
        const latestChange = changes.length > 0 ? changes[0] : null;
        const pricingPlans = (pricingMap && pricingMap[comp.id]) || [];
        const isCollecting = collectingMap[comp.id];
        const showHistory = expandedHistory[comp.id];

        return (
          <Surface
            key={comp.id}
            variant="subtle"
            padding={20}
            style={{
              border: '1px solid var(--x-border)',
              transition: 'border-color var(--x-dur-base) var(--x-ease-standard)',
            }}
          >
            <Stack gap={16}>
              {/* Row 1: Header & Main Controls */}
              <Group justify="space-between" align="center" wrap>
                <Group gap={12} align="center">
                  <div
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: 'var(--x-radius)',
                      border: '1px solid var(--x-border)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: 'var(--x-surface)',
                    }}
                  >
                    <Icon size="sm" color="var(--x-accent)">
                      <Globe weight="thin" />
                    </Icon>
                  </div>
                  <div>
                    <a
                      href={comp.url}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        color: 'var(--x-text)',
                        textDecoration: 'none',
                        outline: 'none',
                      }}
                    >
                      <Text styleKey="headline" weight={400}>
                        {comp.url}
                      </Text>
                    </a>
                    <Group gap={8} align="center" style={{ marginTop: '4px' }}>
                      <Badge tone="success" size="sm">
                        Active
                      </Badge>
                      <Text styleKey="caption2" tone="muted" weight={200}>
                        Added {new Date(comp.createdAt).toLocaleDateString()}
                      </Text>
                      {latestChange && latestChange.hasChanges && (
                        <Badge tone="warning" size="sm">
                          Changes Detected
                        </Badge>
                      )}
                    </Group>
                  </div>
                </Group>

                <Group gap={8} align="center">
                  <Button
                    variant="accent"
                    size="sm"
                    loading={isCollecting}
                    onClick={() => onCollect(comp.id)}
                  >
                    <Icon size="sm">
                      <ArrowsClockwise weight="thin" />
                    </Icon>
                    <span>{isCollecting ? 'Collecting...' : 'Collect'}</span>
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggleHistory(comp.id)}
                  >
                    <Icon size="sm">
                      <ClockCounterClockwise weight="thin" />
                    </Icon>
                    <span>{showHistory ? 'Hide History' : 'History'}</span>
                  </Button>

                  {onDownloadReport && (
                    <Button
                      variant="subtle"
                      size="sm"
                      onClick={() => onDownloadReport(comp.id, comp.url)}
                      title="Download Executive Intelligence Report (.md)"
                    >
                      <Icon size="sm">
                        <FileText weight="thin" />
                      </Icon>
                      <span>Report</span>
                    </Button>
                  )}

                  <IconButton
                    ariaLabel="Delete competitor"
                    variant="ghost"
                    size="sm"
                    onClick={() => onDelete(comp.id)}
                  >
                    <Icon size="sm" color="var(--x-danger)">
                      <Trash weight="thin" />
                    </Icon>
                  </IconButton>
                </Group>
              </Group>

              {/* Latest Snapshot Metadata */}
              {latestSnapshot && !showHistory && (
                <>
                  <Divider />
                  <Group justify="space-between" align="center" wrap>
                    <Group gap={8} align="center">
                      <Text styleKey="subhead" weight={400}>
                        Latest Snapshot:
                      </Text>
                      <Text styleKey="callout" tone="muted" weight={300}>
                        {latestSnapshot.pageTitle || 'No title captured'}
                      </Text>
                    </Group>
                    <Group gap={12} align="center">
                      <Text styleKey="caption2" tone="muted" weight={200}>
                        {new Date(latestSnapshot.capturedAt).toLocaleString()}
                      </Text>
                      <Badge
                        tone={latestSnapshot.status === 'SUCCESS' ? 'success' : 'danger'}
                        size="sm"
                      >
                        {latestSnapshot.status}
                      </Badge>
                    </Group>
                  </Group>
                </>
              )}

              {/* Identified Pricing Plans */}
              {pricingPlans.length > 0 && !showHistory && (
                <Surface
                  variant="default"
                  padding={12}
                  style={{ border: '1px solid var(--x-border)' }}
                >
                  <Stack gap={8}>
                    <Group justify="space-between" align="center">
                      <Group gap={6} align="center">
                        <Icon size="sm" color="var(--x-accent)">
                          <Tag weight="thin" />
                        </Icon>
                        <Text styleKey="subhead" weight={400}>
                          Identified Pricing & Plans
                        </Text>
                      </Group>
                      <Badge size="sm">{pricingPlans.length} tiers</Badge>
                    </Group>
                    <Group gap={8} wrap>
                      {pricingPlans.map((plan) => (
                        <div
                          key={plan.id}
                          style={{
                            padding: '4px 10px',
                            borderRadius: 'var(--x-radius)',
                            border: '1px solid var(--x-border)',
                            background: 'var(--x-surface)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                          }}
                        >
                          <Text styleKey="caption1" weight={300}>
                            {plan.name}:
                          </Text>
                          <Text
                            styleKey="caption1"
                            weight={400}
                            style={{ color: 'var(--x-accent)' }}
                          >
                            {plan.price}
                          </Text>
                          {plan.period && (
                            <Text styleKey="caption2" tone="muted" weight={200}>
                              /{plan.period}
                            </Text>
                          )}
                        </div>
                      ))}
                    </Group>
                  </Stack>
                </Surface>
              )}

              {/* Difference Summary & AI Analysis */}
              {latestChange && latestChange.hasChanges && !showHistory && (
                <Surface
                  variant="default"
                  padding={12}
                  style={{ border: '1px solid var(--x-border)' }}
                >
                  <Stack gap={10}>
                    <Group justify="space-between" align="center">
                      <Group gap={6} align="center">
                        <Icon size="sm" color="var(--x-warning)">
                          <WarningCircle weight="thin" />
                        </Icon>
                        <Text styleKey="subhead" weight={400}>
                          Difference Summary
                        </Text>
                      </Group>
                      {onInspectDiff && (
                        <Button
                          variant="subtle"
                          size="sm"
                          onClick={() => onInspectDiff(comp.id, latestChange.id)}
                        >
                          <Icon size="sm">
                            <Eye weight="thin" />
                          </Icon>
                          <span>Inspect Diff</span>
                        </Button>
                      )}
                    </Group>

                    <Text styleKey="callout" tone="muted" weight={300}>
                      {latestChange.diffSummary}
                    </Text>

                    {latestChange.aiSummary && (
                      <>
                        <Divider />
                        <Stack gap={6}>
                          <Group gap={6} align="center">
                            <Icon size="sm" color="var(--x-accent)">
                              <Sparkle weight="thin" />
                            </Icon>
                            <Text styleKey="subhead" weight={400}>
                              AI Analysis
                            </Text>
                            <Badge
                              tone={
                                latestChange.aiSummary.significance === 'HIGH'
                                  ? 'danger'
                                  : latestChange.aiSummary.significance === 'MEDIUM'
                                  ? 'warning'
                                  : 'neutral'
                              }
                              size="sm"
                            >
                              {latestChange.aiSummary.significance} IMPACT
                            </Badge>
                          </Group>
                          <Text
                            styleKey="caption1"
                            tone="muted"
                            weight={300}
                            style={{ fontStyle: 'italic', lineHeight: 1.6 }}
                          >
                            {latestChange.aiSummary.analysis}
                          </Text>
                        </Stack>
                      </>
                    )}
                  </Stack>
                </Surface>
              )}

              {/* History View */}
              {showHistory && (
                <Stack gap={12}>
                  <Divider />
                  <Heading level={4} styleKey="headline" weight={300}>
                    Change History
                  </Heading>
                  {changes.length === 0 ? (
                    <Text styleKey="callout" tone="muted" weight={300}>
                      No history available for this competitor yet.
                    </Text>
                  ) : (
                    <Stack gap={8}>
                      {changes.map((change) => (
                        <Surface
                          key={change.id}
                          variant="default"
                          padding={12}
                          style={{ border: '1px solid var(--x-border)' }}
                        >
                          <Stack gap={8}>
                            <Group justify="space-between" align="center">
                              <Text styleKey="caption2" tone="muted" weight={200}>
                                {new Date(change.detectedAt).toLocaleString()}
                              </Text>
                              <Badge
                                tone={change.hasChanges ? 'warning' : 'neutral'}
                                size="sm"
                              >
                                {change.hasChanges ? 'Changes' : 'No Changes'}
                              </Badge>
                            </Group>

                            {change.hasChanges && change.diffSummary && (
                              <Group justify="space-between" align="center">
                                <Text styleKey="callout" tone="muted" weight={300}>
                                  {change.diffSummary}
                                </Text>
                                {onInspectDiff && (
                                  <Button
                                    variant="subtle"
                                    size="sm"
                                    onClick={() => onInspectDiff(comp.id, change.id)}
                                  >
                                    <Icon size="sm">
                                      <Eye weight="thin" />
                                    </Icon>
                                    <span>Inspect</span>
                                  </Button>
                                )}
                              </Group>
                            )}

                            {change.aiSummary && (
                              <Text
                                styleKey="caption1"
                                tone="muted"
                                weight={300}
                                style={{ fontStyle: 'italic' }}
                              >
                                {change.aiSummary.analysis}
                              </Text>
                            )}
                          </Stack>
                        </Surface>
                      ))}
                    </Stack>
                  )}
                </Stack>
              )}
            </Stack>
          </Surface>
        );
      })}
    </Stack>
  );
}
