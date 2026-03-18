import { useState } from 'react';
import { usePartners, useCreatePartner, useDeletePartner, useMonthlyProfit, useRecordPartnerPayment } from '../hooks/usePartners';
import {
  Trash2, Plus, Eye, DollarSign, TrendingUp, TrendingDown, Users,
  CreditCard, X, Wallet, PiggyBank, Pencil, ChevronLeft, ChevronRight,
  BadgeDollarSign, ArrowUpRight, ArrowDownLeft, Landmark, Phone,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import ConfirmDialog from '../components/ConfirmDialog';
import StatusBadge from '../components/StatusBadge';
import { SkeletonCard, SkeletonTable } from '../components/Skeletons';
import type { MonthlyProfitData, PartnerDistribution, Partner } from '../types';

const paymentTypeConfig: Record<string, { label: string; color: string; icon: typeof DollarSign; direction: 'out' | 'in' }> = {
  profit_share:         { label: 'توزيع أرباح',    color: 'text-emerald-600 bg-emerald-50', icon: DollarSign,      direction: 'out' },
  advance:              { label: 'سلفة',           color: 'text-blue-600 bg-blue-50',      icon: ArrowUpRight,    direction: 'out' },
  expense:              { label: 'مصروفات',         color: 'text-red-500 bg-red-50',        icon: TrendingDown,    direction: 'out' },
  withdrawal:           { label: 'سحب',            color: 'text-amber-600 bg-amber-50',    icon: Wallet,          direction: 'out' },
  capital_contribution: { label: 'إيداع رأس مال',  color: 'text-purple-600 bg-purple-50',  icon: PiggyBank,       direction: 'in' },
  deposit:              { label: 'إيداع',          color: 'text-indigo-600 bg-indigo-50',  icon: ArrowDownLeft,   direction: 'in' },
};

const arabicMonths = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];

