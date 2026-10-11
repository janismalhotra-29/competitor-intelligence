'use client';

import { useEffect } from 'react';
import { AddCompetitorForm } from '@/components/competitors/AddCompetitorForm';
import { CompetitorList } from '@/components/competitors/CompetitorList';
import { AlertsDropdown } from '@/components/alerts/AlertsDropdown';
import { useCompetitors } from '@/hooks/useCompetitors';
import { useAlerts } from '@/hooks/useAlerts';

export default function Home() {
  const { queries, mutations } = useCompetitors();
  const { loadCompetitors } = queries;
  const { queries: alertQueries, mutations: alertMutations } = useAlerts();

  useEffect(() => {
    loadCompetitors();
  }, [loadCompetitors]);

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to remove this competitor?')) return;
    await mutations.deleteCompetitorMutation(id);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-zinc-950 dark:to-zinc-900 p-8 font-sans">
      <main className="max-w-4xl mx-auto">
        
        <div className="flex items-center justify-between mb-10">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30">
              <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400">
                Competitor Intelligence
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Track and monitor your market rivals</p>
            </div>
          </div>

          <AlertsDropdown
            alerts={alertQueries.alerts}
            unreadCount={alertQueries.unreadCount}
            markAsRead={alertMutations.markAsReadMutation}
            markAllAsRead={alertMutations.markAllAsReadMutation}
          />
        </div>

        <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm p-6 rounded-2xl shadow-sm mb-8 border border-gray-200/50 dark:border-zinc-800/50">
          <h2 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">Add New Competitor</h2>
          <AddCompetitorForm submitCompetitor={mutations.addCompetitorMutation} adding={mutations.adding} />
          {queries.error && (
            <div className="mt-4 flex items-center gap-2 text-red-600 dark:text-red-400 text-sm font-medium bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              {queries.error}
            </div>
          )}
        </div>

        <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-200/50 dark:border-zinc-800/50 overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100 dark:border-zinc-800/50 flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Tracked URLs</h2>
            <span className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 text-xs font-semibold px-2.5 py-0.5 rounded-full">
              {queries.competitors.length} Total
            </span>
          </div>
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
          />
        </div>
      </main>
    </div>
  );
}
