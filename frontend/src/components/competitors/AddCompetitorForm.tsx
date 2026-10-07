import { FormEvent, useState } from 'react';

interface Props {
  submitCompetitor: (url: string) => Promise<void>;
  adding: boolean;
}

export function AddCompetitorForm({ submitCompetitor, adding }: Props) {
  const [url, setUrl] = useState('');

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!url) return;
    await submitCompetitor(url);
    setUrl('');
  }

  return (
    <form onSubmit={onSubmit} className="flex gap-3">
      <div className="relative flex-1">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <input
          type="url"
          placeholder="Enter competitor URL (e.g., https://stripe.com)"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="block w-full pl-11 pr-4 py-3 bg-gray-50 dark:bg-zinc-900/50 border border-gray-200 dark:border-zinc-700/50 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          required
        />
      </div>
      <button
        type="submit"
        disabled={adding}
        className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-medium shadow-sm shadow-blue-600/20 disabled:opacity-50 transition-all active:scale-95 flex items-center gap-2"
      >
        {adding ? (
          <>
            <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Adding...
          </>
        ) : (
          <>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Track
          </>
        )}
      </button>
    </form>
  );
}
