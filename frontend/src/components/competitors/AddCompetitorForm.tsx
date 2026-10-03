import { FormEvent, useState } from 'react';

interface Props {
  onAdd: (url: string) => Promise<void>;
  adding: boolean;
}

export function AddCompetitorForm({ onAdd, adding }: Props) {
  const [url, setUrl] = useState('');

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!url) return;
    await onAdd(url);
    setUrl('');
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-4">
      <input
        type="url"
        placeholder="https://example.com"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        className="flex-1 px-4 py-2 border border-gray-300 dark:border-zinc-700 rounded-md dark:bg-zinc-900 dark:text-white outline-none focus:border-blue-500"
        required
      />
      <button
        type="submit"
        disabled={adding}
        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md font-medium disabled:opacity-50 transition-colors"
      >
        {adding ? 'Adding...' : 'Track'}
      </button>
    </form>
  );
}
