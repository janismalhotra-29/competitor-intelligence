'use client';

import React, { useState, useEffect } from 'react';
import type { Competitor, Snapshot, Change, PricingPlan } from '@/types';
import {
  Surface,
  Group,
  Stack,
  Text,
  Heading,
  Badge,
  Button,
  IconButton,
  Icon,
  Divider,
  Input,
  Avatar,
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
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
  Plus,
  ArrowClockwise,
  ArrowsLeftRight,
  FileText,
  Trash,
  MagnifyingGlass,
  Camera,
  CalendarBlank,
  Sparkle,
  ArrowSquareOut,
  ShieldCheck,
} from '@phosphor-icons/react';
import { API_URL } from '@/lib/api';

function extractDomain(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return url.replace(/https?:\/\//, '').split('/')[0] || url;
  }
}

interface SplitDossierViewProps {
  competitors: Competitor[];
  loading: boolean;
  selectedId: string | null;
  onSelectCompetitor: (id: string) => void;
  onAddCompetitor: (url: string) => Promise<void>;
  adding: boolean;
  onDeleteCompetitor: (id: string) => void;
  onTriggerCollect: (id: string) => void;
  collectingMap: Record<string, boolean>;
  snapshotsMap: Record<string, Snapshot[]>;
  changesMap: Record<string, Change[]>;
  pricingMap: Record<string, PricingPlan[]>;
  onInspectDiff: (competitorId: string, changeId: string) => void;
  onDownloadReport: (id: string, url: string) => void;
}

