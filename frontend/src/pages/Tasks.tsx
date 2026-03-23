import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useTasks, useCreateTask, useUpdateTask, useDeleteTask } from '../hooks/useTasks';
import { useMarkBadgeSeen } from '../hooks/useDashboard';
import { useUrlFilters } from '../hooks/useUrlFilters';
import TaskDetailDrawer from '../components/TaskDetailDrawer';
import { employeesApi } from '../api/employees';
import { clientsApi } from '../api/clients';
import type { Employee, Client, Task } from '../types';
import { formatDate } from '../utils';
import toast from 'react-hot-toast';
import {
  Plus, X, Kanban, ListFilter, Calendar, User, Clock,
  AlertCircle, CheckCircle2, Circle, Loader2, Flag, Trash2, MoreVertical,
  ClipboardList, ArrowUpDown,
} from 'lucide-react';
import ConfirmDialog from '../components/ConfirmDialog';
import SearchInput from '../components/SearchInput';
import StatusBadge from '../components/StatusBadge';

const priorityConfig: Record<string, { label: string; color: string; bg: string; icon: string }> = {
  high: { label: 'عالية', color: 'text-red-600', bg: 'bg-red-50 text-red-700 border-red-200', icon: '🔴' },
  medium: { label: 'متوسطة', color: 'text-amber-600', bg: 'bg-amber-50 text-amber-700 border-amber-200', icon: '🟡' },
  low: { label: 'منخفضة', color: 'text-emerald-600', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: '🟢' },
};

const statusConfig: Record<string, { label: string; color: string; bg: string; dotColor: string; Icon: typeof Circle }> = {
  todo: { label: 'جديد', color: 'text-gray-600', bg: 'bg-gray-100 text-gray-700', dotColor: 'bg-gray-400', Icon: Circle },
  in_progress: { label: 'جاري التنفيذ', color: 'text-blue-600', bg: 'bg-blue-100 text-blue-700', dotColor: 'bg-blue-500', Icon: Loader2 },
  review: { label: 'مراجعة', color: 'text-purple-600', bg: 'bg-purple-100 text-purple-700', dotColor: 'bg-purple-500', Icon: AlertCircle },
  done: { label: 'مكتمل', color: 'text-emerald-600', bg: 'bg-emerald-100 text-emerald-700', dotColor: 'bg-emerald-500', Icon: CheckCircle2 },
};

