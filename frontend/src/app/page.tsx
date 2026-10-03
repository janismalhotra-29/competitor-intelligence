'use client';

import { useState, useEffect } from 'react';
import { fetchCompetitors, addCompetitor, deleteCompetitor } from '@/lib/api';
import { AddCompetitorForm } from '@/components/competitors/AddCompetitorForm';
import { CompetitorList } from '@/components/competitors/CompetitorList';

export default function Home() {
  const [competitors, setCompetitors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    loadCompetitors();
  }, []);

  async function loadCompetitors() {
    try {
      const data = await fetchCompetitors();
      setCompetitors(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleAdd(url: string) {
    setAdding(true);
    setError('');
    try {
      await addCompetitor(url);
      await loadCompetitors();
    } catch (err: any) {
      setError(err.message || err.toString());
    } finally {
      setAdding(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to remove this competitor?')) return;
    try {
      await deleteCompetitor(id);
      await loadCompetitors();
    } catch (err: any) {
      setError(err.message);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-900 p-8">
      <main className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-8">
          Competitor Intelligence
        </h1>

        <div className="bg-white dark:bg-zinc-800 p-6 rounded-lg shadow-sm mb-8 border border-gray-200 dark:border-zinc-700">
          <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200">Add New Competitor</h2>
          <AddCompetitorForm onAdd={handleAdd} adding={adding} />
          {error && <p className="text-red-500 mt-4 text-sm font-medium">{error}</p>}
        </div>

        <div className="bg-white dark:bg-zinc-800 rounded-lg shadow-sm border border-gray-200 dark:border-zinc-700 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-zinc-700 bg-gray-50/50 dark:bg-zinc-800/50">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">Tracked Competitors</h2>
          </div>
          <CompetitorList 
            competitors={competitors} 
            loading={loading} 
            onDelete={handleDelete} 
          />
        </div>
      </main>
    </div>
  );
}
