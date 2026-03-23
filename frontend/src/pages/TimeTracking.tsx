import { useState, useEffect } from 'react';
import { useTimeEntries, useRunningTimer, useStartTimer, useStopTimer, useCreateTimeEntry, useDeleteTimeEntry, useTimeSummary } from '../hooks/useTimeEntries';
import { useTasks } from '../hooks/useTasks';
import { Timer, Play, Square, Plus, Trash2, Clock, BarChart3, Calendar, User, FolderKanban, X } from 'lucide-react';
import { formatDate } from '../utils';
import toast from 'react-hot-toast';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['#2c9f8f', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m} دقيقة`;
  if (m === 0) return `${h} ساعة`;
  return `${h}س ${m}د`;
}

function LiveTimer({ startedAt }: { startedAt: string }) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const start = new Date(startedAt).getTime();
    const tick = () => setElapsed(Math.floor((Date.now() - start) / 1000));
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [startedAt]);

  const h = Math.floor(elapsed / 3600);
  const m = Math.floor((elapsed % 3600) / 60);
  const s = elapsed % 60;
  const pad = (n: number) => n.toString().padStart(2, '0');

  return (
    <span className="font-mono text-2xl font-bold text-primary-600 tabular-nums">
      {pad(h)}:{pad(m)}:{pad(s)}
    </span>
  );
}

export default function TimeTracking() {
  const [dateFrom, setDateFrom] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d.toISOString().split('T')[0];
  });
  const [dateTo, setDateTo] = useState(() => new Date().toISOString().split('T')[0]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);

  const { data: entriesData, isLoading } = useTimeEntries({ date_from: dateFrom, date_to: dateTo, per_page: 50 });
  const { data: runningEntry } = useRunningTimer();
  const { data: summary } = useTimeSummary({ date_from: dateFrom, date_to: dateTo });
  const { data: tasksData } = useTasks({ per_page: 100, status: 'in_progress,todo' });

  const startTimer = useStartTimer();
  const stopTimer = useStopTimer();
  const deleteEntry = useDeleteTimeEntry();
  const createEntry = useCreateTimeEntry();

  const entries = entriesData?.data || [];
  const tasks = tasksData?.data || [];

  const totalMinutes = entries.reduce((sum, e) => sum + (e.duration_minutes || 0), 0);
  const totalHours = Math.round((totalMinutes / 60) * 10) / 10;
  const avgPerDay = (() => {
    const days = new Set(entries.map(e => e.started_at?.split('T')[0])).size;
    return days > 0 ? Math.round((totalMinutes / days / 60) * 10) / 10 : 0;
  })();

  const handleStartTimer = (taskId: number) => {
    startTimer.mutate(taskId, {
      onSuccess: () => toast.success('تم بدء المؤقت'),
      onError: () => toast.error('فشل بدء المؤقت'),
    });
  };

  const handleStopTimer = () => {
    if (!runningEntry) return;
    stopTimer.mutate(runningEntry.id, {
      onSuccess: () => toast.success('تم إيقاف المؤقت'),
      onError: () => toast.error('فشل إيقاف المؤقت'),
    });
  };

  const handleDelete = (id: number) => {
    if (!confirm('حذف هذا السجل؟')) return;
    deleteEntry.mutate(id, {
      onSuccess: () => toast.success('تم الحذف'),
    });
  };

  const handleAddManual = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const taskId = Number(form.get('task_id'));
    const date = form.get('date') as string;
    const hours = Number(form.get('hours') || 0);
    const minutes = Number(form.get('minutes') || 0);
    const description = form.get('description') as string;
    const duration = hours * 60 + minutes;

    if (!taskId || duration <= 0) {
      toast.error('يرجى اختيار مهمة وتحديد المدة');
      return;
    }

    const startedAt = `${date}T09:00:00`;
    const endedAt = new Date(new Date(startedAt).getTime() + duration * 60000).toISOString();

    createEntry.mutate(
      { task_id: taskId, started_at: startedAt, ended_at: endedAt, duration_minutes: duration, description },
      {
        onSuccess: () => {
          toast.success('تم إضافة سجل الوقت');
          setShowAddModal(false);
        },
        onError: () => toast.error('فشل الإضافة'),
      }
    );
  };

  // Chart data
  const byProject = (Array.isArray(summary) ? [] : (summary as any)?.by_project)?.map((p: { project_id: number; total: number; project?: { id: number; name: string } }) => ({
    name: p.project?.name || 'بدون مشروع',
    value: Math.round(p.total / 60 * 10) / 10,
  })) || [];

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <Timer size={28} className="text-primary-600" />
            تتبع الوقت
          </h1>
          <p className="text-sm text-gray-500 mt-1">سجّل وقتك وتابع إنتاجيتك</p>
        </div>
        <button onClick={() => setShowAddModal(true)} className="btn-primary">
          <Plus size={18} />
          إضافة يدوي
        </button>
      </div>

      {/* Running Timer */}
      {runningEntry && (
        <div className="animate-fade-in-up card card-body bg-gradient-to-l from-primary-50 to-white border-2 border-primary-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary-100 flex items-center justify-center">
                <Timer size={24} className="text-primary-600 animate-pulse" />
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">جاري التسجيل الآن</p>
                <p className="font-bold text-gray-900">{runningEntry.task?.title || 'مهمة'}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <LiveTimer startedAt={runningEntry.started_at} />
              <button
                onClick={handleStopTimer}
                disabled={stopTimer.isPending}
                className="btn-danger flex items-center gap-2"
              >
                <Square size={16} />
                إيقاف
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Start */}
      {!runningEntry && (
        <div className="animate-fade-in-up card card-body">
          <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
            <Play size={18} className="text-green-500" />
            بدء مؤقت سريع
          </h3>
          <div className="flex items-center gap-3">
            <select
              value={selectedTaskId || ''}
              onChange={(e) => setSelectedTaskId(Number(e.target.value) || null)}
              className="input flex-1"
            >
              <option value="">اختر مهمة...</option>
              {tasks.map(t => (
                <option key={t.id} value={t.id}>{t.title}</option>
              ))}
            </select>
            <button
              onClick={() => selectedTaskId && handleStartTimer(selectedTaskId)}
              disabled={!selectedTaskId || startTimer.isPending}
              className="btn-primary flex items-center gap-2"
            >
              <Play size={16} />
              ابدأ
            </button>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        {[
          { label: 'إجمالي الساعات', value: `${totalHours} ساعة`, icon: Clock, bg: 'bg-primary-500' },
          { label: 'عدد السجلات', value: entries.length, icon: BarChart3, bg: 'bg-green-500' },
          { label: 'متوسط يومي', value: `${avgPerDay} ساعة`, icon: Calendar, bg: 'bg-amber-500' },
          { label: 'المشاريع', value: byProject.length, icon: FolderKanban, bg: 'bg-violet-500' },
        ].map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div key={i} className={`animate-fade-in-up stagger-${i + 1} stat-card`}>
              <div className="flex items-start justify-between mb-3">
                <div className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center`}>
                  <Icon size={20} className="text-white" />
                </div>
              </div>
              <p className="text-xs text-gray-400 mb-1">{stat.label}</p>
              <p className="text-xl font-bold text-gray-900">{stat.value}</p>
            </div>
          );
        })}
      </div>

      {/* Filters */}
      <div className="filter-bar">
        <div className="flex items-center gap-3">
          <label className="text-sm text-gray-600">من:</label>
          <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="input w-auto" />
          <label className="text-sm text-gray-600">إلى:</label>
          <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="input w-auto" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Entries Table */}
        <div className="lg:col-span-2 card card-body">
          <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Clock size={18} className="text-primary-600" />
            سجلات الوقت
          </h3>
          {isLoading ? (
            <div className="text-center py-8 text-gray-400">جاري التحميل...</div>
          ) : entries.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <Timer size={48} className="mx-auto mb-3 opacity-30" />
              <p>لا توجد سجلات في هذه الفترة</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>المهمة</th>
                    <th>المشروع</th>
                    <th>التاريخ</th>
                    <th>المدة</th>
                    <th>الوصف</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map(entry => (
                    <tr key={entry.id}>
                      <td className="font-medium">{entry.task?.title || '-'}</td>
                      <td className="text-gray-500 text-sm">{entry.project?.name || '-'}</td>
                      <td className="text-sm">{formatDate(entry.started_at)}</td>
                      <td>
                        <span className="badge-info">{formatDuration(entry.duration_minutes)}</span>
                      </td>
                      <td className="text-sm text-gray-500 max-w-[200px] truncate">{entry.description || '-'}</td>
                      <td>
                        <button onClick={() => handleDelete(entry.id)} className="btn-ghost text-red-500 p-1">
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Chart - By Project */}
        <div className="card card-body">
          <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <FolderKanban size={18} className="text-violet-500" />
            حسب المشروع
          </h3>
          {byProject.length === 0 ? (
            <div className="text-center py-8 text-gray-400 text-sm">لا توجد بيانات</div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={220} minWidth={0} minHeight={0}>
                <PieChart>
                  <Pie data={byProject} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" paddingAngle={3}>
                    {byProject.map((_: unknown, i: number) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => `${v} ساعة`} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 mt-4">
                {byProject.map((p: { name: string; value: number }, i: number) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                      <span className="text-gray-700">{p.name}</span>
                    </div>
                    <span className="font-medium">{p.value} ساعة</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Add Manual Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content max-w-md" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold">إضافة سجل وقت يدوي</h3>
              <button onClick={() => setShowAddModal(false)} className="btn-ghost p-1">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleAddManual} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">المهمة *</label>
                <select name="task_id" className="input" required>
                  <option value="">اختر مهمة...</option>
                  {tasks.map(t => (
                    <option key={t.id} value={t.id}>{t.title}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">التاريخ *</label>
                <input type="date" name="date" defaultValue={new Date().toISOString().split('T')[0]} className="input" required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">ساعات</label>
                  <input type="number" name="hours" min="0" max="23" defaultValue="1" className="input" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">دقائق</label>
                  <input type="number" name="minutes" min="0" max="59" defaultValue="0" className="input" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">وصف</label>
                <textarea name="description" rows={2} className="input" placeholder="ماذا عملت؟" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={createEntry.isPending} className="btn-primary flex-1">
                  {createEntry.isPending ? 'جاري الحفظ...' : 'حفظ'}
                </button>
                <button type="button" onClick={() => setShowAddModal(false)} className="btn-secondary">
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
