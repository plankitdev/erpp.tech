import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, BookOpen, Loader2 } from 'lucide-react';
import { useTemplates, useTemplateCategories, useUseTemplate, useDuplicateTemplate } from '../hooks/useTemplateLibrary';
import TemplateCard from '../components/TemplateCard';
import TemplatePreviewModal from '../components/TemplatePreviewModal';
import type { Template } from '../types';
import toast from 'react-hot-toast';
import { useAuthStore } from '../store/authStore';

export default function TemplateLibrary() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'super_admin' || user?.role === 'manager';

  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<Template | null>(null);

  const { data: categoriesRes } = useTemplateCategories();
  const categories = categoriesRes?.data ?? [];

  const { data: templatesRes, isLoading } = useTemplates({
    search: search || undefined,
    category_id: categoryId || undefined,
  });
  const templates = templatesRes?.data ?? [];

  const useTemplate = useUseTemplate();
  const duplicateTemplate = useDuplicateTemplate();

  const handleUse = (template: Template) => {
    useTemplate.mutate(template.id, {
      onSuccess: (res) => {
        toast.success('تم إنشاء مستند جديد');
        setPreviewTemplate(null);
        navigate(`/documents/${res.data.id}/edit`);
      },
      onError: () => toast.error('فشل إنشاء المستند'),
    });
  };

  const handleDuplicate = (template: Template) => {
    duplicateTemplate.mutate(template.id, {
      onSuccess: () => toast.success('تم نسخ التيمبليت'),
      onError: () => toast.error('فشل نسخ التيمبليت'),
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-50 rounded-xl">
            <BookOpen className="text-blue-600" size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">مكتبة التيمبليتس</h1>
            <p className="text-sm text-gray-500">اختر تيمبليت جاهز وابدأ تعبئة بياناتك</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/my-documents')}
            className="px-4 py-2 text-sm border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
          >
            مستنداتي
          </button>
          {isAdmin && (
            <button className="flex items-center gap-2 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              <Plus size={14} />
              تيمبليت جديد
            </button>
          )}
        </div>
      </div>

      {/* Search + Categories */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="ابحث عن تيمبليت..."
            className="w-full pr-10 pl-4 py-2.5 text-sm rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setCategoryId(null)}
            className={`px-3 py-2 text-xs rounded-lg border transition-colors ${
              !categoryId ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
            }`}
          >
            الكل
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setCategoryId(cat.id)}
              className={`px-3 py-2 text-xs rounded-lg border transition-colors ${
                categoryId === cat.id
                  ? 'text-white border-transparent'
                  : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
              }`}
              style={categoryId === cat.id ? { backgroundColor: cat.color || '#6B7280' } : undefined}
            >
              {cat.name}
              {cat.templates_count != null && (
                <span className="mr-1 opacity-70">({cat.templates_count})</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="animate-spin text-blue-500" size={32} />
        </div>
      ) : templates.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <BookOpen size={48} className="mx-auto mb-3 opacity-50" />
          <p className="text-lg font-medium">لا يوجد تيمبليتس</p>
          <p className="text-sm">جرب تغيير البحث أو القسم</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {templates.map((template) => (
            <TemplateCard
              key={template.id}
              template={template}
              onPreview={setPreviewTemplate}
              onUse={handleUse}
              onDuplicate={isAdmin ? handleDuplicate : undefined}
              isAdmin={isAdmin}
            />
          ))}
        </div>
      )}

      {/* Preview Modal */}
      {previewTemplate && (
        <TemplatePreviewModal
          template={previewTemplate}
          onClose={() => setPreviewTemplate(null)}
          onUse={handleUse}
        />
      )}
    </div>
  );
}
