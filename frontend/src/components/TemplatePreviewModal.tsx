import { X, FileText, Lock } from 'lucide-react';
import type { Template } from '../types';
import DynamicForm from './DynamicForm';

interface TemplatePreviewModalProps {
  template: Template;
  onClose: () => void;
  onUse: (template: Template) => void;
}

export default function TemplatePreviewModal({ template, onClose, onUse }: TemplatePreviewModalProps) {
  // Build preview values from defaults
  const previewValues: Record<string, unknown> = {};
  for (const field of template.schema.fields) {
    previewValues[field.key] = field.default ?? null;
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div
              className="w-3 h-8 rounded-full"
              style={{ backgroundColor: template.thumbnail_color || '#6B7280' }}
            />
            <div>
              <h2 className="font-bold text-lg text-gray-800">{template.name}</h2>
              {template.category && (
                <span className="text-xs text-gray-500">{template.category.name}</span>
              )}
            </div>
            {template.is_locked && (
              <span className="flex items-center gap-1 text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded-full">
                <Lock size={12} />
                للقراءة فقط
              </span>
            )}
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <X size={20} className="text-gray-400" />
          </button>
        </div>

        {/* Description */}
        {template.description && (
          <div className="px-6 py-3 bg-gray-50 border-b border-gray-100">
            <p className="text-sm text-gray-600">{template.description}</p>
          </div>
        )}

        {/* Form Preview */}
        <div className="flex-1 overflow-y-auto p-6">
          <DynamicForm
            fields={template.schema.fields}
            sections={template.schema.sections}
            values={previewValues}
            onChange={() => {}}
            readOnly
          />
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
          <div className="text-xs text-gray-400">
            {template.schema.fields.length} حقل • {template.schema.sections.length} قسم
            {template.usage_count > 0 && ` • تم الاستخدام ${template.usage_count} مرة`}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              إغلاق
            </button>
            <button
              onClick={() => onUse(template)}
              className="flex items-center gap-2 px-5 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <FileText size={14} />
              استخدم التيمبليت
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
