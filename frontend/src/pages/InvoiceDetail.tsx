import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useInvoice, useRecordPayment } from '../hooks/useInvoices';
import { formatCurrency, formatDate, formatDateTime, statusLabels, statusColors } from '../utils';
import type { InvoiceStatus } from '../types';
import { ArrowRight, FileDown, Printer } from 'lucide-react';
import Breadcrumbs from '../components/Breadcrumbs';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import toast from 'react-hot-toast';

export default function InvoiceDetail() {
  const { id } = useParams<{ id: string }>();
  const invoiceId = parseInt(id || '0');
  const { data: invoice, isLoading, isError, refetch } = useInvoice(invoiceId);
  const paymentMutation = useRecordPayment();

  const [showPayment, setShowPayment] = useState(false);
  const [payForm, setPayForm] = useState({ amount: '', paid_at: '', notes: '' });

  const handleDownloadPdf = () => {
    const token = localStorage.getItem('token');
    const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
    window.open(`${baseURL}/invoices/${invoiceId}/pdf?token=${token}`, '_blank');
  };

  if (isLoading) return <LoadingSpinner />;
  if (isError || !invoice) return <ErrorMessage onRetry={refetch} />;

  const payments = invoice.payments ?? [];

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await paymentMutation.mutateAsync({
        invoiceId: invoice.id,
        data: {
          amount: parseFloat(payForm.amount),
          paid_at: payForm.paid_at || undefined,
          notes: payForm.notes || undefined,
        },
      });
      setShowPayment(false);
      setPayForm({ amount: '', paid_at: '', notes: '' });
      toast.success('تم تسجيل الدفعة بنجاح');
    } catch {
      toast.error('حدث خطأ أثناء تسجيل الدفعة');
    }
  };

  return (
    <div className="page-container">
      <Breadcrumbs items={[{ label: 'الفواتير', href: '/invoices' }, { label: `فاتورة #${invoice.id}` }]} />
      <div className="flex items-center gap-3 mb-6">
        <Link to="/invoices" className="action-icon text-gray-400 hover:text-gray-600"><ArrowRight size={20} /></Link>
        <h1 className="page-title">فاتورة #{invoice.id}</h1>
        <span className={`text-xs px-2 py-1 rounded ${statusColors.invoice[invoice.status as InvoiceStatus]}`}>
          {statusLabels.invoice[invoice.status as InvoiceStatus]}
        </span>
        <button onClick={handleDownloadPdf} className="mr-auto btn-primary text-sm">
          <FileDown size={16} />
          تحميل PDF
        </button>
        <button onClick={() => window.print()} className="btn-secondary text-sm">
          <Printer size={16} />
          طباعة
        </button>
      </div>

      {/* Invoice Info */}
      <div className="card card-body mb-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">بيانات الفاتورة</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-sm text-gray-500">الشركة</p>
            <p className="font-semibold text-gray-900">{invoice.contract?.client?.company_name || '—'}</p>
            {invoice.contract?.client && (
              <Link to={`/clients/${(invoice.contract.client as any).slug || invoice.contract.client.id}`} className="text-xs text-primary-600 hover:underline">
                العميل: {invoice.contract.client.name}
              </Link>
            )}
          </div>
          <div><p className="text-sm text-gray-500">المبلغ</p><p className="font-medium">{formatCurrency(invoice.amount, invoice.currency)}</p></div>
          <div><p className="text-sm text-gray-500">تاريخ الاستحقاق</p><p className="font-medium">{formatDate(invoice.due_date)}</p></div>
          <div><p className="text-sm text-gray-500">تاريخ الإنشاء</p><p className="font-medium">{formatDate(invoice.created_at)}</p></div>
        </div>
      </div>

      {/* Balance */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="stat-card">
          <p className="text-sm text-gray-500">إجمالي الفاتورة</p>
          <p className="text-2xl font-bold text-gray-800 mt-1">{formatCurrency(invoice.amount, invoice.currency)}</p>
        </div>
        <div className="stat-card">
          <p className="text-sm text-gray-500">المدفوع</p>
          <p className="text-2xl font-bold text-green-600 mt-1">{formatCurrency(invoice.paid_amount, invoice.currency)}</p>
        </div>
        <div className="stat-card">
          <p className="text-sm text-gray-500">المتبقي</p>
          <p className="text-2xl font-bold text-red-600 mt-1">{formatCurrency(invoice.remaining, invoice.currency)}</p>
        </div>
      </div>

      {/* Add Payment Button */}
      {invoice.status !== 'paid' && (
        <div className="mb-6">
          <button onClick={() => setShowPayment(!showPayment)}
            className="btn-primary bg-green-600 hover:bg-green-700">
            {showPayment ? 'إلغاء' : '+ إضافة دفعة'}
          </button>
        </div>
      )}

      {/* Payment Form */}
      {showPayment && (
        <form onSubmit={handlePayment} className="card card-body mb-6 space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="input-label">المبلغ المدفوع *</label>
              <input type="number" step="0.01" max={invoice.remaining} value={payForm.amount}
                onChange={e => setPayForm({ ...payForm, amount: e.target.value })}
                className="input" required />
            </div>
            <div>
              <label className="input-label">تاريخ الدفع</label>
              <input type="date" value={payForm.paid_at}
                onChange={e => setPayForm({ ...payForm, paid_at: e.target.value })}
                className="input" />
            </div>
            <div>
              <label className="input-label">ملاحظات</label>
              <input type="text" value={payForm.notes}
                onChange={e => setPayForm({ ...payForm, notes: e.target.value })}
                className="input" />
            </div>
          </div>
          <button type="submit" disabled={paymentMutation.isPending}
            className="btn-primary bg-green-600 hover:bg-green-700">
            {paymentMutation.isPending ? 'جاري الحفظ...' : 'تسجيل الدفعة'}
          </button>
        </form>
      )}

      {/* Payment History */}
      <div className="table-container">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800">سجل الدفعات</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500">#</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500">المبلغ</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500">التاريخ</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500">ملاحظات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {payments.length === 0 ? (
                <tr><td colSpan={4} className="px-6 py-8 text-center text-gray-500">لا يوجد دفعات بعد</td></tr>
              ) : payments.map((p, idx) => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium">{idx + 1}</td>
                  <td className="px-6 py-4 text-green-600 font-semibold">{formatCurrency(p.amount, invoice.currency)}</td>
                  <td className="px-6 py-4">{formatDateTime(p.paid_at)}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{p.notes || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
