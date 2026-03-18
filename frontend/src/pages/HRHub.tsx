import { Link } from 'react-router-dom';
import { useEmployees, useSalaries } from '../hooks/useEmployees';
import { formatCurrency, formatDate } from '../utils';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import {
  Users, UserCheck, UserX, ArrowUpRight, Banknote, Building2,
  Plus, Sparkles, CreditCard, CalendarClock,
} from 'lucide-react';
import Breadcrumbs from '../components/Breadcrumbs';
import type { Employee, SalaryPayment } from '../types';

const COLORS = ['#2c9f8f', '#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#6366f1'];

export default function HRHub() {
  const { data: employeesData, isLoading } = useEmployees({ per_page: 1000 });
  const { data: salariesData } = useSalaries({ per_page: 5 });

  const employees = employeesData?.data || [];
  const salaries = salariesData?.data || [];

  const activeCount = employees.filter((e: Employee) => e.is_active).length;
  const inactiveCount = employees.filter((e: Employee) => !e.is_active).length;

  // Total monthly salary
  const totalMonthlySalary = employees
    .filter((e: Employee) => e.is_active)
    .reduce((sum: number, e: Employee) => sum + (e.salary || 0), 0);

  // Department distribution
  const deptMap = new Map<string, number>();
  employees.forEach((e: Employee) => {
    const d = e.department || 'غير محدد';
    deptMap.set(d, (deptMap.get(d) || 0) + 1);
  });
  const deptData = Array.from(deptMap.entries()).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);

  // Role distribution
  const roleMap = new Map<string, number>();
  employees.forEach((e: Employee) => {
    const r = e.role || 'غير محدد';
    roleMap.set(r, (roleMap.get(r) || 0) + 1);
  });
  const roleData = Array.from(roleMap.entries()).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 6);

  if (isLoading) {
    return (
      <div className="page-container">
        <div className="h-32 bg-gradient-to-l from-violet-100 to-violet-50 rounded-2xl animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {[1,2,3,4].map(i => <div key={i} className="h-32 bg-white rounded-2xl animate-pulse border border-gray-100" />)}
        </div>
      </div>
    );
  }

  const statCards = [
    { label: 'إجمالي الموظفين', value: employees.length, icon: Users, bg: 'bg-violet-500', link: '/employees' },
    { label: 'موظفين نشطين', value: activeCount, icon: UserCheck, bg: 'bg-emerald-500', link: '/employees' },
    { label: 'الرواتب الشهرية', value: formatCurrency(totalMonthlySalary), icon: Banknote, bg: 'bg-blue-500', link: '/salaries' },
    { label: 'الأقسام', value: deptData.length, icon: Building2, bg: 'bg-amber-500' },
  ];

  return (
    <div className="page-container">
      <Breadcrumbs items={[{ label: 'الموارد البشرية' }]} />

      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-l from-violet-600 via-violet-700 to-purple-800 p-7">
        <div className="absolute top-0 left-0 w-72 h-72 bg-white/[0.04] rounded-full -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-56 h-56 bg-white/[0.03] rounded-full translate-x-1/4 translate-y-1/4" />
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Sparkles size={18} className="text-violet-300" />
              <span className="text-violet-200 text-sm font-medium">نظرة عامة</span>
            </div>
            <h1 className="text-2xl font-bold text-white mb-1">الموارد البشرية</h1>
            <p className="text-violet-200/80 text-sm">إدارة الموظفين والرواتب</p>
          </div>
          <div className="hidden md:flex items-center gap-3">
            <Link to="/employees/create" className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-all border border-white/10">
              <Plus size={16} /> موظف جديد
            </Link>
            <Link to="/salaries" className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-all border border-white/10">
              <Banknote size={16} /> الرواتب
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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Department Distribution */}
        <div className="card card-body animate-fade-in-up">
          <h3 className="text-lg font-bold text-gray-900 mb-1">توزيع الأقسام</h3>
          <p className="text-xs text-gray-400 mb-4">الموظفين حسب القسم</p>
          {deptData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={deptData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={4} dataKey="value" stroke="none">
                    {deptData.map((_, idx) => <Cell key={idx} fill={COLORS[idx % COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px', direction: 'rtl' }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 mt-3">
                {deptData.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                      <span className="text-gray-600 text-[13px]">{item.name}</span>
                    </div>
                    <span className="font-semibold text-gray-800">{item.value}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-10 text-gray-400 text-sm">لا توجد بيانات</div>
          )}
        </div>

        {/* Roles Distribution */}
        <div className="card card-body animate-fade-in-up">
          <h3 className="text-lg font-bold text-gray-900 mb-1">المسميات الوظيفية</h3>
          <p className="text-xs text-gray-400 mb-4">توزيع الموظفين حسب الدور</p>
          {roleData.length > 0 ? (
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={roleData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} width={100} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px', direction: 'rtl' }} />
                <Bar dataKey="value" fill="#8b5cf6" radius={[0, 6, 6, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center py-10 text-gray-400 text-sm">لا توجد بيانات</div>
          )}
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Recent Salaries */}
        <div className="card overflow-hidden animate-fade-in-up">
          <div className="flex items-center justify-between p-6 pb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center ring-1 ring-blue-100">
                <Banknote size={18} className="text-blue-600" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900">أحدث الرواتب</h3>
                <p className="text-[11px] text-gray-400 mt-0.5">آخر الدفعات</p>
              </div>
            </div>
            <Link to="/salaries" className="text-xs text-primary-600 hover:text-primary-700 font-medium">عرض الكل</Link>
          </div>
          <div className="px-6 pb-5">
            {salaries.length === 0 ? (
              <div className="text-center py-8 text-gray-400 text-sm">لا توجد رواتب مسجلة</div>
            ) : (
              <div className="space-y-0.5">
                {salaries.map((s: SalaryPayment) => (
                  <div key={s.id}
                    className="flex items-center justify-between py-3 px-3 -mx-3 rounded-xl hover:bg-surface-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400">
                        <CreditCard size={15} />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-800 text-[13px]">{s.employee?.name || 'موظف'}</p>
                        <div className="flex items-center gap-1.5 text-[11px] text-gray-400 mt-0.5">
                          <CalendarClock size={10} />
                          <span>{s.month}/{s.year}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-left">
                      <p className="font-bold text-gray-800 text-[13px]">{formatCurrency(s.total)}</p>
                      {s.remaining > 0 ? (
                        <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full">متبقي {formatCurrency(s.remaining)}</span>
                      ) : (
                        <span className="text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full">مدفوع</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="card card-body animate-fade-in-up">
          <h3 className="text-lg font-bold text-gray-900 mb-1">إجراءات سريعة</h3>
          <p className="text-xs text-gray-400 mb-5">الوصول السريع لأهم العمليات</p>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'إضافة موظف', icon: Users, to: '/employees/create', color: 'bg-violet-50 text-violet-600 hover:bg-violet-100' },
              { label: 'صرف راتب', icon: Banknote, to: '/salaries', color: 'bg-blue-50 text-blue-600 hover:bg-blue-100' },
              { label: 'عرض الموظفين', icon: UserCheck, to: '/employees', color: 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100' },
              { label: 'سجل الرواتب', icon: CreditCard, to: '/salaries', color: 'bg-amber-50 text-amber-600 hover:bg-amber-100' },
            ].map((action, i) => {
              const Icon = action.icon;
              return (
                <Link key={i} to={action.to}
                  className={`flex items-center gap-3 p-4 rounded-xl transition-all ${action.color}`}>
                  <Icon size={20} />
                  <span className="text-sm font-semibold">{action.label}</span>
                </Link>
              );
            })}
          </div>

          {/* Staff Status */}
          <div className="mt-5 p-4 rounded-xl bg-gradient-to-l from-violet-50 to-white border border-violet-100">
            <h4 className="text-sm font-bold text-gray-700 mb-3">حالة الموظفين</h4>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-gray-500">نشط</span>
                  <span className="text-xs font-bold text-emerald-600">{activeCount}</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div className="h-2 rounded-full bg-emerald-500 transition-all duration-500"
                    style={{ width: employees.length > 0 ? `${(activeCount / employees.length) * 100}%` : '0%' }} />
                </div>
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-gray-500">غير نشط</span>
                  <span className="text-xs font-bold text-red-500">{inactiveCount}</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div className="h-2 rounded-full bg-red-400 transition-all duration-500"
                    style={{ width: employees.length > 0 ? `${(inactiveCount / employees.length) * 100}%` : '0%' }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
