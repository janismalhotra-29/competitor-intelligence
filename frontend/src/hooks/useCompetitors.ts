import { useState, useCallback } from 'react';
import { fetchCompetitors, addCompetitor as apiAddCompetitor, deleteCompetitor as apiDeleteCompetitor } from '@/lib/api';

export function useCompetitors() {
  const [competitors, setCompetitors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [adding, setAdding] = useState(false);

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

  return {
    queries: {
      competitors,
      loading,
      error,
      loadCompetitors,
    },
    mutations: {
      addCompetitorMutation,
      deleteCompetitorMutation,
      adding,
    },
    // Expose root error setter if components need to clear it
    setError,
  };
}
