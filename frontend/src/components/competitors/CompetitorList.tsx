type Competitor = {
  id: string;
  url: string;
  createdAt: string;
};

interface Props {
  competitors: Competitor[];
  loading: boolean;
  onDelete: (id: string) => void;
}

export function CompetitorList({ competitors, loading, onDelete }: Props) {
  if (loading) return <div className="p-6 text-gray-500 text-center">Loading competitors...</div>;
  if (competitors.length === 0) return <div className="p-6 text-gray-500 text-center">No competitors tracked yet.</div>;

  return (
    <div className="space-y-3 p-6">
      {competitors.map((comp) => (
        <div key={comp.id} className="group flex justify-between items-center p-4 bg-white dark:bg-zinc-800/80 border border-gray-100 dark:border-zinc-700/50 rounded-xl hover:shadow-md hover:border-blue-100 dark:hover:border-blue-900/30 transition-all">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
              </svg>
            </div>
            <div>
              <a href={comp.url} target="_blank" rel="noreferrer" className="text-gray-900 dark:text-gray-100 font-medium hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                {comp.url}
              </a>
              <div className="flex items-center gap-2 mt-1">
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                  Active
                </span>
                <span className="text-xs text-gray-500">
                  Added {new Date(comp.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={() => onDelete(comp.id)}
            className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40 p-2 rounded-lg transition-all focus:opacity-100"
            title="Delete competitor"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      ))}
    </div>
  );
}
