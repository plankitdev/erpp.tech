import { useState, useEffect } from 'react';
import { useAnnouncements, useCreateAnnouncement, useUpdateAnnouncement, useDeleteAnnouncement, useToggleLike, useMarkAnnouncementsRead } from '../hooks/useAnnouncements';
import type { Announcement } from '../api/announcements';
import { useAuthStore } from '../store/authStore';
import { formatDateTime } from '../utils';
import toast from 'react-hot-toast';
import {
  Megaphone, Plus, X, Pencil, Trash2, Pin, AlertTriangle, AlertCircle, Info,
  ThumbsUp,
} from 'lucide-react';
import ConfirmDialog from '../components/ConfirmDialog';
import Breadcrumbs from '../components/Breadcrumbs';

const priorityConfig: Record<string, { label: string; color: string; icon: typeof Info }> = {
  normal: { label: 'عادي', color: 'bg-blue-50 border-blue-200 text-blue-700', icon: Info },
  important: { label: 'مهم', color: 'bg-amber-50 border-amber-200 text-amber-700', icon: AlertCircle },
  urgent: { label: 'عاجل', color: 'bg-red-50 border-red-200 text-red-700', icon: AlertTriangle },
};

export default function Announcements() {
  const { user } = useAuthStore();
  const isSuperAdmin = user?.role === 'super_admin';
  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<Announcement | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const { data, isLoading } = useAnnouncements({ page });
  const createMutation = useCreateAnnouncement();
  const updateMutation = useUpdateAnnouncement();
  const deleteMutation = useDeleteAnnouncement();
  const toggleLike = useToggleLike();
  const markRead = useMarkAnnouncementsRead();

  // Mark announcements as read when page is visited
  useEffect(() => {
    markRead.mutate();
  }, []);

  const announcements = data?.data || [];
  const meta = data?.meta;

  const [form, setForm] = useState({ title: '', body: '', priority: 'normal' as 'normal' | 'important' | 'urgent', is_pinned: false });

  const openCreate = () => {
    setEditItem(null);
    setForm({ title: '', body: '', priority: 'normal', is_pinned: false });
    setShowModal(true);
  };

  const openEdit = (a: Announcement) => {
    setEditItem(a);
    setForm({ title: a.title, body: a.body, priority: a.priority, is_pinned: a.is_pinned });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.body) { toast.error('يرجى ملء الحقول المطلوبة'); return; }
    try {
      if (editItem) {
        await updateMutation.mutateAsync({ id: editItem.id, data: form });
        toast.success('تم تحديث الإعلان');
      } else {
        await createMutation.mutateAsync(form);
        toast.success('تم نشر التحديث');
      }
      setShowModal(false);
    } catch {
      toast.error('حدث خطأ');
    }
  };

  const handleDelete = () => {
    if (!deleteId) return;
    deleteMutation.mutate(deleteId, {
      onSuccess: () => { toast.success('تم حذف الإعلان'); setDeleteId(null); },
      onError: () => toast.error('حدث خطأ'),
    });
  };

  return (
    <div className="page-container">
      <Breadcrumbs items={[{ label: 'التحديثات والإعلانات' }]} />
      <div className="page-header">
        <div>
          <h1 className="page-title">التحديثات والإعلانات</h1>
          <p className="page-subtitle">آخر التحديثات والإعلانات من الإدارة</p>
        </div>
        {isSuperAdmin && (
          <button onClick={openCreate} className="btn-primary">
            <Plus size={16} /> إعلان جديد
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white rounded-2xl p-6 border border-gray-100 animate-pulse">
              <div className="h-5 w-48 bg-gray-200 rounded mb-3" />
              <div className="h-4 w-full bg-gray-100 rounded mb-2" />
              <div className="h-4 w-2/3 bg-gray-100 rounded" />
            </div>
          ))}
        </div>
      ) : announcements.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 border border-gray-100 text-center">
          <Megaphone size={48} className="text-gray-200 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">لا يوجد تحديثات حالياً</p>
        </div>
      ) : (
        <div className="space-y-4">
          {announcements.map((a: Announcement) => {
            const cfg = priorityConfig[a.priority] || priorityConfig.normal;
            const Icon = cfg.icon;
            return (
              <div key={a.id} className={`bg-white rounded-2xl border p-6 transition-all hover:shadow-md ${
                a.is_pinned ? 'ring-2 ring-primary-200 border-primary-200' : 'border-gray-100'
              }`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      {a.is_pinned && (
                        <span className="flex items-center gap-1 text-xs text-primary-600 font-medium bg-primary-50 px-2 py-0.5 rounded-full">
                          <Pin size={12} /> مثبت
                        </span>
                      )}
                      <span className={`flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full border ${cfg.color}`}>
                        <Icon size={12} /> {cfg.label}
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">{a.title}</h3>
                    <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-wrap">{a.body}</p>
                    <div className="flex items-center gap-3 mt-4 text-xs text-gray-400">
                      <span>{a.creator?.name || 'الإدارة'}</span>
                      <span>•</span>
                      <span>{formatDateTime(a.created_at)}</span>
                    </div>
                    <div className="flex items-center gap-3 mt-3">
                      <button
                        onClick={() => toggleLike.mutate(a.id)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium transition-all ${
                          a.is_liked
                            ? 'bg-blue-100 text-blue-600'
                            : 'bg-gray-100 text-gray-500 hover:bg-blue-50 hover:text-blue-500'
                        }`}
                      >
                        <ThumbsUp size={14} />
                        {a.likes_count > 0 && <span>{a.likes_count}</span>}
                      </button>
                      {a.likes && a.likes.length > 0 && (
                        <span className="text-xs text-gray-400">
                          {a.likes.map(l => l.name).join('، ')}
                        </span>
                      )}
                    </div>
                  </div>
                  {isSuperAdmin && (
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button onClick={() => openEdit(a)}
                        className="action-icon text-gray-400 hover:text-amber-600 hover:bg-amber-50">
                        <Pencil size={15} />
                      </button>
                      <button onClick={() => setDeleteId(a.id)}
                        className="action-icon text-gray-400 hover:text-red-600 hover:bg-red-50">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {meta && meta.last_page > 1 && (
        <div className="flex items-center justify-center gap-1.5 p-4">
          {Array.from({ length: meta.last_page }, (_, i) => (
            <button key={i + 1} onClick={() => setPage(i + 1)}
              className={`w-9 h-9 rounded-xl text-sm font-medium transition-all ${page === i + 1 ? 'bg-primary-600 text-white shadow-sm' : 'text-gray-500 hover:bg-gray-100'}`}>
              {i + 1}
            </button>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-backdrop" onClick={() => setShowModal(false)} />
          <div className="modal-content" style={{ maxWidth: '560px' }}>
            <div className="modal-header">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center text-white">
                  <Megaphone size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-800">
                    {editItem ? 'تعديل الإعلان' : 'إعلان جديد'}
                  </h2>
                </div>
              </div>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 p-1">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body space-y-4">
                <div>
                  <label className="form-label">العنوان *</label>
                  <input type="text" value={form.title}
                    onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                    className="form-input" placeholder="عنوان الإعلان" required />
                </div>
                <div>
                  <label className="form-label">المحتوى *</label>
                  <textarea value={form.body}
                    onChange={e => setForm(f => ({ ...f, body: e.target.value }))}
                    className="form-input" rows={5} placeholder="محتوى الإعلان..." required />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="form-label">الأهمية</label>
                    <select value={form.priority}
                      onChange={e => setForm(f => ({ ...f, priority: e.target.value as 'normal' | 'important' | 'urgent' }))}
                      className="form-input">
                      <option value="normal">عادي</option>
                      <option value="important">مهم</option>
                      <option value="urgent">عاجل</option>
                    </select>
                  </div>
                  <div className="flex items-end">
                    <label className="flex items-center gap-2 cursor-pointer pb-2">
                      <input type="checkbox" checked={form.is_pinned}
                        onChange={e => setForm(f => ({ ...f, is_pinned: e.target.checked }))}
                        className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
                      <span className="text-sm text-gray-700">تثبيت الإعلان</span>
                    </label>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">إلغاء</button>
                <button type="submit" disabled={createMutation.isPending || updateMutation.isPending}
                  className="btn-primary">
                  {(createMutation.isPending || updateMutation.isPending) ? 'جاري الحفظ...' : editItem ? 'تحديث' : 'نشر'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={deleteId !== null}
        onCancel={() => setDeleteId(null)}
        onConfirm={handleDelete}
        message="هل أنت متأكد من حذف هذا الإعلان؟"
      />
    </div>
  );
}
