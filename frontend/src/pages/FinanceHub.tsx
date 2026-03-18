import { Link } from 'react-router-dom';
import { useDashboard } from '../hooks/useDashboard';
import { useExpenses } from '../hooks/useExpenses';
import { formatCurrency, formatDate } from '../utils';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts';
import {
  Wallet, TrendingDown, TrendingUp, ArrowUpRight, DollarSign,
  Plus, Handshake, Receipt, Sparkles, PiggyBank, CreditCard,
} from 'lucide-react';
import StatusBadge from '../components/StatusBadge';
import Breadcrumbs from '../components/Breadcrumbs';
import type { Expense } from '../types';
import { useQuery } from '@tanstack/react-query';
import { treasuryApi } from '../api/treasury';

const COLORS = ['#2c9f8f', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function FinanceHub() {
  const { data: dashData, isLoading: dashLoading } = useDashboard();
  const { data: expensesData } = useExpenses({ per_page: 5 });
  const { data: balanceData } = useQuery({
    queryKey: ['treasury-balance'],
    queryFn: treasuryApi.getBalance,
  });

  const stats = (dashData || {}) as Record<string, any>;
  const expenses = expensesData?.data || [];
  const balance = balanceData || {};

  const monthlyRevenue: { month: string; revenue: number; expenses: number }[] = stats.monthly_revenue || [];
  const expenseDist: { name: string; value: number }[] = stats.expense_distribution || [];

  if (dashLoading) {
    return (
      <div className="page-container">
        <div className="h-32 bg-gradient-to-l from-emerald-100 to-emerald-50 rounded-2xl animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {[1,2,3,4].map(i => <div key={i} className="h-32 bg-white rounded-2xl animate-pulse border border-gray-100" />)}
        </div>
      </div>
    );
  }

  const netProfit = (stats.total_revenue || 0) - (stats.total_expenses || 0);

  const statCards = [
    { label: 'إجمالي الإيرادات', value: formatCurrency(stats.total_revenue || 0), icon: TrendingUp, bg: 'bg-emerald-500' },
    { label: 'إجمالي المصروفات', value: formatCurrency(stats.total_expenses || 0), icon: TrendingDown, bg: 'bg-red-500', link: '/expenses' },
    { label: 'صافي الربح', value: formatCurrency(netProfit), icon: DollarSign, bg: netProfit >= 0 ? 'bg-blue-500' : 'bg-red-500' },
    { label: 'الفواتير المعلقة', value: stats.pending_invoices || 0, icon: Receipt, bg: 'bg-amber-500', link: '/invoices' },
  ];

  return (
    <div className="page-container">
      <Breadcrumbs items={[{ label: 'الإدارة المالية' }]} />

      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-l from-emerald-600 via-emerald-700 to-green-800 p-7">
        <div className="absolute top-0 left-0 w-72 h-72 bg-white/[0.04] rounded-full -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-56 h-56 bg-white/[0.03] rounded-full translate-x-1/4 translate-y-1/4" />
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Sparkles size={18} className="text-emerald-300" />
              <span className="text-emerald-200 text-sm font-medium">نظرة عامة</span>
            </div>
            <h1 className="text-2xl font-bold text-white mb-1">الإدارة المالية</h1>
            <p className="text-emerald-200/80 text-sm">الخزينة والمصروفات والشراكات</p>
          </div>
          <div className="hidden md:flex items-center gap-3">
            <Link to="/treasury/create" className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-all border border-white/10">
              <Plus size={16} /> حركة خزينة
            </Link>
            <Link to="/expenses/create" className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-all border border-white/10">
              <TrendingDown size={16} /> مصروف جديد
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

      {/* Treasury Balance Strip */}
      {Object.keys(balance).length > 0 && (
        <div className="card card-body animate-fade-in-up">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center ring-1 ring-emerald-100">
              <PiggyBank size={18} className="text-emerald-600" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900">رصيد الخزينة</h3>
              <p className="text-[11px] text-gray-400 mt-0.5">الأرصدة الحالية</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Object.entries(balance as Record<string, number>).map(([currency, amount]) => (
              <div key={currency} className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-l from-gray-50 to-white border border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                    <Wallet size={16} className="text-emerald-600" />
                  </div>
                  <span className="text-sm font-bold text-gray-600">{currency}</span>
                </div>
                <span className={`text-xl font-bold ${(amount as number) >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                  {formatCurrency(amount as number, currency)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Revenue Chart */}
        <div className="card card-body lg:col-span-2 animate-fade-in-up">
          <h3 className="text-lg font-bold text-gray-900 mb-1">الإيرادات والمصروفات</h3>
          <p className="text-xs text-gray-400 mb-4">آخر 12 شهر</p>
          {monthlyRevenue.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={monthlyRevenue}>
                <defs>
                  <linearGradient id="finRevenueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="finExpenseGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px', direction: 'rtl' }} />
                <Area type="monotone" dataKey="revenue" name="الإيرادات" stroke="#10b981" fill="url(#finRevenueGrad)" strokeWidth={2.5} />
                <Area type="monotone" dataKey="expenses" name="المصروفات" stroke="#ef4444" fill="url(#finExpenseGrad)" strokeWidth={2} strokeDasharray="5 5" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center py-16 text-gray-400 text-sm">لا توجد بيانات شهرية</div>
          )}
        </div>

        {/* Expense Distribution */}
        <div className="card card-body animate-fade-in-up">
          <h3 className="text-lg font-bold text-gray-900 mb-1">توزيع المصروفات</h3>
          <p className="text-xs text-gray-400 mb-4">حسب الفئة</p>
          {expenseDist.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={expenseDist} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={4} dataKey="value" stroke="none">
                    {expenseDist.map((_, idx) => <Cell key={idx} fill={COLORS[idx % COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px', direction: 'rtl' }}
                    formatter={(val: any) => formatCurrency(val)} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 mt-2">
                {expenseDist.slice(0, 5).map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[idx] }} />
                      <span className="text-gray-600 text-[13px]">{item.name}</span>
                    </div>
                    <span className="font-semibold text-gray-800">{formatCurrency(item.value)}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-10 text-gray-400 text-sm">لا توجد بيانات</div>
          )}
        </div>
      </div>

      {/* Recent Expenses + Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Recent Expenses */}
        <div className="card overflow-hidden animate-fade-in-up">
          <div className="flex items-center justify-between p-6 pb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center ring-1 ring-red-100">
                <TrendingDown size={18} className="text-red-600" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900">أحدث المصروفات</h3>
                <p className="text-[11px] text-gray-400 mt-0.5">آخر المعاملات</p>
              </div>
            </div>
            <Link to="/expenses" className="text-xs text-primary-600 hover:text-primary-700 font-medium">عرض الكل</Link>
          </div>
          <div className="px-6 pb-5">
            {expenses.length === 0 ? (
              <div className="text-center py-8 text-gray-400 text-sm">لا توجد مصروفات</div>
            ) : (
              <div className="space-y-0.5">
                {expenses.map((exp: Expense) => (
                  <Link key={exp.id} to={`/expenses/${exp.id}/edit`}
                    className="flex items-center justify-between py-3 px-3 -mx-3 rounded-xl hover:bg-surface-50 transition-colors group">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-red-50 group-hover:text-red-500 transition-all">
                        <CreditCard size={15} />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-800 text-[13px]">{exp.category}</p>
                        <p className="text-[11px] text-gray-400 mt-0.5">{formatDate(exp.date)}</p>
                      </div>
                    </div>
                    <p className="font-bold text-red-500 text-[13px]">-{formatCurrency(exp.amount, exp.currency)}</p>
                  </Link>
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
              { label: 'حركة خزينة', icon: Wallet, to: '/treasury/create', color: 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100' },
              { label: 'مصروف جديد', icon: TrendingDown, to: '/expenses/create', color: 'bg-red-50 text-red-600 hover:bg-red-100' },
              { label: 'عرض الخزينة', icon: PiggyBank, to: '/treasury', color: 'bg-blue-50 text-blue-600 hover:bg-blue-100' },
              { label: 'عرض المصروفات', icon: CreditCard, to: '/expenses', color: 'bg-amber-50 text-amber-600 hover:bg-amber-100' },
              { label: 'الشركاء', icon: Handshake, to: '/partners', color: 'bg-violet-50 text-violet-600 hover:bg-violet-100' },
              { label: 'الفواتير', icon: Receipt, to: '/invoices', color: 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100' },
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
        </div>
      </div>
    </div>
  );
}
