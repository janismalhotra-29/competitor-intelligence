import React, { useEffect, useState } from 'react';
import type { ChangeDiffResult } from '@/types';
import { API_URL } from '@/lib/api';

interface Props {
  diffData: ChangeDiffResult | null;
  loading: boolean;
  onClose: () => void;
}

export function SnapshotDiffModal({ diffData, loading, onClose }: Props) {
  const [activeTab, setActiveTab] = useState<'text' | 'visual'>('text');

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!diffData && !loading) return null;

  const hasAnyScreenshot =
    Boolean(diffData?.oldSnapshot?.screenshotUrl) || Boolean(diffData?.newSnapshot?.screenshotUrl);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-4xl max-h-[90vh] flex flex-col rounded-2xl bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-900/50">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                Snapshot Diff Inspector
              </h3>
              {diffData?.aiSummary && (
                <span
                  className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                    diffData.aiSummary.significance === 'HIGH'
                      ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                      : diffData.aiSummary.significance === 'MEDIUM'
                      ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                      : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                  }`}
                >
                  {diffData.aiSummary.significance} IMPACT
                </span>
              )}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Comparing snapshots captured around{' '}
              {diffData ? new Date(diffData.detectedAt).toLocaleString() : ''}
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
            title="Close dialog"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex border-b border-gray-200 dark:border-zinc-800 px-6 bg-gray-100/50 dark:bg-zinc-800/20 text-xs font-medium">
          <button
            onClick={() => setActiveTab('text')}
            className={`py-2.5 px-4 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'text'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400 font-semibold'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            <span>📝 Text Differences</span>
          </button>
          <button
            onClick={() => setActiveTab('visual')}
            className={`py-2.5 px-4 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'visual'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400 font-semibold'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            <span>📸 Visual Screenshots</span>
            {hasAnyScreenshot && (
              <span className="w-2 h-2 rounded-full bg-blue-500 inline-block animate-pulse" />
            )}
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-3 text-gray-500">
              <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm">Calculating snapshot differences...</p>
            </div>
          ) : diffData ? (
            <>
              {/* AI Insight Box */}
              {diffData.aiSummary && (
                <div className="p-4 rounded-xl bg-blue-50/70 dark:bg-blue-950/20 border border-blue-200/60 dark:border-blue-900/40">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-sm font-semibold text-blue-900 dark:text-blue-300">
                      ✨ AI Business Summary
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 leading-relaxed italic">
                    {diffData.aiSummary.analysis}
                  </p>
                </div>
              )}

              {/* Snapshot Comparison Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-gray-50 dark:bg-zinc-800/40 border border-gray-200/70 dark:border-zinc-800">
                  <span className="font-semibold text-gray-500 uppercase tracking-wider text-[10px]">
                    Previous Snapshot (Baseline)
                  </span>
                  <div className="mt-1 font-medium text-gray-800 dark:text-gray-200 truncate">
                    {diffData.oldSnapshot?.pageTitle || 'Initial State'}
                  </div>
                  <div className="text-gray-500 dark:text-gray-400 mt-0.5">
                    {diffData.oldSnapshot
                      ? new Date(diffData.oldSnapshot.capturedAt).toLocaleString()
                      : 'No previous baseline'}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-gray-50 dark:bg-zinc-800/40 border border-gray-200/70 dark:border-zinc-800">
                  <span className="font-semibold text-gray-500 uppercase tracking-wider text-[10px]">
                    Current Snapshot (Updated)
                  </span>
                  <div className="mt-1 font-medium text-gray-800 dark:text-gray-200 truncate">
                    {diffData.newSnapshot?.pageTitle || 'Updated State'}
                  </div>
                  <div className="text-gray-500 dark:text-gray-400 mt-0.5">
                    {diffData.newSnapshot
                      ? new Date(diffData.newSnapshot.capturedAt).toLocaleString()
                      : 'N/A'}
                  </div>
                </div>
              </div>

              {/* TAB 1: Text Diff View */}
              {activeTab === 'text' && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                      Content Differences
                    </span>
                    <span className="text-xs text-gray-500">
                      {diffData.diffSummary || 'Unified view'}
                    </span>
                  </div>

                  <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-gray-900 text-gray-100 font-mono text-xs overflow-x-auto max-h-96 p-4 space-y-1">
                    {diffData.diffChunks.length === 0 ? (
                      <div className="text-gray-500 italic p-4 text-center">
                        No line differences found.
                      </div>
                    ) : (
                      diffData.diffChunks.map((chunk, index) => {
                        if (chunk.added) {
                          return (
                            <div
                              key={index}
                              className="bg-green-950/60 text-green-300 border-l-4 border-green-500 px-3 py-1.5 rounded-r my-1 whitespace-pre-wrap break-words"
                            >
                              <span className="text-green-500 font-bold select-none mr-2">+</span>
                              {chunk.value}
                            </div>
                          );
                        }
                        if (chunk.removed) {
                          return (
                            <div
                              key={index}
                              className="bg-red-950/60 text-red-300 border-l-4 border-red-500 px-3 py-1.5 rounded-r my-1 whitespace-pre-wrap break-words opacity-80"
                            >
                              <span className="text-red-500 font-bold select-none mr-2">-</span>
                              {chunk.value}
                            </div>
                          );
                        }
                        return (
                          <div
                            key={index}
                            className="text-gray-400 px-3 py-0.5 whitespace-pre-wrap break-words"
                          >
                            <span className="text-gray-600 select-none mr-2"> </span>
                            {chunk.value}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}

              {/* TAB 2: Visual Screenshot Comparison */}
              {activeTab === 'visual' && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                      Visual Side-by-Side Comparison
                    </span>
                    <span className="text-[11px] text-gray-500">
                      Desktop Viewport (1280x720)
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Baseline Screenshot */}
                    <div className="rounded-xl border border-gray-200 dark:border-zinc-800 p-3 bg-gray-50 dark:bg-zinc-800/40">
                      <div className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center justify-between">
                        <span>Baseline Visual</span>
                        <span className="text-[10px] text-gray-500 font-normal">
                          {diffData.oldSnapshot
                            ? new Date(diffData.oldSnapshot.capturedAt).toLocaleTimeString()
                            : 'N/A'}
                        </span>
                      </div>
                      {diffData.oldSnapshot?.screenshotUrl ? (
                        <div className="rounded-lg overflow-hidden border border-gray-200 dark:border-zinc-700 bg-black/10">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={`${API_URL}${diffData.oldSnapshot.screenshotUrl}`}
                            alt="Baseline Screenshot"
                            className="w-full h-auto object-cover max-h-96 rounded-lg"
                          />
                        </div>
                      ) : (
                        <div className="h-64 flex flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 dark:border-zinc-700 text-gray-400 text-xs gap-2 p-4 text-center">
                          <span>📷 No baseline visual image</span>
                          <span className="text-[10px] text-gray-500">
                            Captured before visual screenshot support or unavailable.
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Current Screenshot */}
                    <div className="rounded-xl border border-gray-200 dark:border-zinc-800 p-3 bg-gray-50 dark:bg-zinc-800/40">
                      <div className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center justify-between">
                        <span>Current Visual</span>
                        <span className="text-[10px] text-gray-500 font-normal">
                          {diffData.newSnapshot
                            ? new Date(diffData.newSnapshot.capturedAt).toLocaleTimeString()
                            : 'N/A'}
                        </span>
                      </div>
                      {diffData.newSnapshot?.screenshotUrl ? (
                        <div className="rounded-lg overflow-hidden border border-gray-200 dark:border-zinc-700 bg-black/10">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={`${API_URL}${diffData.newSnapshot.screenshotUrl}`}
                            alt="Current Screenshot"
                            className="w-full h-auto object-cover max-h-96 rounded-lg"
                          />
                        </div>
                      ) : (
                        <div className="h-64 flex flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 dark:border-zinc-700 text-gray-400 text-xs gap-2 p-4 text-center">
                          <span>📷 Visual capture pending</span>
                          <span className="text-[10px] text-gray-500">
                            Capture will appear automatically after crawl navigation.
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : null}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-gray-200 dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-900/50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-gray-800 dark:text-gray-200 text-xs font-semibold rounded-xl transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
