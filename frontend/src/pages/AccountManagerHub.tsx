import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { useUpdateTask, useAddComment } from '../hooks/useTasks';
import { formatDueDate } from '../utils';
import toast from 'react-hot-toast';
import {
  AlertTriangle, CheckCircle2, Clock, Eye, FolderKanban, RefreshCw,
  TrendingUp, Users, Flame, ArrowRight, ChevronDown, ChevronUp,
  BarChart3, Target, CircleDot, Repeat2, Star, Inbox, ThumbsUp, ThumbsDown, MessageSquare, Send,
} from 'lucide-react';

// ===== Types =====
interface TeamMember {
  id: number;
  name: string;
  role: string;
  total_open: number;
  overdue: number;
  in_review: number;
  in_progress: number;
  todo: number;
}

interface ActiveProject {
  id: number;
  name: string;
  slug: string;
  client: string | null;
  status: string;
  progress: number;
  total_tasks: number;
  done_tasks: number;
  overdue_tasks: number;
  review_tasks: number;
  days_left: number | null;
  end_date: string | null;
  is_late: boolean;
}

interface TaskItem {
  id: number;
  title: string;
  priority: string;
  status: string;
  due_date: string | null;
  is_overdue?: boolean;
  assignee: { id: number; name: string } | null;
  creator?: { id: number; name: string } | null;
  project: { id: number; name: string; slug: string } | null;
}

interface RecurringTask {
  id: number;
  title: string;
  recurrence: string;
  priority: string;
  status: string;
  assignee: { id: number; name: string } | null;
}

interface OverviewData {
  stats: {
    total_active_projects: number;
    total_open_tasks: number;
    overdue_tasks: number;
    pending_review: number;
    done_today: number;
    team_members: number;
  };
  urgent_today: TaskItem[];
  active_projects: ActiveProject[];
  team_workload: TeamMember[];
  pending_review: TaskItem[];
  recurring: RecurringTask[];
}

// ===== Helper components =====
const priorityBadge = (p: string) => {
  const map: Record<string, string> = {
    high:   'bg-red-100 text-red-700 border border-red-200',
    medium: 'bg-yellow-100 text-yellow-700 border border-yellow-200',
    low:    'bg-gray-100 text-gray-600 border border-gray-200',
  };
  const label: Record<string, string> = { high: '🔴 عالية', medium: '🟡 متوسطة', low: '⚪ منخفضة' };
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${map[p] || ''}`}>
      {label[p] || p}
    </span>
  );
};

const statusBadge = (s: string) => {
  const map: Record<string, string> = {
    todo:        'bg-gray-100 text-gray-600',
    in_progress: 'bg-blue-100 text-blue-700',
    review:      'bg-purple-100 text-purple-700',
    done:        'bg-green-100 text-green-700',
  };
  const label: Record<string, string> = {
    todo: 'قيد الانتظار', in_progress: 'قيد التنفيذ', review: 'للمراجعة', done: 'مكتملة',
  };
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${map[s] || ''}`}>
      {label[s] || s}
    </span>
  );
};

const recurrenceLabel: Record<string, string> = {
  daily: 'يومي', weekly: 'أسبوعي', monthly: 'شهري',
};

function ProgressBar({ value, color = 'bg-primary-500' }: { value: number; color?: string }) {
  return (
    <div className="w-full bg-gray-100 rounded-full h-2">
      <div className={`${color} h-2 rounded-full transition-all`} style={{ width: `${Math.min(value, 100)}%` }} />
    </div>
  );
}

