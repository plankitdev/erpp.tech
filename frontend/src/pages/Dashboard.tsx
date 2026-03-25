import { useState } from 'react';
import { useDashboard } from '../hooks/useDashboard';
import { formatCurrency, formatDate } from '../utils';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Area, AreaChart } from 'recharts';
import { Users, FileText, Receipt, TrendingUp, TrendingDown, Wallet, Clock, CheckCircle2, Sparkles, FolderKanban, Target, CalendarDays, Timer, AlertTriangle, Play, UserCheck, Plus, ArrowUpRight, Activity, Zap, BarChart3, Building2 } from 'lucide-react';
import type { RecentInvoice, RecentTask, ExpenseCategory } from '../types';
import { useAuthStore } from '../store/authStore';
import { Link } from 'react-router-dom';
import StatusBadge from '../components/StatusBadge';
import { SkeletonDashboard } from '../components/Skeletons';

const COLORS = ['#2c9f8f', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

interface StatCard {
  label: string;
  value: string | number;
  icon: typeof Users;
  iconBg: string;
  link?: string;
}

function StatCardGrid({ cards }: { cards: StatCard[] }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
      {cards.map((card, i) => {
        const Icon = card.icon;
        const content = (
          <div className={`animate-fade-in-up stagger-${i + 1} stat-card group`}>
            <div className="relative z-10">
              <div className="flex items-start justify-between mb-4">
                <div className={`w-11 h-11 rounded-xl ${card.iconBg} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                  <Icon size={20} className="text-white" />
                </div>
              </div>
              <p className="text-[13px] text-gray-400 mb-1.5 font-medium">{card.label}</p>
              <p className="text-[1.65rem] font-bold text-gray-900 tracking-tight">{card.value}</p>
            </div>
          </div>
        );
        return card.link ? (
          <Link key={i} to={card.link} className="block">{content}</Link>
        ) : (
          <div key={i}>{content}</div>
        );
      })}
    </div>
  );
}

function WelcomeBanner({ userName, subtitle, rightContent, year, onYearChange, quickActions }: {
  userName: string; subtitle: string; rightContent?: React.ReactNode;
  year: number; onYearChange: (y: number) => void;
  quickActions?: React.ReactNode;
}) {
  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'صباح الخير';
    return 'مساء الخير';
  };

  const today = new Date();
  const currentYear = today.getFullYear();
  const dayNames = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
  const monthNames = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
  const dateStr = `${dayNames[today.getDay()]}، ${today.getDate()} ${monthNames[today.getMonth()]} ${today.getFullYear()}`;

  return (
    <div className="animate-fade-in-up relative overflow-hidden rounded-2xl bg-gradient-to-l from-primary-600 via-primary-700 to-[#312e81] p-5 sm:p-7">
      <div className="absolute top-0 left-0 w-72 h-72 bg-white/[0.04] rounded-full -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 right-0 w-56 h-56 bg-white/[0.03] rounded-full translate-x-1/4 translate-y-1/4" />
      <div className="absolute top-1/2 left-1/3 w-32 h-32 bg-primary-400/10 rounded-full blur-2xl" />
      <div className="absolute top-4 left-4 w-20 h-20 bg-white/[0.02] rounded-full" />
      <div className="relative z-10">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="flex items-center gap-2">
                <Sparkles size={18} className="text-primary-300" />
                <span className="text-primary-200 text-sm font-medium">{getGreeting()}</span>
              </div>
              <span className="text-primary-300/50">|</span>
              <span className="text-primary-300/80 text-xs">{dateStr}</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-white mb-1">مرحباً، {userName} 👋</h1>
            <p className="text-primary-200/80 text-sm">{subtitle}</p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            {rightContent}
            <div className="flex items-center bg-white/[0.08] backdrop-blur-sm rounded-full border border-white/[0.12] p-0.5">
              {Array.from({ length: 4 }, (_, i) => currentYear - i).map((y) => (
                <button
                  key={y}
                  onClick={() => onYearChange(y)}
                  className={`px-3 sm:px-3.5 py-1 rounded-full text-[11px] font-semibold tracking-wide transition-all duration-300 ${
                    year === y
                      ? 'bg-white text-primary-700 shadow-md shadow-black/10'
                      : 'text-white/50 hover:text-white/80'
                  }`}
                >
                  {y}
                </button>
              ))}
            </div>
          </div>
        </div>
        {quickActions && (
          <div className="flex flex-wrap gap-2 mt-4 sm:mt-5 pt-4 sm:pt-5 border-t border-white/10">
            {quickActions}
          </div>
        )}
      </div>
    </div>
  );
}

function RevenueChart({ data }: { data: Array<{ month: string; revenue: number; expenses: number }> }) {
  return (
    <div className="lg:col-span-2 animate-fade-in-up card card-body">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold text-gray-900">الإيرادات والمصروفات</h3>
          <p className="text-xs text-gray-400 mt-1">التحليل الشهري</p>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-primary-500" />
            <span className="text-gray-500">الإيرادات</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-rose-400" />
            <span className="text-gray-500">المصروفات</span>
          </div>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={300} minWidth={0} minHeight={0}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#2c9f8f" stopOpacity={0.15} />
              <stop offset="95%" stopColor="#2c9f8f" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.1} />
              <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
          <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
          <Tooltip contentStyle={{ borderRadius: '14px', border: '1px solid #e2e8f0', boxShadow: '0 10px 30px rgba(0,0,0,0.08)', direction: 'rtl', fontSize: '13px' }} />
          <Area type="monotone" dataKey="revenue" stroke="#2c9f8f" strokeWidth={2.5} fill="url(#revenueGrad)" />
          <Area type="monotone" dataKey="expenses" stroke="#f43f5e" strokeWidth={2} fill="url(#expenseGrad)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

function ExpenseDistChart({ data }: { data: ExpenseCategory[] }) {
  return (
    <div className="animate-fade-in-up card card-body">
      <div className="mb-4">
        <h3 className="text-lg font-bold text-gray-900">توزيع المصروفات</h3>
        <p className="text-xs text-gray-400 mt-1">حسب الفئة</p>
      </div>
      <ResponsiveContainer width="100%" height={210} minWidth={0} minHeight={0}>
        <PieChart>
          <Pie data={data} cx="50%" cy="50%" innerRadius={52} outerRadius={82} paddingAngle={4} dataKey="value" nameKey="name" stroke="none">
            {data.map((_: ExpenseCategory, index: number) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px', direction: 'rtl' }} />
        </PieChart>
      </ResponsiveContainer>
      <div className="space-y-2.5 mt-3">
        {data.slice(0, 4).map((item: ExpenseCategory, idx: number) => (
          <div key={idx} className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
              <span className="text-gray-600 text-[13px]">{item.name}</span>
            </div>
            <span className="font-semibold text-gray-800 text-[13px]">{formatCurrency(item.value)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function RecentInvoicesList({ invoices }: { invoices: RecentInvoice[] }) {
  return (
    <div className="animate-fade-in-up card overflow-hidden">
      <div className="flex items-center justify-between p-6 pb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center ring-1 ring-primary-100">
            <Receipt size={18} className="text-primary-600" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900">أحدث الفواتير</h3>
            <p className="text-[11px] text-gray-400 mt-0.5">آخر المعاملات المالية</p>
          </div>
        </div>
        <Link to="/invoices" className="text-xs text-primary-600 hover:text-primary-700 font-medium">عرض الكل</Link>
      </div>
      <div className="px-6 pb-5">
        {invoices.length === 0 ? (
          <div className="empty-state py-10">
            <Receipt size={36} className="text-gray-300 mb-2" />
            <p className="text-sm text-gray-400">لا توجد فواتير</p>
          </div>
        ) : (
          <div className="space-y-0.5">
            {invoices.map((inv: RecentInvoice, idx: number) => (
              <div key={inv.id} className={`animate-slide-in-right stagger-${Math.min(idx + 1, 8)} flex items-center justify-between py-3 px-3 -mx-3 rounded-xl hover:bg-surface-50 transition-colors group`}>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-primary-50 group-hover:text-primary-500 transition-all">
                    <Receipt size={15} />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800 text-[13px]">{inv.client_name || 'بدون عميل'}</p>
                    <div className="flex items-center gap-1.5 text-[11px] text-gray-400 mt-0.5">
                      <Clock size={10} />
                      <span>{inv.due_date}</span>
                    </div>
                  </div>
                </div>
                <div className="text-left">
                  <p className="font-bold text-gray-800 text-[13px]">{formatCurrency(inv.amount, inv.currency)}</p>
                  <StatusBadge status={inv.status} size="sm" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function RecentTasksList({ tasks }: { tasks: RecentTask[] }) {
  return (
    <div className="animate-fade-in-up card overflow-hidden">
      <div className="flex items-center justify-between p-6 pb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center ring-1 ring-purple-100">
            <CheckCircle2 size={18} className="text-purple-600" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900">أحدث المهام</h3>
            <p className="text-[11px] text-gray-400 mt-0.5">آخر التحديثات</p>
          </div>
        </div>
        <Link to="/tasks/board" className="text-xs text-primary-600 hover:text-primary-700 font-medium">عرض الكل</Link>
      </div>
      <div className="px-6 pb-5">
        {tasks.length === 0 ? (
          <div className="empty-state py-10">
            <CheckCircle2 size={36} className="text-gray-300 mb-2" />
            <p className="text-sm text-gray-400">لا توجد مهام</p>
          </div>
        ) : (
          <div className="space-y-0.5">
            {tasks.map((task: RecentTask, idx: number) => (
              <div key={task.id} className={`animate-slide-in-right stagger-${Math.min(idx + 1, 8)} flex items-center justify-between py-3 px-3 -mx-3 rounded-xl hover:bg-surface-50 transition-colors group`}>
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
                    task.status === 'done' ? 'bg-emerald-50 text-emerald-500 ring-1 ring-emerald-100' :
                    task.status === 'in_progress' ? 'bg-blue-50 text-blue-500 ring-1 ring-blue-100' :
                    'bg-gray-50 text-gray-400 group-hover:bg-purple-50 group-hover:text-purple-500'
                  }`}>
                    <CheckCircle2 size={15} />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800 text-[13px]">{task.title}</p>
                    {task.assigned_to_name && (
                      <p className="text-[11px] text-gray-400 mt-0.5">{task.assigned_to_name}</p>
                    )}
                  </div>
                </div>
                <StatusBadge status={task.status} size="sm" />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function TaskStatusChart({ data }: { data: Array<{ name: string; value: number }> }) {
  if (!data || data.length === 0) return null;
  return (
    <div className="animate-fade-in-up card card-body">
      <h3 className="text-lg font-bold text-gray-900 mb-1">حالة المهام</h3>
      <p className="text-xs text-gray-400 mb-4">توزيع المهام حسب الحالة</p>
      <ResponsiveContainer width="100%" height={250} minWidth={0} minHeight={0}>
        <BarChart data={data} layout="vertical">
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
          <XAxis type="number" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
          <YAxis type="category" dataKey="name" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} width={90} />
          <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px', direction: 'rtl' }} />
          <Bar dataKey="value" fill="#2c9f8f" radius={[0, 6, 6, 0]} barSize={24} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ========== Quick Actions ==========
function getQuickActions(role: string) {
  const actions: Array<{ label: string; icon: typeof Plus; to: string; roles: string[] }> = [
    { label: 'مشروع جديد', icon: FolderKanban, to: '/projects', roles: ['super_admin', 'manager'] },
    { label: 'فاتورة جديدة', icon: Receipt, to: '/invoices', roles: ['super_admin', 'accountant', 'sales'] },
    { label: 'عميل جديد', icon: Building2, to: '/clients', roles: ['super_admin', 'sales'] },
    { label: 'مهمة جديدة', icon: CheckCircle2, to: '/tasks/board', roles: ['super_admin', 'manager', 'employee'] },
    { label: 'عميل محتمل', icon: Target, to: '/leads', roles: ['super_admin', 'sales'] },
    { label: 'التقويم', icon: CalendarDays, to: '/calendar', roles: ['super_admin', 'manager', 'employee'] },
  ];
  return actions.filter(a => a.roles.includes(role));
}

function QuickActionButtons({ role }: { role: string }) {
  const filtered = getQuickActions(role);
  if (filtered.length === 0) return null;
  return (
    <>
      {filtered.map((action, i) => {
        const Icon = action.icon;
        return (
          <Link key={i} to={action.to}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-sm font-medium transition-all duration-200 border border-white/10 hover:border-white/20">
            <Icon size={15} />
            {action.label}
            <ArrowUpRight size={12} className="opacity-50" />
          </Link>
        );
      })}
    </>
  );
}

// ========== Live KPI Strip ==========
function KPIStrip({ stats, role }: { stats: Record<string, any>; role: string }) {
  const kpis: Array<{ label: string; value: string | number; icon: typeof Activity; change?: string; positive?: boolean }> = [];

  if (role === 'super_admin' || role === 'accountant') {
    const rev = stats.total_revenue || 0;
    const exp = stats.total_expenses || 0;
    const margin = rev > 0 ? Math.round(((rev - exp) / rev) * 100) : 0;
    kpis.push(
      { label: 'هامش الربح', value: `${margin}%`, icon: TrendingUp, positive: margin > 0 },
      { label: 'فواتير هذا الشهر', value: stats.pending_invoices || 0, icon: Receipt },
      { label: 'عملاء نشطين', value: stats.clients_count || 0, icon: Users },
      { label: 'مشاريع قيد التنفيذ', value: stats.active_projects || 0, icon: Zap },
    );
  } else if (role === 'manager') {
    const total = stats.total_tasks || 0;
    const done = (stats.task_status_distribution || []).find((d: any) => d.name === 'مكتمل')?.value || 0;
    const rate = total > 0 ? Math.round((done / total) * 100) : 0;
    kpis.push(
      { label: 'معدل الإنجاز', value: `${rate}%`, icon: BarChart3, positive: rate > 50 },
      { label: 'مهام متأخرة', value: stats.overdue_tasks || 0, icon: AlertTriangle },
      { label: 'المشاريع النشطة', value: stats.active_projects || 0, icon: FolderKanban },
      { label: 'أعضاء الفريق', value: stats.team_count || 0, icon: Users },
    );
  } else if (role === 'sales') {
    const total = (stats.total_leads || 0);
    const won = stats.won_leads || 0;
    const rate = total > 0 ? Math.round((won / total) * 100) : 0;
    kpis.push(
      { label: 'معدل التحويل', value: `${rate}%`, icon: BarChart3, positive: rate > 20 },
      { label: 'فرص مفتوحة', value: stats.open_leads || 0, icon: Target },
      { label: 'قيمة المبيعات', value: formatCurrency(stats.won_value || 0), icon: Wallet },
      { label: 'عملاء جدد', value: stats.new_clients_month || 0, icon: Users },
    );
  } else if (role === 'employee') {
    const myTasks = stats.my_tasks || 0;
    const completed = stats.completed_tasks || 0;
    const rate = myTasks > 0 ? Math.round((completed / myTasks) * 100) : 0;
    kpis.push(
      { label: 'معدل إنجازي', value: `${rate}%`, icon: BarChart3, positive: rate > 50 },
      { label: 'مهام قيد التنفيذ', value: stats.in_progress_tasks || 0, icon: Play },
      { label: 'ساعات اليوم', value: `${stats.today_hours || 0}h`, icon: Timer },
      { label: 'مهام متأخرة', value: stats.overdue_tasks || 0, icon: AlertTriangle },
    );
  }

  if (kpis.length === 0) return null;

  return (
    <div className="animate-fade-in-up grid grid-cols-2 md:grid-cols-4 gap-3">
      {kpis.map((kpi, i) => {
        const Icon = kpi.icon;
        return (
          <div key={i} className="bg-white rounded-xl border border-gray-100 px-4 py-3 flex items-center gap-3 hover:shadow-sm transition-all">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
              kpi.positive === true ? 'bg-emerald-50 text-emerald-600' :
              kpi.positive === false ? 'bg-red-50 text-red-600' :
              'bg-gray-50 text-gray-500'
            }`}>
              <Icon size={16} />
            </div>
            <div>
              <p className="text-lg font-bold text-gray-900 leading-tight">{kpi.value}</p>
              <p className="text-[11px] text-gray-400">{kpi.label}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ========== Role-specific Dashboard Sections ==========

function SuperAdminDashboard({ stats }: { stats: Record<string, any> }) {
  const cards: StatCard[] = [
    { label: 'العملاء', value: stats.clients_count || 0, icon: Users, iconBg: 'bg-blue-500', link: '/clients' },
    { label: 'العقود النشطة', value: stats.active_contracts || 0, icon: FileText, iconBg: 'bg-emerald-500', link: '/contracts' },
    { label: 'الفواتير المعلقة', value: stats.pending_invoices || 0, icon: Receipt, iconBg: 'bg-amber-500', link: '/invoices' },
    { label: 'إجمالي الإيرادات', value: formatCurrency(stats.total_revenue || 0), icon: TrendingUp, iconBg: 'bg-primary-500' },
    { label: 'المصروفات', value: formatCurrency(stats.total_expenses || 0), icon: TrendingDown, iconBg: 'bg-rose-500', link: '/expenses' },
    { label: 'صافي الربح', value: formatCurrency(stats.net_profit || 0), icon: Wallet, iconBg: 'bg-teal-500' },
    { label: 'المشاريع النشطة', value: stats.active_projects || 0, icon: FolderKanban, iconBg: 'bg-violet-500', link: '/projects' },
    { label: 'الموظفين', value: stats.employees_count || 0, icon: UserCheck, iconBg: 'bg-indigo-500', link: '/employees' },
  ];

  return (
    <>
      <StatCardGrid cards={cards} />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <RevenueChart data={stats.monthly_revenue || []} />
        <ExpenseDistChart data={stats.expense_distribution || []} />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <RecentInvoicesList invoices={stats.recent_invoices || []} />
        <RecentTasksList tasks={stats.recent_tasks || []} />
      </div>
    </>
  );
}

function ManagerDashboard({ stats }: { stats: Record<string, any> }) {
  const cards: StatCard[] = [
    { label: 'المشاريع النشطة', value: stats.active_projects || 0, icon: FolderKanban, iconBg: 'bg-violet-500', link: '/projects' },
    { label: 'إجمالي المهام', value: stats.total_tasks || 0, icon: CheckCircle2, iconBg: 'bg-blue-500', link: '/tasks/board' },
    { label: 'مهام متأخرة', value: stats.overdue_tasks || 0, icon: AlertTriangle, iconBg: 'bg-red-500', link: '/tasks' },
    { label: 'أعضاء الفريق', value: stats.team_count || 0, icon: Users, iconBg: 'bg-indigo-500', link: '/employees' },
    { label: 'الاجتماعات القادمة', value: stats.upcoming_meetings || 0, icon: CalendarDays, iconBg: 'bg-amber-500', link: '/calendar' },
    { label: 'الوقت المسجل اليوم', value: `${stats.today_hours || 0}h`, icon: Timer, iconBg: 'bg-teal-500' },
  ];

  return (
    <>
      <StatCardGrid cards={cards} />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 animate-fade-in-up card card-body">
          <h3 className="text-lg font-bold text-gray-900 mb-1">تقدم المشاريع</h3>
          <p className="text-xs text-gray-400 mb-4">المشاريع النشطة وتقدمها</p>
          <div className="space-y-4">
            {(stats.project_progress || []).slice(0, 6).map((p: any) => (
              <div key={p.id}>
                <div className="flex items-center justify-between mb-1.5">
                  <Link to={`/projects/${p.slug || p.id}`} className="text-sm font-semibold text-gray-800 hover:text-primary-600">{p.name}</Link>
                  <span className="text-xs text-gray-500">{p.progress}%</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-l from-primary-500 to-primary-600 rounded-full transition-all duration-500" style={{ width: `${p.progress}%` }} />
                </div>
                <div className="flex items-center gap-3 mt-1 text-[11px] text-gray-400">
                  <span>{p.completed_tasks}/{p.total_tasks} مهمة</span>
                  {p.end_date && <span>ينتهي: {formatDate(p.end_date)}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
        <TaskStatusChart data={stats.task_status_distribution || []} />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <RecentTasksList tasks={stats.recent_tasks || []} />
        <div className="animate-fade-in-up card overflow-hidden">
          <div className="p-6 pb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center ring-1 ring-amber-100">
                <AlertTriangle size={18} className="text-amber-600" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900">مواعيد قريبة</h3>
                <p className="text-[11px] text-gray-400 mt-0.5">مهام تستحق قريباً</p>
              </div>
            </div>
          </div>
          <div className="px-6 pb-5">
            {(stats.upcoming_deadlines || []).length === 0 ? (
              <div className="empty-state py-10">
                <CalendarDays size={36} className="text-gray-300 mb-2" />
                <p className="text-sm text-gray-400">لا توجد مواعيد قريبة</p>
              </div>
            ) : (
              <div className="space-y-2">
                {(stats.upcoming_deadlines || []).map((t: any, idx: number) => (
                  <div key={t.id} className={`animate-slide-in-right stagger-${Math.min(idx + 1, 8)} flex items-center justify-between py-3 px-3 -mx-3 rounded-xl hover:bg-surface-50 transition-colors`}>
                    <div>
                      <p className="font-semibold text-gray-800 text-[13px]">{t.title}</p>
                      <p className="text-[11px] text-gray-400 mt-0.5">{t.assigned_to_name || 'غير محدد'}</p>
                    </div>
                    <div className="text-left">
                      <p className="text-xs text-amber-600 font-medium">{formatDate(t.due_date)}</p>
                      <StatusBadge status={t.priority} size="sm" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

function AccountantDashboard({ stats }: { stats: Record<string, any> }) {
  const cards: StatCard[] = [
    { label: 'إجمالي الإيرادات', value: formatCurrency(stats.total_revenue || 0), icon: TrendingUp, iconBg: 'bg-primary-500' },
    { label: 'إجمالي المصروفات', value: formatCurrency(stats.total_expenses || 0), icon: TrendingDown, iconBg: 'bg-rose-500', link: '/expenses' },
    { label: 'صافي الربح', value: formatCurrency(stats.net_profit || 0), icon: Wallet, iconBg: 'bg-teal-500' },
    { label: 'فواتير معلقة', value: stats.pending_invoices || 0, icon: Receipt, iconBg: 'bg-amber-500', link: '/invoices' },
    { label: 'فواتير متأخرة', value: stats.overdue_invoices || 0, icon: AlertTriangle, iconBg: 'bg-red-500' },
    { label: 'رصيد الخزينة', value: formatCurrency(stats.treasury_balance || 0), icon: Wallet, iconBg: 'bg-indigo-500', link: '/treasury' },
  ];

  return (
    <>
      <StatCardGrid cards={cards} />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <RevenueChart data={stats.monthly_revenue || []} />
        <ExpenseDistChart data={stats.expense_distribution || []} />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <RecentInvoicesList invoices={stats.recent_invoices || []} />
        <div className="animate-fade-in-up card card-body">
          <h3 className="text-lg font-bold text-gray-900 mb-1">ملخص الرواتب</h3>
          <p className="text-xs text-gray-400 mb-4">الشهر الحالي</p>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-blue-50 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-blue-700">{stats.total_employees || 0}</p>
              <p className="text-xs text-blue-600 mt-1">إجمالي الموظفين</p>
            </div>
            <div className="bg-emerald-50 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-emerald-700">{formatCurrency(stats.total_salaries || 0)}</p>
              <p className="text-xs text-emerald-600 mt-1">إجمالي الرواتب</p>
            </div>
            <div className="bg-amber-50 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-amber-700">{stats.unpaid_salaries || 0}</p>
              <p className="text-xs text-amber-600 mt-1">رواتب غير مدفوعة</p>
            </div>
            <div className="bg-rose-50 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-rose-700">{formatCurrency(stats.total_deductions || 0)}</p>
              <p className="text-xs text-rose-600 mt-1">إجمالي الخصومات</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function SalesDashboard({ stats }: { stats: Record<string, any> }) {
  const cards: StatCard[] = [
    { label: 'العملاء المحتملين', value: stats.total_leads || 0, icon: Target, iconBg: 'bg-orange-500', link: '/leads' },
    { label: 'فرص مفتوحة', value: stats.open_leads || 0, icon: TrendingUp, iconBg: 'bg-blue-500', link: '/leads' },
    { label: 'تم الفوز', value: stats.won_leads || 0, icon: CheckCircle2, iconBg: 'bg-emerald-500' },
    { label: 'قيمة المبيعات', value: formatCurrency(stats.won_value || 0), icon: Wallet, iconBg: 'bg-primary-500' },
    { label: 'عملاء جدد هذا الشهر', value: stats.new_clients_month || 0, icon: Users, iconBg: 'bg-violet-500' },
    { label: 'فواتير معلقة', value: stats.pending_invoices || 0, icon: Receipt, iconBg: 'bg-amber-500', link: '/invoices' },
  ];

  return (
    <>
      <StatCardGrid cards={cards} />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 animate-fade-in-up card card-body">
          <h3 className="text-lg font-bold text-gray-900 mb-1">خط المبيعات</h3>
          <p className="text-xs text-gray-400 mb-4">مراحل العملاء المحتملين</p>
          <ResponsiveContainer width="100%" height={300} minWidth={0} minHeight={0}>
            <BarChart data={stats.pipeline || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="stage" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: '14px', border: '1px solid #e2e8f0', direction: 'rtl', fontSize: '13px' }} />
              <Bar dataKey="count" fill="#f59e0b" radius={[6, 6, 0, 0]} barSize={40} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="animate-fade-in-up card card-body">
          <h3 className="text-lg font-bold text-gray-900 mb-1">آخر العملاء المحتملين</h3>
          <p className="text-xs text-gray-400 mb-4">أحدث الفرص</p>
          <div className="space-y-3">
            {(stats.recent_leads || []).slice(0, 5).map((lead: any) => (
              <Link key={lead.id} to={`/leads/${lead.id}`} className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition-colors">
                <div>
                  <p className="text-sm font-semibold text-gray-800">{lead.company_name || lead.name}</p>
                  <p className="text-[11px] text-gray-400 mt-0.5">{lead.name}</p>
                </div>
                <StatusBadge status={lead.status} size="sm" />
              </Link>
            ))}
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <RecentInvoicesList invoices={stats.recent_invoices || []} />
        <RecentTasksList tasks={stats.recent_tasks || []} />
      </div>
    </>
  );
}

function EmployeeDashboard({ stats }: { stats: Record<string, any> }) {
  const cards: StatCard[] = [
    { label: 'مهامي', value: stats.my_tasks || 0, icon: CheckCircle2, iconBg: 'bg-blue-500', link: '/tasks/board' },
    { label: 'قيد التنفيذ', value: stats.in_progress_tasks || 0, icon: Play, iconBg: 'bg-amber-500', link: '/tasks/board' },
    { label: 'مكتملة', value: stats.completed_tasks || 0, icon: CheckCircle2, iconBg: 'bg-emerald-500' },
    { label: 'متأخرة', value: stats.overdue_tasks || 0, icon: AlertTriangle, iconBg: 'bg-red-500' },
    { label: 'ساعات اليوم', value: `${stats.today_hours || 0}h`, icon: Timer, iconBg: 'bg-teal-500' },
    { label: 'ساعات هذا الأسبوع', value: `${stats.week_hours || 0}h`, icon: Clock, iconBg: 'bg-indigo-500' },
  ];

  return (
    <>
      <StatCardGrid cards={cards} />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2">
          <RecentTasksList tasks={stats.recent_tasks || []} />
        </div>
        <TaskStatusChart data={stats.task_status_distribution || []} />
      </div>
      <div className="animate-fade-in-up card overflow-hidden">
        <div className="p-6 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center ring-1 ring-amber-100">
              <CalendarDays size={18} className="text-amber-600" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900">المواعيد القادمة</h3>
              <p className="text-[11px] text-gray-400 mt-0.5">مهام تستحق خلال الأسبوع</p>
            </div>
          </div>
        </div>
        <div className="px-6 pb-5">
          {(stats.upcoming_deadlines || []).length === 0 ? (
            <div className="empty-state py-8">
              <CheckCircle2 size={36} className="text-gray-300 mb-2" />
              <p className="text-sm text-gray-400">لا توجد مواعيد قادمة</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {(stats.upcoming_deadlines || []).map((t: any) => (
                <div key={t.id} className="bg-gray-50 rounded-xl p-4 hover:bg-gray-100 transition-colors">
                  <p className="font-semibold text-gray-800 text-sm">{t.title}</p>
                  <div className="flex items-center justify-between mt-2">
                    <StatusBadge status={t.priority} size="sm" />
                    <span className="text-xs text-gray-500">{formatDate(t.due_date)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default function Dashboard() {
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);

  const { data: stats, isLoading } = useDashboard({ year });
  const { user } = useAuthStore();
  const role = user?.role || 'employee';

  if (isLoading) return <SkeletonDashboard />;

  const subtitles: Record<string, string> = {
    super_admin: 'إليك ملخص أداء شركتك اليوم',
    manager: 'تابع تقدم فريقك ومشاريعك',
    accountant: 'ملخص الحالة المالية',
    sales: 'تابع فرص المبيعات وأهدافك',
    employee: 'إليك ملخص مهامك اليوم',
  };

  const rightContent = (role === 'super_admin' || role === 'accountant') ? (
    <div className="flex items-center gap-3">
      <div className="text-left bg-white/10 backdrop-blur-sm rounded-xl px-5 py-3 border border-white/10">
        <p className="text-xs text-primary-200">الإيرادات</p>
        <p className="text-lg font-bold text-white mt-0.5">{formatCurrency((stats as any)?.total_revenue || 0)}</p>
      </div>
      <div className="text-left bg-white/10 backdrop-blur-sm rounded-xl px-5 py-3 border border-white/10">
        <p className="text-xs text-primary-200">صافي الربح</p>
        <p className="text-lg font-bold text-emerald-300 mt-0.5">{formatCurrency((stats as any)?.net_profit || 0)}</p>
      </div>
    </div>
  ) : role === 'manager' ? (
    <div className="flex items-center gap-3">
      <div className="text-left bg-white/10 backdrop-blur-sm rounded-xl px-5 py-3 border border-white/10">
        <p className="text-xs text-primary-200">المشاريع النشطة</p>
        <p className="text-lg font-bold text-white mt-0.5">{(stats as any)?.active_projects || 0}</p>
      </div>
      <div className="text-left bg-white/10 backdrop-blur-sm rounded-xl px-5 py-3 border border-white/10">
        <p className="text-xs text-primary-200">مهام الفريق</p>
        <p className="text-lg font-bold text-white mt-0.5">{(stats as any)?.total_tasks || 0}</p>
      </div>
    </div>
  ) : role === 'sales' ? (
    <div className="flex items-center gap-3">
      <div className="text-left bg-white/10 backdrop-blur-sm rounded-xl px-5 py-3 border border-white/10">
        <p className="text-xs text-primary-200">قيمة المبيعات</p>
        <p className="text-lg font-bold text-emerald-300 mt-0.5">{formatCurrency((stats as any)?.won_value || 0)}</p>
      </div>
      <div className="text-left bg-white/10 backdrop-blur-sm rounded-xl px-5 py-3 border border-white/10">
        <p className="text-xs text-primary-200">فرص مفتوحة</p>
        <p className="text-lg font-bold text-white mt-0.5">{(stats as any)?.open_leads || 0}</p>
      </div>
    </div>
  ) : role === 'employee' ? (
    <div className="flex items-center gap-3">
      <div className="text-left bg-white/10 backdrop-blur-sm rounded-xl px-5 py-3 border border-white/10">
        <p className="text-xs text-primary-200">مهام مكتملة</p>
        <p className="text-lg font-bold text-emerald-300 mt-0.5">{(stats as any)?.completed_tasks || 0}</p>
      </div>
      <div className="text-left bg-white/10 backdrop-blur-sm rounded-xl px-5 py-3 border border-white/10">
        <p className="text-xs text-primary-200">مهامي</p>
        <p className="text-lg font-bold text-white mt-0.5">{(stats as any)?.my_tasks || 0}</p>
      </div>
    </div>
  ) : undefined;

  const renderDashboard = () => {
    const s = (stats || {}) as Record<string, any>;
    switch (role) {
      case 'super_admin': return <SuperAdminDashboard stats={s} />;
      case 'manager': return <ManagerDashboard stats={s} />;
      case 'accountant': return <AccountantDashboard stats={s} />;
      case 'sales': return <SalesDashboard stats={s} />;
      case 'employee': return <EmployeeDashboard stats={s} />;
      default: return <SuperAdminDashboard stats={s} />;
    }
  };

  return (
    <div className="page-container">
      <WelcomeBanner
        userName={user?.name || ''}
        subtitle={subtitles[role]}
        rightContent={rightContent}
        year={year}
        onYearChange={setYear}
        quickActions={<QuickActionButtons role={role} />}
      />
      <KPIStrip stats={(stats || {}) as Record<string, any>} role={role} />
      {renderDashboard()}
    </div>
  );
}
