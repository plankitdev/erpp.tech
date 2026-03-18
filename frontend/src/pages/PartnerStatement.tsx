import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { usePartnerStatement, useDeletePartnerPayment } from '../hooks/usePartners';
import {
  ArrowRight, Calendar, DollarSign, TrendingUp, TrendingDown, Users,
  BadgeDollarSign, Wallet, ArrowUpRight, ArrowDownLeft, PiggyBank,
  Phone, Landmark, Trash2, ChevronDown, ChevronUp, CreditCard,
} from 'lucide-react';
import toast from 'react-hot-toast';
import ConfirmDialog from '../components/ConfirmDialog';
import type { PartnerStatementData } from '../types';

const typeConfig: Record<string, { label: string; color: string; badgeClass: string; direction: 'in' | 'out' }> = {
  profit_share:         { label: 'توزيع أرباح',   color: 'text-emerald-600', badgeClass: 'bg-emerald-50 text-emerald-700',  direction: 'out' },
  advance:              { label: 'سلفة',          color: 'text-blue-600',    badgeClass: 'bg-blue-50 text-blue-700',        direction: 'out' },
  expense:              { label: 'مصروفات',        color: 'text-red-500',     badgeClass: 'bg-red-50 text-red-700',          direction: 'out' },
  withdrawal:           { label: 'سحب',           color: 'text-amber-600',   badgeClass: 'bg-amber-50 text-amber-700',      direction: 'out' },
  capital_contribution: { label: 'إيداع رأس مال', color: 'text-purple-600',  badgeClass: 'bg-purple-50 text-purple-700',    direction: 'in' },
  deposit:              { label: 'إيداع',         color: 'text-indigo-600',  badgeClass: 'bg-indigo-50 text-indigo-700',    direction: 'in' },
};

