import { useState, useMemo } from 'react';
import { useTreasury, useTreasuryBalance, useCreateTransaction } from '../hooks/useTreasury';
import { formatDate } from '../utils';
import { exportToCSV } from '../utils/exportCsv';
import toast from 'react-hot-toast';
import {
  Download, Plus, X, Landmark, ArrowUpCircle, ArrowDownCircle,
  TrendingUp, TrendingDown, Filter, RefreshCw, Search,
} from 'lucide-react';
import { SkeletonTable } from '../components/Skeletons';

const categoryLabels: Record<string, string> = {
  revenue: 'إيرادات',
  salaries: 'رواتب',
  client_expense: 'مصروفات عملاء',
  partner_payment: 'سحب شريك',
  partner_capital: 'رأس مال شريك',
  expense: 'مصروفات',
  other: 'أخرى',
};

const categoryIcons: Record<string, string> = {
  revenue: '💰', salaries: '👤', client_expense: '📋',
  partner_payment: '🤝', partner_capital: '🏦', expense: '📊', other: '📎',
};

const currencyLabels: Record<string, string> = {
  EGP: 'جنيه مصري',
  USD: 'دولار أمريكي',
  SAR: 'ريال سعودي',
};

const currencyIcons: Record<string, string> = { EGP: 'ج.م', USD: '$', SAR: 'ر.س' };

const currencyColors: Record<string, { bg: string; text: string; icon: string }> = {
  EGP: { bg: 'bg-emerald-50', text: 'text-emerald-700', icon: 'bg-emerald-100 text-emerald-600' },
  USD: { bg: 'bg-blue-50', text: 'text-blue-700', icon: 'bg-blue-100 text-blue-600' },
  SAR: { bg: 'bg-purple-50', text: 'text-purple-700', icon: 'bg-purple-100 text-purple-600' },
};

