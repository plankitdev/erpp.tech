import { useState } from 'react';
import { useFileTemplates, useCreateFileTemplate, useDeleteFileTemplate } from '../hooks/useFileTemplates';
import {
  FileText, Plus, X, Upload, Trash2, Loader2, AlertCircle,
  Receipt, FileSignature, LayoutTemplate, BarChart3, FolderOpen, Download,
} from 'lucide-react';
import toast from 'react-hot-toast';
import ConfirmDialog from '../components/ConfirmDialog';
import SearchInput from '../components/SearchInput';

const categories: Record<string, { label: string; icon: typeof FileText; color: string }> = {
  invoice:   { label: 'فاتورة', icon: Receipt, color: 'bg-blue-50 text-blue-600' },
  contract:  { label: 'عقد', icon: FileSignature, color: 'bg-emerald-50 text-emerald-600' },
  plan:      { label: 'خطة', icon: LayoutTemplate, color: 'bg-purple-50 text-purple-600' },
  proposal:  { label: 'عرض سعر', icon: FileText, color: 'bg-amber-50 text-amber-600' },
  report:    { label: 'تقرير', icon: BarChart3, color: 'bg-rose-50 text-rose-600' },
  other:     { label: 'أخرى', icon: FolderOpen, color: 'bg-gray-100 text-gray-600' },
};

export default function FileTemplates() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [showModal, setShowModal] = useState(false);

  const { data, isLoading, isError, refetch } = useFileTemplates({ search: search || undefined, category: category || undefined });
  const createMutation = useCreateFileTemplate();
  const deleteMutation = useDeleteFileTemplate();
  const templates = data?.data ?? [];

  const [form, setForm] = useState({ name: '', category: 'other', description: '' });
  const [file, setFile] = useState<File | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) { toast.error('اختر ملف'); return; }
    const fd = new FormData();
    fd.append('name', form.name);
    fd.append('category', form.category);
    if (form.description) fd.append('description', form.description);
    fd.append('file', file);
    try {
      await createMutation.mutateAsync(fd);
      setShowModal(false);
      setForm({ name: '', category: 'other', description: '' });
      setFile(null);
      toast.success('تم رفع القالب');
    } catch {
      toast.error('حدث خطأ');
    }
  };

  const handleDelete = (id: number) => {
    setDeleteId(id);
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteMutation.mutateAsync(deleteId);
      toast.success('تم الحذف');
    } catch {
      toast.error('حدث خطأ');
    }
    setDeleteId(null);
  };

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">قوالب الملفات</h1>
          <p className="page-subtitle">قوالب الفواتير والعقود والخطط والعروض</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary text-sm">
          <Plus size={16} /> رفع قالب
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="بحث..."
          className="flex-1 max-w-sm"
        />
        <div className="tab-bar">
          <button onClick={() => setCategory('')}
            className={`tab-item ${!category ? 'active' : ''}`}>
            الكل
          </button>
          {Object.entries(categories).map(([key, cat]) => (
            <button key={key} onClick={() => setCategory(key)}
              className={`tab-item ${category === key ? 'active' : ''}`}>
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Loading / Error */}
      {isLoading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="animate-spin text-primary-600" size={32} />
        </div>
      )}

      {isError && (
        <div className="bg-white rounded-xl p-12 border text-center">
          <AlertCircle size={40} className="text-red-300 mx-auto mb-3" />
          <p className="text-gray-500 mb-3">حدث خطأ</p>
          <button onClick={() => refetch()} className="text-primary-600 hover:underline text-sm">إعادة المحاولة</button>
        </div>
      )}

      {/* Templates Grid */}
      {!isLoading && !isError && (
        templates.length === 0 ? (
          <div className="bg-white rounded-xl p-12 border border-gray-100 text-center">
            <FolderOpen size={48} className="text-gray-200 mx-auto mb-3" />
            <p className="text-gray-500">لا توجد قوالب</p>
            <p className="text-xs text-gray-400 mt-1">ارفع قوالب الفواتير والعقود لاستخدامها لاحقاً</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {templates.map(tpl => {
              const cat = categories[tpl.category] || categories.other;
              const CatIcon = cat.icon;
              return (
                <div key={tpl.id} className="card p-5 hover:shadow-card-hover transition-all group">
                  <div className="flex items-start justify-between mb-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${cat.color}`}>
                      <CatIcon size={18} />
                    </div>
                  <div className="flex items-center gap-1">
                    <a href={`/storage/${tpl.file_path}`} target="_blank" rel="noopener noreferrer"
                      className="text-gray-400 hover:text-primary-600 p-1 opacity-0 group-hover:opacity-100 transition-all">
                      <Download size={14} />
                    </a>
                    <button onClick={() => handleDelete(tpl.id)}
                      className="text-gray-400 hover:text-red-600 p-1 opacity-0 group-hover:opacity-100 transition-all">
                      <Trash2 size={14} />
                    </button>
                  </div>
                  </div>
                  <h3 className="font-semibold text-gray-800 text-sm mb-1">{tpl.name}</h3>
                  {tpl.description && <p className="text-xs text-gray-400 mb-2 line-clamp-2">{tpl.description}</p>}
                  <div className="flex items-center gap-2 text-[11px] text-gray-400">
                    <span className={`px-1.5 py-0.5 rounded ${cat.color} text-[10px] font-medium`}>{cat.label}</span>
                    {tpl.file_size > 0 && <span>{(tpl.file_size / 1024).toFixed(0)} KB</span>}
                    {tpl.uploaded_by && <span>بواسطة: {tpl.uploaded_by.name}</span>}
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}

      {/* Upload Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-backdrop" onClick={() => setShowModal(false)} />
          <div className="modal-content max-w-md">
            <div className="modal-header">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white">
                  <Upload size={20} />
                </div>
                <h2 className="text-lg font-bold text-gray-800">رفع قالب جديد</h2>
              </div>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <form onSubmit={handleCreate} className="modal-body space-y-4">
              <div>
                <label className="input-label">اسم القالب *</label>
                <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required
                  className="input" />
              </div>
              <div>
                <label className="input-label">التصنيف</label>
                <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}
                  className="select">
                  {Object.entries(categories).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>
              </div>
              <div>
                <label className="input-label">وصف (اختياري)</label>
                <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={2}
                  className="input resize-none" />
              </div>
              <div>
                <label className="input-label">الملف *</label>
                <input type="file" onChange={e => setFile(e.target.files?.[0] ?? null)} required
                  className="input" />
              </div>
              <div className="modal-footer">
                <button type="submit" disabled={createMutation.isPending}
                  className="btn-primary flex-1">
                  {createMutation.isPending ? 'جاري الرفع...' : 'رفع القالب'}
                </button>
                <button type="button" onClick={() => setShowModal(false)}
                  className="btn-secondary">إلغاء</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={deleteId !== null}
        title="حذف القالب"
        message="هل أنت متأكد من حذف هذا القالب؟"
        confirmText="حذف"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}
