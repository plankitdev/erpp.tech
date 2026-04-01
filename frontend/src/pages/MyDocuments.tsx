import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Search, Loader2, Trash2, Plus, Eye, Archive, CheckCircle, Clock } from 'lucide-react';
import { useUserDocuments, useDeleteUserDocument } from '../hooks/useUserDocuments';
import toast from 'react-hot-toast';
import type { UserDocumentStatus } from '../types';

export default function MyDocuments() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<UserDocumentStatus | ''>('');
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const { data: docsRes, isLoading } = useUserDocuments({
    search: search || undefined,
    status: statusFilter || undefined,
  });
  const documents = docsRes?.data ?? [];

  const deleteDoc = useDeleteUserDocument();

  const handleDelete = () => {
    if (!deleteId) return;
    deleteDoc.mutate(deleteId, {
      onSuccess: () => {
        toast.success('تم حذف المستند');
        setDeleteId(null);
      },
      onError: () => toast.error('فشل الحذف'),
    });
  };

  const statusConfig: Record<string, { label: string; icon: typeof Clock; color: string; bg: string }> = {
    draft: { label: 'مسودة', icon: Clock, color: 'text-yellow-600', bg: 'bg-yellow-50' },
    completed: { label: 'مكتمل', icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50' },
    archived: { label: 'مؤرشف', icon: Archive, color: 'text-gray-500', bg: 'bg-gray-50' },
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-50 rounded-xl">
            <FileText className="text-purple-600" size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">مستنداتي</h1>
            <p className="text-sm text-gray-500">كل المستندات اللي عملتها من التيمبليتس</p>
          </div>
        </div>
        <button
          onClick={() => navigate('/template-library')}
          className="flex items-center gap-2 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={14} />
          مستند جديد
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="ابحث في مستنداتك..."
            className="w-full pr-10 pl-4 py-2.5 text-sm rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          {['', 'draft', 'completed', 'archived'].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s as UserDocumentStatus | '')}
              className={`px-3 py-2 text-xs rounded-lg border transition-colors ${
                statusFilter === s ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
              }`}
            >
              {s === '' ? 'الكل' : statusConfig[s]?.label}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="animate-spin text-blue-500" size={32} />
        </div>
      ) : documents.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <FileText size={48} className="mx-auto mb-3 opacity-50" />
          <p className="text-lg font-medium">لا يوجد مستندات</p>
          <p className="text-sm">اذهب لمكتبة التيمبليتس واختر واحد لتبدأ</p>
        </div>
      ) : (
        <div className="space-y-3">
          {documents.map((doc) => {
            const sc = statusConfig[doc.status];
            const StatusIcon = sc.icon;
            return (
              <div
                key={doc.id}
                className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-all cursor-pointer"
                onClick={() => navigate(`/documents/${doc.id}/edit`)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className={`p-2 rounded-lg ${sc.bg}`}>
                      <StatusIcon size={18} className={sc.color} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-gray-800 truncate">{doc.title}</h3>
                      <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                        {doc.template?.category && (
                          <span>{doc.template.category.name}</span>
                        )}
                        <span>{new Date(doc.created_at).toLocaleDateString('ar-EG')}</span>
                        {doc.managed_file && (
                          <span className="text-green-500">محفوظ في الدرايف</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-1 rounded-full ${sc.bg} ${sc.color}`}>
                      {sc.label}
                    </span>
                    <button
                      onClick={(e) => { e.stopPropagation(); navigate(`/documents/${doc.id}/edit`); }}
                      className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="فتح"
                    >
                      <Eye size={16} />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); setDeleteId(doc.id); }}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="حذف"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full">
            <h3 className="text-lg font-bold text-gray-800 mb-2">حذف المستند</h3>
            <p className="text-sm text-gray-500 mb-6">هل أنت متأكد من حذف هذا المستند؟ لا يمكن التراجع عن هذا الإجراء.</p>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setDeleteId(null)}
                className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                إلغاء
              </button>
              <button
                onClick={handleDelete}
                disabled={deleteDoc.isPending}
                className="flex items-center gap-1.5 px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
              >
                {deleteDoc.isPending ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                حذف
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
