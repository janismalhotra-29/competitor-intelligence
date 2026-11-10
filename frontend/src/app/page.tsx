'use client';

import {
  GlassBar,
  Surface,
  Stack,
  Group,
  Heading,
  Text,
  Badge,
  Icon,
  Divider,
} from '@xenon-kit/web';
import { Lightning, Broadcast } from '@phosphor-icons/react';
import { AddCompetitorForm } from '@/components/competitors/AddCompetitorForm';
import { CompetitorList } from '@/components/competitors/CompetitorList';
import { AlertsDropdown } from '@/components/alerts/AlertsDropdown';
import { SnapshotDiffModal } from '@/components/changes/SnapshotDiffModal';
import { useCompetitors } from '@/hooks/useCompetitors';
import { useAlerts } from '@/hooks/useAlerts';

export default function Home() {
  const { queries, mutations } = useCompetitors();
  const { queries: alertQueries, mutations: alertMutations } = useAlerts();

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to remove this competitor?')) return;
    await mutations.deleteCompetitorMutation(id);
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--x-bg)', color: 'var(--x-text)' }}>
      {/* Top Floating GlassBar */}
      <GlassBar
        sticky
        bordered
        maxWidth="1080px"
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
              <Text styleKey="headline" weight={300}>
                Competitor Intelligence
              </Text>
            </div>
          </Group>
        }
        actions={
          <Group gap={12} align="center">
            <Badge variant="subtle" tone="accent" size="sm">
              <Icon size="xs">
                <Broadcast weight="thin" />
              </Icon>
              <span>Live</span>
            </Badge>

            <AlertsDropdown
              alerts={alertQueries.alerts}
              unreadCount={alertQueries.unreadCount}
              markAsRead={alertMutations.markAsReadMutation}
              markAllAsRead={alertMutations.markAllAsReadMutation}
            />
          </Group>
        }
      />

      {/* Main Content Area */}
      <main style={{ maxWidth: '1080px', margin: '0 auto', padding: 'var(--x-space-8) var(--x-space-6)' }}>
        <Stack gap={40}>
          {/* Header Title Section */}
          <Stack gap={8}>
            <Heading level={1} styleKey="title1" weight={300}>
              Market Monitoring
            </Heading>
            <Text styleKey="body" tone="muted" weight={300} style={{ maxWidth: '640px' }}>
              Autonomous website tracking, visual pixel diff detection, and pricing intelligence powered by Xenon design system.
            </Text>
          </Stack>

          {/* Form Surface */}
          <Surface variant="default" padding={24} style={{ border: '1px solid var(--x-border)' }}>
            <AddCompetitorForm
              submitCompetitor={mutations.addCompetitorMutation}
              adding={mutations.adding}
            />
          </Surface>

          {/* Tracked Competitors List Surface */}
          <Surface variant="default" padding={24} style={{ border: '1px solid var(--x-border)' }}>
            <Stack gap={20}>
              <Group justify="space-between" align="center">
                <div>
                  <Heading level={2} styleKey="title3" weight={300}>
                    Tracked Domains
                  </Heading>
                  <Text styleKey="caption1" tone="muted" weight={300}>
                    Real-time monitoring feeds and change histories
                  </Text>
                </div>
                <Badge variant="subtle" tone="neutral">
                  {queries.competitors.length} Active
                </Badge>
              </Group>

              <Divider />

              <CompetitorList
                competitors={queries.competitors}
                loading={queries.loading}
                onDelete={handleDelete}
                onCollect={mutations.triggerCollectionMutation}
                collectingMap={mutations.collectingMap}
                snapshotsMap={queries.snapshotsMap}
                loadSnapshots={queries.loadSnapshots}
                changesMap={queries.changesMap}
                loadChanges={queries.loadChanges}
                onInspectDiff={queries.loadChangeDiff}
                pricingMap={queries.pricingMap}
                loadPricing={queries.loadPricing}
                onDownloadReport={queries.downloadReport}
              />
            </Stack>
          </Surface>

          {/* Snapshot Diff Modal */}
          <SnapshotDiffModal
            diffData={queries.selectedDiff}
            loading={queries.diffLoading}
            onClose={queries.closeDiffModal}
          />
        </Stack>
      </main>
    </div>
  );
}
