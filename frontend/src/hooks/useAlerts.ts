import { useState, useCallback, useEffect } from 'react';
import { fetchAlerts, markAlertAsRead as apiMarkAlertAsRead, markAllAlertsAsRead as apiMarkAllAlertsAsRead } from '@/lib/api';
import type { Alert } from '@/types';

export function useAlerts() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // === QUERIES (Read-only) ===
  const loadAlerts = useCallback(async () => {
    try {
      const data = await fetchAlerts();
      setAlerts(data);
    } catch (err: unknown) {
      if (err instanceof Error) setError(err.message);
      else setError(String(err));
    } finally {
      setLoading(false);
    }
  }, []);

  // === MUTATIONS (Write-only) ===
  const markAsReadMutation = async (id: string) => {
    try {
      await apiMarkAlertAsRead(id);
      setAlerts(prev => prev.map(a => (a.id === id ? { ...a, isRead: true } : a)));
    } catch (err: unknown) {
      if (err instanceof Error) setError(err.message);
      else setError(String(err));
    }
  };

  const markAllAsReadMutation = async () => {
    try {
      await apiMarkAllAlertsAsRead();
      setAlerts(prev => prev.map(a => ({ ...a, isRead: true })));
    } catch (err: unknown) {
      if (err instanceof Error) setError(err.message);
      else setError(String(err));
    }
  };

  // Initial load and periodic polling every 20 seconds
  useEffect(() => {
    loadAlerts();
    const interval = setInterval(loadAlerts, 20000);
    return () => clearInterval(interval);
  }, [loadAlerts]);

  const unreadCount = alerts.filter(a => !a.isRead).length;

  return {
    queries: {
      alerts,
      unreadCount,
      loading,
      error,
      loadAlerts,
    },
    mutations: {
      markAsReadMutation,
      markAllAsReadMutation,
    },
    setError,
  };
}
