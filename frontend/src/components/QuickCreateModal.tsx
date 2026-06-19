import { useState, useEffect, useRef } from 'react';
import { useCreateTask } from '../hooks/useTasks';
import { useProjects } from '../hooks/useProjects';
import { usersApi } from '../api/users';
import toast from 'react-hot-toast';
import { Zap, X, Calendar, User, Flag, FolderKanban } from 'lucide-react';

interface Props {
  open: boolean;
  onClose: () => void;
  /** Pre-fill the task title (e.g. when converting a chat message into a task). */
  initialTitle?: string;
  /** Pre-select the assignee by user id. */
  initialAssignedTo?: number | null;
}

export default function QuickCreateModal({ open, onClose, initialTitle = '', initialAssignedTo = null }: Props) {
  const createTask = useCreateTask();
  const { data: projectsData } = useProjects({ per_page: 100, status: 'active' });
  const projects = projectsData?.data ?? [];
  const [users, setUsers] = useState<{ id: number; name: string }[]>([]);
  const titleRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    title: '',
    priority: 'medium',
    due_date: '',
    assigned_to: '',
    project_id: '',
  });

  useEffect(() => {
    if (open) {
      usersApi.getList().then(r => setUsers(r.data.data || [])).catch(() => {});
      setForm({
        title: initialTitle,
        priority: 'medium',
        due_date: '',
        assigned_to: initialAssignedTo ? String(initialAssignedTo) : '',
        project_id: '',
      });
      setTimeout(() => titleRef.current?.focus(), 50);
    }
  }, [open, initialTitle, initialAssignedTo]);

  // Keyboard shortcut Ctrl+N
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault();
        if (open) onClose(); else {/* parent handles open */}
      }
      if (e.key === 'Escape' && open) onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) { toast.error('اكتب عنوان المهمة'); return; }
    try {
      await createTask.mutateAsync({
        title: form.title.trim(),
        priority: form.priority as 'high' | 'medium' | 'low',
        due_date: form.due_date || null,
        assigned_to: form.assigned_to ? Number(form.assigned_to) : null,
        project_id: form.project_id ? Number(form.project_id) : null,
        status: 'todo',
      });
      toast.success('تم إنشاء المهمة ✅');
      onClose();
    } catch {
      toast.error('حدث خطأ');
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-start justify-center pt-24 px-4 bg-black/40 backdrop-blur-sm"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg animate-fade-in-up">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-primary-100 flex items-center justify-center">
              <Zap size={16} className="text-primary-600" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-sm">مهمة سريعة</h3>
              <p className="text-xs text-gray-400">Ctrl + N</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400">
            <X size={16} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Title */}
          <input
            ref={titleRef}
            value={form.title}
            onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            placeholder="عنوان المهمة..."
            className="input w-full text-base font-medium"
            maxLength={255}
          />

          {/* Second row: priority + due_date */}
          <div className="grid grid-cols-2 gap-3">
            <div className="relative">
              <Flag size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <select
                value={form.priority}
                onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}
                className="input w-full pr-8 text-sm"
              >
                <option value="high">🔴 عالية</option>
                <option value="medium">🟡 متوسطة</option>
                <option value="low">🟢 منخفضة</option>
              </select>
            </div>
            <div className="relative">
              <Calendar size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <input
                type="date"
                value={form.due_date}
                onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))}
                className="input w-full pr-8 text-sm"
              />
            </div>
          </div>

          {/* Third row: assignee + project */}
          <div className="grid grid-cols-2 gap-3">
            <div className="relative">
              <User size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <select
                value={form.assigned_to}
                onChange={e => setForm(f => ({ ...f, assigned_to: e.target.value }))}
                className="input w-full pr-8 text-sm"
              >
                <option value="">— بدون تعيين —</option>
                {users.map(u => (
                  <option key={u.id} value={u.id}>{u.name}</option>
                ))}
              </select>
            </div>
            <div className="relative">
              <FolderKanban size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <select
                value={form.project_id}
                onChange={e => setForm(f => ({ ...f, project_id: e.target.value }))}
                className="input w-full pr-8 text-sm"
              >
                <option value="">— بدون مشروع —</option>
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-1">
            <p className="text-xs text-gray-400">
              <kbd className="bg-gray-100 border rounded px-1.5 py-0.5 text-xs font-mono">Esc</kbd> للإغلاق
            </p>
            <div className="flex gap-2">
              <button type="button" onClick={onClose} className="btn-secondary text-sm">إلغاء</button>
              <button
                type="submit"
                disabled={createTask.isPending}
                className="btn-primary text-sm flex items-center gap-2"
              >
                <Zap size={14} />
                {createTask.isPending ? 'جاري...' : 'إنشاء المهمة'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
