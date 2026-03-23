import { useState, useEffect, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useProject, useUpdateProject } from '../hooks/useProjects';
import { useCreateTask, useUpdateTask, useDeleteTask } from '../hooks/useTasks';
import { projectsApi } from '../api/projects';
import { employeesApi } from '../api/employees';
import type { Employee, Task } from '../types';
import { formatDate } from '../utils';
import toast from 'react-hot-toast';
import ConfirmDialog from '../components/ConfirmDialog';
import FileDropZone from '../components/FileDropZone';
import {
  ArrowRight, Plus, X, FolderKanban, CheckSquare, FileText, Users, Upload,
  Calendar, AlertCircle, Trash2, ChevronDown, ChevronUp, CircleDot, Download,
  User, Clock, Loader2, CheckCircle2, Circle, Repeat, BarChart3,
  TrendingUp, DollarSign, Timer, Target, Eye, Image, File,
} from 'lucide-react';

// ============ Configs ============
const statusConfig: Record<string, { label: string; bg: string; dot: string; Icon: typeof Circle }> = {
  todo: { label: 'جديد', bg: 'bg-gray-100 text-gray-700', dot: 'bg-gray-400', Icon: Circle },
  in_progress: { label: 'جاري', bg: 'bg-blue-100 text-blue-700', dot: 'bg-blue-500', Icon: Loader2 },
  review: { label: 'مراجعة', bg: 'bg-purple-100 text-purple-700', dot: 'bg-purple-500', Icon: AlertCircle },
  done: { label: 'مكتمل', bg: 'bg-emerald-100 text-emerald-700', dot: 'bg-emerald-500', Icon: CheckCircle2 },
};

const priorityConfig: Record<string, { label: string; bg: string; border: string }> = {
  high: { label: 'عالية', bg: 'bg-red-50 text-red-700', border: 'border-r-red-500' },
  medium: { label: 'متوسطة', bg: 'bg-amber-50 text-amber-700', border: 'border-r-amber-400' },
  low: { label: 'منخفضة', bg: 'bg-emerald-50 text-emerald-700', border: 'border-r-emerald-500' },
};

const recurrenceLabels: Record<string, string> = {
  none: 'بدون', daily: 'يومي', weekly: 'أسبوعي', monthly: 'شهري',
};

const projectStatusConfig: Record<string, { label: string; bg: string; gradient: string }> = {
  active: { label: 'نشط', bg: 'bg-emerald-100 text-emerald-700', gradient: 'from-emerald-500 to-teal-600' },
  completed: { label: 'مكتمل', bg: 'bg-blue-100 text-blue-700', gradient: 'from-blue-500 to-indigo-600' },
  on_hold: { label: 'متوقف', bg: 'bg-amber-100 text-amber-700', gradient: 'from-amber-500 to-orange-600' },
  cancelled: { label: 'ملغي', bg: 'bg-red-100 text-red-700', gradient: 'from-red-500 to-rose-600' },
};

function formatMinutes(mins: number) {
  if (!mins) return '0 د';
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h === 0) return `${m} د`;
  if (m === 0) return `${h} س`;
  return `${h} س ${m} د`;
}

function getFileIcon(name: string) {
  const ext = name.split('.').pop()?.toLowerCase();
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext || '')) return Image;
  if (ext === 'pdf') return FileText;
  return File;
}

