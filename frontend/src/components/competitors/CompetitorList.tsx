'use client';

import { useEffect, useState } from 'react';
import type { Competitor, Snapshot, Change, PricingPlan } from '@/types';
import {
  Stack,
  Group,
  Text,
  Badge,
  Button,
  IconButton,
  Icon,
  Divider,
  Alert,
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
  CaretDown,
  Camera,
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
  const [activeTabMap, setActiveTabMap] = useState<Record<string, 'snapshots' | 'changes' | 'pricing'>>({});

  const toggleHistory = (id: string) => {
    setExpandedHistory((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const setTab = (id: string, tab: 'snapshots' | 'changes' | 'pricing') => {
    setActiveTabMap((prev) => ({ ...prev, [id]: tab }));
  };

  if (loading) {
    return (
      <div style={{ padding: 'var(--x-space-8) 0', textAlign: 'center' }}>
        <Text styleKey="body" tone="muted" weight={300}>
          Loading tracked competitors...
        </Text>
      </div>
    );
  }

  if (competitors.length === 0) {
    return (
      <div style={{ padding: 'var(--x-space-10) 0', textAlign: 'center' }}>
        <Icon size="lg" color="var(--x-text-muted)">
          <Globe weight="thin" />
        </Icon>
        <div style={{ marginTop: 'var(--x-space-2)' }}>
          <Text styleKey="body" tone="muted" weight={300}>
            No competitors tracked yet
          </Text>
        </div>
        <Text styleKey="caption1" tone="muted" weight={200}>
          Add a domain URL above to begin autonomous monitoring.
        </Text>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {competitors.map((comp, index) => {
        const snapshots = snapshotsMap[comp.id] || [];
        const latestSnapshot = snapshots.length > 0 ? snapshots[0] : null;
        const changes = (changesMap && changesMap[comp.id]) || [];
        const latestChange = changes.length > 0 ? changes[0] : null;
        const pricingPlans = (pricingMap && pricingMap[comp.id]) || [];
        const isCollecting = collectingMap[comp.id];
        const showHistory = expandedHistory[comp.id];
        const currentTab = activeTabMap[comp.id] || 'snapshots';

        return (
          <div key={comp.id}>
            {index > 0 && <Divider />}

            <div style={{ padding: 'var(--x-space-4) 0' }}>
              <Stack gap={16}>
                {/* Main Competitor Row */}
                <Group justify="space-between" align="center" wrap gap={12}>
                  {/* Left: Domain identity & metadata */}
                  <Group gap={12} align="center">
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
                      <Icon size="sm">
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
                        }}
                      >
                        <Text styleKey="headline" weight={400}>
                          {comp.url}
                        </Text>
                      </a>

                      <Group gap={8} align="center" style={{ marginTop: '2px' }}>
                        <Badge tone="success" size="sm">
                          Active
                        </Badge>
                        <Text styleKey="caption1" tone="muted" weight={300}>
                          Added {new Date(comp.createdAt).toLocaleDateString()}
                        </Text>
                        {latestChange && latestChange.hasChanges && (
                          <Badge tone="warning" size="sm">
                            <Icon size="xs">
                              <Sparkle weight="thin" />
                            </Icon>
                            Changes Detected
                          </Badge>
                        )}
                        {latestSnapshot && (
                          <Text styleKey="caption1" tone="muted" weight={300}>
                            • Last capture {new Date(latestSnapshot.capturedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </Text>
                        )}
                      </Group>
                    </div>
                  </Group>

                  {/* Right: Actions */}
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
                      <span>Collect</span>
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleHistory(comp.id)}
                    >
                      <Icon size="sm">
                        <ClockCounterClockwise weight="thin" />
                      </Icon>
                      <span>History</span>
                      <span
                        style={{
                          display: 'inline-flex',
                          transform: showHistory ? 'rotate(180deg)' : 'rotate(0deg)',
                          transition: 'transform var(--x-dur-base) var(--x-ease-spring)',
                        }}
                      >
                        <Icon size="xs">
                          <CaretDown weight="thin" />
                        </Icon>
                      </span>
                    </Button>

                    {onDownloadReport && (
                      <Button
                        variant="subtle"
                        size="sm"
                        onClick={() => onDownloadReport(comp.id, comp.url)}
                        title="Download Executive Intelligence Report"
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

                {/* Latest Headline & AI Highlights (when collapsed) */}
                {!showHistory && latestChange && latestChange.hasChanges && (
                  <div
                    style={{
                      borderLeft: '2px solid var(--x-warning)',
                      paddingLeft: 'var(--x-space-3)',
                      marginLeft: 'var(--x-space-2)',
                    }}
                  >
                    <Group justify="space-between" align="center" gap={12}>
                      <Group gap={6} align="center">
                        <Icon size="sm" color="var(--x-warning)">
                          <WarningCircle weight="thin" />
                        </Icon>
                        <Text styleKey="footnote" weight={300}>
                          {latestChange.diffSummary || 'Website update detected'}
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
                  </div>
                )}

                {/* Expanded Disclosure Panel (Pure 1px hairlines, NO nested card) */}
                {showHistory && (
                  <div
                    style={{
                      marginTop: 'var(--x-space-2)',
                      padding: 'var(--x-space-4)',
                      borderRadius: 'var(--x-radius)',
                      backgroundColor: 'var(--x-surface-2)',
                      border: '1px solid var(--x-border)',
                    }}
                  >
                    <Stack gap={16}>
                      {/* Sub-tab selection */}
                      <Group justify="space-between" align="center">
                        <Group gap={4}>
                          <Button
                            size="sm"
                            variant={currentTab === 'snapshots' ? 'accent' : 'subtle'}
                            onClick={() => setTab(comp.id, 'snapshots')}
                          >
                            <Icon size="xs">
                              <Camera weight="thin" />
                            </Icon>
                            <span>Snapshots ({snapshots.length})</span>
                          </Button>

                          <Button
                            size="sm"
                            variant={currentTab === 'changes' ? 'accent' : 'subtle'}
                            onClick={() => setTab(comp.id, 'changes')}
                          >
                            <Icon size="xs">
                              <FileText weight="thin" />
                            </Icon>
                            <span>Revisions ({changes.length})</span>
                          </Button>

                          <Button
                            size="sm"
                            variant={currentTab === 'pricing' ? 'accent' : 'subtle'}
                            onClick={() => setTab(comp.id, 'pricing')}
                          >
                            <Icon size="xs">
                              <Tag weight="thin" />
                            </Icon>
                            <span>Pricing Plans ({pricingPlans.length})</span>
                          </Button>
                        </Group>
                      </Group>

                      {/* TAB 1: Snapshots */}
                      {currentTab === 'snapshots' && (
                        <Stack gap={8}>
                          {snapshots.length === 0 ? (
                            <Text styleKey="footnote" tone="muted" weight={300}>
                              No snapshots captured yet for this domain.
                            </Text>
                          ) : (
                            snapshots.map((snap, sIdx) => (
                              <div
                                key={snap.id}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  padding: 'var(--x-space-2) 0',
                                  borderTop: sIdx > 0 ? '1px solid var(--x-border)' : 'none',
                                }}
                              >
                                <Group gap={8} align="center">
                                  <Badge
                                    tone={snap.status === 'SUCCESS' ? 'success' : 'danger'}
                                    size="sm"
                                  >
                                    {snap.status}
                                  </Badge>
                                  <Text styleKey="footnote" weight={300}>
                                    {snap.pageTitle || 'Default Landing Page'}
                                  </Text>
                                </Group>
                                <Text styleKey="caption1" tone="muted" weight={300}>
                                  {new Date(snap.capturedAt).toLocaleString()}
                                </Text>
                              </div>
                            ))
                          )}
                        </Stack>
                      )}

                      {/* TAB 2: Changes & Diffs */}
                      {currentTab === 'changes' && (
                        <Stack gap={12}>
                          {changes.length === 0 ? (
                            <Text styleKey="footnote" tone="muted" weight={300}>
                              No revisions recorded yet.
                            </Text>
                          ) : (
                            changes.map((chg, cIdx) => (
                              <div
                                key={chg.id}
                                style={{
                                  padding: 'var(--x-space-2) 0',
                                  borderTop: cIdx > 0 ? '1px solid var(--x-border)' : 'none',
                                }}
                              >
                                <Stack gap={8}>
                                  <Group justify="space-between" align="center">
                                    <Group gap={8} align="center">
                                      <Badge
                                        tone={chg.hasChanges ? 'warning' : 'neutral'}
                                        size="sm"
                                      >
                                        {chg.hasChanges ? 'Change Detected' : 'Unchanged'}
                                      </Badge>
                                      <Text styleKey="caption1" tone="muted" weight={300}>
                                        {new Date(chg.detectedAt).toLocaleString()}
                                      </Text>
                                    </Group>

                                    {onInspectDiff && (
                                      <Button
                                        variant="accent"
                                        size="sm"
                                        onClick={() => onInspectDiff(comp.id, chg.id)}
                                      >
                                        <Icon size="sm">
                                          <Eye weight="thin" />
                                        </Icon>
                                        <span>Inspect Diff</span>
                                      </Button>
                                    )}
                                  </Group>

                                  {chg.diffSummary && (
                                    <Text styleKey="footnote" weight={300}>
                                      {chg.diffSummary}
                                    </Text>
                                  )}

                                  {chg.aiSummary && (
                                    <Alert tone="accent" variant="subtle" title="AI Market Analysis">
                                      <Text styleKey="footnote" weight={300}>
                                        {chg.aiSummary.analysis}
                                      </Text>
                                    </Alert>
                                  )}
                                </Stack>
                              </div>
                            ))
                          )}
                        </Stack>
                      )}

                      {/* TAB 3: Pricing Intelligence */}
                      {currentTab === 'pricing' && (
                        <Stack gap={8}>
                          {pricingPlans.length === 0 ? (
                            <Text styleKey="footnote" tone="muted" weight={300}>
                              No pricing plans detected on this domain yet. Run a collection to extract pricing tables.
                            </Text>
                          ) : (
                            <div
                              style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                                gap: 'var(--x-space-3)',
                              }}
                            >
                              {pricingPlans.map((plan) => (
                                <div
                                  key={plan.id}
                                  style={{
                                    padding: 'var(--x-space-3)',
                                    borderRadius: 'var(--x-radius)',
                                    backgroundColor: 'var(--x-surface)',
                                    border: '1px solid var(--x-border)',
                                  }}
                                >
                                  <Group justify="space-between" align="center">
                                    <Text styleKey="footnote" weight={400}>
                                      {plan.name}
                                    </Text>
                                    <Badge tone="accent" size="sm">
                                      {plan.price}
                                    </Badge>
                                  </Group>
                                  {plan.period && (
                                    <Text styleKey="caption2" tone="muted" weight={200}>
                                      Billed {plan.period}
                                    </Text>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </Stack>
                      )}
                    </Stack>
                  </div>
                )}
              </Stack>
            </div>
          </div>
        );
      })}
    </div>
  );
}
