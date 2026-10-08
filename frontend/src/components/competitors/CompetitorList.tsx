import { useEffect } from 'react';

type Competitor = {
  id: string;
  url: string;
  createdAt: string;
};

type Snapshot = {
  id: string;
  url: string;
  pageTitle: string | null;
  status: string;
  capturedAt: string;
};

type Change = {
  id: string;
  hasChanges: boolean;
  diffSummary: string | null;
  detectedAt: string;
};

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
}

export function CompetitorList({ competitors, loading, onDelete, onCollect, collectingMap, snapshotsMap, loadSnapshots, changesMap, loadChanges }: Props) {
  useEffect(() => {
    competitors.forEach(comp => {
      if (!snapshotsMap[comp.id]) {
        loadSnapshots(comp.id);
      }
      if (loadChanges && (!changesMap || !changesMap[comp.id])) {
        loadChanges(comp.id);
      }
    });
  }, [competitors, loadSnapshots, snapshotsMap, loadChanges, changesMap]);

  if (loading) return <div className="p-6 text-gray-500 text-center">Loading competitors...</div>;
  if (competitors.length === 0) return <div className="p-6 text-gray-500 text-center">No competitors tracked yet.</div>;

  return (
    <div className="space-y-4 p-6">
      {competitors.map((comp) => {
        const snapshots = snapshotsMap[comp.id] || [];
        const latestSnapshot = snapshots.length > 0 ? snapshots[0] : null;
        const changes = (changesMap && changesMap[comp.id]) || [];
        const latestChange = changes.length > 0 ? changes[0] : null;
        const isCollecting = collectingMap[comp.id];

        return (
          <div key={comp.id} className="group flex flex-col p-4 bg-white dark:bg-zinc-800/80 border border-gray-100 dark:border-zinc-700/50 rounded-xl hover:shadow-md hover:border-blue-100 dark:hover:border-blue-900/30 transition-all">
            <div className="flex justify-between items-center w-full">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                  </svg>
                </div>
                <div>
                  <a href={comp.url} target="_blank" rel="noreferrer" className="text-gray-900 dark:text-gray-100 font-medium hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                    {comp.url}
                  </a>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                      Active
                    </span>
                    <span className="text-xs text-gray-500">
                      Added {new Date(comp.createdAt).toLocaleDateString()}
                    </span>
                    {latestChange && latestChange.hasChanges && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 ml-2">
                        Changes Detected
                      </span>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onCollect(comp.id)}
                  disabled={isCollecting}
                  className="text-sm px-3 py-1.5 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 text-blue-600 dark:text-blue-400 rounded-lg transition-colors font-medium disabled:opacity-50"
                >
                  {isCollecting ? 'Collecting...' : 'Collect Snapshot'}
                </button>
                <button
                  onClick={() => onDelete(comp.id)}
                  className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40 p-2 rounded-lg transition-all focus:opacity-100"
                  title="Delete competitor"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>

            {latestSnapshot && (
              <div className="mt-4 pt-3 border-t border-gray-100 dark:border-zinc-700/50 flex flex-col gap-1 text-sm text-gray-600 dark:text-gray-400">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Latest Snapshot</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${latestSnapshot.status === 'SUCCESS' ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400' : 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400'}`}>
                    {latestSnapshot.status}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  <div><span className="text-gray-400 dark:text-gray-500">Title:</span> {latestSnapshot.pageTitle || 'N/A'}</div>
                  <div><span className="text-gray-400 dark:text-gray-500">Captured:</span> {new Date(latestSnapshot.capturedAt).toLocaleString()}</div>
                </div>
              </div>
            )}

            {latestChange && latestChange.hasChanges && (
               <div className="mt-3 p-3 bg-yellow-50 dark:bg-yellow-900/10 rounded-lg text-sm border border-yellow-100 dark:border-yellow-900/30">
                 <div className="font-semibold text-yellow-800 dark:text-yellow-500 mb-1">Difference Summary</div>
                 <div className="text-yellow-700 dark:text-yellow-400/90">{latestChange.diffSummary}</div>
               </div>
            )}
            
            {latestChange && !latestChange.hasChanges && (
               <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg text-sm border border-gray-100 dark:border-gray-700/50">
                 <div className="text-gray-500 dark:text-gray-400">No textual changes detected in the last scan.</div>
               </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
