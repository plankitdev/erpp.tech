import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { tasksApi } from '../api/tasks';
import { AlertTriangle, X } from 'lucide-react';

export default function OverdueBanner() {
  const [dismissed, setDismissed] = useState(false);

  const { data } = useQuery({
    queryKey: ['tasks-overdue-count'],
    queryFn: () => tasksApi.getAll({ per_page: 1, overdue: 1 }).then(r => r.data.meta?.total ?? 0),
    refetchInterval: 5 * 60 * 1000, // every 5 min
    retry: false,
  });

  const count = typeof data === 'number' ? data : 0;

  if (dismissed || count === 0) return null;

  return (
    <div className="bg-red-600 text-white px-4 py-2.5 flex items-center justify-between gap-3 animate-fade-in-up">
      <div className="flex items-center gap-2 text-sm">
        <AlertTriangle size={16} className="flex-shrink-0" />
        <span>
          لديك <strong>{count}</strong> {count === 1 ? 'مهمة متأخرة' : 'مهام متأخرة'} تحتاج اهتمامك
        </span>
      </div>
      <div className="flex items-center gap-3 flex-shrink-0">
        <Link
          to="/tasks?statusFilter=all&priorityFilter=all"
          className="text-xs bg-white/20 hover:bg-white/30 rounded-lg px-3 py-1 font-medium transition-colors"
        >
          عرض المهام
        </Link>
        <button onClick={() => setDismissed(true)} className="text-white/70 hover:text-white transition-colors">
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
