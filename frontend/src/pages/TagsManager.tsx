import { useState } from 'react';
import { Tag, Plus, Edit3, Trash2, X, Users, CheckSquare, FolderKanban, UserPlus } from 'lucide-react';
import { useTags, useCreateTag, useUpdateTag, useDeleteTag } from '../hooks/useTags';
import type { TagData } from '../api/tags';

export default function TagsManager() {
  const { data: tags = [], isLoading } = useTags();
  const createTag = useCreateTag();
  const updateTag = useUpdateTag();
  const deleteTag = useDeleteTag();
  const [showForm, setShowForm] = useState(false);
  const [editingTag, setEditingTag] = useState<TagData | null>(null);
  const [name, setName] = useState('');
  const [color, setColor] = useState('#3b82f6');

  const colors = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316', '#6366f1', '#14b8a6'];

  const openEdit = (tag: TagData) => {
    setEditingTag(tag);
    setName(tag.name);
    setColor(tag.color);
    setShowForm(true);
  };

  const openNew = () => {
    setEditingTag(null);
    setName('');
    setColor('#3b82f6');
    setShowForm(true);
  };

  const handleSubmit = () => {
    if (!name.trim()) return;
    if (editingTag) {
      updateTag.mutate({ id: editingTag.id, data: { name, color } }, { onSuccess: () => setShowForm(false) });
    } else {
      createTag.mutate({ name, color }, { onSuccess: () => setShowForm(false) });
    }
  };

  const getUsageCount = (tag: TagData) =>
    (tag.clients_count || 0) + (tag.tasks_count || 0) + (tag.projects_count || 0) + (tag.leads_count || 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Tag size={28} /> العلامات
          </h1>
          <p className="text-gray-500 mt-1">إدارة علامات تصنيف العملاء والمهام والمشاريع</p>
        </div>
        <button onClick={openNew} className="flex items-center gap-2 px-4 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition">
          <Plus size={18} /> علامة جديدة
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" /></div>
      ) : tags.length === 0 ? (
        <div className="bg-white border border-gray-100 rounded-xl p-12 text-center shadow-sm">
          <Tag size={48} className="mx-auto mb-3 text-gray-300" />
          <p className="text-gray-500">لا توجد علامات بعد</p>
          <button onClick={openNew} className="mt-4 text-blue-500 hover:text-blue-700 font-medium">إنشاء أول علامة</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tags.map((tag: TagData) => (
            <div key={tag.id} className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm hover:shadow-md transition">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full" style={{ backgroundColor: tag.color }} />
                  <span className="font-bold text-gray-800">{tag.name}</span>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => openEdit(tag)} className="p-1.5 hover:bg-gray-100 rounded text-gray-400 hover:text-blue-500"><Edit3 size={14} /></button>
                  <button onClick={() => { if (confirm('حذف هذه العلامة؟')) deleteTag.mutate(tag.id); }} className="p-1.5 hover:bg-gray-100 rounded text-gray-400 hover:text-red-500"><Trash2 size={14} /></button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex items-center gap-1.5 text-gray-500">
                  <Users size={12} /> {tag.clients_count || 0} عملاء
                </div>
                <div className="flex items-center gap-1.5 text-gray-500">
                  <CheckSquare size={12} /> {tag.tasks_count || 0} مهام
                </div>
                <div className="flex items-center gap-1.5 text-gray-500">
                  <FolderKanban size={12} /> {tag.projects_count || 0} مشاريع
                </div>
                <div className="flex items-center gap-1.5 text-gray-500">
                  <UserPlus size={12} /> {tag.leads_count || 0} عملاء محتملين
                </div>
              </div>
              <div className="mt-3 pt-2 border-t border-gray-50 text-xs text-gray-400">
                إجمالي الاستخدام: {getUsageCount(tag)}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">{editingTag ? 'تعديل العلامة' : 'علامة جديدة'}</h3>
              <button onClick={() => setShowForm(false)} className="p-1 hover:bg-gray-100 rounded"><X size={20} /></button>
            </div>
            <div className="space-y-4">
              <input
                type="text"
                placeholder="اسم العلامة"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">اللون</label>
                <div className="flex gap-2 flex-wrap">
                  {colors.map(c => (
                    <button
                      key={c}
                      onClick={() => setColor(c)}
                      className={`w-8 h-8 rounded-full transition ${color === c ? 'ring-2 ring-offset-2 ring-blue-500' : ''}`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>
              <button
                onClick={handleSubmit}
                disabled={!name.trim()}
                className="w-full py-2.5 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white rounded-lg font-medium transition"
              >
                {editingTag ? 'تحديث' : 'إنشاء'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