// ============ Stat Card ============
function StatCard({ icon: Icon, label, value, sub, color }: {
  icon: typeof Clock; label: string; value: string | number; sub?: string; color: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-md transition-all">
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center text-white shadow-lg`}>
          <Icon size={18} />
        </div>
        <span className="text-xs font-medium text-gray-500">{label}</span>
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  );
}

// ============ Progress Ring ============
function ProgressRing({ progress, size = 120 }: { progress: number; size?: number }) {
  const stroke = 8;
  const radius = (size - stroke) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} stroke="#f1f5f9" strokeWidth={stroke} fill="none" />
        <circle cx={size / 2} cy={size / 2} r={radius} stroke="url(#progressGrad)" strokeWidth={stroke} fill="none"
          strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={offset}
          className="transition-all duration-1000 ease-out" />
        <defs>
          <linearGradient id="progressGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#2C9F8F" />
            <stop offset="100%" stopColor="#0d9488" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold text-gray-900">{progress}%</span>
        <span className="text-[10px] text-gray-400">إنجاز</span>
      </div>
    </div>
  );
}

// ============ Main Component ============
export default function ProjectDetail() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { data: project, isLoading, isError, refetch } = useProject(slug || '');
  const updateProject = useUpdateProject();
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();

  const [activeTab, setActiveTab] = useState<'tasks' | 'files' | 'info'>('tasks');
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [parentTaskId, setParentTaskId] = useState<number | null>(null);
  const [expandedTasks, setExpandedTasks] = useState<Set<number>>(new Set());
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [editingStatus, setEditingStatus] = useState(false);
  const [taskFilter, setTaskFilter] = useState<string>('all');
  const [confirmDialog, setConfirmDialog] = useState<{ open: boolean; message: string; action: () => void }>({ open: false, message: '', action: () => {} });

  const [taskForm, setTaskForm] = useState({
    title: '', description: '', assigned_to: '', priority: 'medium' as string,
    due_date: '', status: 'todo', recurrence: 'none', assignee_ids: [] as string[],
  });

  useEffect(() => {
    employeesApi.getAll({ per_page: 1000 }).then(res => setEmployees(res.data.data)).catch(() => {});
  }, []);

  // Task stats
  const taskStats = useMemo(() => {
    if (!project?.tasks) return { todo: 0, in_progress: 0, review: 0, done: 0, total: 0, overdue: 0 };
    const all = project.tasks;
    const today = new Date().toISOString().split('T')[0];
    return {
      todo: all.filter(t => t.status === 'todo').length,
      in_progress: all.filter(t => t.status === 'in_progress').length,
      review: all.filter(t => t.status === 'review').length,
      done: all.filter(t => t.status === 'done').length,
      total: all.length,
      overdue: all.filter(t => t.due_date && t.due_date < today && t.status !== 'done').length,
    };
  }, [project?.tasks]);

  const mainTasks = useMemo(() => {
    if (!project?.tasks) return [];
    let tasks = project.tasks.filter(t => !t.parent_id);
    if (taskFilter !== 'all') tasks = tasks.filter(t => t.status === taskFilter);
    return tasks;
  }, [project?.tasks, taskFilter]);

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createTask.mutateAsync({
        title: taskForm.title,
        description: taskForm.description || null,
        assigned_to: taskForm.assigned_to ? (parseInt(taskForm.assigned_to) as any) : null,
        priority: taskForm.priority as any,
        due_date: taskForm.due_date || null,
        status: taskForm.status as any,
        project_id: project?.id as any,
        parent_id: parentTaskId as any,
        recurrence: taskForm.recurrence as any,
        assignee_ids: taskForm.assignee_ids.map(Number) as any,
      });
      setShowTaskModal(false);
      setParentTaskId(null);
      setTaskForm({ title: '', description: '', assigned_to: '', priority: 'medium', due_date: '', status: 'todo', recurrence: 'none', assignee_ids: [] });
      refetch();
      toast.success(parentTaskId ? 'تم إضافة المهمة الفرعية' : 'تم إضافة المهمة');
    } catch {
      toast.error('حدث خطأ');
    }
  };

  const handleStatusChange = async (taskId: number, status: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await updateTask.mutateAsync({ id: taskId, data: { status } as any });
      refetch();
    } catch {
      toast.error('حدث خطأ');
    }
  };

  const handleDeleteTask = (taskId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setConfirmDialog({
      open: true,
      message: 'هل أنت متأكد من حذف هذه المهمة؟',
      action: async () => {
        try {
          await deleteTask.mutateAsync(taskId);
          refetch();
          toast.success('تم الحذف');
        } catch {
          toast.error('حدث خطأ');
        }
        setConfirmDialog(d => ({ ...d, open: false }));
      },
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      await projectsApi.uploadFile(slug || '', file);
      refetch();
      toast.success('تم رفع الملف');
    } catch {
      toast.error('حدث خطأ في رفع الملف');
    }
    e.target.value = '';
  };

  const handleFileDrop = async (file: File) => {
    try {
      await projectsApi.uploadFile(slug || '', file);
      refetch();
      toast.success('تم رفع الملف');
    } catch {
      toast.error('حدث خطأ في رفع الملف');
    }
  };

  const handleDeleteFile = (fileId: number) => {
    setConfirmDialog({
      open: true,
      message: 'هل أنت متأكد من حذف هذا الملف؟',
      action: async () => {
        try {
          await projectsApi.deleteFile(slug || '', fileId);
          refetch();
          toast.success('تم الحذف');
        } catch {
          toast.error('حدث خطأ');
        }
        setConfirmDialog(d => ({ ...d, open: false }));
      },
    });
  };

  const handleProjectStatus = async (status: string) => {
    try {
      await updateProject.mutateAsync({ slug: slug || '', data: { status } });
      refetch();
      setEditingStatus(false);
      toast.success('تم التحديث');
    } catch {
      toast.error('حدث خطأ');
    }
  };

  const toggleExpand = (taskId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedTasks(prev => {
      const next = new Set(prev);
      if (next.has(taskId)) next.delete(taskId); else next.add(taskId);
      return next;
    });
  };

  const toggleAssignee = (userId: string) => {
    setTaskForm(f => ({
      ...f,
      assignee_ids: f.assignee_ids.includes(userId)
        ? f.assignee_ids.filter(id => id !== userId)
        : [...f.assignee_ids, userId],
    }));
  };

  // ============ Loading / Error ============
  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/3" />
        <div className="bg-white rounded-2xl p-8 border border-gray-100">
          <div className="flex gap-8">
            <div className="w-28 h-28 rounded-full bg-gray-100" />
            <div className="flex-1 space-y-3">
              <div className="h-6 bg-gray-200 rounded w-1/2" />
              <div className="h-4 bg-gray-100 rounded w-3/4" />
              <div className="h-3 bg-gray-100 rounded w-full" />
            </div>
          </div>
        </div>
        <div className="grid grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="h-28 bg-white rounded-2xl border border-gray-100" />)}
        </div>
      </div>
    );
  }

  if (isError || !project) {
    return (
      <div className="bg-white rounded-2xl p-16 border text-center">
        <AlertCircle size={48} className="text-red-200 mx-auto mb-4" />
        <h2 className="text-lg font-bold text-gray-800 mb-1">حدث خطأ</h2>
        <p className="text-gray-500 text-sm mb-4">لم نتمكن من تحميل بيانات المشروع</p>
        <button onClick={() => refetch()} className="btn-primary">إعادة المحاولة</button>
      </div>
    );
  }

  const pStatus = projectStatusConfig[project.status] || projectStatusConfig.active;
  const totalTime = (project as any).total_time || 0;
  const totalExpenses = (project as any).total_expenses || 0;

  // ============ Task Card ============
  const renderTask = (task: Task, isSubtask = false) => {
    const status = statusConfig[task.status] || statusConfig.todo;
    const priority = priorityConfig[task.priority] || priorityConfig.medium;
    const StatusIcon = status.Icon;
    const hasSubtasks = task.subtasks && task.subtasks.length > 0;
    const isExpanded = expandedTasks.has(task.id);
    const today = new Date().toISOString().split('T')[0];
    const isOverdue = task.due_date && task.due_date < today && task.status !== 'done';
    const checklistProg = task.checklist_progress;

    return (
      <div key={task.id} className={`${isSubtask ? 'mr-6 border-r-2 border-gray-100 pr-3' : ''}`}>
        <div
          onClick={() => navigate(`/tasks/${task.id}`)}
          className={`bg-white rounded-xl border cursor-pointer transition-all duration-200 group
            ${isSubtask ? 'border-gray-50 hover:border-gray-200' : 'border-gray-100 hover:border-primary-200 hover:shadow-md'}
            ${isOverdue ? 'border-red-200 bg-red-50/30' : ''}
          `}
        >
          <div className="p-4">
            <div className="flex items-start gap-3">
              {/* Priority indicator */}
              <div className={`w-1 self-stretch rounded-full flex-shrink-0 ${
                task.priority === 'high' ? 'bg-red-500' : task.priority === 'medium' ? 'bg-amber-400' : 'bg-emerald-500'
              }`} />

              {/* Expand button */}
              {hasSubtasks && (
                <button onClick={(e) => toggleExpand(task.id, e)} className="mt-0.5 p-0.5 text-gray-400 hover:text-gray-600 flex-shrink-0">
                  {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>
              )}

              {/* Status Icon */}
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${status.bg}`}>
                <StatusIcon size={14} className={task.status === 'in_progress' ? 'animate-spin' : ''} />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-gray-800 text-sm group-hover:text-primary-700 transition-colors">{task.title}</span>
                  {isOverdue && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-red-100 text-red-600 font-medium">متأخرة</span>
                  )}
                  {task.recurrence !== 'none' && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-violet-50 text-violet-600 border border-violet-200 font-medium flex items-center gap-0.5">
                      <Repeat size={8} />{recurrenceLabels[task.recurrence]}
                    </span>
                  )}
                </div>

                {/* Meta row */}
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-gray-400">
                  {task.assigned_to && (
                    <span className="flex items-center gap-1"><User size={10} />{task.assigned_to.name}</span>
                  )}
                  {task.assignees && task.assignees.length > 0 && (
                    <span className="flex items-center gap-1"><Users size={10} />{task.assignees.map(a => a.name).join(', ')}</span>
                  )}
                  {task.due_date && (
                    <span className={`flex items-center gap-1 ${isOverdue ? 'text-red-500 font-medium' : ''}`}>
                      <Calendar size={10} />{formatDate(task.due_date)}
                    </span>
                  )}
                  {hasSubtasks && (
                    <span className="flex items-center gap-1">
                      <CircleDot size={10} />{task.subtasks.filter(s => s.status === 'done').length}/{task.subtasks.length} فرعية
                    </span>
                  )}
                  {task.total_time !== undefined && task.total_time > 0 && (
                    <span className="flex items-center gap-1"><Timer size={10} />{formatMinutes(task.total_time)}</span>
                  )}
                </div>

                {/* Checklist progress */}
                {checklistProg && typeof checklistProg === 'object' && checklistProg.total > 0 && (
                  <div className="flex items-center gap-2 mt-2">
                    <CheckSquare size={11} className="text-gray-400 flex-shrink-0" />
                    <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden max-w-[160px]">
                      <div className="h-full bg-primary-500 rounded-full transition-all" style={{ width: `${(checklistProg.completed / checklistProg.total) * 100}%` }} />
                    </div>
                    <span className="text-[10px] text-gray-400">{checklistProg.completed}/{checklistProg.total}</span>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                <select value={task.status}
                  onClick={e => e.stopPropagation()}
                  onChange={e => handleStatusChange(task.id, e.target.value, e as any)}
                  className={`text-[10px] px-2 py-1 rounded-lg border font-medium cursor-pointer ${status.bg} focus:ring-1 focus:ring-primary-500/20`}>
                  <option value="todo">جديد</option>
                  <option value="in_progress">جاري</option>
                  <option value="review">مراجعة</option>
                  <option value="done">مكتمل</option>
                </select>
                {!isSubtask && (
                  <button onClick={(e) => { e.stopPropagation(); setParentTaskId(task.id); setShowTaskModal(true); }}
                    className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-all" title="إضافة مهمة فرعية">
                    <Plus size={14} />
                  </button>
                )}
                <button onClick={(e) => handleDeleteTask(task.id, e)}
                  className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          </div>
        </div>
        {/* Subtasks */}
        {hasSubtasks && isExpanded && (
          <div className="mt-1.5 space-y-1.5">
            {task.subtasks.map(sub => renderTask(sub, true))}
          </div>
        )}
      </div>
    );
  };

  // ============ RENDER ============
  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Link to="/projects" className="hover:text-primary-600 flex items-center gap-1 transition-colors">
          <ArrowRight size={14} /> المشاريع
        </Link>
        <span className="text-gray-300">/</span>
        <span className="text-gray-800 font-medium">{project.name}</span>
      </div>

      {/* ====== Project Hero Card ====== */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {/* Gradient header bar */}
        <div className={`h-2 bg-gradient-to-l ${pStatus.gradient}`} />

        <div className="p-6 md:p-8">
          <div className="flex flex-col md:flex-row items-start gap-6">
            {/* Progress Ring */}
            <div className="flex-shrink-0 mx-auto md:mx-0">
              <ProgressRing progress={project.progress} />
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0 text-center md:text-right">
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mb-2">
                <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
                {editingStatus ? (
                  <div className="flex items-center gap-1">
                    <select value={project.status} onChange={e => handleProjectStatus(e.target.value)}
                      className={`text-xs px-3 py-1.5 rounded-lg font-medium ${pStatus.bg}`}>
                      <option value="active">نشط</option>
                      <option value="completed">مكتمل</option>
                      <option value="on_hold">متوقف</option>
                      <option value="cancelled">ملغي</option>
                    </select>
                    <button onClick={() => setEditingStatus(false)} className="p-1 text-gray-400 hover:text-gray-600"><X size={14} /></button>
                  </div>
                ) : (
                  <button onClick={() => setEditingStatus(true)}
                    className={`text-xs px-3 py-1.5 rounded-lg font-medium ${pStatus.bg} cursor-pointer hover:opacity-80 transition-opacity`}>
                    {pStatus.label}
                  </button>
                )}
              </div>

              {project.description && <p className="text-sm text-gray-500 mb-3 max-w-2xl">{project.description}</p>}

              <div className="flex flex-wrap items-center justify-center md:justify-start gap-x-5 gap-y-2 text-xs text-gray-400">
                {project.client && (
                  <Link to={`/clients/${project.client.id || ''}`} className="flex items-center gap-1.5 hover:text-primary-600 transition-colors">
                    <Users size={13} /><span>العميل: <strong className="text-gray-600">{project.client.company_name || project.client.name}</strong></span>
                  </Link>
                )}
                {project.created_by && (
                  <span className="flex items-center gap-1.5"><User size={13} />أنشأه: {project.created_by.name}</span>
                )}
                {project.start_date && (
                  <span className="flex items-center gap-1.5">
                    <Calendar size={13} />
                    {formatDate(project.start_date)}{project.end_date ? ` → ${formatDate(project.end_date)}` : ''}
                  </span>
                )}
                {project.budget && user?.role !== 'employee' && (
                  <span className="flex items-center gap-1.5">
                    <DollarSign size={13} />الميزانية: {Number(project.budget).toLocaleString()} {project.currency}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ====== Stats Grid ====== */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={CheckSquare} label="إجمالي المهام" value={project.tasks_count}
          sub={`${project.completed_tasks_count} مكتملة`} color="from-primary-500 to-teal-600" />
        <StatCard icon={Target} label="المهام المتبقية" value={taskStats.total - taskStats.done}
          sub={taskStats.overdue > 0 ? `${taskStats.overdue} متأخرة` : 'لا يوجد متأخر'} color="from-blue-500 to-indigo-600" />
        <StatCard icon={Timer} label="الوقت المسجل" value={formatMinutes(totalTime)}
          sub="إجمالي ساعات العمل" color="from-violet-500 to-purple-600" />
        <StatCard icon={FileText} label="الملفات" value={project.files_count || project.files?.length || 0}
          sub="ملف مرفق" color="from-orange-500 to-amber-600" />
      </div>

      {/* ====== Task Status Distribution ====== */}
      {taskStats.total > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-700">توزيع المهام</h3>
            <span className="text-xs text-gray-400">{taskStats.total} مهمة</span>
          </div>
          <div className="flex rounded-full h-3 overflow-hidden bg-gray-100">
            {taskStats.done > 0 && (
              <div className="bg-emerald-500 transition-all duration-700" style={{ width: `${(taskStats.done / taskStats.total) * 100}%` }} title={`مكتمل: ${taskStats.done}`} />
            )}
            {taskStats.review > 0 && (
              <div className="bg-purple-500 transition-all duration-700" style={{ width: `${(taskStats.review / taskStats.total) * 100}%` }} title={`مراجعة: ${taskStats.review}`} />
            )}
            {taskStats.in_progress > 0 && (
              <div className="bg-blue-500 transition-all duration-700" style={{ width: `${(taskStats.in_progress / taskStats.total) * 100}%` }} title={`جاري: ${taskStats.in_progress}`} />
            )}
            {taskStats.todo > 0 && (
              <div className="bg-gray-300 transition-all duration-700" style={{ width: `${(taskStats.todo / taskStats.total) * 100}%` }} title={`جديد: ${taskStats.todo}`} />
            )}
          </div>
          <div className="flex flex-wrap items-center gap-4 mt-3">
            {Object.entries(statusConfig).map(([key, cfg]) => {
              const count = taskStats[key as keyof typeof taskStats] as number;
              if (!count) return null;
              return (
                <span key={key} className="flex items-center gap-1.5 text-xs text-gray-500">
                  <span className={`w-2.5 h-2.5 rounded-full ${cfg.dot}`} /> {cfg.label}: {count}
                </span>
              );
            })}
          </div>
        </div>
      )}

      {/* ====== Tabs ====== */}
      <div className="flex items-center gap-1 bg-gray-50 p-1 rounded-xl w-fit">
        {[
          { key: 'tasks' as const, label: `المهام (${project.tasks_count})`, icon: CheckSquare },
          { key: 'files' as const, label: `الملفات (${project.files?.length || 0})`, icon: FileText },
          { key: 'info' as const, label: 'المعلومات', icon: FolderKanban },
        ].map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab.key ? 'bg-white text-primary-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}>
            <tab.icon size={14} />{tab.label}
          </button>
        ))}
      </div>

      {/* ====== Tasks Tab ====== */}
      {activeTab === 'tasks' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="font-semibold text-gray-800">المهام</h2>
              {/* Filter pills */}
              <div className="flex items-center gap-1 bg-gray-50 p-0.5 rounded-lg">
                {[
                  { key: 'all', label: 'الكل' },
                  { key: 'todo', label: 'جديد' },
                  { key: 'in_progress', label: 'جاري' },
                  { key: 'review', label: 'مراجعة' },
                  { key: 'done', label: 'مكتمل' },
                ].map(f => (
                  <button key={f.key} onClick={() => setTaskFilter(f.key)}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
                      taskFilter === f.key ? 'bg-white text-primary-700 shadow-sm' : 'text-gray-400 hover:text-gray-600'
                    }`}>
                    {f.label}
                  </button>
                ))}
              </div>
            </div>
            <button onClick={() => { setParentTaskId(null); setShowTaskModal(true); }}
              className="flex items-center gap-1.5 bg-primary-600 text-white px-4 py-2 rounded-xl text-sm hover:bg-primary-700 transition-colors shadow-sm">
              <Plus size={16} /> إضافة مهمة
            </button>
          </div>

          {mainTasks.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 border border-gray-100 text-center">
              <CheckSquare size={48} className="text-gray-200 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">
                {taskFilter !== 'all' ? 'لا توجد مهام بهذه الحالة' : 'لا توجد مهام بعد'}
              </p>
              {taskFilter !== 'all' && (
                <button onClick={() => setTaskFilter('all')} className="text-primary-600 text-sm mt-2 hover:underline">عرض الكل</button>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {mainTasks.map(task => renderTask(task))}
            </div>
          )}
        </div>
      )}

      {/* ====== Files Tab ====== */}
      {activeTab === 'files' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-gray-800">الملفات ({project.files?.length || 0})</h2>
            <label className="flex items-center gap-1.5 bg-primary-600 text-white px-4 py-2 rounded-xl text-sm hover:bg-primary-700 transition-colors cursor-pointer shadow-sm">
              <Upload size={16} /> رفع ملف
              <input type="file" className="hidden" onChange={handleFileUpload} />
            </label>
          </div>
          {(!project.files || project.files.length === 0) ? (
            <FileDropZone onFileDrop={handleFileDrop}>
              <div className="bg-white rounded-2xl p-12 border-2 border-dashed border-gray-200 text-center hover:border-primary-300 transition-colors">
                <Upload size={48} className="text-gray-200 mx-auto mb-3" />
                <p className="text-gray-500 font-medium">لا توجد ملفات</p>
                <p className="text-gray-400 text-sm mt-1">اسحب الملفات هنا أو اضغط لرفع ملف</p>
              </div>
            </FileDropZone>
          ) : (
            <FileDropZone onFileDrop={handleFileDrop} className="rounded-2xl">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {project.files.map(file => {
                const FileIcon = getFileIcon(file.name);
                return (
                  <div key={file.id} className="bg-white rounded-xl border border-gray-100 p-4 hover:shadow-md transition-all group">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-primary-50 flex items-center justify-center text-primary-600 flex-shrink-0">
                        <FileIcon size={20} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate">{file.name}</p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {file.uploaded_by?.name && `${file.uploaded_by.name} · `}
                          {formatDate(file.created_at)}
                          {file.file_size > 0 && ` · ${(file.file_size / 1024).toFixed(0)} KB`}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {file.file_path && (
                          <a href={file.file_path} target="_blank" rel="noreferrer"
                            className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-all">
                            <Download size={14} />
                          </a>
                        )}
                        <button onClick={() => handleDeleteFile(file.id)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
              </div>
              <div className="mt-3 border-2 border-dashed border-gray-200 rounded-xl p-4 text-center hover:border-primary-300 transition-colors">
                <p className="text-gray-400 text-sm">اسحب ملف هنا لرفعه</p>
              </div>
            </FileDropZone>
          )}
        </div>
      )}

      {/* ====== Info Tab ====== */}
      {activeTab === 'info' && (
        <div className="bg-white rounded-2xl border border-gray-100 p-6 md:p-8">
          <h2 className="font-bold text-gray-800 text-lg mb-6">معلومات المشروع</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              { label: 'الاسم', value: project.name },
              { label: 'الحالة', value: pStatus.label, badge: pStatus.bg },
              { label: 'العميل', value: project.client?.company_name || project.client?.name || 'بدون عميل' },
              ...(user?.role !== 'employee' ? [{ label: 'الميزانية', value: project.budget ? `${Number(project.budget).toLocaleString()} ${project.currency}` : 'غير محددة' }] : []),
              { label: 'تاريخ البداية', value: project.start_date ? formatDate(project.start_date) : 'غير محدد' },
              { label: 'تاريخ النهاية', value: project.end_date ? formatDate(project.end_date) : 'غير محدد' },
              { label: 'إجمالي المهام', value: String(project.tasks_count) },
              { label: 'المهام المكتملة', value: String(project.completed_tasks_count) },
              { label: 'الوقت المسجل', value: formatMinutes(totalTime) },
              { label: 'أنشأه', value: project.created_by?.name || '-' },
            ].map((item, idx) => (
              <div key={idx} className="flex items-center gap-3 py-3 border-b border-gray-50 last:border-0">
                <span className="text-sm text-gray-400 w-28 flex-shrink-0">{item.label}</span>
                {item.badge ? (
                  <span className={`text-xs px-2.5 py-1 rounded-lg font-medium ${item.badge}`}>{item.value}</span>
                ) : (
                  <span className="text-sm font-medium text-gray-800">{item.value}</span>
                )}
              </div>
            ))}
          </div>
          {project.description && (
            <div className="mt-6 pt-6 border-t border-gray-100">
              <span className="text-sm text-gray-400 block mb-2">الوصف</span>
              <p className="text-gray-700 leading-relaxed">{project.description}</p>
            </div>
          )}
        </div>
      )}

      {/* ====== Create Task Modal ====== */}
      {showTaskModal && (
        <div className="modal-overlay">
          <div className="modal-backdrop" onClick={() => { setShowTaskModal(false); setParentTaskId(null); }} />
          <div className="modal-content">
            <div className="modal-header">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white shadow-lg">
                  <Plus size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-800">{parentTaskId ? 'مهمة فرعية' : 'مهمة جديدة'}</h2>
                  <p className="text-xs text-gray-400">داخل مشروع: {project.name}</p>
                </div>
              </div>
              <button onClick={() => { setShowTaskModal(false); setParentTaskId(null); }} className="text-gray-400 hover:text-gray-600 p-1"><X size={20} /></button>
            </div>
            <form id="create-task-detail-form" onSubmit={handleCreateTask} className="modal-body space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">العنوان *</label>
                <input type="text" value={taskForm.title} onChange={e => setTaskForm({ ...taskForm, title: e.target.value })} required
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">الوصف</label>
                <textarea value={taskForm.description} onChange={e => setTaskForm({ ...taskForm, description: e.target.value })} rows={2}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl resize-none focus:ring-2 focus:ring-primary-500/20" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">المكلف الرئيسي</label>
                  <select value={taskForm.assigned_to} onChange={e => setTaskForm({ ...taskForm, assigned_to: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-500/20">
                    <option value="">اختر</option>
                    {employees.map(emp => <option key={emp.id} value={(emp as any).user_id || emp.id}>{emp.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">التكرار</label>
                  <select value={taskForm.recurrence} onChange={e => setTaskForm({ ...taskForm, recurrence: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-500/20">
                    <option value="none">بدون تكرار</option>
                    <option value="daily">يومي</option>
                    <option value="weekly">أسبوعي</option>
                    <option value="monthly">شهري</option>
                  </select>
                </div>
              </div>
              {/* Multi-assignee */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">موظفين إضافيين (اختياري)</label>
                <div className="flex flex-wrap gap-2 p-3 border border-gray-200 rounded-xl max-h-24 overflow-y-auto">
                  {employees.map(emp => {
                    const uid = String((emp as any).user_id || emp.id);
                    const selected = taskForm.assignee_ids.includes(uid);
                    return (
                      <button key={emp.id} type="button" onClick={() => toggleAssignee(uid)}
                        className={`text-xs px-2.5 py-1 rounded-lg border transition-all ${
                          selected ? 'bg-primary-50 border-primary-200 text-primary-700' : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300'
                        }`}>
                        {emp.name}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">الأولوية</label>
                  <select value={taskForm.priority} onChange={e => setTaskForm({ ...taskForm, priority: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-500/20">
                    <option value="high">عالية</option>
                    <option value="medium">متوسطة</option>
                    <option value="low">منخفضة</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">الحالة</label>
                  <select value={taskForm.status} onChange={e => setTaskForm({ ...taskForm, status: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-500/20">
                    <option value="todo">جديد</option>
                    <option value="in_progress">جاري</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">تاريخ التسليم</label>
                  <input type="date" value={taskForm.due_date} onChange={e => setTaskForm({ ...taskForm, due_date: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-500/20" />
                </div>
              </div>
            </form>
            <div className="modal-footer">
              <button type="submit" form="create-task-detail-form" disabled={createTask.isPending}
                className="btn-primary flex-1">
                {createTask.isPending ? 'جاري...' : 'إضافة'}
              </button>
              <button type="button" onClick={() => { setShowTaskModal(false); setParentTaskId(null); }}
                className="btn-secondary">إلغاء</button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={confirmDialog.open}
        title="تأكيد الحذف"
        message={confirmDialog.message}
        confirmText="حذف"
        onConfirm={confirmDialog.action}
        onCancel={() => setConfirmDialog(d => ({ ...d, open: false }))}
      />
    </div>
  );
}
