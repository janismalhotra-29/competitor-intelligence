import { useState, useCallback, useEffect } from 'react';
import { fetchCompetitors, addCompetitor as apiAddCompetitor, deleteCompetitor as apiDeleteCompetitor, triggerCollection as apiTriggerCollection, getSnapshots as apiGetSnapshots, getChanges as apiGetChanges } from '@/lib/api';

export function useCompetitors() {
  const [competitors, setCompetitors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [adding, setAdding] = useState(false);
  const [collectingMap, setCollectingMap] = useState<Record<string, boolean>>({});
  const [snapshotsMap, setSnapshotsMap] = useState<Record<string, any[]>>({});
  const [changesMap, setChangesMap] = useState<Record<string, any[]>>({});

  // === QUERIES (Read-only) ===
  const loadCompetitors = useCallback(async () => {
    try {
      const data = await fetchCompetitors();
      setCompetitors(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadSnapshots = useCallback(async (id: string) => {
    try {
      const data = await apiGetSnapshots(id);
      setSnapshotsMap(prev => ({ ...prev, [id]: data }));
    } catch (err: any) {
      setError(err.message);
    }
  }, []);

  const loadChanges = useCallback(async (id: string) => {
    try {
      const data = await apiGetChanges(id);
      setChangesMap(prev => ({ ...prev, [id]: data }));
    } catch (err: any) {
      setError(err.message);
    }
  }, []);

  // === MUTATIONS (Write-only) ===
  const addCompetitorMutation = async (url: string) => {
    setAdding(true);
    setError('');
    try {
      await apiAddCompetitor(url);
      await loadCompetitors();
    } catch (err: any) {
      setError(err.message || err.toString());
    } finally {
      setAdding(false);
    }
  };

  const deleteCompetitorMutation = async (id: string) => {
    try {
      await apiDeleteCompetitor(id);
      await loadCompetitors();
    } catch (err: any) {
      setError(err.message);
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
    } catch (err: any) {
      setError(err.message);
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