export default function Tasks() {
  useMarkBadgeSeen('tasks');
  const { getParam, setParam } = useUrlFilters({ statusFilter: 'all', priorityFilter: 'all' });
  const statusFilter = getParam('statusFilter') || 'all';
  const priorityFilter = getParam('priorityFilter') || 'all';
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [actionMenu, setActionMenu] = useState<number | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const params = statusFilter !== 'all' ? { status: statusFilter } : {};
  const { data, isLoading, isError, refetch } = useTasks(params);
  const createMutation = useCreateTask();
  const updateMutation = useUpdateTask();
  const deleteMutation = useDeleteTask();
  const allTasks = data?.data ?? [];

  const filteredTasks = useMemo(() => {
    let result = allTasks;
    if (priorityFilter !== 'all') {
      result = result.filter(t => t.priority === priorityFilter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(t =>
        t.title.toLowerCase().includes(q) ||
        t.description?.toLowerCase().includes(q) ||
        t.assigned_to?.name?.toLowerCase().includes(q)
      );
    }
    return result;
  }, [allTasks, priorityFilter, searchQuery]);

  const stats = useMemo(() => {
    const all = allTasks;
    return {
      total: all.length,
      todo: all.filter(t => t.status === 'todo').length,
      in_progress: all.filter(t => t.status === 'in_progress').length,
      review: all.filter(t => t.status === 'review').length,
      done: all.filter(t => t.status === 'done').length,
      overdue: all.filter(t => t.due_date && new Date(t.due_date) < new Date() && t.status !== 'done').length,
    };
  }, [allTasks]);

  const [form, setForm] = useState({
    title: '', description: '', assigned_to: '', priority: 'medium', due_date: '', client_id: '', status: 'todo',
  });

  useEffect(() => {
    Promise.all([
      employeesApi.getAll({ per_page: 1000 }).catch(() => ({ data: { data: [] } })),
      clientsApi.getAll({ per_page: 1000 }).catch(() => ({ data: { data: [] } })),
    ]).then(([empRes, clientRes]) => {
      setEmployees(empRes.data.data);
      setClients(clientRes.data.data);
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createMutation.mutateAsync({
        title: form.title,
        description: form.description || null,
        assigned_to: form.assigned_to ? (parseInt(form.assigned_to) as any) : null,
        priority: form.priority as any,
        due_date: form.due_date || null,
        client: form.client_id ? ({ id: parseInt(form.client_id) } as any) : null,
        status: form.status as any,
      });
      setShowModal(false);
      setForm({ title: '', description: '', assigned_to: '', priority: 'medium', due_date: '', client_id: '', status: 'todo' });
      toast.success('تم إضافة المهمة بنجاح');
    } catch {
      toast.error('حدث خطأ');
    }
  };

  const updateStatus = async (id: number, status: string) => {
    try {
      await updateMutation.mutateAsync({ id, data: { status } as any });
      toast.success('تم تحديث الحالة');
    } catch {
      toast.error('حدث خطأ');
    }
  };

  const handleDelete = (id: number) => {
    setDeleteId(id);
    setActionMenu(null);
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteMutation.mutateAsync(deleteId);
      toast.success('تم حذف المهمة');
    } catch {
      toast.error('حدث خطأ');
    }
    setDeleteId(null);
  };

  const isOverdue = (task: Task) => task.due_date && new Date(task.due_date) < new Date() && task.status !== 'done';

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">إدارة المهام</h1>
          <p className="page-subtitle">{stats.total} مهمة إجمالي</p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/tasks/board"
            className="btn-secondary"
          >
            <Kanban size={16} />
            عرض Kanban
          </Link>
          <button
            onClick={() => setShowModal(true)}
            className="btn-primary"
          >
            <Plus size={18} />
            مهمة جديدة
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { key: 'total', label: 'الإجمالي', value: stats.total, color: 'bg-slate-50 border-slate-200 text-slate-700' },
          { key: 'todo', label: 'جديد', value: stats.todo, color: 'bg-gray-50 border-gray-200 text-gray-700' },
          { key: 'in_progress', label: 'جاري', value: stats.in_progress, color: 'bg-blue-50 border-blue-200 text-blue-700' },
          { key: 'review', label: 'مراجعة', value: stats.review, color: 'bg-purple-50 border-purple-200 text-purple-700' },
          { key: 'done', label: 'مكتمل', value: stats.done, color: 'bg-emerald-50 border-emerald-200 text-emerald-700' },
          { key: 'overdue', label: 'متأخر', value: stats.overdue, color: 'bg-red-50 border-red-200 text-red-700' },
        ].map(stat => (
          <div key={stat.key} className={`${stat.color} border rounded-xl p-3 text-center transition-transform hover:scale-105`}>
            <p className="text-2xl font-bold">{stat.value}</p>
            <p className="text-xs font-medium mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Filters Bar */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <SearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="بحث بالعنوان أو الوصف أو المكلف..."
            className="flex-1 min-w-[160px]"
          />

          {/* Status Filter */}
          <div className="flex items-center gap-1.5 bg-gray-50 p-1 rounded-xl overflow-x-auto">
            {[
              { key: 'all', label: 'الكل' },
              { key: 'todo', label: 'جديد' },
              { key: 'in_progress', label: 'جاري' },
              { key: 'review', label: 'مراجعة' },
              { key: 'done', label: 'مكتمل' },
            ].map(s => (
              <button
                key={s.key}
                onClick={() => setParam('statusFilter', s.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                  statusFilter === s.key
                    ? 'bg-white text-primary-700 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>

          {/* Priority Filter */}
          <div className="flex items-center gap-1.5">
            <ListFilter size={14} className="text-gray-400" />
            <select
              value={priorityFilter}
              onChange={e => setParam('priorityFilter', e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-1.5 text-xs focus:ring-2 focus:ring-primary-500/20"
            >
              <option value="all">كل الأولويات</option>
              <option value="high">عالية</option>
              <option value="medium">متوسطة</option>
              <option value="low">منخفضة</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tasks List */}
      <div className="space-y-2">
        {isLoading ? (
          <div className="space-y-3">
            {[1,2,3,4,5].map(i => (
              <div key={i} className="bg-white rounded-xl p-5 border border-gray-100 animate-pulse">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-gray-200 rounded-xl" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-1/3" />
                    <div className="h-3 bg-gray-100 rounded w-1/2" />
                  </div>
                  <div className="w-20 h-7 bg-gray-200 rounded-lg" />
                </div>
              </div>
            ))}
          </div>
        ) : isError ? (
          <div className="bg-white rounded-xl p-12 border border-gray-100 text-center">
            <AlertCircle size={40} className="text-red-300 mx-auto mb-3" />
            <p className="text-gray-500 mb-3">حدث خطأ في تحميل المهام</p>
            <button onClick={() => refetch()} className="text-primary-600 hover:underline text-sm">إعادة المحاولة</button>
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="bg-white rounded-xl p-12 border border-gray-100 text-center">
            <ClipboardList size={48} className="text-gray-200 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">لا توجد مهام</p>
            <p className="text-gray-400 text-sm mt-1">اضغط "مهمة جديدة" لإضافة مهمة</p>
          </div>
        ) : (
          filteredTasks.map((task, idx) => {
            const status = statusConfig[task.status];
            const priority = priorityConfig[task.priority];
            const StatusIcon = status.Icon;
            const overdue = isOverdue(task);

            return (
              <div
                key={task.id}
                className={`bg-white rounded-xl border ${overdue ? 'border-red-200 bg-red-50/30' : 'border-gray-100'} p-4 hover:shadow-md transition-all duration-200 group animate-fade-in-up stagger-${Math.min(idx + 1, 8)}`}
              >
                <div className="flex items-center gap-2 sm:gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${status.bg} flex-shrink-0`}>
                    <StatusIcon size={18} className={task.status === 'in_progress' ? 'animate-spin' : ''} />
                  </div>

                  {/* Main Content */}
                  <div className="flex-1 min-w-0 cursor-pointer" onClick={() => setSelectedTaskId(task.id)}>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-gray-800 hover:text-primary-600 truncate transition-colors">{task.title}</h3>
                      <StatusBadge status={task.priority} size="sm" />
                      {overdue && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-100 text-red-600 border border-red-200 font-medium flex-shrink-0">
                          متأخر
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 sm:gap-4 text-xs text-gray-400 flex-wrap">
                      {task.assigned_to && (
                        <span className="flex items-center gap-1">
                          <User size={12} />
                          {task.assigned_to.name}
                        </span>
                      )}
                      {task.client && (
                        <span className="flex items-center gap-1">
                          <ClipboardList size={12} />
                          {task.client.name}
                        </span>
                      )}
                      {task.due_date && (
                        <span className={`flex items-center gap-1 ${overdue ? 'text-red-500 font-medium' : ''}`}>
                          <Calendar size={12} />
                          {formatDate(task.due_date)}
                        </span>
                      )}
                      {task.comments && task.comments.length > 0 && (
                        <span className="text-gray-400">{task.comments.length} تعليق</span>
                      )}
                    </div>
                  </div>

                  {/* Status Select */}
                  <select
                    value={task.status}
                    onChange={e => updateStatus(task.id, e.target.value)}
                    className={`text-xs px-3 py-1.5 rounded-lg border font-medium cursor-pointer ${status.bg} focus:ring-2 focus:ring-primary-500/20`}
                  >
                    <option value="todo">جديد</option>
                    <option value="in_progress">جاري</option>
                    <option value="review">مراجعة</option>
                    <option value="done">مكتمل</option>
                  </select>

                  {/* Actions */}
                  <div className="relative">
                    <button
                      onClick={() => setActionMenu(actionMenu === task.id ? null : task.id)}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all"
                    >
                      <MoreVertical size={16} />
                    </button>
                    {actionMenu === task.id && (
                      <div className="absolute left-0 top-full mt-1 w-36 bg-white rounded-xl shadow-xl border border-gray-200 z-10 animate-scale-in origin-top-left overflow-hidden">
                        <button
                          onClick={() => { setSelectedTaskId(task.id); setActionMenu(null); }}
                          className="w-full text-right px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                        >
                          عرض التفاصيل
                        </button>
                        <button
                          onClick={() => handleDelete(task.id)}
                          className="w-full text-right px-4 py-2.5 text-sm text-red-600 hover:bg-red-50"
                        >
                          <span className="flex items-center gap-2"><Trash2 size={14} /> حذف</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Task Detail Drawer */}
      {selectedTaskId && (
        <TaskDetailDrawer taskId={selectedTaskId} onClose={() => setSelectedTaskId(null)} />
      )}

      {/* Create Task Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-backdrop" onClick={() => setShowModal(false)} />
          <div className="modal-content">
            {/* Modal Header */}
            <div className="modal-header">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white">
                  <Plus size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-800">مهمة جديدة</h2>
                  <p className="text-xs text-gray-400">أضف مهمة وعينها لأحد الموظفين</p>
                </div>
              </div>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 p-1">
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <form id="create-task-form" onSubmit={handleSubmit} className="modal-body space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">عنوان المهمة *</label>
                <input
                  type="text" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
                  placeholder="مثال: تصميم صفحة العملاء"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-colors"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">الوصف</label>
                <textarea
                  value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                  placeholder="وصف تفصيلي للمهمة..."
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl resize-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-colors"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">المكلف</label>
                  <select value={form.assigned_to} onChange={e => setForm({ ...form, assigned_to: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-500/20">
                    <option value="">اختر الموظف</option>
                    {employees.map(emp => <option key={emp.id} value={(emp as any).user_id || emp.id}>{emp.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">العميل (اختياري)</label>
                  <select value={form.client_id} onChange={e => setForm({ ...form, client_id: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-500/20">
                    <option value="">بدون عميل</option>
                    {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">الأولوية</label>
                  <select value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-500/20">
                    <option value="high">🔴 عالية</option>
                    <option value="medium">🟡 متوسطة</option>
                    <option value="low">🟢 منخفضة</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">الحالة</label>
                  <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-500/20">
                    <option value="todo">جديد</option>
                    <option value="in_progress">جاري</option>
                    <option value="review">مراجعة</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">تاريخ التسليم</label>
                  <input
                    type="date" value={form.due_date} onChange={e => setForm({ ...form, due_date: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-500/20"
                  />
                </div>
              </div>

            </form>
            {/* Modal Footer */}
            <div className="modal-footer">
              <button
                type="submit"
                form="create-task-form"
                disabled={createMutation.isPending}
                className="btn-primary flex-1"
              >
                {createMutation.isPending ? 'جاري الإضافة...' : 'إضافة المهمة'}
              </button>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="btn-secondary"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={deleteId !== null}
        title="حذف المهمة"
        message="هل أنت متأكد من حذف هذه المهمة؟"
        confirmText="حذف"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}
