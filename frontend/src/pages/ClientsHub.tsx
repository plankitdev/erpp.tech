import { Link } from 'react-router-dom';
import { useDashboard } from '../hooks/useDashboard';
import { useClients } from '../hooks/useClients';
import { useContracts } from '../hooks/useContracts';
import { useInvoices } from '../hooks/useInvoices';
import { useAuthStore } from '../store/authStore';
import { formatCurrency, formatDate, statusLabels } from '../utils';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import {
  Users, FileText, Receipt, TrendingUp, ArrowUpRight, AlertTriangle,
  Plus, CreditCard, CheckCircle2, Clock, Sparkles,
} from 'lucide-react';
import StatusBadge from '../components/StatusBadge';
import Breadcrumbs from '../components/Breadcrumbs';
import type { Contract, Invoice } from '../types';

const COLORS = ['#2c9f8f', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function ClientsHub() {
  const { hasPermission } = useAuthStore();
  const canViewContracts = hasPermission('contracts') || hasPermission('clients');
  const canViewInvoices = hasPermission('invoices');
  const { data: dashData, isLoading: dashLoading } = useDashboard();
  const { data: clientsData } = useClients({ per_page: 1000 });
  const { data: contractsData } = useContracts({ per_page: 1000 }, { enabled: canViewContracts });
  const { data: invoicesData } = useInvoices({ per_page: 5 }, { enabled: canViewInvoices });

  const stats = (dashData || {}) as Record<string, any>;
  const clients = clientsData?.data || [];
  const contracts = contractsData?.data || [];
  const invoices = invoicesData?.data || [];

  // Client status distribution
  const clientsByStatus = [
    { name: 'نشط', value: clients.filter((c: any) => c.status === 'active').length },
    { name: 'غير نشط', value: clients.filter((c: any) => c.status === 'inactive').length },
    { name: 'محتمل', value: clients.filter((c: any) => c.status === 'lead').length },
  ].filter(s => s.value > 0);

  // Invoice status distribution
  const invoicesByStatus = [
    { name: 'مدفوعة', value: 0, color: '#10b981' },
    { name: 'معلقة', value: 0, color: '#f59e0b' },
    { name: 'متأخرة', value: 0, color: '#ef4444' },
    { name: 'جزئية', value: 0, color: '#8b5cf6' },
  ];

  // Contracts expiring soon (30 days)
  const expiringContracts = contracts.filter((c: Contract) => {
    if (c.status !== 'active' || !c.end_date) return false;
    const days = Math.ceil((new Date(c.end_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return days > 0 && days <= 30;
  });

  // Sectors distribution
  const sectorMap = new Map<string, number>();
  clients.forEach((c: any) => {
    const s = c.sector || 'غير محدد';
    sectorMap.set(s, (sectorMap.get(s) || 0) + 1);
  });
  const sectorData = Array.from(sectorMap.entries()).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 6);

  if (dashLoading) {
    return (
      <div className="page-container">
        <div className="h-32 bg-gradient-to-l from-blue-100 to-blue-50 rounded-2xl animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {[1,2,3,4].map(i => <div key={i} className="h-32 bg-white rounded-2xl animate-pulse border border-gray-100" />)}
        </div>
      </div>
    );
  }

  const statCards = [
    { label: 'إجمالي العملاء', value: stats.clients_count || clients.length, icon: Users, bg: 'bg-blue-500', link: '/clients' },
    { label: 'العقود النشطة', value: stats.active_contracts || 0, icon: FileText, bg: 'bg-emerald-500', link: '/contracts' },
    { label: 'الفواتير المعلقة', value: stats.pending_invoices || 0, icon: Receipt, bg: 'bg-amber-500', link: '/invoices' },
    { label: 'إجمالي الإيرادات', value: formatCurrency(stats.total_revenue || 0), icon: TrendingUp, bg: 'bg-primary-500' },
  ];

  return (
    <div className="page-container">
      <Breadcrumbs items={[{ label: 'العملاء والمبيعات' }]} />

      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-l from-blue-600 via-blue-700 to-indigo-800 p-7">
        <div className="absolute top-0 left-0 w-72 h-72 bg-white/[0.04] rounded-full -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-56 h-56 bg-white/[0.03] rounded-full translate-x-1/4 translate-y-1/4" />
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Sparkles size={18} className="text-blue-300" />
              <span className="text-blue-200 text-sm font-medium">نظرة عامة</span>
            </div>
            <h1 className="text-2xl font-bold text-white mb-1">العملاء والمبيعات</h1>
            <p className="text-blue-200/80 text-sm">إدارة العملاء والعقود والفواتير</p>
          </div>
          <div className="hidden md:flex items-center gap-3">
            <Link to="/clients/create" className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-all border border-white/10">
              <Plus size={16} /> عميل جديد
            </Link>
            <Link to="/clients/financial" className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-all border border-white/10">
              <CreditCard size={16} /> الملخص المالي
            </Link>
            <Link to="/invoices/create" className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-all border border-white/10">
              <Receipt size={16} /> فاتورة جديدة
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
        {/* Client Status Distribution */}
        <div className="card card-body animate-fade-in-up">
          <h3 className="text-lg font-bold text-gray-900 mb-1">توزيع العملاء</h3>
          <p className="text-xs text-gray-400 mb-4">حسب الحالة</p>
          {clientsByStatus.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={200} minWidth={0} minHeight={0}>
                <PieChart>
                  <Pie data={clientsByStatus} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={4} dataKey="value" stroke="none">
                    {clientsByStatus.map((_, idx) => <Cell key={idx} fill={COLORS[idx % COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px', direction: 'rtl' }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 mt-2">
                {clientsByStatus.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[idx] }} />
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

        {/* Sectors Distribution */}
        <div className="card card-body animate-fade-in-up">
          <h3 className="text-lg font-bold text-gray-900 mb-1">القطاعات</h3>
          <p className="text-xs text-gray-400 mb-4">توزيع العملاء حسب القطاع</p>
          {sectorData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280} minWidth={0} minHeight={0}>
              <BarChart data={sectorData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} width={80} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px', direction: 'rtl' }} />
                <Bar dataKey="value" fill="#3b82f6" radius={[0, 6, 6, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center py-10 text-gray-400 text-sm">لا توجد بيانات</div>
          )}
        </div>

        {/* Expiring Contracts Alert */}
        <div className="card overflow-hidden animate-fade-in-up">
          <div className="flex items-center justify-between p-6 pb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center ring-1 ring-amber-100">
                <AlertTriangle size={18} className="text-amber-600" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900">عقود تنتهي قريباً</h3>
                <p className="text-[11px] text-gray-400 mt-0.5">خلال 30 يوم</p>
              </div>
            </div>
            <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full font-bold">{expiringContracts.length}</span>
          </div>
          <div className="px-6 pb-5">
            {expiringContracts.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle2 size={36} className="text-emerald-300 mx-auto mb-2" />
                <p className="text-sm text-gray-400">جميع العقود في أمان</p>
              </div>
            ) : (
              <div className="space-y-2">
                {expiringContracts.slice(0, 5).map((c: Contract) => {
                  const days = Math.ceil((new Date(c.end_date!).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                  return (
                    <Link key={c.id} to={`/contracts/${c.id}/edit`}
                      className="flex items-center justify-between p-3 rounded-xl hover:bg-amber-50 transition-colors group">
                      <div>
                        <p className="text-sm font-semibold text-gray-800">{c.client?.company_name || c.client?.name}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{formatCurrency(c.value ?? 0, c.currency)}</p>
                      </div>
                      <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full font-bold">
                        {days} يوم
                      </span>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Invoices + Quick Links */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Recent Invoices */}
        <div className="card overflow-hidden animate-fade-in-up">
          <div className="flex items-center justify-between p-6 pb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center ring-1 ring-primary-100">
                <Receipt size={18} className="text-primary-600" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900">أحدث الفواتير</h3>
                <p className="text-[11px] text-gray-400 mt-0.5">آخر المعاملات</p>
              </div>
            </div>
            <Link to="/invoices" className="text-xs text-primary-600 hover:text-primary-700 font-medium">عرض الكل</Link>
          </div>
          <div className="px-6 pb-5">
            {invoices.length === 0 ? (
              <div className="text-center py-8 text-gray-400 text-sm">لا توجد فواتير</div>
            ) : (
              <div className="space-y-0.5">
                {invoices.map((inv: Invoice) => (
                  <Link key={inv.id} to={`/invoices/${inv.id}`}
                    className="flex items-center justify-between py-3 px-3 -mx-3 rounded-xl hover:bg-surface-50 transition-colors group">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-primary-50 group-hover:text-primary-500 transition-all">
                        <Receipt size={15} />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-800 text-[13px]">{inv.contract?.client?.name || 'بدون عميل'}</p>
                        <div className="flex items-center gap-1.5 text-[11px] text-gray-400 mt-0.5">
                          <Clock size={10} />
                          <span>{formatDate(inv.due_date)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-left">
                      <p className="font-bold text-gray-800 text-[13px]">{formatCurrency(inv.amount, inv.currency)}</p>
                      <StatusBadge status={inv.status} size="sm" />
                    </div>
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
              { label: 'إضافة عميل', icon: Users, to: '/clients/create', color: 'bg-blue-50 text-blue-600 hover:bg-blue-100' },
              { label: 'عقد جديد', icon: FileText, to: '/contracts/create', color: 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100' },
              { label: 'فاتورة جديدة', icon: Receipt, to: '/invoices/create', color: 'bg-amber-50 text-amber-600 hover:bg-amber-100' },
              { label: 'تسجيل دفعة', icon: CreditCard, to: '/invoices', color: 'bg-violet-50 text-violet-600 hover:bg-violet-100' },
              { label: 'عرض العملاء', icon: Users, to: '/clients', color: 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100' },
              { label: 'عرض العقود', icon: FileText, to: '/contracts', color: 'bg-teal-50 text-teal-600 hover:bg-teal-100' },
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
