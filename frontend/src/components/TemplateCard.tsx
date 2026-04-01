import { Lock, Copy, Eye, FileText } from 'lucide-react';
import type { Template } from '../types';

interface TemplateCardProps {
  template: Template;
  onPreview: (template: Template) => void;
  onUse: (template: Template) => void;
  onDuplicate?: (template: Template) => void;
  isAdmin?: boolean;
}

export default function TemplateCard({ template, onPreview, onUse, onDuplicate, isAdmin }: TemplateCardProps) {
  const fieldsCount = template.schema?.fields?.length ?? 0;
  const sectionsCount = template.schema?.sections?.length ?? 0;

  return (
    <div className="bg-white rounded-xl border border-gray-200 hover:shadow-lg transition-all duration-200 overflow-hidden group">
      {/* Color bar */}
      <div
        className="h-2"
        style={{ backgroundColor: template.thumbnail_color || '#6B7280' }}
      />

      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-gray-800 text-base truncate">{template.name}</h3>
            {template.category && (
              <span
                className="inline-block text-xs px-2 py-0.5 rounded-full mt-1"
                style={{
                  backgroundColor: (template.category.color || '#6B7280') + '15',
                  color: template.category.color || '#6B7280',
                }}
              >
                {template.category.name}
              </span>
            )}
          </div>
          {template.is_locked && (
            <div className="text-gray-400" title="للقراءة فقط">
              <Lock size={16} />
            </div>
          )}
        </div>

        {/* Description */}
        {template.description && (
          <p className="text-sm text-gray-500 line-clamp-2 mb-3">{template.description}</p>
        )}

        {/* Stats */}
        <div className="flex items-center gap-4 text-xs text-gray-400 mb-4">
          <span className="flex items-center gap-1">
            <FileText size={12} />
            {fieldsCount} حقل
          </span>
          <span>
            {sectionsCount} قسم
          </span>
          {template.usage_count > 0 && (
            <span>تم الاستخدام {template.usage_count} مرة</span>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => onPreview(template)}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-sm border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
          >
            <Eye size={14} />
            معاينة
          </button>
          <button
            onClick={() => onUse(template)}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <FileText size={14} />
            استخدم
          </button>
          {isAdmin && onDuplicate && (
            <button
              onClick={() => onDuplicate(template)}
              className="p-2 text-gray-400 hover:text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              title="نسخ التيمبليت"
            >
              <Copy size={14} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
