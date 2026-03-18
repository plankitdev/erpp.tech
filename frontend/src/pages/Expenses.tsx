import { useState } from 'react';
import { useExpenses, useCreateExpense, useDeleteExpense } from '../hooks/useExpenses';
import { formatCurrency, formatDate } from '../utils';
import toast from 'react-hot-toast';
import { Trash2, Download, Plus, X, Receipt } from 'lucide-react';
import { exportToCSV } from '../utils/exportCsv';
import ConfirmDialog from '../components/ConfirmDialog';
import { SkeletonTable } from '../components/Skeletons';

const categoryLabels: Record<string, string> = {
  'إيجار': 'إيجار',
  'مرافق': 'مرافق',
  'أدوات': 'أدوات',
  'نثريات': 'نثريات',
  'رواتب': 'رواتب',
  'تسويق': 'تسويق',
  'نقل': 'نقل',
  'أخرى': 'أخرى',
};

export default function Expenses() {
  const [filters, setFilters] = useState({ category: '', currency: '' });
  const { data, isLoading, isError, refetch } = useExpenses(filters);
  const createMutation = useCreateExpense();
  const deleteMutation = useDeleteExpense();
  const expenses = data?.data ?? [];

  const [showForm, setShowForm] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [form, setForm] = useState({
    category: 'نثريات',
    amount: '',
    currency: 'EGP',
    date: '',
    notes: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createMutation.mutateAsync({
        category: form.category,
        amount: parseFloat(form.amount),
        currency: form.currency as 'EGP' | 'USD' | 'SAR',
        date: form.date,
        notes: form.notes || null,
      });
      setShowForm(false);
      setForm({ category: 'نثريات', amount: '', currency: 'EGP', date: '', notes: '' });
      toast.success('تم تسجيل المصروف بنجاح');
    } catch {
      toast.error('حدث خطأ أثناء التسجيل');
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteMutation.mutateAsync(deleteId);
      toast.success('تم حذف المصروف');
      setDeleteId(null);
    } catch {
      toast.error('حدث خطأ أثناء الحذف');
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">المصروفات</h1>
          <p className="page-subtitle">تتبع وإدارة المصروفات</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => exportToCSV('expenses', ['التاريخ', 'التصنيف', 'المبلغ', 'العملة', 'ملاحظات'], expenses.map(exp => [exp.date, categoryLabels[exp.category] || exp.category, String(exp.amount), exp.currency, exp.notes || '']))} disabled={expenses.length === 0} className="btn-secondary">
            <Download size={16} /> تصدير
          </button>
          <button onClick={() => setShowForm(!showForm)} className={showForm ? 'btn-secondary' : 'btn-primary'}>
            {showForm ? <><X size={16} /> إلغاء</> : <><Plus size={16} /> مصروف جديد</>}
          </button>
        </div>
      </div>

      <div className="filter-bar">
        <select value={filters.category} onChange={e => setFilters({ ...filters, category: e.target.value })} className="select max-w-[160px]">
          <option value="">كل التصنيفات</option>
          {Object.entries(categoryLabels).map(([key, label]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>
        <select value={filters.currency} onChange={e => setFilters({ ...filters, currency: e.target.value })} className="select max-w-[140px]">
          <option value="">كل العملات</option>
          <option value="EGP">جنيه مصري</option>
          <option value="USD">دولار</option>
          <option value="SAR">ريال</option>
        </select>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="card card-body space-y-4 animate-fade-in-up">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="input-label">التصنيف</label>
              <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className="select">
                {Object.entries(categoryLabels).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="input-label">العملة</label>
              <select value={form.currency} onChange={e => setForm({ ...form, currency: e.target.value })} className="select">
                <option value="EGP">EGP</option>
                <option value="USD">USD</option>
                <option value="SAR">SAR</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="input-label">المبلغ</label>
              <input type="number" step="0.01" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} className="input" required />
            </div>
            <div>
              <label className="input-label">التاريخ</label>
              <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} className="input" required />
            </div>
          </div>
          <div>
            <label className="input-label">ملاحظات</label>
            <input type="text" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} className="input" />
          </div>
          <button type="submit" disabled={createMutation.isPending} className="btn-primary disabled:opacity-50">
            {createMutation.isPending ? 'جاري الحفظ...' : 'حفظ'}
          </button>
        </form>
      )}

      <div className="table-container">
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>التاريخ</th>
                <th>التصنيف</th>
                <th>المبلغ</th>
                <th>ملاحظات</th>
                <th>إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <SkeletonTable rows={5} cols={5} />
              ) : isError ? (
                <tr><td colSpan={5} className="text-center py-12"><div className="text-red-400 mb-2">حدث خطأ في تحميل البيانات</div><button onClick={() => refetch()} className="text-sm text-primary-600 hover:underline">إعادة المحاولة</button></td></tr>
              ) : expenses.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-12">
                  <Receipt size={40} className="mx-auto mb-3 text-gray-300" />
                  <p className="text-gray-400">لا يوجد مصروفات</p>
                </td></tr>
              ) : expenses.map((expense) => (
                <tr key={expense.id}>
                  <td className="text-gray-500 text-[13px]">{formatDate(expense.date)}</td>
                  <td><span className="badge-neutral">{categoryLabels[expense.category] || expense.category}</span></td>
                  <td className="font-semibold text-red-500">{formatCurrency(expense.amount, expense.currency)}</td>
                  <td className="text-gray-500 text-[13px]">{expense.notes || '—'}</td>
                  <td>
                    <button onClick={() => setDeleteId(expense.id)} className="action-icon text-gray-400 hover:text-red-500 hover:bg-red-50">
                      <Trash2 size={15} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <ConfirmDialog
        open={deleteId !== null}
        title="حذف المصروف"
        message="هل أنت متأكد من حذف هذا المصروف؟"
        confirmText="حذف"
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}
