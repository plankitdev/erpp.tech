import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useInvoices, useRecordPayment, useDeleteInvoice } from '../hooks/useInvoices';
import { useUrlFilters } from '../hooks/useUrlFilters';
import { formatCurrency, formatDate, statusLabels } from '../utils';
import type { Invoice } from '../types';
import toast from 'react-hot-toast';
import { Plus, CreditCard, Pencil, Eye, Download, Receipt, X, Trash2, CalendarDays } from 'lucide-react';
import { exportToCSV } from '../utils/exportCsv';
import ConfirmDialog from '../components/ConfirmDialog';
import StatusBadge from '../components/StatusBadge';
import Breadcrumbs from '../components/Breadcrumbs';
import { SkeletonTable } from '../components/Skeletons';

export default function Invoices() {
  const { getParam, setParam, getPage, setPage } = useUrlFilters({ filter: 'all' });
  const filter = getParam('filter') || 'all';
  const page = getPage();
  const dateFrom = getParam('dateFrom');
  const dateTo = getParam('dateTo');
  const [paymentModal, setPaymentModal] = useState<{ invoiceId: number; remaining: number; currency: 'EGP' | 'USD' | 'SAR' } | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const paymentInputRef = useRef<HTMLInputElement>(null);

  const params: Record<string, unknown> = { page };
  if (filter !== 'all') params.status = filter;
  if (dateFrom) params.date_from = dateFrom;
  if (dateTo) params.date_to = dateTo;

  const { data, isLoading, isError, refetch } = useInvoices(params);
  const paymentMutation = useRecordPayment();
  const deleteMutation = useDeleteInvoice();
  const [deleteTarget, setDeleteTarget] = useState<Invoice | null>(null);

  useEffect(() => {
    if (paymentModal) {
      setTimeout(() => paymentInputRef.current?.focus(), 100);
    }
  }, [paymentModal]);

  const openPaymentModal = (inv: Invoice) => {
    setPaymentModal({ invoiceId: inv.id, remaining: inv.remaining, currency: inv.currency });
    setPaymentAmount(String(inv.remaining));
  };

  const handlePayment = () => {
    if (!paymentModal || !paymentAmount) return;
    const amount = parseFloat(paymentAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error('أدخل مبلغ صحيح');
      return;
    }
    paymentMutation.mutate(
      { invoiceId: paymentModal.invoiceId, data: { amount } },
      {
        onSuccess: () => {
          toast.success('تم تسجيل الدفعة');
          setPaymentModal(null);
          setPaymentAmount('');
        },
        onError: () => toast.error('حدث خطأ'),
      },
    );
  };

  const invoices = data?.data || [];

  const statusFilters = [
    { value: 'all', label: 'الكل' },
    { value: 'pending', label: statusLabels.invoice.pending },
    { value: 'paid', label: statusLabels.invoice.paid },
    { value: 'overdue', label: statusLabels.invoice.overdue },
    { value: 'partial', label: statusLabels.invoice.partial },
  ];

  return (
    <div className="page-container">
      <Breadcrumbs items={[{ label: 'الفواتير والتحصيل' }]} />
      <div className="page-header">
        <div>
          <h1 className="page-title">الفواتير والتحصيل</h1>
          <p className="page-subtitle">{invoices.length} فاتورة</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => exportToCSV('invoices', ['رقم', 'الشركة', 'العميل', 'المبلغ', 'العملة', 'المدفوع', 'المتبقي', 'الاستحقاق', 'الحالة'], invoices.map((inv: Invoice) => [String(inv.id), inv.contract?.client?.company_name || '', inv.contract?.client?.name || '', String(inv.amount), inv.currency, String(inv.paid_amount), String(inv.remaining), inv.due_date, inv.status]))} disabled={invoices.length === 0} className="btn-secondary">
            <Download size={16} /> تصدير CSV
          </button>
          <Link to="/invoices/create" className="btn-primary">
            <Plus size={16} /> فاتورة جديدة
          </Link>
        </div>
      </div>

      <div className="card card-body !py-4 flex items-center gap-4 flex-wrap">
        <div className="filter-bar">
          {statusFilters.map(s => (
            <button key={s.value} onClick={() => setParam('filter', s.value)}
              className={`filter-pill ${filter === s.value ? 'active' : ''}`}>
              {s.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <CalendarDays size={14} className="text-gray-400" />
          <input type="date" value={dateFrom}
            onChange={e => setParam('dateFrom', e.target.value)}
            className="form-input !py-1.5 !px-2.5 !text-xs w-36" placeholder="من تاريخ" />
          <span className="text-gray-300 text-xs">—</span>
          <input type="date" value={dateTo}
            onChange={e => setParam('dateTo', e.target.value)}
            className="form-input !py-1.5 !px-2.5 !text-xs w-36" placeholder="إلى تاريخ" />
          {(dateFrom || dateTo) && (
            <button onClick={() => { setParam('dateFrom', ''); setParam('dateTo', ''); }}
              className="text-gray-400 hover:text-red-500 p-1 rounded transition-colors">
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      <div className="table-container">
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>رقم</th>
                <th>الشركة / العميل</th>
                <th>المبلغ</th>
                <th>المدفوع</th>
                <th>المتبقي</th>
                <th>الاستحقاق</th>
                <th>الحالة</th>
                <th>إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <SkeletonTable rows={5} cols={8} />
              ) : isError ? (
                <tr><td colSpan={8} className="text-center py-12"><div className="text-red-400 mb-2">حدث خطأ في تحميل البيانات</div><button onClick={() => refetch()} className="text-sm text-primary-600 hover:underline">إعادة المحاولة</button></td></tr>
              ) : invoices.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-12">
                  <Receipt size={40} className="mx-auto mb-3 text-gray-300" />
                  <p className="text-gray-400">لا يوجد فواتير</p>
                </td></tr>
              ) : invoices.map((inv: Invoice) => (
                <tr key={inv.id}>
                  <td className="font-semibold text-primary-600">
                    <span className="bg-primary-50 px-2 py-1 rounded-lg text-xs font-mono">
                      INV-{new Date(inv.created_at).getFullYear()}-{String(inv.id).padStart(4, '0')}
                    </span>
                  </td>
                  <td className="font-medium text-gray-900">
                    <div>
                      <span>{inv.contract?.client?.company_name || inv.contract?.client?.name}</span>
                      {inv.contract?.client?.company_name && inv.contract?.client?.name && (
                        <span className="block text-xs text-gray-400 font-normal">{inv.contract.client.name}</span>
                      )}
                    </div>
                  </td>
                  <td className="font-medium">{formatCurrency(inv.amount, inv.currency)}</td>
                  <td className="text-emerald-600 font-medium">{formatCurrency(inv.paid_amount, inv.currency)}</td>
                  <td className="text-red-500 font-medium">{formatCurrency(inv.remaining, inv.currency)}</td>
                  <td className="text-gray-500 text-[13px]">{formatDate(inv.due_date)}</td>
                  <td>
                    <StatusBadge status={inv.status} size="sm" />
                  </td>
                  <td>
                    <div className="flex gap-1">
                      <Link to={`/invoices/${inv.id}`} className="action-icon text-gray-400 hover:text-primary-600 hover:bg-primary-50"><Eye size={15} /></Link>
                      <button onClick={() => openPaymentModal(inv)} className="action-icon text-gray-400 hover:text-emerald-600 hover:bg-emerald-50" title="تسجيل دفعة"><CreditCard size={15} /></button>
                      <Link to={`/invoices/${inv.id}/edit`} className="action-icon text-gray-400 hover:text-amber-600 hover:bg-amber-50" title="تعديل"><Pencil size={15} /></Link>
                      <button onClick={() => setDeleteTarget(inv)} className="action-icon text-gray-400 hover:text-red-600 hover:bg-red-50" title="حذف"><Trash2 size={15} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <ConfirmDialog
        open={!!deleteTarget}
        title="حذف فاتورة"
        message={deleteTarget ? `هل أنت متأكد من حذف الفاتورة #${deleteTarget.id} بمبلغ ${formatCurrency(deleteTarget.amount, deleteTarget.currency)}؟ سيتم حذف جميع الدفعات المرتبطة.` : ''}
        confirmText="حذف"
        cancelText="إلغاء"
        variant="danger"
        onConfirm={() => {
          if (!deleteTarget) return;
          deleteMutation.mutate(deleteTarget.id, {
            onSuccess: () => {
              toast.success('تم حذف الفاتورة');
              setDeleteTarget(null);
            },
            onError: () => toast.error('حدث خطأ في حذف الفاتورة'),
          });
        }}
        onCancel={() => setDeleteTarget(null)}
      />

      {/* Payment Modal */}
      {paymentModal && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal-backdrop" onClick={() => setPaymentModal(null)} />
          <div className="modal-content max-w-sm animate-scale-in">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900">تسجيل دفعة</h3>
                <button onClick={() => setPaymentModal(null)} className="text-gray-400 hover:text-gray-600">
                  <X size={20} />
                </button>
              </div>
              <div className="w-14 h-14 rounded-2xl bg-emerald-100 flex items-center justify-center mx-auto mb-4">
                <CreditCard size={24} className="text-emerald-600" />
              </div>
              <p className="text-sm text-gray-500 text-center mb-1">المتبقي: <span className="font-semibold text-gray-700">{formatCurrency(paymentModal.remaining, paymentModal.currency)}</span></p>
              <div className="mt-4">
                <label className="input-label">المبلغ المدفوع</label>
                <input
                  ref={paymentInputRef}
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={paymentAmount}
                  onChange={e => setPaymentAmount(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handlePayment()}
                  className="input text-center text-lg font-semibold"
                  placeholder="0.00"
                />
              </div>
            </div>
            <div className="flex gap-3 px-6 pb-6">
              <button onClick={() => setPaymentModal(null)} className="btn flex-1 bg-gray-100 text-gray-700 hover:bg-gray-200">
                إلغاء
              </button>
              <button onClick={handlePayment} disabled={paymentMutation.isPending} className="btn flex-1 bg-emerald-600 text-white hover:bg-emerald-700 focus:ring-2 focus:ring-emerald-500/20">
                {paymentMutation.isPending ? 'جاري التسجيل...' : 'تسجيل الدفعة'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