export default function Partners() {
  const navigate = useNavigate();
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [showForm, setShowForm] = useState(false);
  const [editingPartner, setEditingPartner] = useState<Partner | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState<PartnerDistribution | null>(null);
  const [activeTab, setActiveTab] = useState<'distribution' | 'list'>('distribution');
  const [form, setForm] = useState({ name: '', share_percentage: '', capital: '', phone: '', bank_account: '' });
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [paymentForm, setPaymentForm] = useState({
    amount: '', currency: 'EGP', type: 'profit_share',
    payment_date: new Date().toISOString().split('T')[0], notes: '',
  });

  const { data: partnersRaw, isLoading: partnersLoading } = usePartners();
  const { data: profitRaw, isLoading: profitLoading } = useMonthlyProfit(month, year);
  const createMutation = useCreatePartner();
  const deleteMutation = useDeletePartner();
  const recordPayment = useRecordPartnerPayment();

  const partners: Partner[] = partnersRaw?.data ?? [];
  const profit = (profitRaw as { data?: MonthlyProfitData } | undefined)?.data as MonthlyProfitData | undefined;
  const distribution: PartnerDistribution[] = profit?.distribution ?? [];

  const totalCapital = distribution.reduce((s, d) => s + (d.capital || 0), 0);
  const totalEntitlement = distribution.reduce((s, d) => s + (d.entitlement || 0), 0);
  const totalReceived = distribution.reduce((s, d) => s + (d.received || 0), 0);
  const totalRemaining = distribution.reduce((s, d) => s + (d.remaining || 0), 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createMutation.mutateAsync({
        name: form.name,
        share_percentage: parseFloat(form.share_percentage),
        capital: form.capital ? parseFloat(form.capital) : 0,
        phone: form.phone || undefined,
        bank_account: form.bank_account || undefined,
      });
      setShowForm(false);
      setForm({ name: '', share_percentage: '', capital: '', phone: '', bank_account: '' });
      toast.success('تم إضافة الشريك بنجاح');
    } catch {
      toast.error('حدث خطأ في إضافة الشريك');
    }
  };

  const handleDelete = (id: number) => {
    setDeleteId(id);
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteMutation.mutateAsync(deleteId);
      toast.success('تم حذف الشريك');
    } catch {
      toast.error('حدث خطأ');
    }
    setDeleteId(null);
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showPaymentModal) return;
    try {
      await recordPayment.mutateAsync({
        partnerId: showPaymentModal.id,
        data: {
          ...paymentForm,
          amount: parseFloat(paymentForm.amount),
          month, year,
        },
      });
      setShowPaymentModal(null);
      setPaymentForm({ amount: '', currency: 'EGP', type: 'profit_share', payment_date: new Date().toISOString().split('T')[0], notes: '' });
      toast.success('تم تسجيل الدفعة بنجاح');
    } catch {
      toast.error('حدث خطأ في تسجيل الدفعة');
    }
  };

  const navigateMonth = (dir: number) => {
    let m = month + dir;
    let y = year;
    if (m > 12) { m = 1; y++; }
    if (m < 1) { m = 12; y--; }
    setMonth(m);
    setYear(y);
  };

  const openEditForm = (p: Partner) => {
    setEditingPartner(p);
    setForm({
      name: p.name,
      share_percentage: String(p.share_percentage),
      capital: String(p.capital || 0),
      phone: p.phone || '',
      bank_account: p.bank_account || '',
    });
    setShowForm(true);
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingPartner(null);
    setForm({ name: '', share_percentage: '', capital: '', phone: '', bank_account: '' });
  };

  // Format number with locale
  const fmt = (n: number) => n?.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 }) ?? '0';

  return (
    <div className="page-container">
      {/* ===== HEADER ===== */}
      <div className="page-header">
        <div>
          <h1 className="page-title">إدارة الشركاء</h1>
          <p className="page-subtitle">توزيع الأرباح والمتابعة المالية للشركاء</p>
        </div>
        <button onClick={() => showForm ? resetForm() : setShowForm(true)} className={showForm ? 'btn-secondary' : 'btn-primary'}>
          {showForm ? <><X size={16} /> إلغاء</> : <><Plus size={16} /> شريك جديد</>}
        </button>
      </div>

      {/* ===== MONTH NAVIGATOR ===== */}
      <div className="card card-body !py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button onClick={() => navigateMonth(-1)} className="action-icon text-gray-400 hover:text-primary-600 hover:bg-primary-50">
            <ChevronRight size={18} />
          </button>
          <div className="flex items-center gap-2 min-w-[200px] justify-center">
            <select value={month} onChange={e => setMonth(Number(e.target.value))} className="select max-w-[130px] text-center">
              {arabicMonths.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
            </select>
            <select value={year} onChange={e => setYear(Number(e.target.value))} className="select max-w-[90px] text-center">
              {Array.from({ length: 5 }, (_, i) => now.getFullYear() - 2 + i).map(y =>
                <option key={y} value={y}>{y}</option>
              )}
            </select>
          </div>
          <button onClick={() => navigateMonth(1)} className="action-icon text-gray-400 hover:text-primary-600 hover:bg-primary-50">
            <ChevronLeft size={18} />
          </button>
        </div>
        <span className="text-xs text-gray-400 hidden sm:block">
          {distribution.length} شريك نشط
        </span>
      </div>

      {/* ===== FINANCIAL SUMMARY ===== */}
      {profit && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'الإيرادات', value: profit.revenue, icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50', desc: 'فواتير مدفوعة' },
            { label: 'المصروفات', value: profit.expenses, icon: TrendingDown, color: 'text-red-500', bg: 'bg-red-50', desc: 'بدون الرواتب' },
            { label: 'الرواتب', value: profit.salaries, icon: Users, color: 'text-amber-600', bg: 'bg-amber-50', desc: 'رواتب الموظفين' },
            { label: 'صافي الربح', value: profit.net_profit, icon: DollarSign, color: profit.net_profit >= 0 ? 'text-primary-600' : 'text-red-600', bg: profit.net_profit >= 0 ? 'bg-primary-50' : 'bg-red-50', desc: 'إيرادات − مصروفات − رواتب' },
          ].map((item) => (
            <div key={item.label} className="stat-card">
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{item.label}</p>
                <div className={`w-9 h-9 rounded-lg ${item.bg} flex items-center justify-center`}>
                  <item.icon size={17} className={item.color} />
                </div>
              </div>
              <p className={`text-2xl font-bold ${item.color}`}>{fmt(item.value)} <span className="text-xs font-normal text-gray-400">ج.م</span></p>
              <p className="text-[11px] text-gray-400 mt-1">{item.desc}</p>
            </div>
          ))}
        </div>
      )}

      {/* ===== ADD PARTNER FORM ===== */}
      {showForm && (
        <form onSubmit={handleSubmit} className="card card-body animate-fade-in-up">
          <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Users size={18} className="text-primary-500" />
            {editingPartner ? 'تعديل بيانات الشريك' : 'إضافة شريك جديد'}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <label className="input-label">اسم الشريك *</label>
              <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="input" required placeholder="مثال: أحمد محمد" />
            </div>
            <div>
              <label className="input-label">نسبة المشاركة % *</label>
              <input type="number" step="0.01" min={0} max={100} value={form.share_percentage}
                onChange={e => setForm({ ...form, share_percentage: e.target.value })} className="input" required placeholder="مثال: 30" />
            </div>
            <div>
              <label className="input-label">رأس المال المدفوع</label>
              <input type="number" step="0.01" min={0} value={form.capital}
                onChange={e => setForm({ ...form, capital: e.target.value })} className="input" placeholder="0.00" />
            </div>
            <div>
              <label className="input-label">رقم الهاتف</label>
              <input type="text" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="input" placeholder="01xxxxxxxxx" />
            </div>
            <div>
              <label className="input-label">الحساب البنكي</label>
              <input type="text" value={form.bank_account} onChange={e => setForm({ ...form, bank_account: e.target.value })} className="input" placeholder="رقم الحساب" />
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between">
            <p className="text-xs text-gray-400">
              * مجموع نسب الشركاء الحاليين: <span className="font-semibold text-gray-600">{distribution.reduce((s, d) => s + Number(d.share_percentage), 0)}%</span>
            </p>
            <div className="flex gap-2">
              <button type="button" onClick={resetForm} className="btn-secondary">إلغاء</button>
              <button type="submit" disabled={createMutation.isPending} className="btn-primary disabled:opacity-50">
                {createMutation.isPending ? 'جاري الحفظ...' : editingPartner ? 'حفظ التعديلات' : 'إضافة الشريك'}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* ===== TABS ===== */}
      <div className="tab-bar">
        <button className={`tab-item ${activeTab === 'distribution' ? 'active' : ''}`} onClick={() => setActiveTab('distribution')}>
          <BadgeDollarSign size={16} /> توزيع الأرباح
          {distribution.length > 0 && <span className="text-xs bg-primary-100 text-primary-700 px-1.5 py-0.5 rounded-full mr-1">{distribution.length}</span>}
        </button>
        <button className={`tab-item ${activeTab === 'list' ? 'active' : ''}`} onClick={() => setActiveTab('list')}>
          <Users size={16} /> قائمة الشركاء
          {partners.length > 0 && <span className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-full mr-1">{partners.length}</span>}
        </button>
      </div>

      {/* ===== DISTRIBUTION TAB ===== */}
      {activeTab === 'distribution' && (
        <>
          {profitLoading ? (
            <div className="card card-body flex items-center justify-center py-16">
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 w-full">
                {[1,2,3].map(i => <SkeletonCard key={i} />)}
              </div>
            </div>
          ) : distribution.length > 0 ? (
            <>
              {/* Distribution Summary Bar */}
              <div className="card card-body !py-3 grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                <div>
                  <p className="text-xs text-gray-400">إجمالي رأس المال</p>
                  <p className="text-lg font-bold text-primary-600">{fmt(totalCapital)} <span className="text-xs font-normal">ج.م</span></p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">إجمالي المستحق</p>
                  <p className="text-lg font-bold text-indigo-600">{fmt(totalEntitlement)} <span className="text-xs font-normal">ج.م</span></p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">إجمالي المستلم</p>
                  <p className="text-lg font-bold text-emerald-600">{fmt(totalReceived)} <span className="text-xs font-normal">ج.م</span></p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">إجمالي المتبقي</p>
                  <p className={`text-lg font-bold ${totalRemaining > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>{fmt(totalRemaining)} <span className="text-xs font-normal">ج.م</span></p>
                </div>
              </div>

              {/* Partner Distribution Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {distribution.map((d: PartnerDistribution) => {
                  const percentage = d.entitlement > 0 ? Math.min((d.received / d.entitlement) * 100, 100) : 0;
                  const isFullyPaid = d.remaining <= 0 && d.entitlement > 0;
                  return (
                    <div key={d.id} className="card overflow-hidden">
                      {/* Card Header with gradient */}
                      <div className={`px-5 py-4 ${isFullyPaid ? 'bg-gradient-to-l from-emerald-50 to-emerald-100/50' : 'bg-gradient-to-l from-gray-50 to-white'} border-b border-gray-100`}>
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-sm">
                              {d.name.charAt(0)}
                            </div>
                            <div>
                              <h3 className="font-bold text-gray-900">{d.name}</h3>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-xs bg-primary-50 text-primary-700 px-2 py-0.5 rounded-full font-medium">{d.share_percentage}%</span>
                                {d.capital > 0 && (
                                  <span className="text-xs bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full font-medium">رأس مال: {fmt(d.capital)}</span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-0.5">
                            <button onClick={() => navigate(`/partners/${d.id}/statement`)}
                              className="action-icon text-gray-400 hover:text-primary-600 hover:bg-primary-50" title="كشف حساب">
                              <Eye size={15} />
                            </button>
                            <button onClick={() => setShowPaymentModal(d)}
                              className="action-icon text-gray-400 hover:text-emerald-600 hover:bg-emerald-50" title="تسجيل دفعة">
                              <CreditCard size={15} />
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Card Body — Financial Details */}
                      <div className="px-5 py-4 space-y-3">
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-gray-500 flex items-center gap-1.5"><BadgeDollarSign size={14} /> المستحق من الأرباح</span>
                          <span className="font-bold text-primary-600 text-[15px]">{fmt(d.entitlement)} ج.م</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-gray-500 flex items-center gap-1.5"><ArrowUpRight size={14} /> تم استلامه</span>
                          <span className="font-semibold text-emerald-600">{fmt(d.received)} ج.م</span>
                        </div>
                        <div className="flex justify-between items-center text-sm pt-2 border-t border-gray-100">
                          <span className="text-gray-700 font-medium flex items-center gap-1.5"><Wallet size={14} /> المتبقي</span>
                          <span className={`font-bold text-[15px] ${d.remaining > 0 ? 'text-amber-600' : d.remaining < 0 ? 'text-red-500' : 'text-emerald-600'}`}>
                            {d.remaining > 0 ? `${fmt(d.remaining)} ج.م` : d.remaining < 0 ? `(${fmt(Math.abs(d.remaining))}) ج.م زيادة` : '✓ تم السداد'}
                          </span>
                        </div>

                        {/* Progress bar */}
                        <div>
                          <div className="flex justify-between text-[11px] text-gray-400 mb-1">
                            <span>نسبة السداد</span>
                            <span>{Math.round(percentage)}%</span>
                          </div>
                          <div className="w-full bg-gray-100 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full transition-all duration-700 ${isFullyPaid ? 'bg-gradient-to-l from-emerald-400 to-emerald-500' : 'bg-gradient-to-l from-primary-400 to-primary-600'}`}
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>

                        {/* Contact info */}
                        {(d.phone || d.bank_account) && (
                          <div className="flex items-center gap-3 pt-2 border-t border-gray-50 text-xs text-gray-400">
                            {d.phone && <span className="flex items-center gap-1"><Phone size={11} /> {d.phone}</span>}
                            {d.bank_account && <span className="flex items-center gap-1"><Landmark size={11} /> {d.bank_account}</span>}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          ) : !partnersLoading && (
            <div className="card card-body text-center py-16">
              <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
                <Users size={28} className="text-gray-300" />
              </div>
              <h3 className="font-semibold text-gray-600 mb-1">لا يوجد شركاء بعد</h3>
              <p className="text-sm text-gray-400 mb-4">أضف الشركاء وحدد نسبة كل واحد لبدء توزيع الأرباح تلقائياً</p>
              <button onClick={() => setShowForm(true)} className="btn-primary mx-auto">
                <Plus size={16} /> إضافة أول شريك
              </button>
            </div>
          )}
        </>
      )}

      {/* ===== PARTNERS LIST TAB ===== */}
      {activeTab === 'list' && (
        <>
          {partnersLoading ? (
            <div className="table-container">
              <table className="data-table"><tbody>
                <SkeletonTable rows={5} cols={9} />
              </tbody></table>
            </div>
          ) : partners.length > 0 ? (
            <div className="table-container">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                <h3 className="font-semibold text-gray-700 flex items-center gap-2">
                  <Users size={17} className="text-gray-400" />
                  جميع الشركاء
                </h3>
                <span className="text-xs text-gray-400">{partners.length} شريك</span>
              </div>
              <div className="table-wrapper">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>الشريك</th>
                      <th>الهاتف</th>
                      <th>الحساب البنكي</th>
                      <th>النسبة</th>
                      <th>رأس المال</th>
                      <th>عدد الدفعات</th>
                      <th>إجمالي المستلم</th>
                      <th>الحالة</th>
                      <th>إجراءات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {partners.map(p => (
                      <tr key={p.id}>
                        <td>
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-xs shrink-0">
                              {p.name.charAt(0)}
                            </div>
                            <span className="font-semibold text-gray-900">{p.name}</span>
                          </div>
                        </td>
                        <td className="text-gray-500 text-[13px]">{p.phone || <span className="text-gray-300">—</span>}</td>
                        <td className="text-gray-500 text-[13px]">{p.bank_account || <span className="text-gray-300">—</span>}</td>
                        <td>
                          <span className="inline-flex items-center gap-1 text-sm font-semibold text-primary-700 bg-primary-50 px-2 py-0.5 rounded-full">
                            {p.share_percentage}%
                          </span>
                        </td>
                        <td className="font-semibold text-purple-600">{fmt(p.capital ?? 0)} <span className="text-xs font-normal text-gray-400">ج.م</span></td>
                        <td className="text-gray-600">{p.payments_count ?? 0}</td>
                        <td className="font-semibold text-emerald-600">{fmt(p.payments_sum_amount ?? 0)} <span className="text-xs font-normal text-gray-400">ج.م</span></td>
                        <td>
                          <StatusBadge status={p.is_active ? 'active' : 'inactive'} size="sm" />
                        </td>
                        <td>
                          <div className="flex items-center gap-0.5">
                            <button onClick={() => navigate(`/partners/${p.id}/statement`)}
                              className="action-icon text-gray-400 hover:text-primary-600 hover:bg-primary-50" title="كشف حساب">
                              <Eye size={15} />
                            </button>
                            <button onClick={() => openEditForm(p)}
                              className="action-icon text-gray-400 hover:text-amber-600 hover:bg-amber-50" title="تعديل">
                              <Pencil size={15} />
                            </button>
                            <button onClick={() => handleDelete(p.id)}
                              className="action-icon text-gray-400 hover:text-red-500 hover:bg-red-50" title="حذف">
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="card card-body text-center py-12">
              <Users size={36} className="mx-auto mb-3 text-gray-300" />
              <p className="text-gray-400">لا يوجد شركاء. أضف شريك جديد للبدء.</p>
            </div>
          )}
        </>
      )}

      {/* ===== PAYMENT MODAL ===== */}
      {showPaymentModal && (
        <div className="modal-overlay">
          <div className="modal-backdrop" onClick={() => setShowPaymentModal(null)} />
          <div className="modal-content max-w-lg">
            <div className="modal-header">
              <div>
                <h3 className="text-lg font-bold text-gray-900">تسجيل دفعة</h3>
                <p className="text-sm text-gray-500 mt-0.5">
                  الشريك: <span className="font-semibold text-gray-700">{showPaymentModal.name}</span>
                  <span className="mx-1.5 text-gray-300">|</span>
                  <span className="text-gray-500">{arabicMonths[month - 1]} {year}</span>
                </p>
              </div>
              <button onClick={() => setShowPaymentModal(null)} className="action-icon text-gray-400 hover:text-gray-600"><X size={18} /></button>
            </div>

            <form id="partner-payment-form" onSubmit={handleRecordPayment} className="modal-body space-y-4">
              {/* Payment Direction Indicator */}
              <div className="grid grid-cols-2 gap-3">
                <button type="button" className={`p-3 rounded-xl text-center border-2 transition-all ${
                  ['profit_share', 'advance', 'expense', 'withdrawal'].includes(paymentForm.type)
                    ? 'border-red-200 bg-red-50 text-red-700'
                    : 'border-gray-100 text-gray-400 hover:border-gray-200'
                }`} onClick={() => setPaymentForm({ ...paymentForm, type: 'profit_share' })}>
                  <ArrowUpRight size={20} className="mx-auto mb-1" />
                  <span className="text-xs font-medium">دفع للشريك</span>
                </button>
                <button type="button" className={`p-3 rounded-xl text-center border-2 transition-all ${
                  ['capital_contribution', 'deposit'].includes(paymentForm.type)
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                    : 'border-gray-100 text-gray-400 hover:border-gray-200'
                }`} onClick={() => setPaymentForm({ ...paymentForm, type: 'capital_contribution' })}>
                  <ArrowDownLeft size={20} className="mx-auto mb-1" />
                  <span className="text-xs font-medium">استلام من الشريك</span>
                </button>
              </div>

              <div>
                <label className="input-label">المبلغ *</label>
                <div className="relative">
                  <input type="number" step="0.01" min="0.01" value={paymentForm.amount}
                    onChange={e => setPaymentForm({ ...paymentForm, amount: e.target.value })} className="input !pr-16" required placeholder="0.00" />
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">{paymentForm.currency}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="input-label">العملة</label>
                  <select value={paymentForm.currency}
                    onChange={e => setPaymentForm({ ...paymentForm, currency: e.target.value })} className="select">
                    <option value="EGP">جنيه مصري (EGP)</option>
                    <option value="SAR">ريال سعودي (SAR)</option>
                    <option value="USD">دولار (USD)</option>
                    <option value="EUR">يورو (EUR)</option>
                  </select>
                </div>
                <div>
                  <label className="input-label">نوع الدفعة</label>
                  <select value={paymentForm.type}
                    onChange={e => setPaymentForm({ ...paymentForm, type: e.target.value })} className="select">
                    <optgroup label="دفع للشريك ←">
                      <option value="profit_share">توزيع أرباح</option>
                      <option value="advance">سلفة</option>
                      <option value="expense">مصروفات</option>
                      <option value="withdrawal">سحب</option>
                    </optgroup>
                    <optgroup label="→ استلام من الشريك">
                      <option value="capital_contribution">إيداع رأس مال</option>
                      <option value="deposit">إيداع</option>
                    </optgroup>
                  </select>
                </div>
              </div>

              <div>
                <label className="input-label">تاريخ الدفع *</label>
                <input type="date" value={paymentForm.payment_date}
                  onChange={e => setPaymentForm({ ...paymentForm, payment_date: e.target.value })} className="input" required />
              </div>

              <div>
                <label className="input-label">ملاحظات</label>
                <textarea value={paymentForm.notes}
                  onChange={e => setPaymentForm({ ...paymentForm, notes: e.target.value })} className="input" rows={2} placeholder="ملاحظات اختيارية..." />
              </div>

              {/* Remaining info */}
              {showPaymentModal.entitlement > 0 && (
                <div className="bg-gray-50 rounded-xl p-3 text-xs text-gray-500 space-y-1">
                  <div className="flex justify-between"><span>المستحق هذا الشهر</span><span className="font-semibold text-gray-700">{fmt(showPaymentModal.entitlement)} ج.م</span></div>
                  <div className="flex justify-between"><span>تم استلامه</span><span className="font-semibold text-emerald-600">{fmt(showPaymentModal.received)} ج.م</span></div>
                  <div className="flex justify-between border-t border-gray-200 pt-1 mt-1"><span>المتبقي</span><span className="font-bold text-amber-600">{fmt(showPaymentModal.remaining)} ج.م</span></div>
                </div>
              )}
            </form>

            <div className="modal-footer">
              <button type="submit" form="partner-payment-form" disabled={recordPayment.isPending}
                className="btn-primary flex-1">
                {recordPayment.isPending ? 'جاري التسجيل...' : 'تسجيل الدفعة'}
              </button>
              <button type="button" onClick={() => setShowPaymentModal(null)} className="btn-secondary">إلغاء</button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={deleteId !== null}
        title="حذف الشريك"
        message="هل أنت متأكد من حذف هذا الشريك؟ سيتم حذف جميع دفعاته."
        confirmText="حذف"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}
