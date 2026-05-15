import { useState, useMemo } from 'react';
import { useTreasury, useCreateTransaction, useDeleteTransaction } from '../hooks/useTreasury';
import { formatCurrency, formatDate } from '../utils';
import toast from 'react-hot-toast';
import { Trash2, Download, Plus, X, Receipt, TrendingDown } from 'lucide-react';
import { exportToCSV } from '../utils/exportCsv';
import ConfirmDialog from '../components/ConfirmDialog';
import { SkeletonTable } from '../components/Skeletons';

const categoryLabels: Record<string, string> = {
  expense: 'مصروفات',
  salaries: 'رواتب',
  client_expense: 'مصروفات عملاء',
  partner_payment: 'سحب شريك',
  partner_profit: 'أرباح شريك',
  other: 'أخرى',
};

const categoryColors: Record<string, string> = {
  expense: 'bg-red-50 text-red-700',
  salaries: 'bg-blue-50 text-blue-700',
  client_expense: 'bg-amber-50 text-amber-700',
  partner_payment: 'bg-purple-50 text-purple-700',
  partner_profit: 'bg-teal-50 text-teal-700',
  other: 'bg-gray-50 text-gray-700',
};

export default function Expenses() {
  const [filters, setFilters] = useState<Record<string, string>>({ type: 'out' });
  const { data, isLoading, isError, refetch } = useTreasury(filters);
  const createMutation = useCreateTransaction();
  const deleteMutation = useDeleteTransaction();
  const expenses = data?.data ?? [];

  const [showForm, setShowForm] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [form, setForm] = useState({
    category: 'expense',
    amount: '',
    currency: 'EGP',
    date: new Date().toISOString().split('T')[0],
    description: '',
  });

  const totalAmount = useMemo(() =>
    expenses.reduce((s: number, t: any) => s + Number(t.amount || 0), 0),
    [expenses]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createMutation.mutateAsync({
        type: 'out',
        category: form.category,
        amount: parseFloat(form.amount),
        currency: form.currency,
        date: form.date,
        description: form.description || '',
      } as any);
      setShowForm(false);
      setForm({ category: 'expense', amount: '', currency: 'EGP', date: new Date().toISOString().split('T')[0], description: '' });
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
          <p className="page-subtitle">تتبع وإدارة جميع المصروفات والمدفوعات الصادرة</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => exportToCSV('expenses', ['التاريخ', 'التصنيف', 'المبلغ', 'العملة', 'الوصف'], expenses.map((exp: any) => [exp.date, categoryLabels[exp.category] || exp.category, String(exp.amount), exp.currency, exp.description || '']))} disabled={expenses.length === 0} className="btn-secondary">
            <Download size={16} /> تصدير
          </button>
          <button onClick={() => setShowForm(!showForm)} className={showForm ? 'btn-secondary' : 'btn-primary'}>
            {showForm ? <><X size={16} /> إلغاء</> : <><Plus size={16} /> مصروف جديد</>}
          </button>
        </div>
      </div>

      {/* Summary Card */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
        <div className="card card-body flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
            <TrendingDown size={20} className="text-red-600" />
          </div>
          <div>
            <p className="text-xs text-gray-500">إجمالي المصروفات</p>
            <p className="text-lg font-bold text-red-600">{formatCurrency(totalAmount)}</p>
          </div>
        </div>
        <div className="card card-body flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
            <Receipt size={20} className="text-gray-600" />
          </div>
          <div>
            <p className="text-xs text-gray-500">عدد الحركات</p>
            <p className="text-lg font-bold text-gray-800">{expenses.length}</p>
          </div>
        </div>
      </div>

      <div className="filter-bar">
        <select value={filters.category || ''} onChange={e => setFilters({ ...filters, category: e.target.value })} className="select max-w-[160px]">
          <option value="">كل التصنيفات</option>
          {Object.entries(categoryLabels).map(([key, label]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>
        <select value={filters.currency || ''} onChange={e => setFilters({ ...filters, currency: e.target.value })} className="select max-w-[140px]">
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
                <option value="EGP">جنيه مصري</option>
                <option value="USD">دولار</option>
                <option value="SAR">ريال</option>
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
            <label className="input-label">الوصف</label>
            <input type="text" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="input" placeholder="وصف المصروف..." />
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
                <th>الوصف</th>
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
              ) : expenses.map((expense: any) => (
                <tr key={expense.id}>
                  <td className="text-gray-500 text-[13px]">{formatDate(expense.date)}</td>
                  <td><span className={`text-xs font-medium px-2.5 py-1 rounded-lg ${categoryColors[expense.category] || 'bg-gray-50 text-gray-700'}`}>{categoryLabels[expense.category] || expense.category}</span></td>
                  <td className="font-semibold text-red-500">{formatCurrency(Number(expense.amount), expense.currency)}</td>
                  <td className="text-gray-500 text-[13px]">{expense.description || '—'}</td>
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
