import { useState } from 'react';
import {
  useBudgets, useCreateBudget, useUpdateBudget, useApproveBudget,
  useDeleteBudget, useBudgetComparison,
} from '../hooks/useFinancial';
import { formatDate } from '../utils';
import toast from 'react-hot-toast';
import {
  Plus, X, Edit3, Trash2, Calculator, Check, BarChart3,
  TrendingUp, TrendingDown, Eye,
} from 'lucide-react';
import ConfirmDialog from '../components/ConfirmDialog';
import { SkeletonTable } from '../components/Skeletons';

const statusLabels: Record<string, string> = {
  draft: 'مسودة',
  approved: 'معتمدة',
  closed: 'مغلقة',
};

const statusColors: Record<string, string> = {
  draft: 'badge-warning',
  approved: 'badge-success',
  closed: 'badge-neutral',
};

const monthNames = [
  'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
  'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر',
];

export default function Budgets() {
  const [tab, setTab] = useState<'list' | 'comparison'>('list');
  const [compYear, setCompYear] = useState(new Date().getFullYear());
  const { data, isLoading, isError, refetch } = useBudgets();
  const { data: comparison, isLoading: compLoading } = useBudgetComparison({ year: compYear });
  const createMutation = useCreateBudget();
  const updateMutation = useUpdateBudget();
  const approveMutation = useApproveBudget();
  const deleteMutation = useDeleteBudget();

  const budgets = data?.data ?? [];

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [form, setForm] = useState({
    name: '',
    year: new Date().getFullYear(),
    total_amount: '',
    notes: '',
  });

  const resetForm = () => {
    setForm({ name: '', year: new Date().getFullYear(), total_amount: '', notes: '' });
    setEditingId(null);
    setShowForm(false);
  };

  const startEdit = (budget: any) => {
    setForm({
      name: budget.name,
      year: budget.year,
      total_amount: String(budget.total_amount || ''),
      notes: budget.notes || '',
    });
    setEditingId(budget.id);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      ...form,
      total_amount: parseFloat(form.total_amount) || 0,
    };
    try {
      if (editingId) {
        await updateMutation.mutateAsync({ id: editingId, data: payload });
        toast.success('تم تحديث الموازنة');
      } else {
        await createMutation.mutateAsync(payload);
        toast.success('تم إنشاء الموازنة');
      }
      resetForm();
    } catch {
      toast.error('حدث خطأ');
    }
  };

  const handleApprove = async (id: number) => {
    try {
      await approveMutation.mutateAsync(id);
      toast.success('تم اعتماد الموازنة');
    } catch {
      toast.error('حدث خطأ');
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteMutation.mutateAsync(deleteId);
      toast.success('تم حذف الموازنة');
      setDeleteId(null);
    } catch {
      toast.error('حدث خطأ');
    }
  };

  const comparisonData = (comparison as any[]) ?? [];

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">الموازنات</h1>
          <p className="page-subtitle">إدارة الموازنات التقديرية ومقارنة المخطط بالفعلي</p>
        </div>
        <div className="flex gap-2">
          <div className="flex bg-gray-100 rounded-lg p-0.5">
            <button onClick={() => setTab('list')} className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${tab === 'list' ? 'bg-white shadow-sm text-gray-800' : 'text-gray-500'}`}>
              القائمة
            </button>
            <button onClick={() => setTab('comparison')} className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${tab === 'comparison' ? 'bg-white shadow-sm text-gray-800' : 'text-gray-500'}`}>
              <BarChart3 size={14} className="inline ml-1" />المقارنة
            </button>
          </div>
          {tab === 'list' && (
            <button onClick={() => { resetForm(); setShowForm(!showForm); }} className={showForm ? 'btn-secondary' : 'btn-primary'}>
              {showForm ? <><X size={16} /> إلغاء</> : <><Plus size={16} /> موازنة جديدة</>}
            </button>
          )}
        </div>
      </div>

      {tab === 'list' && (
        <>
          {showForm && (
            <form onSubmit={handleSubmit} className="card card-body space-y-4 animate-fade-in-up border-r-4 border-primary-500">
              <h3 className="text-base font-bold text-gray-800 flex items-center gap-2">
                <Calculator size={18} className="text-primary-600" />
                {editingId ? 'تعديل الموازنة' : 'إنشاء موازنة جديدة'}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="input-label">اسم الموازنة</label>
                  <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="input" placeholder="موازنة 2026" required />
                </div>
                <div>
                  <label className="input-label">السنة</label>
                  <input type="number" value={form.year} onChange={e => setForm({ ...form, year: parseInt(e.target.value) })} className="input" min={2020} max={2040} required />
                </div>
                <div>
                  <label className="input-label">المبلغ الإجمالي</label>
                  <input type="number" step="0.01" value={form.total_amount} onChange={e => setForm({ ...form, total_amount: e.target.value })} className="input" placeholder="0.00" />
                </div>
              </div>
              <div>
                <label className="input-label">ملاحظات</label>
                <input type="text" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} className="input" placeholder="ملاحظات اختيارية..." />
              </div>
              <div className="flex gap-2 pt-1">
                <button type="submit" disabled={createMutation.isPending || updateMutation.isPending} className="btn-primary">
                  {(createMutation.isPending || updateMutation.isPending) ? 'جاري الحفظ...' : editingId ? 'تحديث' : 'حفظ'}
                </button>
                <button type="button" onClick={resetForm} className="btn-secondary">إلغاء</button>
              </div>
            </form>
          )}

          <div className="table-container">
            <div className="table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>اسم الموازنة</th>
                    <th>السنة</th>
                    <th>المبلغ الإجمالي</th>
                    <th>الحالة</th>
                    <th>تاريخ الإنشاء</th>
                    <th>إجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <SkeletonTable rows={4} cols={6} />
                  ) : isError ? (
                    <tr><td colSpan={6} className="text-center py-12">
                      <p className="text-red-400 mb-2">حدث خطأ</p>
                      <button onClick={() => refetch()} className="text-sm text-primary-600 hover:underline">إعادة المحاولة</button>
                    </td></tr>
                  ) : budgets.length === 0 ? (
                    <tr><td colSpan={6} className="text-center py-16">
                      <Calculator size={40} className="mx-auto mb-3 text-gray-300" />
                      <p className="text-gray-500 font-medium">لا يوجد موازنات</p>
                    </td></tr>
                  ) : budgets.map((budget: any) => (
                    <tr key={budget.id}>
                      <td className="font-medium text-gray-800">{budget.name}</td>
                      <td className="text-gray-500">{budget.year}</td>
                      <td className="font-semibold text-gray-900">{Number(budget.total_amount || 0).toLocaleString('en', { minimumFractionDigits: 2 })}</td>
                      <td><span className={`badge ${statusColors[budget.status]}`}>{statusLabels[budget.status]}</span></td>
                      <td className="text-gray-500 text-[13px]">{formatDate(budget.created_at)}</td>
                      <td>
                        <div className="flex gap-1">
                          {budget.status === 'draft' && (
                            <>
                              <button onClick={() => handleApprove(budget.id)} className="action-icon text-gray-400 hover:text-emerald-600 hover:bg-emerald-50" title="اعتماد">
                                <Check size={15} />
                              </button>
                              <button onClick={() => startEdit(budget)} className="action-icon text-gray-400 hover:text-primary-600 hover:bg-primary-50" title="تعديل">
                                <Edit3 size={15} />
                              </button>
                              <button onClick={() => setDeleteId(budget.id)} className="action-icon text-gray-400 hover:text-red-500 hover:bg-red-50" title="حذف">
                                <Trash2 size={15} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {tab === 'comparison' && (
        <div className="space-y-4">
          <div className="card card-body">
            <div className="flex items-center gap-4 mb-4">
              <label className="input-label mb-0">سنة المقارنة:</label>
              <input type="number" value={compYear} onChange={e => setCompYear(parseInt(e.target.value))} className="input w-32" min={2020} max={2040} />
            </div>

            {compLoading ? (
              <SkeletonTable rows={6} cols={4} />
            ) : comparisonData.length === 0 ? (
              <div className="text-center py-12">
                <BarChart3 size={40} className="mx-auto mb-3 text-gray-300" />
                <p className="text-gray-500">لا يوجد بيانات مقارنة لهذه السنة</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-[13px]">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-right font-semibold text-gray-600">الشهر</th>
                      <th className="px-4 py-3 text-right font-semibold text-gray-600">المخطط</th>
                      <th className="px-4 py-3 text-right font-semibold text-gray-600">الفعلي</th>
                      <th className="px-4 py-3 text-right font-semibold text-gray-600">الفرق</th>
                      <th className="px-4 py-3 text-right font-semibold text-gray-600">النسبة</th>
                    </tr>
                  </thead>
                  <tbody>
                    {comparisonData.map((item: any, idx: number) => {
                      const variance = (item.planned || 0) - (item.actual || 0);
                      const pct = item.planned > 0 ? ((item.actual / item.planned) * 100) : 0;
                      return (
                        <tr key={idx} className="border-t border-gray-100">
                          <td className="px-4 py-3 font-medium text-gray-800">{monthNames[item.month - 1] || item.month}</td>
                          <td className="px-4 py-3 text-blue-600">{Number(item.planned || 0).toLocaleString('en', { minimumFractionDigits: 2 })}</td>
                          <td className="px-4 py-3 text-gray-900 font-semibold">{Number(item.actual || 0).toLocaleString('en', { minimumFractionDigits: 2 })}</td>
                          <td className={`px-4 py-3 font-semibold flex items-center gap-1 ${variance >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                            {variance >= 0 ? <TrendingDown size={14} /> : <TrendingUp size={14} />}
                            {Math.abs(variance).toLocaleString('en', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className="w-16 bg-gray-200 rounded-full h-1.5">
                                <div className={`h-1.5 rounded-full ${pct > 100 ? 'bg-red-500' : pct > 80 ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${Math.min(pct, 100)}%` }} />
                              </div>
                              <span className="text-xs text-gray-500">{pct.toFixed(0)}%</span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      <ConfirmDialog
        open={deleteId !== null}
        title="حذف الموازنة"
        message="هل أنت متأكد من حذف هذه الموازنة؟"
        confirmText="حذف"
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}
