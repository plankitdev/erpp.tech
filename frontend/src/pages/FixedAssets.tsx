import { useState } from 'react';
import {
  useFixedAssets, useCreateFixedAsset, useUpdateFixedAsset,
  useDeleteFixedAsset, useDepreciateAssets, useAssetSummary,
} from '../hooks/useFinancial';
import { formatDate } from '../utils';
import toast from 'react-hot-toast';
import {
  Plus, X, Edit3, Trash2, Box, Calculator, BarChart3,
  RefreshCw, Download,
} from 'lucide-react';
import { exportToCSV } from '../utils/exportCsv';
import ConfirmDialog from '../components/ConfirmDialog';
import { SkeletonTable } from '../components/Skeletons';

const categoryLabels: Record<string, string> = {
  equipment: 'معدات',
  furniture: 'أثاث',
  vehicles: 'مركبات',
  electronics: 'إلكترونيات',
  property: 'عقارات',
  other: 'أخرى',
};

const statusLabels: Record<string, string> = {
  active: 'نشط',
  disposed: 'تم التخلص',
  under_maintenance: 'تحت الصيانة',
};

const statusColors: Record<string, string> = {
  active: 'badge-success',
  disposed: 'badge-neutral',
  under_maintenance: 'badge-warning',
};

const methodLabels: Record<string, string> = {
  straight_line: 'القسط الثابت',
  declining_balance: 'القسط المتناقص',
};

