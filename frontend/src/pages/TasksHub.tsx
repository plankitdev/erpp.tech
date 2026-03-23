import { Link } from 'react-router-dom';
import { useDashboard } from '../hooks/useDashboard';
import { useProjects } from '../hooks/useProjects';
import { useTasks } from '../hooks/useTasks';
import { useMeetings } from '../hooks/useMeetings';
import { formatDate } from '../utils';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts';
import {
  FolderKanban, CheckSquare, Clock, Calendar, Video, ArrowUpRight,
  Plus, ListChecks, AlertTriangle, Sparkles, Target, LayoutGrid,
} from 'lucide-react';
import StatusBadge from '../components/StatusBadge';
import Breadcrumbs from '../components/Breadcrumbs';
import type { Task, Project } from '../types';

const COLORS = ['#2c9f8f', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

const TASK_STATUS_MAP: Record<string, string> = {
  todo: 'قيد الانتظار',
  in_progress: 'قيد التنفيذ',
  review: 'مراجعة',
  done: 'مكتمل',
};

const PRIORITY_COLORS: Record<string, string> = {
  high: 'text-red-600 bg-red-50',
  medium: 'text-amber-600 bg-amber-50',
  low: 'text-blue-600 bg-blue-50',
};

export default function TasksHub() {
  const { data: dashData, isLoading: dashLoading } = useDashboard();
  const { data: projectsData } = useProjects({ per_page: 1000 });
  const { data: tasksData } = useTasks({ per_page: 1000 });
  const { data: meetingsData } = useMeetings();

  const stats = (dashData || {}) as Record<string, any>;
  const projects = projectsData?.data || [];
  const tasks = tasksData?.data || [];
  const meetings = meetingsData?.data || [];

  // Task status distribution
  const tasksByStatus = [
    { name: 'قيد الانتظار', value: tasks.filter((t: Task) => t.status === 'todo').length, color: '#94a3b8' },
    { name: 'قيد التنفيذ', value: tasks.filter((t: Task) => t.status === 'in_progress').length, color: '#3b82f6' },
    { name: 'مراجعة', value: tasks.filter((t: Task) => t.status === 'review').length, color: '#f59e0b' },
    { name: 'مكتمل', value: tasks.filter((t: Task) => t.status === 'done').length, color: '#10b981' },
  ].filter(s => s.value > 0);

  // Overdue tasks
  const overdueTasks = tasks.filter((t: Task) => {
    if (t.status === 'done' || !t.due_date) return false;
    return new Date(t.due_date) < new Date();
  });

  // Upcoming meetings
  const upcomingMeetings = meetings.filter((m: any) => new Date(m.start_time) >= new Date()).slice(0, 5);

  // Active projects with progress
  const activeProjects = projects.filter((p: Project) => p.status === 'active').slice(0, 6);

  // Completion rate
  const completionRate = tasks.length > 0
    ? Math.round((tasks.filter((t: Task) => t.status === 'done').length / tasks.length) * 100)
    : 0;

  if (dashLoading) {
    return (
      <div className="page-container">
        <div className="h-32 bg-gradient-to-l from-teal-100 to-teal-50 rounded-2xl animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {[1,2,3,4].map(i => <div key={i} className="h-32 bg-white rounded-2xl animate-pulse border border-gray-100" />)}
        </div>
      </div>
    );
  }

  const statCards = [
    { label: 'إجمالي المشاريع', value: stats.total_projects || projects.length, icon: FolderKanban, bg: 'bg-indigo-500', link: '/projects' },
    { label: 'المهام النشطة', value: stats.total_tasks || tasks.length, icon: CheckSquare, bg: 'bg-blue-500', link: '/tasks' },
    { label: 'مهام متأخرة', value: stats.overdue_tasks || overdueTasks.length, icon: AlertTriangle, bg: 'bg-red-500', link: '/tasks' },
    { label: 'نسبة الإنجاز', value: `${stats.task_completion_rate || completionRate}%`, icon: Target, bg: 'bg-emerald-500' },
  ];

  return (
    <div className="page-container">
      <Breadcrumbs items={[{ label: 'إدارة المهام' }]} />

      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-l from-teal-600 via-teal-700 to-emerald-800 p-7">
        <div className="absolute top-0 left-0 w-72 h-72 bg-white/[0.04] rounded-full -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-56 h-56 bg-white/[0.03] rounded-full translate-x-1/4 translate-y-1/4" />
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Sparkles size={18} className="text-teal-300" />
              <span className="text-teal-200 text-sm font-medium">نظرة عامة</span>
            </div>
            <h1 className="text-2xl font-bold text-white mb-1">إدارة المهام والمشاريع</h1>
            <p className="text-teal-200/80 text-sm">متابعة المشاريع والمهام والاجتماعات</p>
          </div>
          <div className="hidden md:flex items-center gap-3">
            <Link to="/projects/create" className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-all border border-white/10">
              <Plus size={16} /> مشروع جديد
            </Link>
            <Link to="/tasks/board" className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-all border border-white/10">
              <LayoutGrid size={16} /> لوحة المهام
            </Link>
          </div>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {statCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <Link key={i} to={card.link || '#'} className="block">
              <div className={`stat-card group animate-fade-in-up stagger-${i + 1}`}>
                <div className="relative z-10">
                  <div className="flex items-start justify-between mb-4">
                    <div className={`w-11 h-11 rounded-xl ${card.bg} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                      <Icon size={20} className="text-white" />
                    </div>
                    <ArrowUpRight size={16} className="text-gray-300 group-hover:text-primary-500 transition-colors" />
                  </div>
                  <p className="text-[13px] text-gray-400 mb-1.5 font-medium">{card.label}</p>
                  <p className="text-[1.65rem] font-bold text-gray-900 tracking-tight">{card.value}</p>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Task Status Distribution */}
        <div className="card card-body animate-fade-in-up">
          <h3 className="text-lg font-bold text-gray-900 mb-1">توزيع المهام</h3>
          <p className="text-xs text-gray-400 mb-4">حسب الحالة</p>
          {tasksByStatus.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={200} minWidth={0} minHeight={0}>
                <PieChart>
                  <Pie data={tasksByStatus} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={4} dataKey="value" stroke="none">
                    {tasksByStatus.map((entry, idx) => <Cell key={idx} fill={entry.color} />)}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px', direction: 'rtl' }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 mt-2">
                {tasksByStatus.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-gray-600 text-[13px]">{item.name}</span>
                    </div>
                    <span className="font-semibold text-gray-800">{item.value}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-10 text-gray-400 text-sm">لا توجد مهام</div>
          )}
        </div>

        {/* Active Projects Progress */}
        <div className="card card-body lg:col-span-2 animate-fade-in-up">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-1">تقدم المشاريع</h3>
              <p className="text-xs text-gray-400">المشاريع النشطة</p>
            </div>
            <Link to="/projects" className="text-xs text-primary-600 hover:text-primary-700 font-medium">عرض الكل</Link>
          </div>
          {activeProjects.length === 0 ? (
            <div className="text-center py-10 text-gray-400 text-sm">لا توجد مشاريع نشطة</div>
          ) : (
            <div className="space-y-4">
              {activeProjects.map((p: Project) => {
                const progress = p.tasks_count && p.tasks_count > 0
                  ? Math.round((p.completed_tasks_count || 0) / p.tasks_count * 100)
                  : 0;
                return (
                  <Link key={p.id} to={`/projects/${p.id}`} className="block group">
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <FolderKanban size={14} className="text-gray-400 group-hover:text-primary-500 transition-colors" />
                        <span className="text-sm font-semibold text-gray-800">{p.name}</span>
                      </div>
                      <span className="text-xs font-bold text-gray-500">{progress}%</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div
                        className="h-2 rounded-full transition-all duration-500"
                        style={{
                          width: `${progress}%`,
                          backgroundColor: progress === 100 ? '#10b981' : progress >= 50 ? '#3b82f6' : '#f59e0b',
                        }}
                      />
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-[11px] text-gray-400">
                      <span>{p.completed_tasks_count || 0}/{p.tasks_count || 0} مهمة</span>
                      {p.client && <span>• {p.client.name}</span>}
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Overdue Tasks */}
        <div className="card overflow-hidden animate-fade-in-up">
          <div className="flex items-center justify-between p-6 pb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center ring-1 ring-red-100">
                <AlertTriangle size={18} className="text-red-600" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900">مهام متأخرة</h3>
                <p className="text-[11px] text-gray-400 mt-0.5">تحتاج إلى اهتمام</p>
              </div>
            </div>
            <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full font-bold">{overdueTasks.length}</span>
          </div>
          <div className="px-6 pb-5">
            {overdueTasks.length === 0 ? (
              <div className="text-center py-8">
                <CheckSquare size={36} className="text-emerald-300 mx-auto mb-2" />
                <p className="text-sm text-gray-400">لا توجد مهام متأخرة</p>
              </div>
            ) : (
              <div className="space-y-1">
                {overdueTasks.slice(0, 5).map((t: Task) => (
                  <Link key={t.id} to={`/tasks/${t.id}/edit`}
                    className="flex items-center justify-between p-3 rounded-xl hover:bg-red-50 transition-colors group">
                    <div className="flex items-center gap-3">
                      <div className={`text-xs px-2 py-0.5 rounded-full font-semibold ${PRIORITY_COLORS[t.priority] || 'text-gray-600 bg-gray-50'}`}>
                        {t.priority === 'high' ? 'عالي' : t.priority === 'medium' ? 'متوسط' : 'منخفض'}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-800">{t.title}</p>
                        <p className="text-[11px] text-gray-400 mt-0.5">{t.project?.name}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-red-500 text-[11px]">
                      <Clock size={10} />
                      <span>{formatDate(t.due_date!)}</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Upcoming Meetings */}
        <div className="card overflow-hidden animate-fade-in-up">
          <div className="flex items-center justify-between p-6 pb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center ring-1 ring-violet-100">
                <Video size={18} className="text-violet-600" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900">الاجتماعات القادمة</h3>
                <p className="text-[11px] text-gray-400 mt-0.5">الجدول الزمني</p>
              </div>
            </div>
            <Link to="/meetings" className="text-xs text-primary-600 hover:text-primary-700 font-medium">عرض الكل</Link>
          </div>
          <div className="px-6 pb-5">
            {upcomingMeetings.length === 0 ? (
              <div className="text-center py-8">
                <Calendar size={36} className="text-gray-200 mx-auto mb-2" />
                <p className="text-sm text-gray-400">لا توجد اجتماعات قادمة</p>
              </div>
            ) : (
              <div className="space-y-1">
                {upcomingMeetings.map((m: any) => (
                  <Link key={m.id} to={`/meetings/${m.id}`}
                    className="flex items-center justify-between p-3 rounded-xl hover:bg-violet-50 transition-colors group">
                    <div>
                      <p className="text-sm font-semibold text-gray-800">{m.title}</p>
                      <p className="text-[11px] text-gray-400 mt-0.5">{m.location || (m.type === 'online' ? 'أونلاين' : 'حضوري')}</p>
                    </div>
                    <div className="text-left">
                      <p className="text-xs font-semibold text-gray-600">{formatDate(m.start_time)}</p>
                      <p className="text-[11px] text-gray-400">{new Date(m.start_time).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card card-body animate-fade-in-up">
        <h3 className="text-lg font-bold text-gray-900 mb-1">إجراءات سريعة</h3>
        <p className="text-xs text-gray-400 mb-5">الوصول السريع لأهم العمليات</p>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { label: 'مشروع جديد', icon: FolderKanban, to: '/projects/create', color: 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100' },
            { label: 'مهمة جديدة', icon: CheckSquare, to: '/tasks/create', color: 'bg-blue-50 text-blue-600 hover:bg-blue-100' },
            { label: 'لوحة كانبان', icon: LayoutGrid, to: '/tasks/board', color: 'bg-teal-50 text-teal-600 hover:bg-teal-100' },
            { label: 'التقويم', icon: Calendar, to: '/calendar', color: 'bg-amber-50 text-amber-600 hover:bg-amber-100' },
            { label: 'اجتماع جديد', icon: Video, to: '/meetings/create', color: 'bg-violet-50 text-violet-600 hover:bg-violet-100' },
            { label: 'كل المهام', icon: ListChecks, to: '/tasks', color: 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100' },
          ].map((action, i) => {
            const Icon = action.icon;
            return (
              <Link key={i} to={action.to}
                className={`flex flex-col items-center justify-center gap-2.5 p-5 rounded-xl transition-all ${action.color}`}>
                <Icon size={22} />
                <span className="text-xs font-semibold text-center">{action.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
