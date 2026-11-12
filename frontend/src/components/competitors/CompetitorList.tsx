'use client';

import { useState } from 'react';
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
  Input,
  SegmentedControl,
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
  Avatar,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
  Spinner,
  toast,
} from '@xenon-kit/web';
import {
  Globe,
  ArrowClockwise,
  ClockCounterClockwise,
  FileText,
  Trash,
  ArrowsLeftRight,
  CaretDown,
  MagnifyingGlass,
  Camera,
} from '@phosphor-icons/react';

function extractDomain(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return url.replace(/https?:\/\//, '').split('/')[0] || url;
  }
}

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
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [activeSubTab, setActiveSubTab] = useState<'snapshots' | 'revisions' | 'pricing'>('snapshots');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState('all');
  const [deleteTarget, setDeleteTarget] = useState<Competitor | null>(null);

  // Filter competitors based on search and segment
  const filteredCompetitors = competitors.filter((c) => {
    const domain = extractDomain(c.url);
    const query = searchQuery.toLowerCase();

    const matchesSearch =
      domain.toLowerCase().includes(query) ||
      c.url.toLowerCase().includes(query);

    if (!matchesSearch) return false;
    if (filterMode === 'changes') {
      const changes = changesMap?.[c.id] || [];
      return changes.length > 0;
    }
    return true;
  });

  const toggleExpand = (id: string) => {
    if (expandedId === id) {
      setExpandedId(null);
    } else {
      setExpandedId(id);
      loadSnapshots(id);
      if (loadChanges) loadChanges(id);
      if (loadPricing) loadPricing(id);
    }
  };

  const handleTriggerCollect = (id: string, domain: string) => {
    toast.info('Crawl Initiated', {
      description: `Capturing viewport screenshot and analyzing DOM for ${domain}...`,
    });
    onCollect(id);
  };

  const handleDownloadReport = (id: string, url: string, domain: string) => {
    if (onDownloadReport) {
      onDownloadReport(id, url);
      toast.success('Report Exported', {
        description: `Intelligence Markdown report generated for ${domain}.`,
      });
    }
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    const name = extractDomain(deleteTarget.url);
    onDelete(deleteTarget.id);
    setDeleteTarget(null);
    toast.warning('Competitor Removed', {
      description: `${name} has been removed from autonomous observation.`,
    });
  };

  if (loading && competitors.length === 0) {
    return (
      <div style={{ padding: '40px 24px', textAlign: 'center' }}>
        <Group justify="center" gap={12} align="center">
          <Spinner size="sm" />
          <Text styleKey="callout" weight={300} style={{ color: 'var(--x-text-muted)' }}>
            Loading tracked competitors from database...
          </Text>
        </Group>
      </div>
    );
  }

  if (competitors.length === 0) {
    return (
      <div style={{ padding: '48px 24px', textAlign: 'center' }}>
        <Stack gap={16} align="center">
          <Icon size="lg" style={{ color: 'var(--x-text-muted)' }}>
            <Globe weight="thin" />
          </Icon>
          <Text styleKey="headline" weight={300}>
            No competitors tracked yet
          </Text>
          <Text styleKey="callout" weight={300} style={{ color: 'var(--x-text-muted)', maxWidth: '440px' }}>
            Enter a domain URL above to begin autonomous monitoring, visual pixel diff tracking, and pricing intelligence.
          </Text>
        </Stack>
      </div>
    );
  }

  return (
    <>
      {/* Sub-header with Search and Filter */}
      <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--x-border)' }}>
        <Group justify="space-between" align="center" wrap="wrap" gap={12}>
          <div style={{ width: '280px' }}>
            <Input
              size="sm"
              placeholder="Filter by domain..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              prefix={
                <Icon size="sm" style={{ color: 'var(--x-text-muted)' }}>
                  <MagnifyingGlass weight="thin" />
                </Icon>
              }
            />
          </div>

          <Group gap={12} align="center">
            <SegmentedControl
              size="sm"
              value={filterMode}
              onValueChange={setFilterMode}
              options={[
                { value: 'all', label: `All (${competitors.length})` },
                { value: 'changes', label: 'With Changes' },
              ]}
            />
          </Group>
        </Group>
      </div>

      {/* Competitors List */}
      <Stack gap={0}>
        {filteredCompetitors.map((comp, index) => {
          const isExpanded = expandedId === comp.id;
          const isCollecting = !!collectingMap[comp.id];
          const snapshots = snapshotsMap[comp.id] || [];
          const changes = changesMap?.[comp.id] || [];
          const pricingPlans = pricingMap?.[comp.id] || [];
          const domain = extractDomain(comp.url);
          const domainInitials = domain
            .replace(/[^a-zA-Z0-9]/g, '')
            .slice(0, 2)
            .toUpperCase() || 'CO';

          return (
            <div key={comp.id} data-testid="competitor-row">
              {index > 0 && <Divider />}

              {/* Main Competitor Row */}
              <div
                style={{
                  padding: '20px 24px',
                  transition: 'background-color 0.2s ease',
                  backgroundColor: isExpanded ? 'var(--x-surface-1)' : 'transparent',
                }}
              >
                <Group justify="space-between" align="center" wrap="wrap" gap={16}>
                  {/* Left: Avatar + Identity */}
                  <Group gap={16} align="center">
                    <Avatar fallback={domainInitials} size="md" />

                    <div>
                      <Group gap={8} align="center">
                        <Text styleKey="callout" weight={400} style={{ color: 'var(--x-text)' }}>
                          {domain}
                        </Text>
                        <Badge variant="subtle" tone="accent" size="sm">
                          Active
                        </Badge>
                        {changes.length > 0 && (
                          <Badge variant="outline" tone="neutral" size="sm">
                            {changes.length} Changes
                          </Badge>
                        )}
                      </Group>
                      <Group gap={8} align="center" style={{ marginTop: '4px' }}>
                        <a
                          href={comp.url}
                          target="_blank"
                          rel="noreferrer"
                          style={{
                            textDecoration: 'none',
                            color: 'var(--x-text-muted)',
                            fontSize: '13px',
                          }}
                        >
                          {comp.url}
                        </a>
                        <Text styleKey="caption2" weight={300} style={{ color: 'var(--x-text-muted)' }}>
                          · 15s interval
                        </Text>
                      </Group>
                    </div>
                  </Group>

                  {/* Right: Actions */}
                  <Group gap={8} align="center">
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={isCollecting}
                      onClick={() => handleTriggerCollect(comp.id, domain)}
                    >
                      {isCollecting ? (
                        <Spinner size="sm" />
                      ) : (
                        <Icon size="sm">
                          <ArrowClockwise weight="thin" />
                        </Icon>
                      )}
                      {isCollecting ? 'Checking...' : 'Check Updates'}
                    </Button>

                    {onDownloadReport && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDownloadReport(comp.id, comp.url, domain)}
                      >
                        <Icon size="sm">
                          <FileText weight="thin" />
                        </Icon>
                        Report
                      </Button>
                    )}

                    {/* Norman Invariant Rotating Disclosure Trigger */}
                    <Button
                      variant={isExpanded ? 'accent' : 'subtle'}
                      size="sm"
                      onClick={() => toggleExpand(comp.id)}
                    >
                      <Icon size="sm">
                        <ClockCounterClockwise weight="thin" />
                      </Icon>
                      History
                      <span
                        style={{
                          display: 'inline-flex',
                          transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                          transition: 'transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                        }}
                      >
                        <Icon size="sm">
                          <CaretDown weight="thin" />
                        </Icon>
                      </span>
                    </Button>

                    <IconButton
                      variant="ghost"
                      size="sm"
                      aria-label="Delete Competitor"
                      onClick={() => setDeleteTarget(comp)}
                    >
                      <Icon size="sm" style={{ color: 'var(--x-text-muted)' }}>
                        <Trash weight="thin" />
                      </Icon>
                    </IconButton>
                  </Group>
                </Group>
              </div>

              {/* Norman Invariant Expanded Disclosure Panel */}
              {isExpanded && (
                <div
                  style={{
                    padding: '20px 24px 28px 24px',
                    borderTop: '1px solid var(--x-border)',
                    backgroundColor: 'var(--x-surface-1)',
                  }}
                >
                  <Stack gap={16}>
                    {/* Segmented Control for Sub-tabs */}
                    <Group justify="space-between" align="center">
                      <SegmentedControl
                        size="sm"
                        value={activeSubTab}
                        onValueChange={(val: string) => setActiveSubTab(val as 'snapshots' | 'revisions' | 'pricing')}
                        options={[
                          { value: 'snapshots', label: `Screenshots (${snapshots.length})` },
                          { value: 'revisions', label: `Changes Found (${changes.length})` },
                          { value: 'pricing', label: `Pricing Tiers (${pricingPlans.length})` },
                        ]}
                      />
                      <Badge variant="outline" tone="neutral" size="sm">
                        Monitoring Active
                      </Badge>
                    </Group>

                    {/* Sub-tab 1: Snapshots Table */}
                    {activeSubTab === 'snapshots' && (
                      <div>
                        {snapshots.length === 0 ? (
                          <div style={{ padding: '24px', textAlign: 'center' }}>
                            <Text styleKey="caption1" weight={300} style={{ color: 'var(--x-text-muted)' }}>
                              No screenshots captured yet. Click &quot;Check Updates&quot; to capture a new screenshot.
                            </Text>
                          </div>
                        ) : (
                          <Table variant="default" size="sm">
                            <TableHeader>
                              <TableRow>
                                <TableHead style={{ width: '40%' }}>DATE & TIME</TableHead>
                                <TableHead style={{ width: '25%' }}>STATUS</TableHead>
                                <TableHead style={{ width: '35%', textAlign: 'right' }}>PREVIEW</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {snapshots.map((snap) => (
                                <TableRow key={snap.id}>
                                  <TableCell>
                                    <Group gap={6} align="center">
                                      <Icon size="sm" style={{ color: 'var(--x-text-muted)' }}>
                                        <Camera weight="thin" />
                                      </Icon>
                                      <Text styleKey="caption1" weight={300}>
                                        {new Date(snap.capturedAt).toLocaleString()}
                                      </Text>
                                    </Group>
                                  </TableCell>
                                  <TableCell>
                                    <Badge variant="subtle" tone="accent" size="sm">
                                      Saved
                                    </Badge>
                                  </TableCell>
                                  <TableCell style={{ textAlign: 'right' }}>
                                    <Text styleKey="caption2" weight={300} style={{ color: 'var(--x-text-muted)' }}>
                                      Full page saved
                                    </Text>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        )}
                      </div>
                    )}

                    {/* Sub-tab 2: Revisions Table */}
                    {activeSubTab === 'revisions' && (
                      <div>
                        {changes.length === 0 ? (
                          <div style={{ padding: '24px', textAlign: 'center' }}>
                            <Text styleKey="caption1" weight={300} style={{ color: 'var(--x-text-muted)' }}>
                              No updates found yet. When text or layout changes on this website, they will appear here.
                            </Text>
                          </div>
                        ) : (
                          <Table variant="default" size="sm">
                            <TableHeader>
                              <TableRow>
                                <TableHead style={{ width: '25%' }}>STATUS</TableHead>
                                <TableHead style={{ width: '20%' }}>IMPACT</TableHead>
                                <TableHead style={{ width: '38%' }}>CHANGE SUMMARY</TableHead>
                                <TableHead style={{ width: '17%', textAlign: 'right' }}>VISUAL DIFF</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {changes.map((ch) => {
                                const sig = ch.aiSummary?.significance?.toLowerCase() || 'medium';
                                const isHigh = sig === 'high';
                                const isMedium = sig === 'medium';
                                const badgeTone = isHigh ? 'danger' : isMedium ? 'accent' : 'neutral';

                                return (
                                  <TableRow key={ch.id}>
                                    <TableCell>
                                      <Badge variant="subtle" tone={badgeTone} size="sm">
                                        {ch.hasChanges ? 'PAGE UPDATED' : 'STABLE'}
                                      </Badge>
                                    </TableCell>
                                    <TableCell>
                                      <Text styleKey="caption1" weight={300}>
                                        {ch.aiSummary?.significance ? `${ch.aiSummary.significance} impact` : 'Standard'}
                                      </Text>
                                    </TableCell>
                                    <TableCell>
                                      <Text styleKey="caption1" weight={300} style={{ color: 'var(--x-text-muted)' }}>
                                        {ch.aiSummary?.analysis || ch.diffSummary || 'Visual layout or content modified'}
                                      </Text>
                                    </TableCell>
                                    <TableCell style={{ textAlign: 'right' }}>
                                      {onInspectDiff && (
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => onInspectDiff(comp.id, ch.id)}
                                        >
                                          <Icon size="sm">
                                            <ArrowsLeftRight weight="thin" />
                                          </Icon>
                                          Compare
                                        </Button>
                                      )}
                                    </TableCell>
                                  </TableRow>
                                );
                              })}
                            </TableBody>
                          </Table>
                        )}
                      </div>
                    )}

                    {/* Sub-tab 3: Pricing Plans Table */}
                    {activeSubTab === 'pricing' && (
                      <div>
                        {pricingPlans.length === 0 ? (
                          <div style={{ padding: '24px', textAlign: 'center' }}>
                            <Text styleKey="caption1" weight={300} style={{ color: 'var(--x-text-muted)' }}>
                              No pricing tiers extracted yet for this competitor.
                            </Text>
                          </div>
                        ) : (
                          <Table variant="default" size="sm">
                            <TableHeader>
                              <TableRow>
                                <TableHead style={{ width: '25%' }}>PLAN</TableHead>
                                <TableHead style={{ width: '25%' }}>RATE</TableHead>
                                <TableHead style={{ width: '50%' }}>FEATURES</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {pricingPlans.map((plan, pIdx) => {
                                const features: string[] = Array.isArray(plan.features)
                                  ? plan.features
                                  : typeof plan.features === 'string'
                                  ? JSON.parse(plan.features || '[]')
                                  : [];

                                return (
                                  <TableRow key={plan.id || pIdx}>
                                    <TableCell>
                                      <Badge variant="subtle" tone="accent" size="sm">
                                        {plan.name}
                                      </Badge>
                                    </TableCell>
                                    <TableCell>
                                      <Text styleKey="caption1" weight={400}>
                                        {plan.price ? `$${plan.price}` : 'Free'}
                                        {plan.period ? ` / ${plan.period}` : ''}
                                      </Text>
                                    </TableCell>
                                    <TableCell>
                                      <Group gap={6} wrap="wrap">
                                        {features.map((f, fIdx) => (
                                          <Badge key={fIdx} variant="outline" tone="neutral" size="sm">
                                            {f}
                                          </Badge>
                                        ))}
                                      </Group>
                                    </TableCell>
                                  </TableRow>
                                );
                              })}
                            </TableBody>
                          </Table>
                        )}
                      </div>
                    )}
                  </Stack>
                </div>
              )}
            </div>
          );
        })}
      </Stack>

      {/* Xenon Confirmation Dialog for Deletion */}
      {/* @ts-expect-error Xenon WebDialogProps typings omit children in declaration */}
      <Dialog open={!!deleteTarget} onOpenChange={(open: boolean) => !open && setDeleteTarget(null)}>
        <DialogContent style={{ maxWidth: '440px', padding: '24px' }}>
          <DialogHeader>
            <DialogTitle>Remove Competitor</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove{' '}
              <span style={{ color: 'var(--x-text)', fontWeight: 400 }}>
                {deleteTarget ? extractDomain(deleteTarget.url) : 'this competitor'}
              </span>
              ? Autonomous snapshot collection and historical visual diffs for this domain will be permanently removed.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter style={{ marginTop: '20px' }}>
            <Group gap={8} justify="flex-end">
              <DialogClose asChild>
                <Button variant="ghost" size="sm">
                  Cancel
                </Button>
              </DialogClose>
              <Button variant="destructive" size="sm" onClick={confirmDelete}>
                <Icon size="sm">
                  <Trash weight="thin" />
                </Icon>
                Delete Competitor
              </Button>
            </Group>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