export default function FixedAssets() {
  const [tab, setTab] = useState<'list' | 'summary'>('list');
  const [filters, setFilters] = useState<Record<string, string>>({});
  const { data, isLoading, isError, refetch } = useFixedAssets(filters);
  const { data: summary, isLoading: summaryLoading } = useAssetSummary();
  const createMutation = useCreateFixedAsset();
  const updateMutation = useUpdateFixedAsset();
  const deleteMutation = useDeleteFixedAsset();
  const depreciateMutation = useDepreciateAssets();

  const assets = data?.data ?? [];

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [form, setForm] = useState({
    code: '', name: '', category: 'equipment', purchase_date: '',
    purchase_cost: '', salvage_value: '0', useful_life_months: '60',
    depreciation_method: 'straight_line', location: '', serial_number: '', notes: '',
  });

  const resetForm = () => {
    setForm({
      code: '', name: '', category: 'equipment', purchase_date: '',
      purchase_cost: '', salvage_value: '0', useful_life_months: '60',
      depreciation_method: 'straight_line', location: '', serial_number: '', notes: '',
    });
    setEditingId(null);
    setShowForm(false);
  };

  const startEdit = (asset: any) => {
    setForm({
      code: asset.code, name: asset.name, category: asset.category,
      purchase_date: asset.purchase_date, purchase_cost: String(asset.purchase_cost),
      salvage_value: String(asset.salvage_value || 0),
      useful_life_months: String(asset.useful_life_months),
      depreciation_method: asset.depreciation_method,
      location: asset.location || '', serial_number: asset.serial_number || '',
      notes: asset.notes || '',
    });
    setEditingId(asset.id);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      ...form,
      purchase_cost: parseFloat(form.purchase_cost),
      salvage_value: parseFloat(form.salvage_value) || 0,
      useful_life_months: parseInt(form.useful_life_months),
    };
    try {
      if (editingId) {
        await updateMutation.mutateAsync({ id: editingId, data: payload });
        toast.success('تم تحديث الأصل');
      } else {
        await createMutation.mutateAsync(payload);
        toast.success('تم إضافة الأصل');
      }
      resetForm();
    } catch {
      toast.error('حدث خطأ');
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteMutation.mutateAsync(deleteId);
      toast.success('تم حذف الأصل');
      setDeleteId(null);
    } catch {
      toast.error('حدث خطأ');
    }
  };

  const handleDepreciate = async () => {
    try {
      await depreciateMutation.mutateAsync();
      toast.success('تم احتساب الإهلاك الشهري');
    } catch {
      toast.error('حدث خطأ في احتساب الإهلاك');
    }
  };

  const summaryData = (summary as any[]) ?? [];

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">الأصول الثابتة</h1>
          <p className="page-subtitle">سجل الأصول، الإهلاك، والقيمة الدفترية</p>
        </div>
        <div className="flex gap-2">
          <div className="flex bg-gray-100 rounded-lg p-0.5">
            <button onClick={() => setTab('list')} className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${tab === 'list' ? 'bg-white shadow-sm text-gray-800' : 'text-gray-500'}`}>
              السجل
            </button>
            <button onClick={() => setTab('summary')} className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${tab === 'summary' ? 'bg-white shadow-sm text-gray-800' : 'text-gray-500'}`}>
              <BarChart3 size={14} className="inline ml-1" />ملخص
            </button>
          </div>
          <button onClick={handleDepreciate} disabled={depreciateMutation.isPending} className="btn-secondary">
            <Calculator size={16} /> {depreciateMutation.isPending ? 'جاري...' : 'احتساب الإهلاك'}
          </button>
          <button onClick={() => exportToCSV('fixed-assets', ['الكود', 'الاسم', 'التصنيف', 'تكلفة الشراء', 'الإهلاك المتراكم', 'القيمة الحالية', 'الحالة'], assets.map((a: any) => [a.code, a.name, categoryLabels[a.category], String(a.purchase_cost), String(a.accumulated_depreciation), String(a.current_value), statusLabels[a.status]]))} disabled={assets.length === 0} className="btn-secondary">
            <Download size={16} /> تصدير
          </button>
          {tab === 'list' && (
            <button onClick={() => { resetForm(); setShowForm(!showForm); }} className={showForm ? 'btn-secondary' : 'btn-primary'}>
              {showForm ? <><X size={16} /> إلغاء</> : <><Plus size={16} /> أصل جديد</>}
            </button>
          )}
        </div>
      </div>

      {tab === 'list' && (
        <>
          {/* Filters */}
          <div className="filter-bar">
            <select value={filters.category || ''} onChange={e => setFilters(f => ({ ...f, category: e.target.value }))} className="select max-w-[160px]">
              <option value="">كل التصنيفات</option>
              {Object.entries(categoryLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
            <select value={filters.status || ''} onChange={e => setFilters(f => ({ ...f, status: e.target.value }))} className="select max-w-[160px]">
              <option value="">كل الحالات</option>
              {Object.entries(statusLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>

          {showForm && (
            <form onSubmit={handleSubmit} className="card card-body space-y-4 animate-fade-in-up border-r-4 border-primary-500">
              <h3 className="text-base font-bold text-gray-800 flex items-center gap-2">
                <Box size={18} className="text-primary-600" />
                {editingId ? 'تعديل الأصل' : 'إضافة أصل ثابت'}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="input-label">كود الأصل</label>
                  <input type="text" value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} className="input" placeholder="FA-001" required />
                </div>
                <div>
                  <label className="input-label">اسم الأصل</label>
                  <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="input" placeholder="سيارة نقل" required />
                </div>
                <div>
                  <label className="input-label">التصنيف</label>
                  <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className="select">
                    {Object.entries(categoryLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="input-label">تاريخ الشراء</label>
                  <input type="date" value={form.purchase_date} onChange={e => setForm({ ...form, purchase_date: e.target.value })} className="input" required />
                </div>
                <div>
                  <label className="input-label">تكلفة الشراء</label>
                  <input type="number" step="0.01" value={form.purchase_cost} onChange={e => setForm({ ...form, purchase_cost: e.target.value })} className="input" required />
                </div>
                <div>
                  <label className="input-label">القيمة التخريدية</label>
                  <input type="number" step="0.01" value={form.salvage_value} onChange={e => setForm({ ...form, salvage_value: e.target.value })} className="input" />
                </div>
                <div>
                  <label className="input-label">العمر الافتراضي (شهور)</label>
                  <input type="number" value={form.useful_life_months} onChange={e => setForm({ ...form, useful_life_months: e.target.value })} className="input" required />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="input-label">طريقة الإهلاك</label>
                  <select value={form.depreciation_method} onChange={e => setForm({ ...form, depreciation_method: e.target.value })} className="select">
                    {Object.entries(methodLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
                <div>
                  <label className="input-label">الموقع</label>
                  <input type="text" value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} className="input" placeholder="المكتب الرئيسي" />
                </div>
                <div>
                  <label className="input-label">الرقم التسلسلي</label>
                  <input type="text" value={form.serial_number} onChange={e => setForm({ ...form, serial_number: e.target.value })} className="input" dir="ltr" />
                </div>
              </div>
              <div className="flex gap-2 pt-1">
                <button type="submit" disabled={createMutation.isPending || updateMutation.isPending} className="btn-primary">
                  {(createMutation.isPending || updateMutation.isPending) ? 'جاري الحفظ...' : editingId ? 'تحديث' : 'حفظ'}
                </button>
                <button type="button" onClick={resetForm} className="btn-secondary">إلغاء</button>
              </div>
            </form>
          )}

          {/* Assets Table */}
          <div className="table-container">
            <div className="table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>الكود</th>
                    <th>الاسم</th>
                    <th>التصنيف</th>
                    <th>تكلفة الشراء</th>
                    <th>الإهلاك المتراكم</th>
                    <th>القيمة الحالية</th>
                    <th>طريقة الإهلاك</th>
                    <th>الحالة</th>
                    <th>إجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <SkeletonTable rows={5} cols={9} />
                  ) : isError ? (
                    <tr><td colSpan={9} className="text-center py-12">
                      <p className="text-red-400 mb-2">حدث خطأ</p>
                      <button onClick={() => refetch()} className="text-sm text-primary-600 hover:underline">إعادة المحاولة</button>
                    </td></tr>
                  ) : assets.length === 0 ? (
                    <tr><td colSpan={9} className="text-center py-16">
                      <Box size={40} className="mx-auto mb-3 text-gray-300" />
                      <p className="text-gray-500 font-medium">لا يوجد أصول ثابتة</p>
                    </td></tr>
                  ) : assets.map((asset: any) => (
                    <tr key={asset.id}>
                      <td className="font-mono text-sm text-gray-500">{asset.code}</td>
                      <td className="font-medium text-gray-800">{asset.name}</td>
                      <td><span className="badge badge-neutral">{categoryLabels[asset.category]}</span></td>
                      <td className="font-semibold text-gray-900">{Number(asset.purchase_cost).toLocaleString('en', { minimumFractionDigits: 2 })}</td>
                      <td className="text-red-500">{Number(asset.accumulated_depreciation || 0).toLocaleString('en', { minimumFractionDigits: 2 })}</td>
                      <td className="font-bold text-emerald-600">{Number(asset.current_value).toLocaleString('en', { minimumFractionDigits: 2 })}</td>
                      <td className="text-gray-500 text-[12px]">{methodLabels[asset.depreciation_method]}</td>
                      <td><span className={`badge ${statusColors[asset.status]}`}>{statusLabels[asset.status]}</span></td>
                      <td>
                        <div className="flex gap-1">
                          <button onClick={() => startEdit(asset)} className="action-icon text-gray-400 hover:text-primary-600 hover:bg-primary-50">
                            <Edit3 size={15} />
                          </button>
                          <button onClick={() => setDeleteId(asset.id)} className="action-icon text-gray-400 hover:text-red-500 hover:bg-red-50">
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
        </>
      )}

      {tab === 'summary' && (
        <div className="card card-body">
          <h3 className="text-base font-bold text-gray-800 mb-4 flex items-center gap-2">
            <BarChart3 size={18} className="text-primary-600" />
            ملخص الأصول حسب التصنيف
          </h3>
          {summaryLoading ? (
            <SkeletonTable rows={6} cols={5} />
          ) : summaryData.length === 0 ? (
            <div className="text-center py-12 text-gray-400">لا يوجد بيانات</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-[13px]">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-right font-semibold text-gray-600">التصنيف</th>
                    <th className="px-4 py-3 text-right font-semibold text-gray-600">العدد</th>
                    <th className="px-4 py-3 text-right font-semibold text-gray-600">إجمالي التكلفة</th>
                    <th className="px-4 py-3 text-right font-semibold text-gray-600">الإهلاك المتراكم</th>
                    <th className="px-4 py-3 text-right font-semibold text-gray-600">القيمة الدفترية</th>
                  </tr>
                </thead>
                <tbody>
                  {summaryData.map((item: any, idx: number) => (
                    <tr key={idx} className="border-t border-gray-100">
                      <td className="px-4 py-3 font-medium text-gray-800">{item.category_label || categoryLabels[item.category] || item.category}</td>
                      <td className="px-4 py-3 text-gray-600">{item.count}</td>
                      <td className="px-4 py-3 font-semibold text-gray-900">{Number(item.total_cost || 0).toLocaleString('en', { minimumFractionDigits: 2 })}</td>
                      <td className="px-4 py-3 text-red-500">{Number(item.total_depreciation || 0).toLocaleString('en', { minimumFractionDigits: 2 })}</td>
                      <td className="px-4 py-3 font-bold text-emerald-600">{Number(item.book_value || 0).toLocaleString('en', { minimumFractionDigits: 2 })}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      <ConfirmDialog
        open={deleteId !== null}
        title="حذف الأصل"
        message="هل أنت متأكد من حذف هذا الأصل؟"
        confirmText="حذف"
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}