export default function PartnerStatement() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [expandedMonth, setExpandedMonth] = useState<number | null>(now.getMonth() + 1);
  const deletePayment = useDeletePartnerPayment();

  const [deletePaymentId, setDeletePaymentId] = useState<number | null>(null);
  const { data: raw, isLoading } = usePartnerStatement(Number(id) || 0, year);
  const statement = (raw as { data?: PartnerStatementData })?.data as PartnerStatementData | undefined;

  const fmt = (n: number) => n?.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 }) ?? '0';

  const handleDeletePayment = (paymentId: number) => {
    setDeletePaymentId(paymentId);
  };

  const confirmDeletePayment = async () => {
    if (!deletePaymentId) return;
    try {
      await deletePayment.mutateAsync({ partnerId: Number(id), paymentId: deletePaymentId });
      toast.success('تم حذف الدفعة');
    } catch {
      toast.error('حدث خطأ في حذف الدفعة');
    }
    setDeletePaymentId(null);
  };

  if (isLoading) {
    return (
      <div className="page-container">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          <p className="text-gray-400 mr-3">جاري تحميل كشف الحساب...</p>
        </div>
      </div>
    );
  }

  if (!statement) {
    return (
      <div className="page-container">
        <div className="card card-body text-center py-16">
          <Users size={40} className="mx-auto mb-3 text-gray-300" />
          <p className="text-gray-500">لا توجد بيانات لهذا الشريك</p>
          <button onClick={() => navigate('/partners')} className="btn-secondary mt-4 mx-auto">
            <ArrowRight size={16} /> العودة للشركاء
          </button>
        </div>
      </div>
    );
  }

  const { partner } = statement;
  const monthsWithData = statement.months.filter(m => m.payments.length > 0 || m.entitlement !== 0);
  const balance = statement.total_entitlement - statement.total_outflow;

  return (
    <div className="page-container">
      {/* ===== HEADER ===== */}
      <div className="page-header">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/partners')}
            className="action-icon text-gray-400 hover:text-primary-600 hover:bg-primary-50">
            <ArrowRight size={22} />
          </button>
          <div>
            <h1 className="page-title flex items-center gap-2">
              <span className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-sm">
                {partner.name.charAt(0)}
              </span>
              {partner.name}
            </h1>
            <div className="flex items-center gap-3 mt-1 flex-wrap">
              <span className="text-xs bg-primary-50 text-primary-700 px-2.5 py-1 rounded-full font-medium">
                نسبة: {partner.share_percentage}%
              </span>
              {partner.capital > 0 && (
                <span className="text-xs bg-purple-50 text-purple-700 px-2.5 py-1 rounded-full font-medium">
                  رأس المال: {fmt(partner.capital)} ج.م
                </span>
              )}
              <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${partner.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                {partner.is_active ? 'نشط' : 'غير نشط'}
              </span>
              {partner.phone && (
                <span className="text-xs text-gray-400 flex items-center gap-1"><Phone size={12} /> {partner.phone}</span>
              )}
              {partner.bank_account && (
                <span className="text-xs text-gray-400 flex items-center gap-1"><Landmark size={12} /> {partner.bank_account}</span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Calendar size={16} className="text-gray-400" />
          <select value={year} onChange={e => setYear(Number(e.target.value))} className="select max-w-[100px]">
            {Array.from({ length: 5 }, (_, i) => now.getFullYear() - 2 + i).map(y =>
              <option key={y} value={y}>{y}</option>
            )}
          </select>
        </div>
      </div>

      {/* ===== SUMMARY CARDS ===== */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="stat-card">
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs font-medium text-gray-500">إجمالي المستحق</p>
            <div className="w-9 h-9 rounded-lg bg-primary-50 flex items-center justify-center">
              <BadgeDollarSign size={17} className="text-primary-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-primary-600">{fmt(statement.total_entitlement)} <span className="text-xs font-normal text-gray-400">ج.م</span></p>
          <p className="text-[11px] text-gray-400 mt-1">من أرباح {year}</p>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs font-medium text-gray-500">تم صرفه</p>
            <div className="w-9 h-9 rounded-lg bg-red-50 flex items-center justify-center">
              <ArrowUpRight size={17} className="text-red-500" />
            </div>
          </div>
          <p className="text-2xl font-bold text-red-500">{fmt(statement.total_outflow)} <span className="text-xs font-normal text-gray-400">ج.م</span></p>
          <p className="text-[11px] text-gray-400 mt-1">أرباح + سلف + سحب</p>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs font-medium text-gray-500">إيداعات الشريك</p>
            <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center">
              <ArrowDownLeft size={17} className="text-emerald-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-emerald-600">{fmt(statement.total_inflow)} <span className="text-xs font-normal text-gray-400">ج.م</span></p>
          <p className="text-[11px] text-gray-400 mt-1">رأس مال + إيداعات</p>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs font-medium text-gray-500">الرصيد المتبقي</p>
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${balance > 0 ? 'bg-amber-50' : 'bg-emerald-50'}`}>
              <Wallet size={17} className={balance > 0 ? 'text-amber-600' : 'text-emerald-600'} />
            </div>
          </div>
          <p className={`text-2xl font-bold ${balance > 0 ? 'text-amber-600' : balance < 0 ? 'text-red-500' : 'text-emerald-600'}`}>
            {balance > 0 ? fmt(balance) : balance < 0 ? `(${fmt(Math.abs(balance))})` : '✓ 0'} <span className="text-xs font-normal text-gray-400">ج.م</span>
          </p>
          <p className="text-[11px] text-gray-400 mt-1">{balance > 0 ? 'مستحق للشريك' : balance < 0 ? 'زيادة عن المستحق' : 'تم السداد بالكامل'}</p>
        </div>
      </div>

      {/* ===== BREAKDOWN BY TYPE ===== */}
      {Object.keys(statement.by_type).length > 0 && (
        <div className="card card-body">
          <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <CreditCard size={17} className="text-gray-400" /> تفاصيل حسب النوع
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {Object.entries(statement.by_type).map(([type, amount]) => {
              const config = typeConfig[type];
              return (
                <div key={type} className="rounded-xl border border-gray-100 p-3 text-center">
                  <span className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-medium ${config?.badgeClass ?? 'bg-gray-100 text-gray-600'} mb-2`}>
                    {config?.label ?? type}
                  </span>
                  <p className={`text-lg font-bold ${config?.color ?? 'text-gray-700'}`}>{fmt(Number(amount))}</p>
                  <p className="text-[10px] text-gray-400">ج.م</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ===== MONTHLY BREAKDOWN ===== */}
      <div className="card overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-semibold text-gray-700 flex items-center gap-2">
            <Calendar size={17} className="text-gray-400" /> الكشف الشهري — {year}
          </h3>
          <span className="text-xs text-gray-400">{monthsWithData.length} شهر فيه حركة</span>
        </div>

        <div className="divide-y divide-gray-100">
          {statement.months.map(m => {
            const hasData = m.payments.length > 0 || m.entitlement !== 0;
            const isExpanded = expandedMonth === m.month;
            const netForMonth = m.entitlement - m.outflow;

            return (
              <div key={m.month} className={!hasData ? 'opacity-50' : ''}>
                {/* Month Row */}
                <button
                  onClick={() => hasData ? setExpandedMonth(isExpanded ? null : m.month) : null}
                  className={`w-full px-6 py-4 flex items-center justify-between text-right transition-colors ${hasData ? 'hover:bg-gray-50 cursor-pointer' : 'cursor-default'}`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold ${
                      hasData ? 'bg-primary-50 text-primary-700' : 'bg-gray-50 text-gray-300'
                    }`}>
                      {m.month}
                    </div>
                    <div>
                      <span className="font-semibold text-gray-800">{m.month_name}</span>
                      {hasData && (
                        <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-400">
                          <span>ربح: <span className={m.net_profit >= 0 ? 'text-emerald-600' : 'text-red-500'}>{fmt(m.net_profit)}</span></span>
                          <span>مستحق: <span className="text-primary-600">{fmt(m.entitlement)}</span></span>
                          <span>{m.payments.length} دفعة</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    {hasData && (
                      <div className="text-left">
                        {m.outflow > 0 && (
                          <span className="text-xs text-red-500 flex items-center gap-1 justify-end"><ArrowUpRight size={12} /> {fmt(m.outflow)}</span>
                        )}
                        {m.inflow > 0 && (
                          <span className="text-xs text-emerald-600 flex items-center gap-1 justify-end"><ArrowDownLeft size={12} /> {fmt(m.inflow)}</span>
                        )}
                      </div>
                    )}
                    {!hasData ? (
                      <span className="text-xs text-gray-300">لا توجد حركة</span>
                    ) : (
                      isExpanded ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />
                    )}
                  </div>
                </button>

                {/* Expanded Details */}
                {isExpanded && hasData && (
                  <div className="px-6 pb-5 pt-1 bg-gray-50/50 animate-fade-in-up">
                    {/* Month Financial Summary */}
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-4">
                      <div className="bg-white rounded-lg p-3 border border-gray-100 text-center">
                        <p className="text-[10px] text-gray-400 mb-1">الإيرادات</p>
                        <p className="text-sm font-bold text-emerald-600">{fmt(m.revenue)}</p>
                      </div>
                      <div className="bg-white rounded-lg p-3 border border-gray-100 text-center">
                        <p className="text-[10px] text-gray-400 mb-1">المصروفات</p>
                        <p className="text-sm font-bold text-red-500">{fmt(m.expenses)}</p>
                      </div>
                      <div className="bg-white rounded-lg p-3 border border-gray-100 text-center">
                        <p className="text-[10px] text-gray-400 mb-1">الرواتب</p>
                        <p className="text-sm font-bold text-amber-600">{fmt(m.salaries)}</p>
                      </div>
                      <div className="bg-white rounded-lg p-3 border border-gray-100 text-center">
                        <p className="text-[10px] text-gray-400 mb-1">صافي الربح</p>
                        <p className={`text-sm font-bold ${m.net_profit >= 0 ? 'text-primary-600' : 'text-red-500'}`}>{fmt(m.net_profit)}</p>
                      </div>
                      <div className="bg-white rounded-lg p-3 border border-gray-100 text-center">
                        <p className="text-[10px] text-gray-400 mb-1">نصيب الشريك ({partner.share_percentage}%)</p>
                        <p className="text-sm font-bold text-primary-700">{fmt(m.entitlement)}</p>
                      </div>
                    </div>

                    {/* Payments List */}
                    {m.payments.length > 0 ? (
                      <div className="space-y-2">
                        <p className="text-xs font-semibold text-gray-500 mb-2">الدفعات المسجلة:</p>
                        {m.payments.map(p => {
                          const config = typeConfig[p.type];
                          const isInflow = config?.direction === 'in';
                          return (
                            <div key={p.id} className="bg-white rounded-xl border border-gray-100 px-4 py-3 flex items-center justify-between group">
                              <div className="flex items-center gap-3">
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isInflow ? 'bg-emerald-50' : 'bg-red-50'}`}>
                                  {isInflow ? <ArrowDownLeft size={14} className="text-emerald-600" /> : <ArrowUpRight size={14} className="text-red-500" />}
                                </div>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${config?.badgeClass ?? 'bg-gray-100 text-gray-600'}`}>
                                      {config?.label ?? p.type}
                                    </span>
                                    <span className="text-sm font-bold text-gray-800">{fmt(Number(p.amount))} {p.currency}</span>
                                  </div>
                                  <div className="flex items-center gap-2 mt-0.5 text-[11px] text-gray-400">
                                    <span>{p.payment_date}</span>
                                    {p.notes && <span>• {p.notes}</span>}
                                  </div>
                                </div>
                              </div>
                              <button onClick={() => handleDeletePayment(p.id)}
                                className="action-icon text-gray-300 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity" title="حذف الدفعة">
                                <Trash2 size={14} />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-xs text-gray-400 text-center py-3">لا توجد دفعات مسجلة هذا الشهر</p>
                    )}

                    {/* Month Balance */}
                    {m.entitlement !== 0 && (
                      <div className="mt-3 pt-3 border-t border-gray-200 flex items-center justify-between text-sm">
                        <span className="text-gray-500">رصيد الشهر (مستحق − مصروف)</span>
                        <span className={`font-bold ${netForMonth > 0 ? 'text-amber-600' : netForMonth < 0 ? 'text-red-500' : 'text-emerald-600'}`}>
                          {netForMonth > 0 ? `${fmt(netForMonth)} ج.م مستحق` : netForMonth < 0 ? `(${fmt(Math.abs(netForMonth))}) ج.م زيادة` : '✓ تم السداد'}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ===== YEARLY TOTAL BAR ===== */}
      <div className="card card-body bg-gradient-to-l from-primary-50 to-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center">
              <DollarSign size={18} className="text-primary-700" />
            </div>
            <div>
              <p className="font-bold text-gray-800">ملخص {year} — {partner.name}</p>
              <p className="text-xs text-gray-400">إجمالي المستحق: {fmt(statement.total_entitlement)} | مصروف: {fmt(statement.total_outflow)} | إيداعات: {fmt(statement.total_inflow)}</p>
            </div>
          </div>
          <div className="text-left">
            <p className="text-xs text-gray-400">صافي المتبقي</p>
            <p className={`text-xl font-bold ${balance > 0 ? 'text-amber-600' : balance < 0 ? 'text-red-500' : 'text-emerald-600'}`}>
              {balance > 0 ? `${fmt(balance)} ج.م` : balance < 0 ? `(${fmt(Math.abs(balance))}) ج.م` : '✓ 0 ج.م'}
            </p>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={deletePaymentId !== null}
        title="حذف الدفعة"
        message="هل أنت متأكد من حذف هذه الدفعة؟"
        confirmText="حذف"
        onConfirm={confirmDeletePayment}
        onCancel={() => setDeletePaymentId(null)}
      />
    </div>
  );
}
