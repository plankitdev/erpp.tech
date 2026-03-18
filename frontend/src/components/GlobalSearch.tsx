import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, Users, FolderOpen, CheckSquare, FileText, UserPlus, Briefcase, ArrowLeft } from 'lucide-react';
import { clientsApi } from '../api/clients';
import { projectsApi } from '../api/projects';
import { tasksApi } from '../api/tasks';
import { invoicesApi } from '../api/invoices';
import { employeesApi } from '../api/employees';
import { leadsApi } from '../api/leads';

interface SearchResult {
  id: string;
  label: string;
  sub?: string;
  type: string;
  icon: typeof Users;
  path: string;
  color: string;
}

const categories = [
  { key: 'clients', label: 'العملاء', icon: Users, color: 'text-blue-500', fetch: (q: string) => clientsApi.getAll({ search: q, per_page: 5 }) },
  { key: 'projects', label: 'المشاريع', icon: FolderOpen, color: 'text-emerald-500', fetch: (q: string) => projectsApi.getAll({ search: q, per_page: 5 }) },
  { key: 'tasks', label: 'المهام', icon: CheckSquare, color: 'text-violet-500', fetch: (q: string) => tasksApi.getAll({ search: q, per_page: 5 }) },
  { key: 'invoices', label: 'الفواتير', icon: FileText, color: 'text-amber-500', fetch: (q: string) => invoicesApi.getAll({ search: q, per_page: 5 }) },
  { key: 'leads', label: 'العملاء المحتملين', icon: UserPlus, color: 'text-orange-500', fetch: (q: string) => leadsApi.getAll({ search: q, per_page: 5 }) },
  { key: 'employees', label: 'الموظفين', icon: Briefcase, color: 'text-pink-500', fetch: (q: string) => employeesApi.getAll({ search: q, per_page: 5 }) },
];

const routeMap: Record<string, (item: any) => string> = {
  clients: (i) => `/clients/${i.id}`,
  projects: (i) => `/projects/${i.slug || i.id}`,
  tasks: (i) => `/tasks`,
  invoices: (i) => `/invoices/${i.id}`,
  leads: (i) => `/leads/${i.id}`,
  employees: (i) => `/employees/${i.id}`,
};

const labelMap: Record<string, (item: any) => string> = {
  clients: (i) => i.name,
  projects: (i) => i.name,
  tasks: (i) => i.title,
  invoices: (i) => `فاتورة #${i.id}`,
  leads: (i) => i.name,
  employees: (i) => i.name || i.user?.name,
};

const subMap: Record<string, (item: any) => string | undefined> = {
  clients: (i) => i.company_name || i.phone,
  projects: (i) => i.status,
  tasks: (i) => i.status,
  invoices: (i) => i.status ? `${i.amount?.toLocaleString()} - ${i.status}` : undefined,
  leads: (i) => i.stage,
  employees: (i) => i.position,
};

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function GlobalSearch({ open, onClose }: Props) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (open) {
      setQuery('');
      setResults([]);
      setSelected(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  // Keyboard shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        if (!open) {
          // Parent handles opening
        } else {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  const doSearch = useCallback(async (q: string) => {
    if (q.length < 2) { setResults([]); return; }
    setLoading(true);
    try {
      const promises = categories.map(async (cat) => {
        try {
          const resp = await cat.fetch(q);
          const items: any[] = (resp as any).data || [];
          return items.map((item: any) => ({
            id: `${cat.key}-${item.id}`,
            label: labelMap[cat.key](item),
            sub: subMap[cat.key](item),
            type: cat.label,
            icon: cat.icon,
            path: routeMap[cat.key](item),
            color: cat.color,
          }));
        } catch {
          return [];
        }
      });
      const all = (await Promise.all(promises)).flat();
      setResults(all);
      setSelected(0);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleChange = (val: string) => {
    setQuery(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doSearch(val), 300);
  };

  const handleSelect = (result: SearchResult) => {
    onClose();
    navigate(result.path);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelected(s => Math.min(s + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelected(s => Math.max(s - 1, 0));
    } else if (e.key === 'Enter' && results[selected]) {
      handleSelect(results[selected]);
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100]">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* Search Modal */}
      <div className="relative flex items-start justify-center pt-[15vh]">
        <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden animate-fade-in-up mx-4">
          {/* Search Input */}
          <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
            <Search size={20} className="text-gray-400 flex-shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={e => handleChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="ابحث عن عميل، مشروع، مهمة، فاتورة..."
              className="flex-1 outline-none text-sm text-gray-800 placeholder:text-gray-400 bg-transparent"
              autoComplete="off"
            />
            <div className="flex items-center gap-2">
              {query && (
                <button onClick={() => { setQuery(''); setResults([]); inputRef.current?.focus(); }} className="p-1 hover:bg-gray-100 rounded-lg">
                  <X size={14} className="text-gray-400" />
                </button>
              )}
              <kbd className="hidden sm:inline-flex text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded font-mono">ESC</kbd>
            </div>
          </div>

          {/* Results */}
          <div className="max-h-[50vh] overflow-y-auto">
            {loading && (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-500" />
              </div>
            )}

            {!loading && query.length >= 2 && results.length === 0 && (
              <div className="text-center py-10">
                <Search size={32} className="text-gray-200 mx-auto mb-2" />
                <p className="text-sm text-gray-400">لا توجد نتائج لـ "{query}"</p>
              </div>
            )}

            {!loading && results.length > 0 && (
              <div className="py-2">
                {results.map((result, idx) => {
                  const Icon = result.icon;
                  return (
                    <button
                      key={result.id}
                      onClick={() => handleSelect(result)}
                      className={`w-full flex items-center gap-3 px-5 py-3 text-right transition-colors ${
                        idx === selected ? 'bg-primary-50' : 'hover:bg-gray-50'
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center flex-shrink-0 ${result.color}`}>
                        <Icon size={16} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-800 truncate">{result.label}</p>
                        {result.sub && (
                          <p className="text-[11px] text-gray-400 truncate">{result.sub}</p>
                        )}
                      </div>
                      <span className="text-[10px] text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full flex-shrink-0">{result.type}</span>
                      <ArrowLeft size={12} className="text-gray-300 flex-shrink-0" />
                    </button>
                  );
                })}
              </div>
            )}

            {!loading && query.length < 2 && (
              <div className="py-6 px-5">
                <p className="text-xs text-gray-400 mb-3">بحث سريع في</p>
                <div className="flex flex-wrap gap-2">
                  {categories.map(cat => {
                    const Icon = cat.icon;
                    return (
                      <span key={cat.key} className="inline-flex items-center gap-1.5 text-xs text-gray-500 bg-gray-50 px-3 py-1.5 rounded-lg">
                        <Icon size={12} className={cat.color} />
                        {cat.label}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-5 py-2.5 border-t border-gray-100 bg-gray-50/50">
            <div className="flex items-center gap-3 text-[10px] text-gray-400">
              <span className="flex items-center gap-1"><kbd className="bg-gray-200 px-1 rounded font-mono">↑↓</kbd> تنقل</span>
              <span className="flex items-center gap-1"><kbd className="bg-gray-200 px-1 rounded font-mono">↵</kbd> فتح</span>
            </div>
            <span className="text-[10px] text-gray-300">Ctrl+K</span>
          </div>
        </div>
      </div>
    </div>
  );
}