export function SplitDossierView({
  competitors,
  loading,
  selectedId,
  onSelectCompetitor,
  onAddCompetitor,
  adding,
  onDeleteCompetitor,
  onTriggerCollect,
  collectingMap,
  snapshotsMap,
  changesMap,
  pricingMap,
  onInspectDiff,
  onDownloadReport,
}: SplitDossierViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<Competitor | null>(null);

  // Auto-select first competitor if none selected
  useEffect(() => {
    if (!selectedId && competitors.length > 0) {
      onSelectCompetitor(competitors[0].id);
    }
  }, [selectedId, competitors, onSelectCompetitor]);

  // Filter left sidebar list
  const filteredCompetitors = competitors.filter((c) => {
    const domain = extractDomain(c.url).toLowerCase();
    const q = searchQuery.toLowerCase();
    return domain.includes(q) || c.url.toLowerCase().includes(q);
  });

  const selectedCompetitor = competitors.find((c) => c.id === selectedId) || competitors[0] || null;

  // Selected competitor's data
  const snapshots = selectedCompetitor ? snapshotsMap[selectedCompetitor.id] || [] : [];
  const changes = selectedCompetitor ? changesMap[selectedCompetitor.id] || [] : [];
  const pricingPlans = selectedCompetitor ? pricingMap[selectedCompetitor.id] || [] : [];
  const isCollecting = selectedCompetitor ? !!collectingMap[selectedCompetitor.id] : false;

  const latestSnapshot = snapshots.find((s) => s.status === 'SUCCESS' && s.screenshotUrl) || snapshots.find((s) => s.status === 'SUCCESS') || snapshots[0] || null;
  const latestChange = changes.find((c) => c.hasChanges) || changes[0] || null;

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUrl.trim()) return;
    const targetUrl = newUrl.trim();
    try {
      await onAddCompetitor(targetUrl);
      setNewUrl('');
      toast.success('Competitor Added', {
        description: `Now monitoring ${targetUrl}. Initial snapshot queued.`,
      });
    } catch {
      // Handled upstream
    }
  };

  const handleCheckUpdates = (id: string, domain: string) => {
    toast.info('Checking for updates', {
      description: `Capturing fresh screenshot for ${domain}...`,
    });
    onTriggerCollect(id);
  };

  const handleDownload = (id: string, url: string, domain: string) => {
    onDownloadReport(id, url);
    toast.success('Report Downloaded', {
      description: `Executive intelligence markdown exported for ${domain}.`,
    });
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    const name = extractDomain(deleteTarget.url);
    onDeleteCompetitor(deleteTarget.id);
    setDeleteTarget(null);
    toast.warning('Competitor Removed', {
      description: `${name} has been removed from tracking.`,
    });
  };

  return (
    <>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '320px 1fr',
          gap: '24px',
          alignItems: 'start',
        }}
      >
        {/* LEFT PANE: Competitor Explorer */}
        <Surface
          variant="default"
          padding={0}
          style={{
            borderRadius: 'var(--x-radius)',
            border: '1px solid var(--x-border)',
            overflow: 'hidden',
          }}
        >
          {/* Quick Add Form */}
          <div style={{ padding: '16px', borderBottom: '1px solid var(--x-border)' }}>
            <form onSubmit={handleAddSubmit}>
              <Stack gap={8}>
                <Text styleKey="caption1" weight={400} style={{ color: 'var(--x-text)' }}>
                  Add Competitor
                </Text>
                <Group gap={6} align="center">
                  <div style={{ flex: 1 }}>
                    <Input
                      id="competitor-url-input"
                      size="sm"
                      placeholder="https://company.com"
                      value={newUrl}
                      onChange={(e) => setNewUrl(e.target.value)}
                      type="url"
                      required
                      prefix={
                        <Icon size="sm" style={{ color: 'var(--x-text-muted)' }}>
                          <Globe weight="thin" />
                        </Icon>
                      }
                    />
                  </div>
                  <Button type="submit" variant="accent" size="sm" loading={adding}>
                    <Icon size="sm">
                      <Plus weight="thin" />
                    </Icon>
                    Add
                  </Button>
                </Group>
              </Stack>
            </form>
          </div>

          {/* Search Box */}
          <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--x-border)' }}>
            <Input
              size="sm"
              placeholder="Search competitors..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              prefix={
                <Icon size="sm" style={{ color: 'var(--x-text-muted)' }}>
                  <MagnifyingGlass weight="thin" />
                </Icon>
              }
            />
          </div>

          {/* Competitor List */}
          <div style={{ maxHeight: '680px', overflowY: 'auto' }}>
            {loading && competitors.length === 0 ? (
              <div style={{ padding: '32px 16px', textAlign: 'center' }}>
                <Group justify="center" gap={8} align="center">
                  <Spinner size="sm" />
                  <Text styleKey="caption1" weight={300} style={{ color: 'var(--x-text-muted)' }}>
                    Loading websites...
                  </Text>
                </Group>
              </div>
            ) : filteredCompetitors.length === 0 ? (
              <div style={{ padding: '32px 16px', textAlign: 'center' }}>
                <Text styleKey="caption1" weight={300} style={{ color: 'var(--x-text-muted)' }}>
                  No competitors found.
                </Text>
              </div>
            ) : (
              <Stack gap={0}>
                {filteredCompetitors.map((comp, idx) => {
                  const isSelected = selectedCompetitor?.id === comp.id;
                  const domain = extractDomain(comp.url);
                  const domainInitials = domain
                    .replace(/[^a-zA-Z0-9]/g, '')
                    .slice(0, 2)
                    .toUpperCase() || 'CO';
                  const compChanges = changesMap[comp.id] || [];
                  const hasUpdates = compChanges.length > 0;

                  return (
                    <React.Fragment key={comp.id}>
                      {idx > 0 && <Divider />}
                      <div
                        onClick={() => onSelectCompetitor(comp.id)}
                        style={{
                          padding: '14px 16px',
                          cursor: 'pointer',
                          backgroundColor: isSelected ? 'var(--x-surface-2)' : 'transparent',
                          transition: 'background-color 0.15s ease',
                          borderLeft: isSelected ? '2px solid var(--x-accent)' : '2px solid transparent',
                        }}
                      >
                        <Group justify="space-between" align="center">
                          <Group gap={12} align="center">
                            <Avatar fallback={domainInitials} size="sm" />
                            <div>
                              <Text
                                styleKey="callout"
                                weight={isSelected ? 400 : 300}
                                style={{ color: isSelected ? 'var(--x-text)' : 'var(--x-text)' }}
                              >
                                {domain}
                              </Text>
                              <Text styleKey="caption2" weight={300} style={{ color: 'var(--x-text-muted)', marginTop: '2px' }}>
                                Checked recently
                              </Text>
                            </div>
                          </Group>

                          <div>
                            {hasUpdates ? (
                              <Badge variant="subtle" tone="accent" size="sm">
                                {compChanges.length} New
                              </Badge>
                            ) : (
                              <Badge variant="outline" tone="neutral" size="sm">
                                Stable
                              </Badge>
                            )}
                          </div>
                        </Group>
                      </div>
                    </React.Fragment>
                  );
                })}
              </Stack>
            )}
          </div>
        </Surface>

        {/* RIGHT PANE: Deep-Dive Dossier */}
        {selectedCompetitor ? (
          <Stack gap={24}>
            {/* Dossier Header Card */}
            <Surface
              variant="default"
              padding={24}
              style={{
                borderRadius: 'var(--x-radius)',
                border: '1px solid var(--x-border)',
              }}
            >
              <Group justify="space-between" align="center" wrap="wrap" gap={16}>
                <div>
                  <Group gap={10} align="center">
                    <Heading level={2} styleKey="title2" weight={300} style={{ letterSpacing: '-0.01em' }}>
                      {extractDomain(selectedCompetitor.url)}
                    </Heading>
                    <Badge variant="subtle" tone="accent" size="sm">
                      Live Monitoring
                    </Badge>
                  </Group>
                  <Group gap={6} align="center" style={{ marginTop: '6px' }}>
                    <a
                      href={selectedCompetitor.url}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        color: 'var(--x-text-muted)',
                        fontSize: '13px',
                        textDecoration: 'none',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      <span>{selectedCompetitor.url}</span>
                      <Icon size="sm">
                        <ArrowSquareOut weight="thin" />
                      </Icon>
                    </a>
                  </Group>
                </div>

                {/* Top Action Buttons */}
                <Group gap={8} align="center">
                  <Button
                    variant="accent"
                    size="sm"
                    disabled={isCollecting}
                    onClick={() => handleCheckUpdates(selectedCompetitor.id, extractDomain(selectedCompetitor.url))}
                  >
                    {isCollecting ? (
                      <Spinner size="sm" />
                    ) : (
                      <Icon size="sm">
                        <ArrowClockwise weight="thin" />
                      </Icon>
                    )}
                    <span>{isCollecting ? 'Checking...' : 'Check Updates'}</span>
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      handleDownload(selectedCompetitor.id, selectedCompetitor.url, extractDomain(selectedCompetitor.url))
                    }
                  >
                    <Icon size="sm">
                      <FileText weight="thin" />
                    </Icon>
                    <span>Download Report</span>
                  </Button>

                  <IconButton
                    variant="ghost"
                    size="sm"
                    aria-label="Remove website"
                    onClick={() => setDeleteTarget(selectedCompetitor)}
                  >
                    <Icon size="sm" style={{ color: 'var(--x-text-muted)' }}>
                      <Trash weight="thin" />
                    </Icon>
                  </IconButton>
                </Group>
              </Group>
            </Surface>

            {/* AI Executive Summary Card */}
            <Surface
              variant="default"
              padding={24}
              style={{
                borderRadius: 'var(--x-radius)',
                border: '1px solid var(--x-border)',
                backgroundColor: 'var(--x-surface-1)',
              }}
            >
              <Stack gap={12}>
                <Group justify="space-between" align="center">
                  <Group gap={8} align="center">
                    <Icon size="sm" style={{ color: 'var(--x-accent)' }}>
                      <Sparkle weight="thin" />
                    </Icon>
                    <Text styleKey="callout" weight={400} style={{ color: 'var(--x-text)' }}>
                      AI Executive Summary
                    </Text>
                  </Group>
                  <Badge variant="subtle" tone={changes.length > 0 ? 'accent' : 'neutral'} size="sm">
                    {changes.length > 0 ? `${changes.length} Updates Detected` : 'No Recent Changes'}
                  </Badge>
                </Group>

                <Text styleKey="callout" weight={300} style={{ color: 'var(--x-text)', lineHeight: 1.6 }}>
                  {latestChange?.aiSummary?.analysis ||
                    latestChange?.diffSummary ||
                    'Website is currently stable. Continuous autonomous crawling will highlight text shifts, design redesigns, or pricing changes here immediately.'}
                </Text>

                <Group gap={16} align="center" style={{ marginTop: '4px' }}>
                  <Group gap={6} align="center">
                    <Icon size="sm" style={{ color: 'var(--x-text-muted)' }}>
                      <ShieldCheck weight="thin" />
                    </Icon>
                    <Text styleKey="caption2" weight={300} style={{ color: 'var(--x-text-muted)' }}>
                      Full page visual integrity checked
                    </Text>
                  </Group>
                  <Text styleKey="caption2" weight={300} style={{ color: 'var(--x-text-muted)' }}>
                    ·
                  </Text>
                  <Group gap={6} align="center">
                    <Icon size="sm" style={{ color: 'var(--x-text-muted)' }}>
                      <CalendarBlank weight="thin" />
                    </Icon>
                    <Text styleKey="caption2" weight={300} style={{ color: 'var(--x-text-muted)' }}>
                      {latestSnapshot ? `Last screenshot: ${new Date(latestSnapshot.capturedAt).toLocaleTimeString()}` : 'No snapshots'}
                    </Text>
                  </Group>
                </Group>
              </Stack>
            </Surface>

            {/* Visual Screenshot & Diff Comparison Card */}
            <Surface
              variant="default"
              padding={0}
              style={{
                borderRadius: 'var(--x-radius)',
                border: '1px solid var(--x-border)',
                overflow: 'hidden',
              }}
            >
              <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--x-border)' }}>
                <Group justify="space-between" align="center">
                  <div>
                    <Text styleKey="callout" weight={400}>
                      Visual Snapshot & Design Inspector
                    </Text>
                    <Text styleKey="caption2" weight={300} style={{ color: 'var(--x-text-muted)', marginTop: '2px' }}>
                      Headless Chromium viewport capture
                    </Text>
                  </div>

                  {latestChange && (
                    <Button
                      variant="accent"
                      size="sm"
                      onClick={() => onInspectDiff(selectedCompetitor.id, latestChange.id)}
                    >
                      <Icon size="sm">
                        <ArrowsLeftRight weight="thin" />
                      </Icon>
                      <span>Compare Before & After</span>
                    </Button>
                  )}
                </Group>
              </div>

              {latestSnapshot ? (
                <div style={{ padding: '20px', backgroundColor: 'var(--x-surface-1)' }}>
                  <div
                    style={{
                      borderRadius: 'var(--x-radius-sm)',
                      overflow: 'hidden',
                      border: '1px solid var(--x-border)',
                      maxHeight: '340px',
                      backgroundColor: '#000',
                      position: 'relative',
                    }}
                  >
                    <img
                      src={`${API_URL}/snapshots/${latestSnapshot.id}/screenshot`}
                      alt="Website screenshot"
                      style={{
                        width: '100%',
                        height: 'auto',
                        display: 'block',
                        objectFit: 'cover',
                      }}
                      onError={(e) => {
                        // Fallback placeholder if image load fails
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                    <div
                      style={{
                        position: 'absolute',
                        bottom: '12px',
                        right: '12px',
                        backgroundColor: 'rgba(0,0,0,0.75)',
                        backdropFilter: 'blur(8px)',
                        padding: '4px 10px',
                        borderRadius: 'var(--x-radius)',
                        border: '1px solid var(--x-border)',
                      }}
                    >
                      <Text styleKey="caption2" weight={300} style={{ color: '#fff' }}>
                        Captured: {new Date(latestSnapshot.capturedAt).toLocaleString()}
                      </Text>
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ padding: '40px', textAlign: 'center' }}>
                  <Stack gap={8} align="center">
                    <Icon size="md" style={{ color: 'var(--x-text-muted)' }}>
                      <Camera weight="thin" />
                    </Icon>
                    <Text styleKey="caption1" weight={300} style={{ color: 'var(--x-text-muted)' }}>
                      No screenshot captured yet. Click &quot;Check Updates&quot; to take a live snapshot.
                    </Text>
                  </Stack>
                </div>
              )}
            </Surface>

            {/* Extracted Pricing Tiers Matrix */}
            <Surface
              variant="default"
              padding={0}
              style={{
                borderRadius: 'var(--x-radius)',
                border: '1px solid var(--x-border)',
                overflow: 'hidden',
              }}
            >
              <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--x-border)' }}>
                <Group justify="space-between" align="center">
                  <div>
                    <Text styleKey="callout" weight={400}>
                      Detected Pricing Tiers
                    </Text>
                    <Text styleKey="caption2" weight={300} style={{ color: 'var(--x-text-muted)', marginTop: '2px' }}>
                      Subscription rates and feature breakdown
                    </Text>
                  </div>
                  <Badge variant="subtle" tone="accent" size="sm">
                    {pricingPlans.length} Tiers
                  </Badge>
                </Group>
              </div>

              {pricingPlans.length === 0 ? (
                <div style={{ padding: '32px 20px', textAlign: 'center' }}>
                  <Text styleKey="caption1" weight={300} style={{ color: 'var(--x-text-muted)' }}>
                    No pricing tiers detected on this page. If this page has a pricing grid, it will appear here.
                  </Text>
                </div>
              ) : (
                <Table variant="default" size="sm">
                  <TableHeader>
                    <TableRow>
                      <TableHead style={{ width: '25%' }}>PLAN NAME</TableHead>
                      <TableHead style={{ width: '25%' }}>PRICE</TableHead>
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

                      const displayPrice = plan.price
                        ? plan.price.startsWith('$')
                          ? plan.price
                          : `$${plan.price}`
                        : 'Free';

                      return (
                        <TableRow key={plan.id || pIdx}>
                          <TableCell>
                            <Badge variant="subtle" tone="accent" size="sm">
                              {plan.name}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Text styleKey="caption1" weight={400}>
                              {displayPrice}
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
                              {features.length === 0 && (
                                <Text styleKey="caption2" weight={300} style={{ color: 'var(--x-text-muted)' }}>
                                  Standard features
                                </Text>
                              )}
                            </Group>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </Surface>
          </Stack>
        ) : (
          <Surface
            variant="default"
            padding={48}
            style={{
              borderRadius: 'var(--x-radius)',
              border: '1px solid var(--x-border)',
              textAlign: 'center',
            }}
          >
            <Stack gap={16} align="center">
              <Icon size="lg" style={{ color: 'var(--x-text-muted)' }}>
                <Globe weight="thin" />
              </Icon>
              <Text styleKey="headline" weight={300}>
                Select a competitor
              </Text>
              <Text styleKey="callout" weight={300} style={{ color: 'var(--x-text-muted)', maxWidth: '440px' }}>
                Choose a website from the left panel to inspect its visual screenshots, AI insights, and pricing plans.
              </Text>
            </Stack>
          </Surface>
        )}
      </div>

      {/* Confirmation Dialog for Competitor Deletion */}
      {/* @ts-expect-error Xenon DialogProps typings omit children in declaration */}
      <Dialog open={!!deleteTarget} onOpenChange={(open: boolean) => !open && setDeleteTarget(null)}>
        <DialogContent style={{ maxWidth: '440px', padding: '24px' }}>
          <DialogHeader>
            <DialogTitle>Remove Competitor</DialogTitle>
            <DialogDescription>
              Are you sure you want to stop tracking{' '}
              <span style={{ color: 'var(--x-text)', fontWeight: 400 }}>
                {deleteTarget ? extractDomain(deleteTarget.url) : 'this website'}
              </span>
              ? All historical snapshots, revisions, and visual diffs will be removed.
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
                Delete
              </Button>
            </Group>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
