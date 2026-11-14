'use client';

import React, { useState } from 'react';
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
  Input,
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
  Plus,
  ArrowClockwise,
  ArrowsLeftRight,
  FileText,
  Trash,
  Sparkle,
  ArrowSquareOut,
  Camera,
  MagnifyingGlass,
} from '@phosphor-icons/react';
import { API_URL } from '@/lib/api';

function extractDomain(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return url.replace(/https?:\/\//, '').split('/')[0] || url;
  }
}

function timeAgo(dateString?: string | Date): string {
  if (!dateString) return 'Just now';
  const now = new Date();
  const past = new Date(dateString);
  const diffSec = Math.floor((now.getTime() - past.getTime()) / 1000);
  if (diffSec < 60) return 'Just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDays = Math.floor(diffHr / 24);
  return `${diffDays}d ago`;
}

interface EasyCompetitorFeedProps {
  competitors: Competitor[];
  loading: boolean;
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

export function EasyCompetitorFeed({
  competitors,
  loading,
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
}: EasyCompetitorFeedProps) {
  const [newUrl, setNewUrl] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<Competitor | null>(null);

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUrl.trim()) return;
    const targetUrl = newUrl.trim();
    try {
      await onAddCompetitor(targetUrl);
      setNewUrl('');
      toast.success('Website Added', {
        description: `Now monitoring ${targetUrl} for visual and text changes.`,
      });
    } catch {
      // Handled upstream
    }
  };

  const handleCheck = (id: string, domain: string) => {
    toast.info('Checking Website', {
      description: `Capturing fresh screenshot and scanning for changes on ${domain}...`,
    });
    onTriggerCollect(id);
  };

  const handleDownload = (id: string, url: string, domain: string) => {
    onDownloadReport(id, url);
    toast.success('Report Downloaded', {
      description: `Executive intelligence report exported for ${domain}.`,
    });
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    const domain = extractDomain(deleteTarget.url);
    onDeleteCompetitor(deleteTarget.id);
    setDeleteTarget(null);
    toast.warning('Website Removed', {
      description: `${domain} has been removed from tracking.`,
    });
  };

  const filteredCompetitors = competitors.filter((c) => {
    const domain = extractDomain(c.url).toLowerCase();
    const q = searchQuery.toLowerCase();
    return domain.includes(q) || c.url.toLowerCase().includes(q);
  });

  return (
    <Stack gap={32} style={{ maxWidth: '840px', margin: '0 auto' }}>
      {/* 1. HERO TRACK BAR (Clean, centered, Enfold-inspired) */}
      <Surface
        variant="default"
        padding={24}
        style={{
          borderRadius: 'var(--x-radius)',
          border: '1px solid var(--x-border)',
          backgroundColor: 'var(--x-surface-1)',
        }}
      >
        <form onSubmit={handleAddSubmit}>
          <Stack gap={16}>
            <div>
              <Heading level={2} styleKey="title3" weight={300}>
                Track New Website
              </Heading>
              <Text styleKey="callout" weight={300} style={{ color: 'var(--x-text-muted)', marginTop: '4px' }}>
                Enter any competitor landing page to monitor design shifts, copy updates, and pricing tiers.
              </Text>
            </div>

            <Group gap={8} align="center">
              <div style={{ flex: 1 }}>
                <Input
                  id="competitor-url-input"
                  size="md"
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
              <Button type="submit" variant="accent" size="md" loading={adding}>
                <Icon size="sm">
                  <Plus weight="thin" />
                </Icon>
                <span>Track Website</span>
              </Button>
            </Group>
          </Stack>
        </form>
      </Surface>

      {/* 2. SUB-BAR: Search Filter & Count */}
      <Group justify="space-between" align="center" wrap="wrap" gap={12}>
        <Group gap={8} align="center">
          <Text styleKey="callout" weight={400} style={{ color: 'var(--x-text)' }}>
            Monitored Websites
          </Text>
          <Badge variant="subtle" tone="accent" size="sm">
            {competitors.length} Active
          </Badge>
        </Group>

        {competitors.length > 1 && (
          <div style={{ width: '240px' }}>
            <Input
              size="sm"
              placeholder="Search websites..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              prefix={
                <Icon size="sm" style={{ color: 'var(--x-text-muted)' }}>
                  <MagnifyingGlass weight="thin" />
                </Icon>
              }
            />
          </div>
        )}
      </Group>

      {/* 3. COMPETITOR CARDS FEED */}
      {loading && competitors.length === 0 ? (
        <Surface
          variant="default"
          padding={48}
          style={{
            borderRadius: 'var(--x-radius)',
            border: '1px solid var(--x-border)',
            textAlign: 'center',
          }}
        >
          <Group justify="center" gap={12} align="center">
            <Spinner size="md" />
            <Text styleKey="callout" weight={300} style={{ color: 'var(--x-text-muted)' }}>
              Loading monitored websites...
            </Text>
          </Group>
        </Surface>
      ) : filteredCompetitors.length === 0 ? (
        <Surface
          variant="default"
          padding={48}
          style={{
            borderRadius: 'var(--x-radius)',
            border: '1px solid var(--x-border)',
            textAlign: 'center',
          }}
        >
          <Stack gap={12} align="center">
            <Icon size="lg" style={{ color: 'var(--x-text-muted)' }}>
              <Globe weight="thin" />
            </Icon>
            <Text styleKey="headline" weight={300}>
              {searchQuery ? 'No websites match your search' : 'No competitors tracked yet'}
            </Text>
            <Text styleKey="callout" weight={300} style={{ color: 'var(--x-text-muted)', maxWidth: '420px' }}>
              {searchQuery
                ? 'Try a different search query or clear the filter.'
                : 'Enter a competitor URL above to start autonomous visual surveillance and change detection.'}
            </Text>
          </Stack>
        </Surface>
      ) : (
        <Stack gap={16}>
          {filteredCompetitors.map((comp) => {
            const domain = extractDomain(comp.url);
            const domainInitials =
              domain
                .replace(/[^a-zA-Z0-9]/g, '')
                .slice(0, 2)
                .toUpperCase() || 'CO';

            const compSnapshots = snapshotsMap[comp.id] || [];
            const compChanges = changesMap[comp.id] || [];
            const compPricing = pricingMap[comp.id] || [];
            const isCollecting = !!collectingMap[comp.id];

            const latestSnapshot =
              compSnapshots.find((s) => s.status === 'SUCCESS' && s.screenshotUrl) ||
              compSnapshots.find((s) => s.status === 'SUCCESS') ||
              compSnapshots[0] ||
              null;

            const latestChange = compChanges.find((c) => c.hasChanges) || compChanges[0] || null;

            return (
              <Surface
                key={comp.id}
                variant="default"
                padding={24}
                style={{
                  borderRadius: 'var(--x-radius)',
                  border: '1px solid var(--x-border)',
                  transition: 'border-color 0.15s ease',
                }}
              >
                <Stack gap={16}>
                  {/* Card Header: Identity + Actions */}
                  <Group justify="space-between" align="center" wrap="wrap" gap={12}>
                    <Group gap={12} align="center">
                      <Avatar fallback={domainInitials} size="md" />
                      <div>
                        <Group gap={8} align="center">
                          <Heading level={3} styleKey="headline" weight={400}>
                            {domain}
                          </Heading>
                          <a
                            href={comp.url}
                            target="_blank"
                            rel="noreferrer"
                            style={{
                              color: 'var(--x-text-muted)',
                              display: 'inline-flex',
                              alignItems: 'center',
                              textDecoration: 'none',
                            }}
                            title={`Open ${comp.url}`}
                          >
                            <Icon size="sm">
                              <ArrowSquareOut weight="thin" />
                            </Icon>
                          </a>
                          {compChanges.length > 0 ? (
                            <Badge variant="subtle" tone="accent" size="sm">
                              {compChanges.length} Updates Found
                            </Badge>
                          ) : (
                            <Badge variant="outline" tone="neutral" size="sm">
                              Stable
                            </Badge>
                          )}
                        </Group>

                        <Text styleKey="caption2" weight={300} style={{ color: 'var(--x-text-muted)', marginTop: '2px' }}>
                          Last checked {timeAgo(latestSnapshot?.capturedAt || comp.createdAt)} · {compSnapshots.length} snapshots saved
                        </Text>
                      </div>
                    </Group>

                    {/* Action Buttons */}
                    <Group gap={8} align="center">
                      {latestChange && (
                        <Button
                          variant="accent"
                          size="sm"
                          onClick={() => onInspectDiff(comp.id, latestChange.id)}
                        >
                          <Icon size="sm">
                            <ArrowsLeftRight weight="thin" />
                          </Icon>
                          <span>Compare Diff</span>
                        </Button>
                      )}

                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={isCollecting}
                        onClick={() => handleCheck(comp.id, domain)}
                      >
                        {isCollecting ? (
                          <Spinner size="sm" />
                        ) : (
                          <Icon size="sm">
                            <ArrowClockwise weight="thin" />
                          </Icon>
                        )}
                        <span>{isCollecting ? 'Checking...' : 'Check Now'}</span>
                      </Button>

                      <IconButton
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDownload(comp.id, comp.url, domain)}
                        aria-label="Download markdown report"
                      >
                        <Icon size="sm" style={{ color: 'var(--x-text-muted)' }}>
                          <FileText weight="thin" />
                        </Icon>
                      </IconButton>

                      <IconButton
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeleteTarget(comp)}
                        aria-label="Delete website"
                      >
                        <Icon size="sm" style={{ color: 'var(--x-text-muted)' }}>
                          <Trash weight="thin" />
                        </Icon>
                      </IconButton>
                    </Group>
                  </Group>

                  {/* AI Summary Banner (What Changed?) */}
                  <div
                    style={{
                      padding: '12px 16px',
                      borderRadius: 'var(--x-radius-sm)',
                      backgroundColor: 'var(--x-surface-1)',
                      border: '1px solid var(--x-border)',
                    }}
                  >
                    <Group gap={10} align="flex-start">
                      <Icon size="sm" style={{ color: 'var(--x-accent)', marginTop: '2px', flexShrink: 0 }}>
                        <Sparkle weight="thin" />
                      </Icon>
                      <div style={{ flex: 1 }}>
                        <Text styleKey="callout" weight={300} style={{ color: 'var(--x-text)', lineHeight: 1.5 }}>
                          {latestChange?.aiSummary?.analysis ||
                            latestChange?.diffSummary ||
                            'Website is currently stable. Continuous autonomous crawling will highlight text shifts, design redesigns, or pricing changes here immediately.'}
                        </Text>
                      </div>
                    </Group>
                  </div>

                  {/* Visual Preview & Pricing Pill Row */}
                  <Group justify="space-between" align="center" wrap="wrap" gap={12}>
                    {/* Left: Pricing Pills if any */}
                    <div>
                      {compPricing.length > 0 ? (
                        <Group gap={6} align="center" wrap="wrap">
                          <Text styleKey="caption2" weight={400} style={{ color: 'var(--x-text-muted)' }}>
                            Pricing Plans:
                          </Text>
                          {compPricing.slice(0, 3).map((plan) => {
                            const priceText = plan.price
                              ? plan.price.startsWith('$')
                                ? plan.price
                                : `$${plan.price}`
                              : 'Free';
                            return (
                              <Badge key={plan.id} variant="outline" tone="neutral" size="sm">
                                {plan.name}: {priceText}
                                {plan.period ? ` / ${plan.period}` : ''}
                              </Badge>
                            );
                          })}
                        </Group>
                      ) : (
                        <Text styleKey="caption2" weight={300} style={{ color: 'var(--x-text-muted)' }}>
                          No pricing grid detected on this landing page.
                        </Text>
                      )}
                    </div>

                    {/* Right: Screenshot Quick Preview Pill */}
                    {latestSnapshot?.screenshotUrl && (
                      <button
                        type="button"
                        onClick={() => {
                          if (latestChange) {
                            onInspectDiff(comp.id, latestChange.id);
                          } else {
                            window.open(`${API_URL}/snapshots/${latestSnapshot.id}/screenshot`, '_blank');
                          }
                        }}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '4px 10px',
                          backgroundColor: 'var(--x-surface-2)',
                          border: '1px solid var(--x-border)',
                          borderRadius: 'var(--x-radius)',
                          color: 'var(--x-text)',
                          cursor: 'pointer',
                          fontSize: '12px',
                        }}
                        title="Click to view full screenshot diff"
                      >
                        <Icon size="sm" style={{ color: 'var(--x-accent)' }}>
                          <Camera weight="thin" />
                        </Icon>
                        <span>View Latest Screenshot</span>
                      </button>
                    )}
                  </Group>
                </Stack>
              </Surface>
            );
          })}
        </Stack>
      )}

      {/* Confirmation Dialog for Competitor Deletion */}
      {/* @ts-expect-error Xenon DialogProps typings omit children in declaration */}
      <Dialog open={!!deleteTarget} onOpenChange={(open: boolean) => !open && setDeleteTarget(null)}>
        <DialogContent style={{ maxWidth: '440px', padding: '24px' }}>
          <DialogHeader>
            <DialogTitle>Remove Website</DialogTitle>
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
                <span>Delete</span>
              </Button>
            </Group>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Stack>
  );
}
