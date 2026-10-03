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
    <ul className="divide-y divide-gray-200 dark:divide-zinc-700">
      {competitors.map((comp) => (
        <li key={comp.id} className="p-6 flex justify-between items-center hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors">
          <div>
            <a href={comp.url} target="_blank" rel="noreferrer" className="text-blue-600 dark:text-blue-400 font-medium hover:underline">
              {comp.url}
            </a>
            <p className="text-xs text-gray-500 mt-1">Added: {new Date(comp.createdAt).toLocaleDateString()}</p>
          </div>
          <button
            onClick={() => onDelete(comp.id)}
            className="text-red-500 hover:text-red-700 text-sm font-medium px-3 py-1 border border-red-200 dark:border-red-900 hover:border-red-500 rounded transition-colors"
          >
            Delete
          </button>
        </li>
      ))}
    </ul>
  );
}
