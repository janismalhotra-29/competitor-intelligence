import { useState, useCallback, useEffect } from 'react';
import { fetchCompetitors, addCompetitor as apiAddCompetitor, deleteCompetitor as apiDeleteCompetitor, triggerCollection as apiTriggerCollection, getSnapshots as apiGetSnapshots, getChanges as apiGetChanges, fetchChangeDiff } from '@/lib/api';
import type { Competitor, Snapshot, Change, ChangeDiffResult } from '@/types';

export function useCompetitors() {
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [adding, setAdding] = useState(false);
  const [collectingMap, setCollectingMap] = useState<Record<string, boolean>>({});
  const [snapshotsMap, setSnapshotsMap] = useState<Record<string, Snapshot[]>>({});
  const [changesMap, setChangesMap] = useState<Record<string, Change[]>>({});
  const [selectedDiff, setSelectedDiff] = useState<ChangeDiffResult | null>(null);
  const [diffLoading, setDiffLoading] = useState(false);

  // === QUERIES (Read-only) ===
  const loadCompetitors = useCallback(async () => {
    try {
      const data = await fetchCompetitors();
      setCompetitors(data);
    } catch (err: unknown) {
      if (err instanceof Error) setError(err.message);
      else setError(String(err));
    } finally {
      setLoading(false);
    }
  }, []);

  const loadSnapshots = useCallback(async (id: string) => {
    try {
      const data = await apiGetSnapshots(id);
      setSnapshotsMap(prev => ({ ...prev, [id]: data }));
    } catch (err: unknown) {
      if (err instanceof Error) setError(err.message);
      else setError(String(err));
    }
  }, []);

  const loadChanges = useCallback(async (id: string) => {
    try {
      const data = await apiGetChanges(id);
      setChangesMap(prev => ({ ...prev, [id]: data }));
    } catch (err: unknown) {
      if (err instanceof Error) setError(err.message);
      else setError(String(err));
    }
  }, []);

  const loadChangeDiff = useCallback(async (competitorId: string, changeId: string) => {
    setDiffLoading(true);
    setError('');
    try {
      const data = await fetchChangeDiff(competitorId, changeId);
      setSelectedDiff(data);
    } catch (err: unknown) {
      if (err instanceof Error) setError(err.message);
      else setError(String(err));
    } finally {
      setDiffLoading(false);
    }
  }, []);

  const closeDiffModal = useCallback(() => {
    setSelectedDiff(null);
  }, []);

  // === MUTATIONS (Write-only) ===
  const addCompetitorMutation = async (url: string) => {
    setAdding(true);
    setError('');
    try {
      await apiAddCompetitor(url);
      await loadCompetitors();
    } catch (err: unknown) {
      if (err instanceof Error) setError(err.message);
      else setError(String(err));
    } finally {
      setAdding(false);
    }
  };

  const deleteCompetitorMutation = async (id: string) => {
    try {
      await apiDeleteCompetitor(id);
      await loadCompetitors();
    } catch (err: unknown) {
      if (err instanceof Error) setError(err.message);
      else setError(String(err));
    }
  };

  const triggerCollectionMutation = async (id: string) => {
    setCollectingMap(prev => ({ ...prev, [id]: true }));
    setError('');
    try {
      await apiTriggerCollection(id);
      // Wait a moment for background change detection to complete
      setTimeout(async () => {
        await loadSnapshots(id);
        await loadChanges(id);
      }, 1000);
    } catch (err: unknown) {
      if (err instanceof Error) setError(err.message);
      else setError(String(err));
    } finally {
      setCollectingMap(prev => ({ ...prev, [id]: false }));
    }
  };

  // Auto-refreshing UI via polling
  useEffect(() => {
    const intervalId = setInterval(async () => {
      // Reload competitors list
      const latestCompetitors = await fetchCompetitors().catch(() => null);
      if (latestCompetitors) {
        setCompetitors(latestCompetitors);
        
        // For each competitor we already have expanded (which we can guess if they exist in snapshotsMap or changesMap), reload their details
        // Or simply reload details for all competitors that exist in the map
        for (const comp of latestCompetitors) {
          if (snapshotsMap[comp.id] || changesMap[comp.id]) {
            apiGetSnapshots(comp.id)
              .then(data => setSnapshotsMap(prev => ({ ...prev, [comp.id]: data })))
              .catch(() => {});
            apiGetChanges(comp.id)
              .then(data => setChangesMap(prev => ({ ...prev, [comp.id]: data })))
              .catch(() => {});
          }
        }
      }
    }, 15000); // poll every 15 seconds

    return () => clearInterval(intervalId);
  }, [snapshotsMap, changesMap]); // Depend on the maps to know which competitors to refresh

  return {
    queries: {
      competitors,
      loading,
      error,
      loadCompetitors,
      loadSnapshots,
      loadChanges,
      snapshotsMap,
      changesMap,
      selectedDiff,
      diffLoading,
      loadChangeDiff,
      closeDiffModal,
    },
    mutations: {
      addCompetitorMutation,
      deleteCompetitorMutation,
      triggerCollectionMutation,
      adding,
      collectingMap,
    },
    setError,
  };
}
