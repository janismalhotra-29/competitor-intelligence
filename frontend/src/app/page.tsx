'use client';

import { useEffect } from 'react';
import { Surface, Stack, Group, Heading, Text, Badge, Alert, Icon } from '@xenon-kit/web';
import { Lightning } from '@phosphor-icons/react';
import { AddCompetitorForm } from '@/components/competitors/AddCompetitorForm';
import { CompetitorList } from '@/components/competitors/CompetitorList';
import { AlertsDropdown } from '@/components/alerts/AlertsDropdown';
import { SnapshotDiffModal } from '@/components/changes/SnapshotDiffModal';
import { useCompetitors } from '@/hooks/useCompetitors';
import { useAlerts } from '@/hooks/useAlerts';

export default function Home() {
  const { queries, mutations } = useCompetitors();
  const { loadCompetitors } = queries;
  const { queries: alertQueries, mutations: alertMutations } = useAlerts();
  const { loadAlerts } = alertQueries;

  useEffect(() => {
    loadCompetitors();
    loadAlerts();
  }, [loadCompetitors, loadAlerts]);

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to remove this competitor?')) return;
    await mutations.deleteCompetitorMutation(id);
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--x-bg)', color: 'var(--x-text)', padding: 'var(--x-space-8)' }}>
      <main style={{ maxWidth: '960px', margin: '0 auto' }}>
        <Stack gap={32}>
          {/* Header */}
          <Group justify="between" align="center">
            <Group gap={16} align="center">
              <div
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: 'var(--x-radius)',
                  border: '1px solid var(--x-border)',
                  backgroundColor: 'var(--x-surface)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--x-accent)',
                }}
              >
                <Icon size="lg">
                  <Lightning weight="thin" />
                </Icon>
              </div>
              <div>
                <Heading level={1} styleKey="title2" weight={300}>
                  Competitor Intelligence
                </Heading>
                <Text styleKey="callout" tone="muted" weight={300}>
                  Track and monitor market changes, pricing, and visual updates
                </Text>
              </div>
            </Group>

            <AlertsDropdown
              alerts={alertQueries.alerts}
              unreadCount={alertQueries.unreadCount}
              markAsRead={alertMutations.markAsReadMutation}
              markAllAsRead={alertMutations.markAllAsReadMutation}
            />
          </Group>

          {/* Add Competitor Surface */}
          <Surface variant="default" padding={24}>
            <Stack gap={16}>
              <Heading level={2} styleKey="title3" weight={300}>
                Add New Competitor
              </Heading>
              <AddCompetitorForm submitCompetitor={mutations.addCompetitorMutation} adding={mutations.adding} />
              {queries.error && (
                <Alert tone="danger" variant="subtle" title="Action Failed">
                  <Text styleKey="footnote" weight={300}>
                    {queries.error}
                  </Text>
                </Alert>
              )}
            </Stack>
          </Surface>

          {/* Tracked Competitors Surface */}
          <Surface variant="default" padding={24}>
            <Stack gap={20}>
              <Group justify="between" align="center">
                <Heading level={2} styleKey="title3" weight={300}>
                  Tracked URLs
                </Heading>
                <Badge variant="subtle" tone="neutral">
                  {queries.competitors.length} Total
                </Badge>
              </Group>

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
