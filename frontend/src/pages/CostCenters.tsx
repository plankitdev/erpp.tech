import { useState } from 'react';
import {
  useCostCenters, useCreateCostCenter, useUpdateCostCenter, useDeleteCostCenter,
} from '../hooks/useFinancial';
import toast from 'react-hot-toast';
import { Plus, X, Edit3, Trash2, Building, GitBranch } from 'lucide-react';
import ConfirmDialog from '../components/ConfirmDialog';
import { SkeletonTable } from '../components/Skeletons';
import type { CostCenter } from '../types';

const typeLabels: Record<string, string> = {
  department: 'قسم',
  project: 'مشروع',
  branch: 'فرع',
};

const typeColors: Record<string, string> = {
  department: 'badge-info',
  project: 'badge-success',
  branch: 'badge-warning',
};

export default function CostCenters() {
  const { data, isLoading, isError, refetch } = useCostCenters({ per_page: 100 });
  const createMutation = useCreateCostCenter();
  const updateMutation = useUpdateCostCenter();
  const deleteMutation = useDeleteCostCenter();

  const centers = (data?.data ?? []) as CostCenter[];

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [form, setForm] = useState({
    code: '',
    name: '',
    type: 'department',
    parent_id: '' as string | number,
    is_active: true,
  });

  const resetForm = () => {
    setForm({ code: '', name: '', type: 'department', parent_id: '', is_active: true });
    setEditingId(null);
    setShowForm(false);
  };

  const startEdit = (center: CostCenter) => {
    setForm({
      code: center.code,
      name: center.name,
      type: center.type,
      parent_id: center.parent_id || '',
      is_active: center.is_active,
    });
    setEditingId(center.id);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { ...form, parent_id: form.parent_id || null };
    try {
      if (editingId) {
        await updateMutation.mutateAsync({ id: editingId, data: payload });
        toast.success('تم تحديث مركز التكلفة');
      } else {
        await createMutation.mutateAsync(payload);
        toast.success('تم إنشاء مركز التكلفة');
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
      toast.success('تم حذف مركز التكلفة');
      setDeleteId(null);
    } catch {
      toast.error('لا يمكن حذف مركز مرتبط بقيود');
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">مراكز التكلفة</h1>
          <p className="page-subtitle">تنظيم وتتبع التكاليف حسب الأقسام والمشاريع والفروع</p>
        </div>
        <button onClick={() => { resetForm(); setShowForm(!showForm); }} className={showForm ? 'btn-secondary' : 'btn-primary'}>
          {showForm ? <><X size={16} /> إلغاء</> : <><Plus size={16} /> مركز جديد</>}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="card card-body space-y-4 animate-fade-in-up border-r-4 border-primary-500">
          <h3 className="text-base font-bold text-gray-800 flex items-center gap-2">
            <GitBranch size={18} className="text-primary-600" />
            {editingId ? 'تعديل مركز التكلفة' : 'إضافة مركز تكلفة'}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="input-label">الكود</label>
              <input type="text" value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} className="input" placeholder="CC-01" required />
            </div>
            <div>
              <label className="input-label">الاسم</label>
              <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="input" placeholder="قسم المبيعات" required />
            </div>
            <div>
              <label className="input-label">النوع</label>
              <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} className="select">
                {Object.entries(typeLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div>
              <label className="input-label">المركز الأب</label>
              <select value={form.parent_id} onChange={e => setForm({ ...form, parent_id: e.target.value })} className="select">
                <option value="">— رئيسي —</option>
                {centers.filter(c => c.id !== editingId).map(c => (
                  <option key={c.id} value={c.id}>{c.code} - {c.name}</option>
                ))}
              </select>
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

      <div className="table-container">
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>الكود</th>
                <th>الاسم</th>
                <th>النوع</th>
                <th>المركز الأب</th>
                <th>الحالة</th>
                <th>إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <SkeletonTable rows={5} cols={6} />
              ) : isError ? (
                <tr><td colSpan={6} className="text-center py-12">
                  <p className="text-red-400 mb-2">حدث خطأ</p>
                  <button onClick={() => refetch()} className="text-sm text-primary-600 hover:underline">إعادة المحاولة</button>
                </td></tr>
              ) : centers.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-16">
                  <Building size={40} className="mx-auto mb-3 text-gray-300" />
                  <p className="text-gray-500 font-medium">لا يوجد مراكز تكلفة</p>
                </td></tr>
              ) : centers.map((center) => (
                <tr key={center.id}>
                  <td className="font-mono text-sm text-gray-500">{center.code}</td>
                  <td className="font-medium text-gray-800">{center.name}</td>
                  <td><span className={`badge ${typeColors[center.type]}`}>{typeLabels[center.type]}</span></td>
                  <td className="text-gray-500 text-[13px]">{center.parent?.name || '—'}</td>
                  <td>
                    <span className={`badge ${center.is_active ? 'badge-success' : 'badge-neutral'}`}>
                      {center.is_active ? 'نشط' : 'غير نشط'}
                    </span>
                  </td>
                  <td>
                    <div className="flex gap-1">
                      <button onClick={() => startEdit(center)} className="action-icon text-gray-400 hover:text-primary-600 hover:bg-primary-50">
                        <Edit3 size={15} />
                      </button>
                      <button onClick={() => setDeleteId(center.id)} className="action-icon text-gray-400 hover:text-red-500 hover:bg-red-50">
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

      <ConfirmDialog
        open={deleteId !== null}
        title="حذف مركز التكلفة"
        message="هل أنت متأكد من حذف هذا المركز؟"
        confirmText="حذف"
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}