export default function Treasury() {
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [showFilters, setShowFilters] = useState(false);
  const { data: txData, isLoading, isError, refetch } = useTreasury(filters);
  const { data: balance } = useTreasuryBalance();
  const createMutation = useCreateTransaction();
  const transactions = txData?.data ?? [];
  const meta = txData?.meta;

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    type: 'in' as 'in' | 'out',
    amount: '',
    currency: 'EGP',
    category: 'revenue',
    description: '',
    date: new Date().toISOString().split('T')[0],
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createMutation.mutateAsync({
        type: form.type,
        amount: parseFloat(form.amount),
        currency: form.currency as 'EGP' | 'USD' | 'SAR',
        category: form.category,
        description: form.description,
        date: form.date,
      });
      setShowForm(false);
      setForm({ type: 'in', amount: '', currency: 'EGP', category: 'revenue', description: '', date: new Date().toISOString().split('T')[0] });
      toast.success('تم تسجيل الحركة بنجاح');
    } catch {
      toast.error('حدث خطأ في تسجيل الحركة');
    }
  };

  const balanceData = (balance as Record<string, number> | undefined) ?? {};

  // Summary stats from current transactions
  const stats = useMemo(() => {
    const totalIn = transactions.filter(t => t.type === 'in').reduce((s, t) => s + Number(t.amount || 0), 0);
    const totalOut = transactions.filter(t => t.type === 'out').reduce((s, t) => s + Number(t.amount || 0), 0);
    return { totalIn, totalOut, count: transactions.length };
  }, [transactions]);

  const hasActiveFilters = Object.values(filters).some(v => v && v !== '');
  const clearFilters = () => { setFilters({}); };

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">الخزينة</h1>
          <p className="page-subtitle">إدارة الحركات المالية والأرصدة — نظرة شاملة على التدفقات النقدية</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => exportToCSV('treasury', ['التاريخ', 'النوع', 'التصنيف', 'المبلغ', 'العملة', 'الوصف', 'الرصيد بعد'], transactions.map(tx => [tx.date, tx.type === 'in' ? 'إيداع' : 'سحب', categoryLabels[tx.category] || tx.category, String(tx.amount), tx.currency, tx.description, String(tx.balance_after)]))} disabled={transactions.length === 0} className="btn-secondary">
            <Download size={16} /> تصدير
          </button>
          <button onClick={() => setShowForm(!showForm)} className={showForm ? 'btn-secondary' : 'btn-primary'}>
            {showForm ? <><X size={16} /> إلغاء</> : <><Plus size={16} /> حركة جديدة</>}
          </button>
        </div>
      </div>

      {/* Balance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {(['EGP', 'USD', 'SAR'] as const).map(currency => {
          const colors = currencyColors[currency];
          const val = Number(balanceData[currency] || 0);
          return (
            <div key={currency} className="stat-card group">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{currencyLabels[currency]}</p>
                  <p className={`text-[1.75rem] font-bold mt-1.5 ${val >= 0 ? 'text-gray-900' : 'text-red-600'}`}>
                    {val.toLocaleString('en', { minimumFractionDigits: 2 })}
                  </p>
                  <p className="text-[11px] text-gray-400 mt-1">{currencyIcons[currency]}</p>
                </div>
                <div className={`w-12 h-12 rounded-2xl ${colors.icon} flex items-center justify-center font-bold text-sm transition-transform group-hover:scale-110`}>
                  {currencyIcons[currency]}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card card-body flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
            <TrendingUp size={20} className="text-emerald-600" />
          </div>
          <div>
            <p className="text-xs text-gray-400 font-medium">إجمالي الوارد</p>
            <p className="text-lg font-bold text-emerald-600">+{stats.totalIn.toLocaleString('en', { minimumFractionDigits: 2 })}</p>
          </div>
        </div>
        <div className="card card-body flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
            <TrendingDown size={20} className="text-red-600" />
          </div>
          <div>
            <p className="text-xs text-gray-400 font-medium">إجمالي الصادر</p>
            <p className="text-lg font-bold text-red-500">-{stats.totalOut.toLocaleString('en', { minimumFractionDigits: 2 })}</p>
          </div>
        </div>
        <div className="card card-body flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center">
            <Landmark size={20} className="text-primary-600" />
          </div>
          <div>
            <p className="text-xs text-gray-400 font-medium">عدد الحركات</p>
            <p className="text-lg font-bold text-gray-900">{meta?.total ?? stats.count}</p>
          </div>
        </div>
      </div>

      {/* New Transaction Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="card card-body space-y-4 animate-fade-in-up border-r-4 border-primary-500">
          <h3 className="text-base font-bold text-gray-800 flex items-center gap-2">
            <Plus size={18} className="text-primary-600" />
            تسجيل حركة جديدة
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="input-label">النوع</label>
              <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value as 'in' | 'out' })} className="select">
                <option value="in">⬆ إيداع (وارد)</option>
                <option value="out">⬇ سحب (صادر)</option>
              </select>
            </div>
            <div>
              <label className="input-label">التصنيف</label>
              <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className="select">
                {Object.entries(categoryLabels).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="input-label">المبلغ</label>
              <input type="number" step="0.01" min="0.01" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} className="input" placeholder="0.00" required />
            </div>
            <div>
              <label className="input-label">العملة</label>
              <select value={form.currency} onChange={e => setForm({ ...form, currency: e.target.value })} className="select">
                <option value="EGP">🇪🇬 جنيه مصري (EGP)</option>
                <option value="USD">🇺🇸 دولار (USD)</option>
                <option value="SAR">🇸🇦 ريال (SAR)</option>
              </select>
            </div>
            <div>
              <label className="input-label">التاريخ</label>
              <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} className="input" required />
            </div>
          </div>
          <div>
            <label className="input-label">الوصف</label>
            <input type="text" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="input" placeholder="وصف الحركة المالية..." required />
          </div>
          <div className="flex gap-2 pt-1">
            <button type="submit" disabled={createMutation.isPending} className="btn-primary">
              {createMutation.isPending ? 'جاري الحفظ...' : 'حفظ الحركة'}
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">إلغاء</button>
          </div>
        </form>
      )}

      {/* Filters */}
      <div className="card card-body">
        <div className="flex items-center justify-between mb-3">
          <button onClick={() => setShowFilters(!showFilters)} className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-primary-600 transition-colors">
            <Filter size={16} />
            فلترة الحركات
            {hasActiveFilters && <span className="w-2 h-2 rounded-full bg-primary-500" />}
          </button>
          <div className="flex items-center gap-2">
            {hasActiveFilters && (
              <button onClick={clearFilters} className="text-xs text-red-500 hover:text-red-600 flex items-center gap-1">
                <X size={14} /> مسح الفلاتر
              </button>
            )}
            <button onClick={() => refetch()} className="btn-icon" title="تحديث">
              <RefreshCw size={16} />
            </button>
          </div>
        </div>

        {showFilters && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 animate-fade-in">
            <select value={filters.type || ''} onChange={e => setFilters(f => ({ ...f, type: e.target.value }))} className="select text-sm">
              <option value="">كل الأنواع</option>
              <option value="in">وارد (إيداع)</option>
              <option value="out">صادر (سحب)</option>
            </select>
            <select value={filters.category || ''} onChange={e => setFilters(f => ({ ...f, category: e.target.value }))} className="select text-sm">
              <option value="">كل التصنيفات</option>
              {Object.entries(categoryLabels).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
            <select value={filters.currency || ''} onChange={e => setFilters(f => ({ ...f, currency: e.target.value }))} className="select text-sm">
              <option value="">كل العملات</option>
              <option value="EGP">EGP</option>
              <option value="USD">USD</option>
              <option value="SAR">SAR</option>
            </select>
            <input type="date" value={filters.from || ''} onChange={e => setFilters(f => ({ ...f, from: e.target.value }))} className="input text-sm" placeholder="من تاريخ" />
            <input type="date" value={filters.to || ''} onChange={e => setFilters(f => ({ ...f, to: e.target.value }))} className="input text-sm" placeholder="إلى تاريخ" />
          </div>
        )}
      </div>

      {/* Transactions Table */}
      <div className="table-container">
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>التاريخ</th>
                <th>النوع</th>
                <th>التصنيف</th>
                <th>المبلغ</th>
                <th>العملة</th>
                <th>الوصف</th>
                <th>الرصيد بعد</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <SkeletonTable rows={5} cols={7} />
              ) : isError ? (
                <tr><td colSpan={7} className="text-center py-16">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center">
                      <X size={24} className="text-red-400" />
                    </div>
                    <p className="text-red-400 font-medium">حدث خطأ في تحميل البيانات</p>
                    <button onClick={() => refetch()} className="btn-secondary text-sm">
                      <RefreshCw size={14} /> إعادة المحاولة
                    </button>
                  </div>
                </td></tr>
              ) : transactions.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-16">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center">
                      <Landmark size={28} className="text-gray-300" />
                    </div>
                    <p className="text-gray-500 font-medium">لا يوجد حركات مالية</p>
                    <p className="text-xs text-gray-400">ابدأ بإضافة أول حركة مالية</p>
                  </div>
                </td></tr>
              ) : transactions.map((tx) => (
                <tr key={tx.id}>
                  <td className="text-gray-500 text-[13px] whitespace-nowrap">{formatDate(tx.date)}</td>
                  <td>
                    <span className={`badge ${tx.type === 'in' ? 'badge-success' : 'badge-danger'} flex items-center gap-1 w-fit`}>
                      {tx.type === 'in' ? <ArrowUpCircle size={13} /> : <ArrowDownCircle size={13} />}
                      {tx.type === 'in' ? 'وارد' : 'صادر'}
                    </span>
                  </td>
                  <td>
                    <span className="flex items-center gap-1.5 text-gray-600 text-[13px]">
                      <span>{categoryIcons[tx.category] || '📎'}</span>
                      {categoryLabels[tx.category] || tx.category}
                    </span>
                  </td>
                  <td className={`font-bold text-[15px] ${tx.type === 'in' ? 'text-emerald-600' : 'text-red-500'}`}>
                    {tx.type === 'in' ? '+' : '-'}{Number(tx.amount || 0).toLocaleString('en', { minimumFractionDigits: 2 })}
                  </td>
                  <td>
                    <span className="badge badge-neutral text-[11px]">{tx.currency}</span>
                  </td>
                  <td className="text-gray-500 text-[13px] max-w-[250px] truncate" title={tx.description}>{tx.description}</td>
                  <td className="font-bold text-gray-900 whitespace-nowrap">
                    {Number(tx.balance_after || 0).toLocaleString('en', { minimumFractionDigits: 2 })} <span className="text-[11px] text-gray-400">{tx.currency}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {meta && meta.last_page > 1 && (
          <div className="flex items-center justify-between px-5 py-4 border-t border-gray-100">
            <p className="text-xs text-gray-400">
              عرض {((meta.current_page - 1) * meta.per_page) + 1} - {Math.min(meta.current_page * meta.per_page, meta.total)} من {meta.total} حركة
            </p>
            <div className="flex items-center gap-1">
              {Array.from({ length: meta.last_page }, (_, i) => (
                <button key={i + 1} onClick={() => setFilters(f => ({ ...f, page: String(i + 1) }))}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    meta.current_page === i + 1
                      ? 'bg-primary-600 text-white shadow-sm'
                      : 'bg-surface-100 text-gray-600 hover:bg-surface-200'
                  }`}>
                  {i + 1}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
