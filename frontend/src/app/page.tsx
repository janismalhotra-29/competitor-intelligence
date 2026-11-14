'use client';

import { useState, useEffect } from 'react';
import {
  GlassBar,
  Surface,
  Stack,
  Group,
  Heading,
  Text,
  Badge,
  Icon,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from '@xenon-kit/web';
import {
  Lightning,
  Globe,
  GitDiff,
  CurrencyDollar,
  Bell,
  MagnifyingGlass,
} from '@phosphor-icons/react';
import { SplitDossierView } from '@/components/dashboard/SplitDossierView';
import { AlertsDropdown } from '@/components/alerts/AlertsDropdown';
import { SnapshotDiffModal } from '@/components/changes/SnapshotDiffModal';
import { MetricsRibbon } from '@/components/dashboard/MetricsRibbon';
import { CommandPaletteModal } from '@/components/dashboard/CommandPaletteModal';
import { VisualDiffGallery } from '@/components/diffs/VisualDiffGallery';
import { PricingMatrix } from '@/components/pricing/PricingMatrix';
import { AlertsTrail } from '@/components/alerts/AlertsTrail';
import { useCompetitors } from '@/hooks/useCompetitors';
import { useAlerts } from '@/hooks/useAlerts';

export default function Home() {
  const { queries, mutations } = useCompetitors();
  const { queries: alertQueries, mutations: alertMutations } = useAlerts();

  const [activeTab, setActiveTab] = useState('competitors');
  const [selectedCompetitorId, setSelectedCompetitorId] = useState<string | null>(null);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);

  // Global Keyboard Shortcut for Command Palette (⌘K / Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleFocusAdd = () => {
    setActiveTab('competitors');
    setTimeout(() => {
      const input = document.getElementById('competitor-url-input');
      if (input) input.focus();
    }, 150);
  };

  // Compute aggregate statistics for the Metrics Ribbon
  const totalSnapshots = Object.values(queries.snapshotsMap).reduce((acc, s) => acc + s.length, 0);
  const totalChanges = Object.values(queries.changesMap).reduce((acc, c) => acc + c.length, 0);
  const totalPricingPlans = Object.values(queries.pricingMap).reduce((acc, p) => acc + p.length, 0);

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--x-bg)', color: 'var(--x-text)' }}>
      {/* Top Floating GlassBar Navigation */}
      <GlassBar
        sticky
        bordered
        maxWidth="1140px"
        brand={
          <Group gap={12} align="center">
            <div
              style={{
                width: '32px',
                height: '32px',
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
                <Lightning weight="thin" />
              </Icon>
            </div>
            <div>
              <Group gap={8} align="center">
                <Text styleKey="headline" weight={300}>
                  Competitor Intelligence
                </Text>
                <Badge variant="subtle" tone="accent" size="sm">
                  v1.2 Xenon
                </Badge>
              </Group>
            </div>
          </Group>
        }
      >
        <Group gap={16} align="center">
          {/* Fast Search Pill Button for Command Palette */}
          <button
            type="button"
            onClick={() => setCommandPaletteOpen(true)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 12px',
              backgroundColor: 'var(--x-surface-1)',
              border: '1px solid var(--x-border)',
              borderRadius: 'var(--x-radius)',
              color: 'var(--x-text-muted)',
              cursor: 'pointer',
              fontSize: '13px',
              transition: 'border-color 0.15s ease',
            }}
          >
            <Icon size="sm">
              <MagnifyingGlass weight="thin" />
            </Icon>
            <span>Search or command...</span>
            <span
              style={{
                fontSize: '11px',
                padding: '2px 6px',
                borderRadius: 'var(--x-radius-sm)',
                backgroundColor: 'var(--x-surface-2)',
                border: '1px solid var(--x-border)',
                color: 'var(--x-text-muted)',
              }}
            >
              ⌘K
            </span>
          </button>

          {/* Realtime Live Status Pill */}
          <Badge variant="subtle" tone="accent" size="sm">
            <Group gap={6} align="center">
              <span
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--x-accent)',
                  display: 'inline-block',
                }}
              />
              <span>Live Engine</span>
            </Group>
          </Badge>

          {/* Notification Alerts Popover */}
          <AlertsDropdown
            alerts={alertQueries.alerts}
            unreadCount={alertQueries.unreadCount}
            markAsRead={alertMutations.markAsReadMutation}
            markAllAsRead={alertMutations.markAllAsReadMutation}
          />
        </Group>
      </GlassBar>

      {/* Main Content Area */}
      <main style={{ maxWidth: '1140px', margin: '0 auto', padding: '40px 24px 80px 24px' }}>
        <Stack gap={32}>
          {/* Hero Header */}
          <Stack gap={8}>
            <Heading level={1} styleKey="title1" weight={300} style={{ letterSpacing: '-0.02em' }}>
              Competitor Intelligence Dashboard
            </Heading>
            <Text styleKey="callout" weight={300} style={{ color: 'var(--x-text-muted)', maxWidth: '680px' }}>
              Track competitor website updates, visual design shifts, and pricing tier changes in real-time.
            </Text>
          </Stack>

          {/* Xenon Signature Metrics & Health Ribbon */}
          <MetricsRibbon
            competitorsCount={queries.competitors.length}
            totalSnapshots={totalSnapshots}
            totalChanges={totalChanges}
            totalPricingPlans={totalPricingPlans}
            isLive={true}
          />

          {/* Xenon Core Navigation Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList ariaLabel="Dashboard Sections">
              <TabsTrigger value="competitors" icon={<Globe weight="thin" />}>
                Competitors ({queries.competitors.length})
              </TabsTrigger>
              <TabsTrigger value="diffs" icon={<GitDiff weight="thin" />}>
                Visual Changes ({totalChanges})
              </TabsTrigger>
              <TabsTrigger value="pricing" icon={<CurrencyDollar weight="thin" />}>
                Pricing Comparison
              </TabsTrigger>
              <TabsTrigger value="alerts" icon={<Bell weight="thin" />}>
                Activity Feed ({alertQueries.unreadCount})
              </TabsTrigger>
            </TabsList>

            {/* TAB 1: Competitors Management (Executive Split Dossier) */}
            <TabsContent value="competitors">
              <div style={{ marginTop: '20px' }}>
                <SplitDossierView
                  competitors={queries.competitors}
                  loading={queries.loading}
                  selectedId={selectedCompetitorId}
                  onSelectCompetitor={setSelectedCompetitorId}
                  onAddCompetitor={mutations.addCompetitorMutation}
                  adding={mutations.adding}
                  onDeleteCompetitor={mutations.deleteCompetitorMutation}
                  onTriggerCollect={mutations.triggerCollectionMutation}
                  collectingMap={mutations.collectingMap}
                  snapshotsMap={queries.snapshotsMap}
                  changesMap={queries.changesMap}
                  pricingMap={queries.pricingMap}
                  onInspectDiff={queries.loadChangeDiff}
                  onDownloadReport={queries.downloadReport}
                />
              </div>
            </TabsContent>

            {/* TAB 2: Visual Diffs & Heatmaps Gallery */}
            <TabsContent value="diffs">
              <div style={{ marginTop: '20px' }}>
                <VisualDiffGallery
                  competitors={queries.competitors}
                  changesMap={queries.changesMap}
                  onInspectDiff={queries.loadChangeDiff}
                  diffLoading={queries.diffLoading}
                />
              </div>
            </TabsContent>

            {/* TAB 3: Cross-Competitor Pricing Intelligence */}
            <TabsContent value="pricing">
              <div style={{ marginTop: '20px' }}>
                <PricingMatrix
                  competitors={queries.competitors}
                  pricingMap={queries.pricingMap}
                  onDownloadReport={queries.downloadReport}
                />
              </div>
            </TabsContent>

            {/* TAB 4: Alerts & Audit Log */}
            <TabsContent value="alerts">
              <div style={{ marginTop: '20px' }}>
                <AlertsTrail
                  alerts={alertQueries.alerts}
                  onMarkRead={alertMutations.markAsReadMutation}
                  onMarkAllRead={alertMutations.markAllAsReadMutation}
                />
              </div>
            </TabsContent>
          </Tabs>
        </Stack>
      </main>

      {/* Floating Liquid Glass Command Palette (⌘K) */}
      <CommandPaletteModal
        open={commandPaletteOpen}
        onOpenChange={setCommandPaletteOpen}
        competitors={queries.competitors}
        onSelectTab={setActiveTab}
        onFocusAdd={handleFocusAdd}
        onTriggerCollect={mutations.triggerCollectionMutation}
      />

      {/* Floating Liquid Glass Visual Diff Modal */}
      {queries.selectedDiff && (
        <SnapshotDiffModal
          diffData={queries.selectedDiff}
          onClose={queries.closeDiffModal}
          loading={queries.diffLoading}
        />
      )}
    </div>
  );
}
