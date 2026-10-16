import { useEffect, useState } from 'react';
import type { Competitor, Snapshot, Change, PricingPlan } from '@/types';

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

  if (loading) return <div className="p-6 text-gray-500 text-center">Loading competitors...</div>;
  if (competitors.length === 0) return <div className="p-6 text-gray-500 text-center">No competitors tracked yet.</div>;

  return (
    <div className="space-y-4 p-6">
      {competitors.map((comp) => {
        const snapshots = snapshotsMap[comp.id] || [];
        const latestSnapshot = snapshots.length > 0 ? snapshots[0] : null;
        const changes = (changesMap && changesMap[comp.id]) || [];
        const latestChange = changes.length > 0 ? changes[0] : null;
        const pricingPlans = (pricingMap && pricingMap[comp.id]) || [];
        const isCollecting = collectingMap[comp.id];
        const showHistory = expandedHistory[comp.id];

        return (
          <div
            key={comp.id}
            className="group flex flex-col p-4 bg-white dark:bg-zinc-800/80 border border-gray-100 dark:border-zinc-700/50 rounded-xl hover:shadow-md hover:border-blue-100 dark:hover:border-blue-900/30 transition-all"
          >
            <div className="flex justify-between items-center w-full">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                  </svg>
                </div>
                <div>
                  <a
                    href={comp.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-gray-900 dark:text-gray-100 font-medium hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                  >
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
                  onClick={() => toggleHistory(comp.id)}
                  className="text-sm px-3 py-1.5 bg-gray-50 hover:bg-gray-100 dark:bg-zinc-700/50 dark:hover:bg-zinc-700 text-gray-600 dark:text-gray-300 rounded-lg transition-colors font-medium"
                >
                  {showHistory ? 'Hide History' : 'View History'}
                </button>
                {onDownloadReport && (
                  <button
                    onClick={() => onDownloadReport(comp.id, comp.url)}
                    className="text-sm px-3 py-1.5 bg-gray-50 hover:bg-gray-100 dark:bg-zinc-700/50 dark:hover:bg-zinc-700 text-gray-700 dark:text-gray-300 rounded-lg transition-colors font-medium flex items-center gap-1.5"
                    title="Download Executive Intelligence Report (.md)"
                  >
                    <span>📄</span> Report
                  </button>
                )}
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

            {latestSnapshot && !showHistory && (
              <div className="mt-4 pt-3 border-t border-gray-100 dark:border-zinc-700/50 flex flex-col gap-1 text-sm text-gray-600 dark:text-gray-400">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Latest Snapshot</span>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full ${
                      latestSnapshot.status === 'SUCCESS'
                        ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                        : 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400'
                    }`}
                  >
                    {latestSnapshot.status}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  <div>
                    <span className="text-gray-400 dark:text-gray-500">Title:</span> {latestSnapshot.pageTitle || 'N/A'}
                  </div>
                  <div>
                    <span className="text-gray-400 dark:text-gray-500">Captured:</span> {new Date(latestSnapshot.capturedAt).toLocaleString()}
                  </div>
                </div>
              </div>
            )}

            {/* Pricing Tiers Display */}
            {pricingPlans.length > 0 && !showHistory && (
              <div className="mt-3 p-3 bg-indigo-50/70 dark:bg-indigo-950/20 rounded-xl text-xs border border-indigo-100/80 dark:border-indigo-900/40">
                <div className="font-semibold text-indigo-900 dark:text-indigo-300 mb-2 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <span>🏷️</span> Identified Pricing & Plans
                  </span>
                  <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-medium bg-indigo-100 dark:bg-indigo-900/50 px-2 py-0.5 rounded-full">
                    {pricingPlans.length} tiers
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {pricingPlans.map((plan) => (
                    <div
                      key={plan.id}
                      className="px-2.5 py-1.5 bg-white dark:bg-zinc-800 rounded-lg border border-indigo-100 dark:border-zinc-700 shadow-xs flex items-center gap-1.5"
                    >
                      <span className="font-medium text-gray-700 dark:text-gray-200">{plan.name}:</span>
                      <span className="font-bold text-indigo-600 dark:text-indigo-400">{plan.price}</span>
                      {plan.period && <span className="text-gray-400 text-[10px]">/{plan.period}</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {latestChange && latestChange.hasChanges && !showHistory && (
              <div className="mt-3 p-3 bg-yellow-50 dark:bg-yellow-900/10 rounded-lg text-sm border border-yellow-100 dark:border-yellow-900/30">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-yellow-800 dark:text-yellow-500">Difference Summary</span>
                  {onInspectDiff && (
                    <button
                      onClick={() => onInspectDiff(comp.id, latestChange.id)}
                      className="text-xs font-semibold px-2.5 py-0.5 bg-yellow-200/80 hover:bg-yellow-300 dark:bg-yellow-900/50 dark:hover:bg-yellow-900/80 text-yellow-900 dark:text-yellow-200 rounded-md transition-colors"
                    >
                      Inspect Diff →
                    </button>
                  )}
                </div>
                <div className="text-yellow-700 dark:text-yellow-400/90">{latestChange.diffSummary}</div>

                {latestChange.aiSummary ? (
                  <div className="mt-3 pt-3 border-t border-yellow-200 dark:border-yellow-800/50">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-blue-800 dark:text-blue-400">✨ AI Analysis</span>
                      <span
                        className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${
                          latestChange.aiSummary.significance === 'HIGH'
                            ? 'bg-red-100 text-red-700'
                            : latestChange.aiSummary.significance === 'MEDIUM'
                            ? 'bg-orange-100 text-orange-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {latestChange.aiSummary.significance} IMPACT
                      </span>
                    </div>
                    <div className="text-gray-700 dark:text-gray-300 italic whitespace-pre-wrap">
                      {latestChange.aiSummary.analysis}
                    </div>
                  </div>
                ) : (
                  <div className="mt-2 text-xs text-gray-500 italic flex items-center gap-1">
                    <span className="animate-pulse">●</span> AI analyzing changes...
                  </div>
                )}
              </div>
            )}

            {latestChange && !latestChange.hasChanges && !showHistory && (
              <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg text-sm border border-gray-100 dark:border-gray-700/50">
                <div className="text-gray-500 dark:text-gray-400">No textual changes detected in the last scan.</div>
              </div>
            )}

            {showHistory && (
              <div className="mt-4 pt-4 border-t border-gray-100 dark:border-zinc-700/50">
                <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-4">Change History</h4>
                {changes.length === 0 ? (
                  <div className="text-sm text-gray-500">No history available.</div>
                ) : (
                  <div className="space-y-4 relative before:absolute before:inset-0 before:ml-2.5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-gray-200 dark:before:via-zinc-700 before:to-transparent">
                    {changes.map((change) => (
                      <div key={change.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                        <div className="flex items-center justify-center w-6 h-6 rounded-full border border-white dark:border-zinc-900 bg-gray-200 dark:bg-zinc-700 text-gray-500 dark:text-gray-400 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">
                          <div className={`w-2 h-2 rounded-full ${change.hasChanges ? 'bg-yellow-500' : 'bg-gray-400'}`}></div>
                        </div>

                        <div className="w-[calc(100%-2.5rem)] md:w-[calc(50%-1.5rem)] p-3 rounded-xl border border-gray-100 dark:border-zinc-700/50 bg-gray-50 dark:bg-zinc-800/50 shadow-sm">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                              {new Date(change.detectedAt).toLocaleString()}
                            </span>
                            {change.hasChanges ? (
                              <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-500">
                                Changes
                              </span>
                            ) : (
                              <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                                No Changes
                              </span>
                            )}
                          </div>

                          {change.hasChanges && change.diffSummary && (
                            <div className="mt-2 flex items-center justify-between gap-2">
                              <span className="text-sm text-gray-700 dark:text-gray-300">{change.diffSummary}</span>
                              {onInspectDiff && (
                                <button
                                  onClick={() => onInspectDiff(comp.id, change.id)}
                                  className="text-[11px] font-semibold px-2 py-0.5 bg-gray-200 dark:bg-zinc-700 hover:bg-gray-300 dark:hover:bg-zinc-600 text-gray-700 dark:text-gray-200 rounded transition-colors whitespace-nowrap shrink-0"
                                >
                                  Inspect Diff →
                                </button>
                              )}
                            </div>
                          )}

                          {change.aiSummary && (
                            <div className="mt-2 pt-2 border-t border-gray-200 dark:border-zinc-700/50">
                              <div className="flex items-center gap-1 mb-1">
                                <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">AI Analysis</span>
                                <span
                                  className={`text-[9px] uppercase font-bold px-1 py-0.5 rounded ${
                                    change.aiSummary.significance === 'HIGH'
                                      ? 'bg-red-100 text-red-700'
                                      : change.aiSummary.significance === 'MEDIUM'
                                      ? 'bg-orange-100 text-orange-700'
                                      : 'bg-gray-100 text-gray-700'
                                  }`}
                                >
                                  {change.aiSummary.significance}
                                </span>
                              </div>
                              <div className="text-xs text-gray-600 dark:text-gray-400 italic line-clamp-3 hover:line-clamp-none transition-all">
                                {change.aiSummary.analysis}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
