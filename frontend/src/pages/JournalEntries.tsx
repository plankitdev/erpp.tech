import { useState } from 'react';
import {
  useJournalEntries, useCreateJournalEntry, usePostJournalEntry,
  useReverseJournalEntry, useDeleteJournalEntry,
} from '../hooks/useFinancial';
import { useChartOfAccounts, useCostCenters } from '../hooks/useFinancial';
import { formatDate } from '../utils';
import toast from 'react-hot-toast';
import {
  Plus, X, BookOpen, Check, RotateCcw, Trash2, Eye,
  Filter, RefreshCw, Download,
} from 'lucide-react';
import { exportToCSV } from '../utils/exportCsv';
import ConfirmDialog from '../components/ConfirmDialog';
import { SkeletonTable } from '../components/Skeletons';
import type { ChartOfAccount, CostCenter } from '../types';

const statusLabels: Record<string, string> = {
  draft: 'مسودة',
  posted: 'مرحّل',
  reversed: 'معكوس',
};

const statusColors: Record<string, string> = {
  draft: 'badge-warning',
  posted: 'badge-success',
  reversed: 'badge-danger',
};

interface LineForm {
  account_id: string;
  debit: string;
  credit: string;
  description: string;
  cost_center_id: string;
}

export default function JournalEntries() {
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [showFilters, setShowFilters] = useState(false);
  const { data, isLoading, isError, refetch } = useJournalEntries(filters);
  const { data: accountsData } = useChartOfAccounts({ per_page: 200 });
  const { data: centersData } = useCostCenters({ per_page: 100 });
  const createMutation = useCreateJournalEntry();
  const postMutation = usePostJournalEntry();
  const reverseMutation = useReverseJournalEntry();
  const deleteMutation = useDeleteJournalEntry();

  const entries = data?.data ?? [];
  const meta = data?.meta;
  const accounts = (accountsData?.data ?? []) as ChartOfAccount[];
  const costCenters = (centersData?.data ?? []) as CostCenter[];

  const [showForm, setShowForm] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [viewingEntry, setViewingEntry] = useState<number | null>(null);
  const [form, setForm] = useState({
    date: new Date().toISOString().split('T')[0],
    description: '',
    reference_type: '',
    lines: [
      { account_id: '', debit: '', credit: '', description: '', cost_center_id: '' },
      { account_id: '', debit: '', credit: '', description: '', cost_center_id: '' },
    ] as LineForm[],
  });

  const addLine = () => setForm(f => ({
    ...f,
    lines: [...f.lines, { account_id: '', debit: '', credit: '', description: '', cost_center_id: '' }],
  }));

  const removeLine = (index: number) => {
    if (form.lines.length <= 2) return;
    setForm(f => ({ ...f, lines: f.lines.filter((_, i) => i !== index) }));
  };

  const updateLine = (index: number, field: keyof LineForm, value: string) => {
    setForm(f => ({
      ...f,
      lines: f.lines.map((l, i) => i === index ? { ...l, [field]: value } : l),
    }));
  };

  const totalDebit = form.lines.reduce((s, l) => s + (parseFloat(l.debit) || 0), 0);
  const totalCredit = form.lines.reduce((s, l) => s + (parseFloat(l.credit) || 0), 0);
  const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01 && totalDebit > 0;

  const resetForm = () => {
    setForm({
      date: new Date().toISOString().split('T')[0],
      description: '',
      reference_type: '',
      lines: [
        { account_id: '', debit: '', credit: '', description: '', cost_center_id: '' },
        { account_id: '', debit: '', credit: '', description: '', cost_center_id: '' },
      ],
    });
    setShowForm(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isBalanced) {
      toast.error('القيد غير متوازن — مجموع المدين يجب أن يساوي مجموع الدائن');
      return;
    }
    try {
      await createMutation.mutateAsync({
        date: form.date,
        description: form.description,
        reference_type: form.reference_type || null,
        lines: form.lines
          .filter(l => l.account_id && (parseFloat(l.debit) > 0 || parseFloat(l.credit) > 0))
          .map(l => ({
            account_id: parseInt(l.account_id),
            debit: parseFloat(l.debit) || 0,
            credit: parseFloat(l.credit) || 0,
            description: l.description || null,
            cost_center_id: l.cost_center_id ? parseInt(l.cost_center_id) : null,
          })),
      });
      toast.success('تم إنشاء القيد بنجاح');
      resetForm();
    } catch {
      toast.error('حدث خطأ في إنشاء القيد');
    }
  };

  const handlePost = async (id: number) => {
    try {
      await postMutation.mutateAsync(id);
      toast.success('تم ترحيل القيد');
    } catch {
      toast.error('حدث خطأ في الترحيل');
    }
  };

  const handleReverse = async (id: number) => {
    try {
      await reverseMutation.mutateAsync(id);
      toast.success('تم عكس القيد بنجاح');
    } catch {
      toast.error('حدث خطأ في عكس القيد');
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteMutation.mutateAsync(deleteId);
      toast.success('تم حذف القيد');
      setDeleteId(null);
    } catch {
      toast.error('لا يمكن حذف قيد مرحّل');
    }
  };

  const viewedEntry = entries.find((e: any) => e.id === viewingEntry);

  const hasActiveFilters = Object.values(filters).some(v => v && v !== '');

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">قيود اليومية</h1>
          <p className="page-subtitle">إدارة القيود المحاسبية — القيد المزدوج</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => exportToCSV('journal-entries', ['رقم القيد', 'التاريخ', 'الوصف', 'مدين', 'دائن', 'الحالة'], entries.map((e: any) => [e.entry_number, e.date, e.description, String(e.total_debit), String(e.total_credit), statusLabels[e.status]]))} disabled={entries.length === 0} className="btn-secondary">
            <Download size={16} /> تصدير
          </button>
          <button onClick={() => { resetForm(); setShowForm(!showForm); }} className={showForm ? 'btn-secondary' : 'btn-primary'}>
            {showForm ? <><X size={16} /> إلغاء</> : <><Plus size={16} /> قيد جديد</>}
          </button>
        </div>
      </div>

      {/* Create Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="card card-body space-y-4 animate-fade-in-up border-r-4 border-primary-500">
          <h3 className="text-base font-bold text-gray-800 flex items-center gap-2">
            <BookOpen size={18} className="text-primary-600" />
            إنشاء قيد جديد
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="input-label">التاريخ</label>
              <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} className="input" required />
            </div>
            <div className="md:col-span-2">
              <label className="input-label">البيان / الوصف</label>
              <input type="text" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="input" placeholder="وصف القيد..." required />
            </div>
          </div>

          {/* Lines */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="input-label mb-0">بنود القيد</label>
              <button type="button" onClick={addLine} className="text-xs text-primary-600 hover:text-primary-700 flex items-center gap-1">
                <Plus size={14} /> إضافة بند
              </button>
            </div>
            <div className="overflow-x-auto border rounded-xl">
              <table className="w-full text-[13px]">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-right font-medium text-gray-600">الحساب</th>
                    <th className="px-3 py-2 text-right font-medium text-gray-600">مدين</th>
                    <th className="px-3 py-2 text-right font-medium text-gray-600">دائن</th>
                    <th className="px-3 py-2 text-right font-medium text-gray-600">مركز التكلفة</th>
                    <th className="px-3 py-2 text-right font-medium text-gray-600">بيان</th>
                    <th className="px-3 py-2 w-10"></th>
                  </tr>
                </thead>
                <tbody>
                  {form.lines.map((line, idx) => (
                    <tr key={idx} className="border-t border-gray-100">
                      <td className="px-2 py-1.5">
                        <select value={line.account_id} onChange={e => updateLine(idx, 'account_id', e.target.value)} className="select text-xs py-1.5" required>
                          <option value="">اختر حساب</option>
                          {accounts.map(a => <option key={a.id} value={a.id}>{a.code} - {a.name}</option>)}
                        </select>
                      </td>
                      <td className="px-2 py-1.5">
                        <input type="number" step="0.01" min="0" value={line.debit} onChange={e => updateLine(idx, 'debit', e.target.value)} className="input text-xs py-1.5" placeholder="0.00" dir="ltr" />
                      </td>
                      <td className="px-2 py-1.5">
                        <input type="number" step="0.01" min="0" value={line.credit} onChange={e => updateLine(idx, 'credit', e.target.value)} className="input text-xs py-1.5" placeholder="0.00" dir="ltr" />
                      </td>
                      <td className="px-2 py-1.5">
                        <select value={line.cost_center_id} onChange={e => updateLine(idx, 'cost_center_id', e.target.value)} className="select text-xs py-1.5">
                          <option value="">—</option>
                          {costCenters.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                      </td>
                      <td className="px-2 py-1.5">
                        <input type="text" value={line.description} onChange={e => updateLine(idx, 'description', e.target.value)} className="input text-xs py-1.5" placeholder="بيان البند" />
                      </td>
                      <td className="px-2 py-1.5">
                        {form.lines.length > 2 && (
                          <button type="button" onClick={() => removeLine(idx)} className="text-red-400 hover:text-red-600">
                            <X size={14} />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50 font-semibold">
                  <tr>
                    <td className="px-3 py-2 text-gray-700">الإجمالي</td>
                    <td className={`px-3 py-2 ${isBalanced ? 'text-emerald-600' : 'text-red-500'}`}>{totalDebit.toFixed(2)}</td>
                    <td className={`px-3 py-2 ${isBalanced ? 'text-emerald-600' : 'text-red-500'}`}>{totalCredit.toFixed(2)}</td>
                    <td colSpan={3} className="px-3 py-2">
                      {isBalanced ? (
                        <span className="text-emerald-600 text-xs flex items-center gap-1"><Check size={14} /> القيد متوازن</span>
                      ) : (
                        <span className="text-red-500 text-xs">الفرق: {Math.abs(totalDebit - totalCredit).toFixed(2)}</span>
                      )}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          <div className="flex gap-2 pt-1">
            <button type="submit" disabled={createMutation.isPending || !isBalanced} className="btn-primary disabled:opacity-50">
              {createMutation.isPending ? 'جاري الحفظ...' : 'حفظ القيد'}
            </button>
            <button type="button" onClick={resetForm} className="btn-secondary">إلغاء</button>
          </div>
        </form>
      )}

      {/* Filters */}
      <div className="card card-body">
        <div className="flex items-center justify-between mb-2">
          <button onClick={() => setShowFilters(!showFilters)} className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-primary-600 transition-colors">
            <Filter size={16} /> فلترة القيود
            {hasActiveFilters && <span className="w-2 h-2 rounded-full bg-primary-500" />}
          </button>
          <div className="flex items-center gap-2">
            {hasActiveFilters && (
              <button onClick={() => setFilters({})} className="text-xs text-red-500 flex items-center gap-1"><X size={14} /> مسح</button>
            )}
            <button onClick={() => refetch()} className="btn-icon" title="تحديث"><RefreshCw size={16} /></button>
          </div>
        </div>
        {showFilters && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 animate-fade-in">
            <select value={filters.status || ''} onChange={e => setFilters(f => ({ ...f, status: e.target.value }))} className="select text-sm">
              <option value="">كل الحالات</option>
              <option value="draft">مسودة</option>
              <option value="posted">مرحّل</option>
              <option value="reversed">معكوس</option>
            </select>
            <input type="date" value={filters.from || ''} onChange={e => setFilters(f => ({ ...f, from: e.target.value }))} className="input text-sm" />
            <input type="date" value={filters.to || ''} onChange={e => setFilters(f => ({ ...f, to: e.target.value }))} className="input text-sm" />
            <input type="text" placeholder="بحث..." value={filters.search || ''} onChange={e => setFilters(f => ({ ...f, search: e.target.value }))} className="input text-sm" />
          </div>
        )}
      </div>

      {/* View Entry Modal */}
      {viewedEntry && (
        <div className="card card-body animate-fade-in-up border-r-4 border-blue-500">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-gray-800 flex items-center gap-2">
              <Eye size={18} className="text-blue-600" />
              قيد رقم: {viewedEntry.entry_number}
            </h3>
            <button onClick={() => setViewingEntry(null)} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
          </div>
          <div className="grid grid-cols-3 gap-4 mb-4 text-sm">
            <div><span className="text-gray-400">التاريخ:</span> <span className="font-medium">{formatDate(viewedEntry.date)}</span></div>
            <div><span className="text-gray-400">الحالة:</span> <span className={`badge ${statusColors[viewedEntry.status]}`}>{statusLabels[viewedEntry.status]}</span></div>
            <div><span className="text-gray-400">البيان:</span> <span className="font-medium">{viewedEntry.description}</span></div>
          </div>
          {viewedEntry.lines && (
            <table className="w-full text-[13px] border rounded-lg overflow-hidden">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-right">الحساب</th>
                  <th className="px-3 py-2 text-right">مدين</th>
                  <th className="px-3 py-2 text-right">دائن</th>
                  <th className="px-3 py-2 text-right">البيان</th>
                </tr>
              </thead>
              <tbody>
                {viewedEntry.lines.map((line: any) => (
                  <tr key={line.id} className="border-t border-gray-100">
                    <td className="px-3 py-2">{line.account?.code} - {line.account?.name}</td>
                    <td className="px-3 py-2 text-emerald-600 font-medium">{Number(line.debit) > 0 ? Number(line.debit).toLocaleString('en', { minimumFractionDigits: 2 }) : '—'}</td>
                    <td className="px-3 py-2 text-red-500 font-medium">{Number(line.credit) > 0 ? Number(line.credit).toLocaleString('en', { minimumFractionDigits: 2 }) : '—'}</td>
                    <td className="px-3 py-2 text-gray-500">{line.description || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Entries Table */}
      <div className="table-container">
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>رقم القيد</th>
                <th>التاريخ</th>
                <th>الوصف</th>
                <th>مدين</th>
                <th>دائن</th>
                <th>الحالة</th>
                <th>إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <SkeletonTable rows={5} cols={7} />
              ) : isError ? (
                <tr><td colSpan={7} className="text-center py-12">
                  <p className="text-red-400 mb-2">حدث خطأ في تحميل البيانات</p>
                  <button onClick={() => refetch()} className="text-sm text-primary-600 hover:underline">إعادة المحاولة</button>
                </td></tr>
              ) : entries.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-16">
                  <BookOpen size={40} className="mx-auto mb-3 text-gray-300" />
                  <p className="text-gray-500 font-medium">لا يوجد قيود</p>
                  <p className="text-xs text-gray-400 mt-1">ابدأ بإنشاء أول قيد محاسبي</p>
                </td></tr>
              ) : entries.map((entry: any) => (
                <tr key={entry.id}>
                  <td className="font-mono text-sm text-primary-600">{entry.entry_number}</td>
                  <td className="text-gray-500 text-[13px]">{formatDate(entry.date)}</td>
                  <td className="text-gray-700 text-[13px] max-w-[200px] truncate">{entry.description}</td>
                  <td className="text-emerald-600 font-semibold">{Number(entry.total_debit).toLocaleString('en', { minimumFractionDigits: 2 })}</td>
                  <td className="text-red-500 font-semibold">{Number(entry.total_credit).toLocaleString('en', { minimumFractionDigits: 2 })}</td>
                  <td><span className={`badge ${statusColors[entry.status]}`}>{statusLabels[entry.status]}</span></td>
                  <td>
                    <div className="flex gap-1">
                      <button onClick={() => setViewingEntry(entry.id)} className="action-icon text-gray-400 hover:text-blue-600 hover:bg-blue-50" title="عرض">
                        <Eye size={15} />
                      </button>
                      {entry.status === 'draft' && (
                        <>
                          <button onClick={() => handlePost(entry.id)} className="action-icon text-gray-400 hover:text-emerald-600 hover:bg-emerald-50" title="ترحيل">
                            <Check size={15} />
                          </button>
                          <button onClick={() => setDeleteId(entry.id)} className="action-icon text-gray-400 hover:text-red-500 hover:bg-red-50" title="حذف">
                            <Trash2 size={15} />
                          </button>
                        </>
                      )}
                      {entry.status === 'posted' && (
                        <button onClick={() => handleReverse(entry.id)} className="action-icon text-gray-400 hover:text-orange-500 hover:bg-orange-50" title="عكس">
                          <RotateCcw size={15} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {meta && meta.last_page > 1 && (
          <div className="flex items-center justify-between px-5 py-4 border-t border-gray-100">
            <p className="text-xs text-gray-400">عرض {((meta.current_page - 1) * meta.per_page) + 1} - {Math.min(meta.current_page * meta.per_page, meta.total)} من {meta.total}</p>
            <div className="flex items-center gap-1">
              {Array.from({ length: meta.last_page }, (_, i) => (
                <button key={i + 1} onClick={() => setFilters(f => ({ ...f, page: String(i + 1) }))}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${meta.current_page === i + 1 ? 'bg-primary-600 text-white shadow-sm' : 'bg-surface-100 text-gray-600 hover:bg-surface-200'}`}>
                  {i + 1}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={deleteId !== null}
        title="حذف القيد"
        message="هل أنت متأكد من حذف هذا القيد؟ لا يمكن حذف قيود مرحّلة."
        confirmText="حذف"
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}
