import { useState } from 'react';
import {
  useAccountTree, useChartOfAccounts, useCreateAccount,
  useUpdateAccount, useDeleteAccount, useSeedAccounts,
} from '../hooks/useFinancial';
import toast from 'react-hot-toast';
import {
  Plus, X, ChevronDown, ChevronLeft, Trash2, Edit3,
  FolderTree, Download, Layers, Sprout,
} from 'lucide-react';
import ConfirmDialog from '../components/ConfirmDialog';
import { SkeletonTable } from '../components/Skeletons';
import type { ChartOfAccount } from '../types';

const typeLabels: Record<string, string> = {
  asset: 'أصول',
  liability: 'التزامات',
  equity: 'حقوق ملكية',
  revenue: 'إيرادات',
  expense: 'مصروفات',
};

const typeColors: Record<string, string> = {
  asset: 'badge-info',
  liability: 'badge-danger',
  equity: 'badge-neutral',
  revenue: 'badge-success',
  expense: 'badge-warning',
};

const natureLabels: Record<string, string> = {
  debit: 'مدين',
  credit: 'دائن',
};

export default function ChartOfAccounts() {
  const { data: treeData, isLoading: treeLoading } = useAccountTree();
  const { data: flatData } = useChartOfAccounts({ per_page: 200 });
  const createMutation = useCreateAccount();
  const updateMutation = useUpdateAccount();
  const deleteMutation = useDeleteAccount();
  const seedMutation = useSeedAccounts();

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [expandedNodes, setExpandedNodes] = useState<Set<number>>(new Set());
  const [form, setForm] = useState({
    code: '',
    name: '',
    name_en: '',
    type: 'asset',
    nature: 'debit',
    parent_id: '' as string | number,
    description: '',
  });

  const tree = (treeData as ChartOfAccount[]) ?? [];
  const allAccounts = flatData?.data ?? [];

  const parentAccounts = allAccounts.filter((a: ChartOfAccount) => !a.parent_id || a.id !== editingId);

  const toggleExpand = (id: number) => {
    setExpandedNodes(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const expandAll = () => {
    const ids = new Set(allAccounts.map((a: ChartOfAccount) => a.id));
    setExpandedNodes(ids);
  };

  const resetForm = () => {
    setForm({ code: '', name: '', name_en: '', type: 'asset', nature: 'debit', parent_id: '', description: '' });
    setEditingId(null);
    setShowForm(false);
  };

  const startEdit = (account: ChartOfAccount) => {
    setForm({
      code: account.code,
      name: account.name,
      name_en: account.name_en || '',
      type: account.type,
      nature: account.nature,
      parent_id: account.parent_id || '',
      description: account.description || '',
    });
    setEditingId(account.id);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      ...form,
      parent_id: form.parent_id || null,
    };
    try {
      if (editingId) {
        await updateMutation.mutateAsync({ id: editingId, data: payload });
        toast.success('تم تحديث الحساب بنجاح');
      } else {
        await createMutation.mutateAsync(payload);
        toast.success('تم إنشاء الحساب بنجاح');
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
      toast.success('تم حذف الحساب');
      setDeleteId(null);
    } catch {
      toast.error('لا يمكن حذف حساب مرتبط بقيود');
    }
  };

  const handleSeed = async () => {
    try {
      await seedMutation.mutateAsync();
      toast.success('تم إنشاء دليل الحسابات الافتراضي');
      expandAll();
    } catch {
      toast.error('حدث خطأ');
    }
  };

  const renderTreeNode = (node: ChartOfAccount, depth = 0) => {
    const hasChildren = node.children && node.children.length > 0;
    const isExpanded = expandedNodes.has(node.id);

    return (
      <div key={node.id}>
        <div
          className={`flex items-center gap-2 px-3 py-2.5 hover:bg-gray-50 border-b border-gray-100 transition-colors group`}
          style={{ paddingRight: `${depth * 24 + 12}px` }}
        >
          {hasChildren ? (
            <button onClick={() => toggleExpand(node.id)} className="text-gray-400 hover:text-gray-600 transition-colors">
              {isExpanded ? <ChevronDown size={16} /> : <ChevronLeft size={16} />}
            </button>
          ) : (
            <span className="w-4" />
          )}
          <span className="text-xs font-mono text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">{node.code}</span>
          <span className="font-medium text-gray-800 flex-1 text-[13px]">{node.name}</span>
          <span className={`badge text-[10px] ${typeColors[node.type] || 'badge-neutral'}`}>{typeLabels[node.type]}</span>
          <span className="text-[11px] text-gray-400">{natureLabels[node.nature]}</span>
          <div className="opacity-0 group-hover:opacity-100 flex gap-1 transition-opacity">
            <button onClick={() => startEdit(node)} className="action-icon text-gray-400 hover:text-primary-600 hover:bg-primary-50">
              <Edit3 size={14} />
            </button>
            {!node.is_system && (
              <button onClick={() => setDeleteId(node.id)} className="action-icon text-gray-400 hover:text-red-500 hover:bg-red-50">
                <Trash2 size={14} />
              </button>
            )}
          </div>
        </div>
        {hasChildren && isExpanded && node.children!.map(child => renderTreeNode(child, depth + 1))}
      </div>
    );
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">دليل الحسابات</h1>
          <p className="page-subtitle">شجرة الحسابات المحاسبية — تنظيم هرمي للحسابات</p>
        </div>
        <div className="flex gap-2">
          {allAccounts.length === 0 && (
            <button onClick={handleSeed} disabled={seedMutation.isPending} className="btn-secondary">
              <Sprout size={16} /> {seedMutation.isPending ? 'جاري الإنشاء...' : 'إنشاء دليل افتراضي'}
            </button>
          )}
          <button onClick={expandAll} className="btn-secondary">
            <Layers size={16} /> توسيع الكل
          </button>
          <button onClick={() => { resetForm(); setShowForm(!showForm); }} className={showForm ? 'btn-secondary' : 'btn-primary'}>
            {showForm ? <><X size={16} /> إلغاء</> : <><Plus size={16} /> حساب جديد</>}
          </button>
        </div>
      </div>

      {/* Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="card card-body space-y-4 animate-fade-in-up border-r-4 border-primary-500">
          <h3 className="text-base font-bold text-gray-800 flex items-center gap-2">
            {editingId ? <Edit3 size={18} className="text-primary-600" /> : <Plus size={18} className="text-primary-600" />}
            {editingId ? 'تعديل الحساب' : 'إضافة حساب جديد'}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="input-label">كود الحساب</label>
              <input type="text" value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} className="input" placeholder="1100" required />
            </div>
            <div>
              <label className="input-label">اسم الحساب</label>
              <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="input" placeholder="النقدية" required />
            </div>
            <div>
              <label className="input-label">الاسم بالإنجليزية (اختياري)</label>
              <input type="text" value={form.name_en} onChange={e => setForm({ ...form, name_en: e.target.value })} className="input" placeholder="Cash" dir="ltr" />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="input-label">نوع الحساب</label>
              <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} className="select">
                {Object.entries(typeLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div>
              <label className="input-label">طبيعة الحساب</label>
              <select value={form.nature} onChange={e => setForm({ ...form, nature: e.target.value })} className="select">
                <option value="debit">مدين</option>
                <option value="credit">دائن</option>
              </select>
            </div>
            <div>
              <label className="input-label">الحساب الأب</label>
              <select value={form.parent_id} onChange={e => setForm({ ...form, parent_id: e.target.value })} className="select">
                <option value="">— حساب رئيسي —</option>
                {parentAccounts.map((a: ChartOfAccount) => (
                  <option key={a.id} value={a.id}>{a.code} - {a.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="input-label">الوصف</label>
            <input type="text" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="input" placeholder="وصف اختياري للحساب..." />
          </div>
          <div className="flex gap-2 pt-1">
            <button type="submit" disabled={createMutation.isPending || updateMutation.isPending} className="btn-primary">
              {(createMutation.isPending || updateMutation.isPending) ? 'جاري الحفظ...' : editingId ? 'تحديث' : 'حفظ'}
            </button>
            <button type="button" onClick={resetForm} className="btn-secondary">إلغاء</button>
          </div>
        </form>
      )}

      {/* Tree View */}
      <div className="card overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2 bg-gray-50/50">
          <FolderTree size={16} className="text-primary-500" />
          <span className="text-sm font-semibold text-gray-700">شجرة الحسابات</span>
          <span className="text-xs text-gray-400 mr-2">({allAccounts.length} حساب)</span>
        </div>

        {treeLoading ? (
          <div className="p-4"><SkeletonTable rows={8} cols={4} /></div>
        ) : tree.length === 0 ? (
          <div className="text-center py-16">
            <FolderTree size={40} className="mx-auto mb-3 text-gray-300" />
            <p className="text-gray-500 font-medium">لا يوجد حسابات</p>
            <p className="text-xs text-gray-400 mt-1">ابدأ بإنشاء دليل الحسابات الافتراضي</p>
          </div>
        ) : (
          <div>{tree.map(node => renderTreeNode(node))}</div>
        )}
      </div>

      <ConfirmDialog
        open={deleteId !== null}
        title="حذف الحساب"
        message="هل أنت متأكد من حذف هذا الحساب؟ لا يمكن حذف حسابات مرتبطة بقيود."
        confirmText="حذف"
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}
