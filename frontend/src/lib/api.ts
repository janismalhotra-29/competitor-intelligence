const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export async function fetchCompetitors() {
  const res = await fetch(`${API_URL}/competitors`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch competitors');
  return res.json();
}

export async function addCompetitor(url: string) {
  const res = await fetch(`${API_URL}/competitors`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url }),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(Array.isArray(error.message) ? error.message[0] : error.message || 'Failed to add competitor');
  }
  return res.json();
}

export async function deleteCompetitor(id: string) {
  const res = await fetch(`${API_URL}/competitors/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Failed to delete competitor');
  return res.json();
}

export async function triggerCollection(id: string) {
  const res = await fetch(`${API_URL}/competitors/${id}/snapshots/collect`, {
    method: 'POST',
  });
  if (!res.ok) throw new Error('Failed to trigger collection');
  return res.json();
}

export async function getSnapshots(id: string) {
  const res = await fetch(`${API_URL}/competitors/${id}/snapshots`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch snapshots');
  return res.json();
}

export async function getChanges(id: string) {
  const res = await fetch(`${API_URL}/competitors/${id}/changes`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch changes');
  return res.json();
}

export async function fetchAlerts(unreadOnly = false) {
  const query = unreadOnly ? '?unread=true' : '';
  const res = await fetch(`${API_URL}/alerts${query}`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch alerts');
  return res.json();
}

export async function markAlertAsRead(id: string) {
  const res = await fetch(`${API_URL}/alerts/${id}/read`, {
    method: 'PATCH',
  });
  if (!res.ok) throw new Error('Failed to mark alert as read');
  return res.json();
}

export async function markAllAlertsAsRead() {
  const res = await fetch(`${API_URL}/alerts/read-all`, {
    method: 'PATCH',
  });
  if (!res.ok) throw new Error('Failed to mark all alerts as read');
  return res.json();
}

export async function fetchChangeDiff(competitorId: string, changeId: string) {
  const res = await fetch(`${API_URL}/competitors/${competitorId}/changes/${changeId}/diff`, {
    cache: 'no-store',
  });
  if (!res.ok) throw new Error('Failed to fetch change diff');
  return res.json();
}

export async function fetchPricingPlans(competitorId: string) {
  const res = await fetch(`${API_URL}/competitors/${competitorId}/pricing`, {
    cache: 'no-store',
  });
  if (!res.ok) throw new Error('Failed to fetch pricing plans');
  return res.json();
}

export async function fetchExecutiveReport(competitorId: string) {
  const res = await fetch(`${API_URL}/competitors/${competitorId}/report`, {
    cache: 'no-store',
  });
  if (!res.ok) throw new Error('Failed to fetch executive report');
  return res.json();
}



