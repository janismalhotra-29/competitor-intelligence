import { useState, useCallback } from 'react';
import { fetchCompetitors, addCompetitor as apiAddCompetitor, deleteCompetitor as apiDeleteCompetitor, triggerCollection as apiTriggerCollection, getSnapshots as apiGetSnapshots } from '@/lib/api';

export function useCompetitors() {
  const [competitors, setCompetitors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [adding, setAdding] = useState(false);
  const [collectingMap, setCollectingMap] = useState<Record<string, boolean>>({});
  const [snapshotsMap, setSnapshotsMap] = useState<Record<string, any[]>>({});

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
      await loadSnapshots(id);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setCollectingMap(prev => ({ ...prev, [id]: false }));
    }
  };

  return {
    queries: {
      competitors,
      loading,
      error,
      loadCompetitors,
      loadSnapshots,
      snapshotsMap,
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
