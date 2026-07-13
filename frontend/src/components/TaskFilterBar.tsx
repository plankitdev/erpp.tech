import { useState } from 'react';
import { Filter, Bookmark, Save, Trash2, X, Search, Rows3 } from 'lucide-react';
import toast from 'react-hot-toast';
import type { Task, Project, Epic } from '../types';
import type { GroupBy } from './KanbanBoard';
import { useSavedFilters, useCreateSavedFilter, useDeleteSavedFilter } from '../hooks/useSavedFilters';

export interface TaskFilterState {
  project: string;   // 'all' | 'none' | id
  assignee: string;  // 'all' | 'me'  | id
  priority: string;  // 'all' | high | medium | low
  epic: string;      // 'all' | 'none' | id
  search: string;
  groupBy: GroupBy;
}

export const defaultTaskFilter: TaskFilterState = {
  project: 'all',
  assignee: 'all',
  priority: 'all',
  epic: 'all',
  search: '',
  groupBy: 'none',
};

type UserLite = { id: number; name: string; role?: string };

/**
 * Pure client-side filter applied to an already-loaded task set.
 */
export function applyTaskFilters(tasks: Task[], f: TaskFilterState, meId?: number): Task[] {
  return tasks.filter(t => {
    if (f.project === 'none' && t.project_id) return false;
    if (f.project !== 'all' && f.project !== 'none' && String(t.project_id) !== f.project) return false;

    if (f.assignee === 'me') {
      const mine = t.assigned_to?.id === meId || t.assignees?.some(a => a.id === meId);
      if (!mine) return false;
    } else if (f.assignee !== 'all' && String(t.assigned_to?.id) !== f.assignee) {
      return false;
    }

    if (f.priority !== 'all' && t.priority !== f.priority) return false;

    if (f.epic === 'none' && t.epic_id) return false;
    if (f.epic !== 'all' && f.epic !== 'none' && String(t.epic_id) !== f.epic) return false;

    if (f.search.trim()) {
      const q = f.search.trim().toLowerCase();
      const hay = `${t.title} ${t.task_key ?? ''} ${t.description ?? ''}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}

interface Props {
  value: TaskFilterState;
  onChange: (v: TaskFilterState) => void;
  scope: string;
  projects?: Project[];
  epics?: Epic[];
  users?: UserLite[];
  showProject?: boolean;
  showEpic?: boolean;
  showAssignee?: boolean;
  showGroupBy?: boolean;
}

const selectClass = 'text-sm bg-transparent border-0 focus:ring-0 text-gray-700 py-0';

export default function TaskFilterBar({
  value, onChange, scope, projects = [], epics = [], users = [],
  showProject = true, showEpic = true, showAssignee = true, showGroupBy = true,
}: Props) {
  const { data: savedFilters = [] } = useSavedFilters(scope);
  const createFilter = useCreateSavedFilter();
  const deleteFilter = useDeleteSavedFilter();

  const [selectedFilterId, setSelectedFilterId] = useState<string>('');
  const [savingName, setSavingName] = useState<string | null>(null);

  const set = (patch: Partial<TaskFilterState>) => {
    onChange({ ...value, ...patch });
    setSelectedFilterId('');
  };

  const applySaved = (id: string) => {
    setSelectedFilterId(id);
    const sf = savedFilters.find(f => String(f.id) === id);
    if (sf) onChange({ ...defaultTaskFilter, ...(sf.criteria as Partial<TaskFilterState>) });
  };

  const handleSave = async () => {
    const name = (savingName || '').trim();
    if (!name) return;
    try {
      await createFilter.mutateAsync({ name, scope, criteria: value as unknown as Record<string, unknown> });
      toast.success('تم حفظ الفلتر');
      setSavingName(null);
    } catch {
      toast.error('تعذّر حفظ الفلتر');
    }
  };

  const handleDeleteSaved = async () => {
    if (!selectedFilterId) return;
    try {
      await deleteFilter.mutateAsync(Number(selectedFilterId));
      setSelectedFilterId('');
      toast.success('تم حذف الفلتر');
    } catch {
      toast.error('تعذّر حذف الفلتر');
    }
  };

  const pill = 'flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-2';

  return (
    <div className="flex flex-wrap items-center gap-2.5">
      {/* Search */}
      <div className={pill}>
        <Search size={14} className="text-gray-400" />
        <input
          value={value.search}
          onChange={e => set({ search: e.target.value })}
          placeholder="بحث..."
          className="text-sm bg-transparent border-0 focus:ring-0 text-gray-700 p-0 w-28"
        />
      </div>

      {showProject && (
        <div className={pill}>
          <Filter size={14} className="text-gray-400" />
          <select value={value.project} onChange={e => set({ project: e.target.value })} className={selectClass}>
            <option value="all">كل المشاريع</option>
            <option value="none">بدون مشروع</option>
            {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
      )}

      {showAssignee && (
        <div className={pill}>
          <select value={value.assignee} onChange={e => set({ assignee: e.target.value })} className={selectClass}>
            <option value="all">كل المكلّفين</option>
            <option value="me">مهامي فقط</option>
            {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>
        </div>
      )}

      <div className={pill}>
        <select value={value.priority} onChange={e => set({ priority: e.target.value })} className={selectClass}>
          <option value="all">كل الأولويات</option>
          <option value="high">عالية</option>
          <option value="medium">متوسطة</option>
          <option value="low">منخفضة</option>
        </select>
      </div>

      {showEpic && epics.length > 0 && (
        <div className={pill}>
          <select value={value.epic} onChange={e => set({ epic: e.target.value })} className={selectClass}>
            <option value="all">كل الملاحم</option>
            <option value="none">بدون ملحمة</option>
            {epics.map(ep => <option key={ep.id} value={ep.id}>{ep.title}</option>)}
          </select>
        </div>
      )}

      {showGroupBy && (
        <div className={`${pill} bg-gray-50`}>
          <Rows3 size={14} className="text-gray-400" />
          <select
            value={value.groupBy}
            onChange={e => onChange({ ...value, groupBy: e.target.value as GroupBy })}
            className={selectClass + ' bg-transparent'}
          >
            <option value="none">بدون تجميع</option>
            <option value="assignee">حسب المكلّف</option>
            <option value="priority">حسب الأولوية</option>
            {epics.length > 0 && <option value="epic">حسب الملحمة</option>}
            <option value="project">حسب المشروع</option>
          </select>
        </div>
      )}

      {/* Saved filters */}
      <div className={`${pill}`}>
        <Bookmark size={14} className="text-gray-400" />
        <select value={selectedFilterId} onChange={e => applySaved(e.target.value)} className={selectClass}>
          <option value="">فلتر محفوظ…</option>
          {savedFilters.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
        </select>
        {selectedFilterId && (
          <button onClick={handleDeleteSaved} className="text-gray-300 hover:text-red-500" title="حذف الفلتر">
            <Trash2 size={13} />
          </button>
        )}
      </div>

      {savingName === null ? (
        <button
          onClick={() => setSavingName('')}
          className="flex items-center gap-1.5 text-sm text-primary-600 hover:text-primary-700 px-2 py-2"
        >
          <Save size={14} /> حفظ الفلتر
        </button>
      ) : (
        <div className={pill}>
          <input
            autoFocus
            value={savingName}
            onChange={e => setSavingName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSave()}
            placeholder="اسم الفلتر"
            className="text-sm bg-transparent border-0 focus:ring-0 text-gray-700 p-0 w-24"
          />
          <button onClick={handleSave} disabled={createFilter.isPending} className="text-primary-600 hover:text-primary-700">
            <Save size={14} />
          </button>
          <button onClick={() => setSavingName(null)} className="text-gray-300 hover:text-gray-500">
            <X size={14} />
          </button>
        </div>
      )}
    </div>
  );
}