// ===== Member Task Drawer =====
function MemberTasksDrawer({ member, onClose }: { member: TeamMember; onClose: () => void }) {
  const { data, isLoading } = useQuery({
    queryKey: ['am-member-tasks', member.id],
    queryFn: () => api.get(`/account-manager/member/${member.id}/tasks`).then(r => r.data?.data || []),
  });

  const tasks: TaskItem[] = data || [];

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/30" onClick={onClose}>
      <div className="bg-white w-full max-w-md h-full overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="sticky top-0 bg-white border-b px-5 py-4 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-gray-900">{member.name}</h3>
            <p className="text-xs text-gray-500">{member.total_open} مهام مفتوحة</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg text-gray-500">✕</button>
        </div>
        <div className="p-4">
          {isLoading ? (
            <div className="text-center py-8 text-gray-400">جاري التحميل...</div>
          ) : tasks.length === 0 ? (
            <div className="text-center py-8 text-gray-400">لا توجد مهام مفتوحة</div>
          ) : (
            <div className="space-y-2">
              {tasks.map(t => (
                <Link
                  key={t.id}
                  to={`/tasks/${t.id}`}
                  onClick={onClose}
                  className={`block p-3 rounded-xl border hover:border-primary-300 hover:bg-primary-50/30 transition-all ${t.is_overdue ? 'border-red-200 bg-red-50/30' : 'border-gray-200'}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className={`text-sm font-medium ${t.is_overdue ? 'text-red-700' : 'text-gray-800'}`}>{t.title}</p>
                    {priorityBadge(t.priority)}
                  </div>
                  <div className="flex items-center gap-3 mt-2">
                    {statusBadge(t.status)}
                    {t.due_date && (
                      <span className={`text-xs flex items-center gap-1 ${t.is_overdue ? 'text-red-600 font-semibold' : 'text-gray-500'}`}>
                        <Clock size={11} />
                        {formatDate(t.due_date)}
                        {t.is_overdue && ' (متأخر)'}
                      </span>
                    )}
                  </div>
                  {t.project && (
                    <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                      <FolderKanban size={11} />
                      {t.project.name}
                    </p>
                  )}
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ===== Main Page =====
export default function AccountManagerHub() {
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [rejectTaskId, setRejectTaskId] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [commentTaskId, setCommentTaskId] = useState<number | null>(null);
  const [commentText, setCommentText] = useState('');
  const updateTask = useUpdateTask();
  const addComment = useAddComment();
  const qc = useQueryClient();

  const { data, isLoading, refetch, isFetching } = useQuery<OverviewData>({
    queryKey: ['account-manager-overview'],
    queryFn: () => api.get('/account-manager/overview').then(r => r.data?.data),
    refetchInterval: 60000,
  });

  const handleApprove = async (taskId: number) => {
    try {
      await updateTask.mutateAsync({ id: taskId, data: { status: 'done' } as any });
      qc.invalidateQueries({ queryKey: ['account-manager-overview'] });
      toast.success('تمت الموافقة ✅');
    } catch { toast.error('حدث خطأ'); }
  };

  const handleRejectConfirm = async () => {
    if (!rejectTaskId) return;
    try {
      await updateTask.mutateAsync({ id: rejectTaskId, data: { status: 'in_progress', rejection_reason: rejectReason || null } as any });
      qc.invalidateQueries({ queryKey: ['account-manager-overview'] });
      setRejectTaskId(null);
      setRejectReason('');
      toast.success('تم إرجاع المهمة للتعديل');
    } catch { toast.error('حدث خطأ'); }
  };

  const handleSendComment = async (taskId: number) => {
    if (!commentText.trim()) return;
    try {
      await addComment.mutateAsync({ taskId, data: { comment: commentText.trim() } });
      setCommentTaskId(null);
      setCommentText('');
      toast.success('تم إرسال التعليق ✅');
    } catch { toast.error('حدث خطأ'); }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <RefreshCw size={32} className="animate-spin text-primary-400 mx-auto mb-3" />
          <p className="text-gray-500">جاري تحميل لوحة الأكونت مانجر...</p>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { stats, urgent_today, active_projects, team_workload, pending_review, recurring } = data;

  const toggleSection = (s: string) => setExpandedSection(prev => prev === s ? null : s);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Star size={24} className="text-amber-500" />
            لوحة الأكونت مانجر
          </h1>
          <p className="text-sm text-gray-500 mt-1">نظرة شاملة على المهام والمشاريع والتيم</p>
        </div>
        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-primary-600 bg-gray-100 hover:bg-primary-50 px-3 py-2 rounded-xl transition-all border"
        >
          <RefreshCw size={15} className={isFetching ? 'animate-spin' : ''} />
          تحديث
        </button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: 'مشاريع نشطة', value: stats.total_active_projects, icon: FolderKanban, color: 'bg-blue-50 text-blue-700 border-blue-100' },
          { label: 'مهام مفتوحة', value: stats.total_open_tasks, icon: CircleDot, color: 'bg-gray-50 text-gray-700 border-gray-200' },
          { label: 'متأخرة 🔴', value: stats.overdue_tasks, icon: AlertTriangle, color: stats.overdue_tasks > 0 ? 'bg-red-50 text-red-700 border-red-100' : 'bg-gray-50 text-gray-500 border-gray-200' },
          { label: 'تنتظر مراجعة', value: stats.pending_review, icon: Eye, color: stats.pending_review > 0 ? 'bg-purple-50 text-purple-700 border-purple-100' : 'bg-gray-50 text-gray-500 border-gray-200' },
          { label: 'منجزة اليوم ✅', value: stats.done_today, icon: CheckCircle2, color: 'bg-green-50 text-green-700 border-green-100' },
          { label: 'أعضاء التيم', value: stats.team_members, icon: Users, color: 'bg-indigo-50 text-indigo-700 border-indigo-100' },
        ].map(s => (
          <div key={s.label} className={`rounded-xl border p-4 ${s.color}`}>
            <div className="flex items-center justify-between mb-1">
              <s.icon size={18} />
            </div>
            <p className="text-2xl font-bold">{s.value}</p>
            <p className="text-xs font-medium mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Two-column layout for main content */}
      <div className="grid lg:grid-cols-3 gap-6">

        {/* LEFT: Projects + Urgent + Recurring (2/3) */}
        <div className="lg:col-span-2 space-y-5">

          {/* Active Projects */}
          <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
            <button
              className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors"
              onClick={() => toggleSection('projects')}
            >
              <h2 className="font-bold text-gray-900 flex items-center gap-2">
                <FolderKanban size={18} className="text-blue-500" />
                المشاريع النشطة
                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">{active_projects.length}</span>
              </h2>
              {expandedSection === 'projects' ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>

            <div className={`transition-all ${expandedSection === 'projects' ? '' : 'max-h-72 overflow-hidden'}`}>
              {active_projects.length === 0 ? (
                <div className="text-center py-8 text-gray-400 border-t">لا توجد مشاريع نشطة</div>
              ) : (
                <div className="divide-y">
                  {active_projects.map(p => (
                    <div key={p.id} className="px-5 py-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <Link to={`/projects/${p.slug}`} className="font-semibold text-gray-900 hover:text-primary-600 truncate">
                              {p.name}
                            </Link>
                            {p.is_late && (
                              <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-medium flex-shrink-0">
                                متأخر
                              </span>
                            )}
                          </div>
                          {p.client && <p className="text-xs text-gray-400 mt-0.5">{p.client}</p>}
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-lg font-bold text-gray-900">{p.progress}%</p>
                          {p.days_left !== null && (
                            <p className={`text-xs font-medium ${p.is_late ? 'text-red-600' : p.days_left <= 3 ? 'text-amber-600' : 'text-gray-400'}`}>
                              {p.is_late ? `متأخر ${Math.abs(p.days_left)} يوم` : `${p.days_left} يوم متبقي`}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="mt-3">
                        <ProgressBar
                          value={p.progress}
                          color={p.is_late ? 'bg-red-400' : p.progress >= 75 ? 'bg-emerald-500' : p.progress >= 40 ? 'bg-blue-500' : 'bg-amber-400'}
                        />
                      </div>

                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <CheckCircle2 size={12} className="text-green-500" />
                          {p.done_tasks}/{p.total_tasks} مكتملة
                        </span>
                        {p.overdue_tasks > 0 && (
                          <span className="flex items-center gap-1 text-red-600 font-medium">
                            <AlertTriangle size={12} />
                            {p.overdue_tasks} متأخرة
                          </span>
                        )}
                        {p.review_tasks > 0 && (
                          <span className="flex items-center gap-1 text-purple-600">
                            <Eye size={12} />
                            {p.review_tasks} للمراجعة
                          </span>
                        )}
                        {p.end_date && (
                          <span className="flex items-center gap-1">
                            <Clock size={12} />
                            {formatDate(p.end_date)}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {active_projects.length > 3 && expandedSection !== 'projects' && (
              <button
                onClick={() => toggleSection('projects')}
                className="w-full py-2.5 text-sm text-primary-600 hover:bg-primary-50 border-t font-medium"
              >
                عرض الكل ({active_projects.length}) <ArrowRight size={13} className="inline" />
              </button>
            )}
          </div>

          {/* Urgent Today */}
          <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
            <div className="px-5 py-4 border-b flex items-center justify-between">
              <h2 className="font-bold text-gray-900 flex items-center gap-2">
                <Flame size={18} className="text-red-500" />
                عاجل اليوم
                {urgent_today.length > 0 && (
                  <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">{urgent_today.length}</span>
                )}
              </h2>
              <Link to="/tasks?status=todo,in_progress" className="text-xs text-primary-600 hover:underline">
                كل المهام
              </Link>
            </div>

            {urgent_today.length === 0 ? (
              <div className="py-10 text-center">
                <CheckCircle2 size={36} className="text-green-400 mx-auto mb-2" />
                <p className="text-gray-500 text-sm">ممتاز! لا توجد مهام عاجلة اليوم 🎉</p>
              </div>
            ) : (
              <div className="divide-y">
                {urgent_today.slice(0, expandedSection === 'urgent' ? undefined : 5).map(t => (
                  <Link key={t.id} to={`/tasks/${t.id}`} className="flex items-start gap-3 px-5 py-3 hover:bg-gray-50 transition-colors">
                    <div className="mt-0.5">
                      {t.is_overdue
                        ? <AlertTriangle size={15} className="text-red-500" />
                        : <CircleDot size={15} className="text-blue-400" />
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium truncate ${t.is_overdue ? 'text-red-700' : 'text-gray-800'}`}>
                        {t.title}
                      </p>
                      <div className="flex flex-wrap items-center gap-2 mt-1">
                        {priorityBadge(t.priority)}
                        {statusBadge(t.status)}
                        {t.assignee && (
                          <span className="text-xs text-gray-400 flex items-center gap-1">
                            <Users size={11} />
                            {t.assignee.name}
                          </span>
                        )}
                        {t.due_date && (
                          <span className={`text-xs flex items-center gap-1 ${t.is_overdue ? 'text-red-600 font-semibold' : 'text-gray-400'}`}>
                            <Clock size={11} />
                            {formatDate(t.due_date)}
                          </span>
                        )}
                      </div>
                      {t.project && (
                        <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                          <FolderKanban size={11} />
                          {t.project.name}
                        </p>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            )}

            {urgent_today.length > 5 && (
              <button
                onClick={() => toggleSection('urgent')}
                className="w-full py-2.5 text-sm text-primary-600 hover:bg-primary-50 border-t font-medium"
              >
                {expandedSection === 'urgent' ? 'أقل' : `عرض الكل (${urgent_today.length})`}
                <ArrowRight size={13} className="inline mr-1" />
              </button>
            )}
          </div>

          {/* Recurring Tasks */}
          {recurring.length > 0 && (
            <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
              <div className="px-5 py-4 border-b">
                <h2 className="font-bold text-gray-900 flex items-center gap-2">
                  <Repeat2 size={18} className="text-teal-500" />
                  المهام المتكررة
                  <span className="text-xs bg-teal-100 text-teal-700 px-2 py-0.5 rounded-full">{recurring.length}</span>
                </h2>
              </div>
              <div className="divide-y">
                {recurring.map(t => (
                  <Link key={t.id} to={`/tasks/${t.id}`} className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition-colors">
                    <Repeat2 size={14} className="text-teal-400 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{t.title}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs bg-teal-50 text-teal-700 px-2 py-0.5 rounded-full">
                          {recurrenceLabel[t.recurrence] || t.recurrence}
                        </span>
                        {priorityBadge(t.priority)}
                        {t.assignee && (
                          <span className="text-xs text-gray-400">{t.assignee.name}</span>
                        )}
                      </div>
                    </div>
                    {statusBadge(t.status)}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT: Team + Review (1/3) */}
        <div className="space-y-5">

          {/* Team Workload */}
          <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
            <div className="px-5 py-4 border-b flex items-center justify-between">
              <h2 className="font-bold text-gray-900 flex items-center gap-2">
                <BarChart3 size={18} className="text-indigo-500" />
                حمل التيم
              </h2>
              <Link to="/users" className="text-xs text-primary-600 hover:underline">إدارة</Link>
            </div>
            <div className="divide-y">
              {team_workload.length === 0 ? (
                <div className="py-6 text-center text-gray-400 text-sm">لا يوجد أعضاء</div>
              ) : (
                team_workload.map(m => (
                  <button
                    key={m.id}
                    onClick={() => setSelectedMember(m)}
                    className="w-full text-right px-4 py-3 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-sm font-bold flex-shrink-0">
                          {m.name.charAt(0)}
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-gray-800">{m.name}</p>
                          <p className="text-xs text-gray-400">{m.total_open} مهام مفتوحة</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {m.overdue > 0 && (
                          <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-bold">
                            {m.overdue} ⚠️
                          </span>
                        )}
                        {m.in_review > 0 && (
                          <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
                            {m.in_review} 👁️
                          </span>
                        )}
                        <ArrowRight size={14} className="text-gray-300" />
                      </div>
                    </div>
                    <div className="mt-2">
                      <ProgressBar
                        value={m.total_open > 0 ? Math.min((m.in_progress / (m.total_open || 1)) * 100, 100) : 0}
                        color="bg-blue-400"
                      />
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Pending Review */}
          <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
            <div className="px-5 py-4 border-b flex items-center justify-between">
              <h2 className="font-bold text-gray-900 flex items-center gap-2">
                <Inbox size={18} className="text-purple-500" />
                تنتظر مراجعتك
                {pending_review.length > 0 && (
                  <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">{pending_review.length}</span>
                )}
              </h2>
            </div>
            {pending_review.length === 0 ? (
              <div className="py-6 text-center text-gray-400 text-sm">
                <CheckCircle2 size={28} className="mx-auto text-green-300 mb-2" />
                لا يوجد شيء للمراجعة
              </div>
            ) : (
              <div className="divide-y max-h-96 overflow-y-auto">
                {pending_review.map(t => (
                  <div key={t.id} className="px-4 py-3 hover:bg-purple-50/40 transition-colors">
                    <Link to={`/tasks/${t.id}`} className="block">
                      <p className="text-sm font-medium text-gray-800 truncate">{t.title}</p>
                      <div className="flex items-center gap-2 mt-1">
                        {priorityBadge(t.priority)}
                        {t.assignee && (
                          <span className="text-xs text-gray-400 flex items-center gap-1">
                            <Users size={11} />
                            {t.assignee.name}
                          </span>
                        )}
                        {t.due_date && (() => { const d = formatDueDate(t.due_date); return <span className={`text-xs ${d.className}`}>{d.label}</span>; })()}
                      </div>
                      {t.project && (
                        <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                          <FolderKanban size={11} />
                          {t.project.name}
                        </p>
                      )}
                    </Link>
                    <div className="flex gap-2 mt-2">
                      <button
                        onClick={() => handleApprove(t.id)}
                        disabled={updateTask.isPending}
                        className="flex items-center gap-1 text-xs bg-green-100 text-green-700 hover:bg-green-200 px-2.5 py-1 rounded-lg font-medium transition-colors disabled:opacity-50"
                      >
                        <ThumbsUp size={11} /> قبول
                      </button>
                      <button
                        onClick={() => { setRejectTaskId(t.id); setRejectReason(''); }}
                        disabled={updateTask.isPending}
                        className="flex items-center gap-1 text-xs bg-red-100 text-red-700 hover:bg-red-200 px-2.5 py-1 rounded-lg font-medium transition-colors disabled:opacity-50"
                      >
                        <ThumbsDown size={11} /> إرجاع
                      </button>
                      <button
                        onClick={() => { setCommentTaskId(commentTaskId === t.id ? null : t.id); setCommentText(''); }}
                        className="flex items-center gap-1 text-xs bg-gray-100 text-gray-600 hover:bg-gray-200 px-2.5 py-1 rounded-lg font-medium transition-colors"
                      >
                        <MessageSquare size={11} /> تعليق
                      </button>
                    </div>
                    {/* Inline comment input */}
                    {commentTaskId === t.id && (
                      <div className="mt-2 flex gap-2">
                        <input
                          type="text"
                          value={commentText}
                          onChange={e => setCommentText(e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && handleSendComment(t.id)}
                          placeholder="اكتب تعليقك..."
                          autoFocus
                          className="flex-1 text-xs border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary-300"
                        />
                        <button
                          onClick={() => handleSendComment(t.id)}
                          disabled={addComment.isPending || !commentText.trim()}
                          className="p-1.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
                        >
                          <Send size={12} />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Workflow Guide */}
          <div className="bg-gradient-to-br from-primary-50 to-indigo-50 rounded-2xl border border-primary-100 p-5">
            <h3 className="font-bold text-primary-800 mb-3 flex items-center gap-2">
              <Target size={16} />
              Workflow المتبع
            </h3>
            <div className="space-y-2">
              {[
                { step: '1', text: 'أنشئ المشروع وحدد المستودعات', color: 'bg-blue-500' },
                { step: '2', text: 'قسّم لمهام وعيّن للتيم', color: 'bg-indigo-500' },
                { step: '3', text: 'التيم ينفّذ → In Progress', color: 'bg-violet-500' },
                { step: '4', text: 'عند الانتهاء → In Review', color: 'bg-purple-500' },
                { step: '5', text: 'تراجع وتوافق → Done ✅', color: 'bg-green-500' },
              ].map(w => (
                <div key={w.step} className="flex items-center gap-3">
                  <div className={`w-6 h-6 rounded-full ${w.color} text-white text-xs flex items-center justify-center font-bold flex-shrink-0`}>
                    {w.step}
                  </div>
                  <p className="text-xs text-gray-700">{w.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Member Tasks Drawer */}
      {selectedMember && (
        <MemberTasksDrawer
          member={selectedMember}
          onClose={() => setSelectedMember(null)}
        />
      )}

      {/* Reject Task Modal */}
      {rejectTaskId !== null && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setRejectTaskId(null)}>
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
            <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
              <ThumbsDown size={16} className="text-red-500" />
              إرجاع المهمة للتعديل
            </h3>
            <textarea
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              placeholder="سبب الإرجاع (اختياري)..."
              rows={3}
              className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-300 resize-none"
              autoFocus
            />
            <div className="flex gap-3 mt-4">
              <button
                onClick={handleRejectConfirm}
                disabled={updateTask.isPending}
                className="flex-1 bg-red-600 text-white py-2 rounded-xl text-sm font-semibold hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {updateTask.isPending ? 'جاري...' : 'إرجاع للتعديل'}
              </button>
              <button
                onClick={() => setRejectTaskId(null)}
                className="flex-1 border border-gray-200 text-gray-600 py-2 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
