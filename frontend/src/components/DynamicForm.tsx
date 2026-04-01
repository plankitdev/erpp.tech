import type { SchemaField } from '../types';

interface DynamicFormProps {
  fields: SchemaField[];
  sections: { title: string; fields: string[] }[];
  values: Record<string, unknown>;
  onChange: (key: string, value: unknown) => void;
  readOnly?: boolean;
}

export default function DynamicForm({ fields, sections, values, onChange, readOnly }: DynamicFormProps) {
  const fieldMap = new Map(fields.map(f => [f.key, f]));

  return (
    <div className="space-y-8">
      {sections.map((section) => (
        <div key={section.title}>
          <h3 className="text-lg font-bold text-gray-800 mb-4 pb-2 border-b border-gray-200">
            {section.title}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {section.fields.map((fieldKey) => {
              const field = fieldMap.get(fieldKey);
              if (!field) return null;
              const fullWidth = field.type === 'textarea';
              return (
                <div key={field.key} className={fullWidth ? 'md:col-span-2' : ''}>
                  <FieldRenderer
                    field={field}
                    value={values[field.key]}
                    onChange={(val) => onChange(field.key, val)}
                    readOnly={readOnly}
                  />
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

function FieldRenderer({
  field, value, onChange, readOnly,
}: {
  field: SchemaField;
  value: unknown;
  onChange: (val: unknown) => void;
  readOnly?: boolean;
}) {
  const base = 'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500';

  const label = (
    <label className="block text-sm font-medium text-gray-700 mb-1">
      {field.label}
      {field.required && <span className="text-red-500 mr-1">*</span>}
      {field.unit && <span className="text-gray-400 text-xs mr-1">({field.unit})</span>}
    </label>
  );

  switch (field.type) {
    case 'text':
    case 'url':
      return (
        <div>
          {label}
          <input
            type={field.type === 'url' ? 'url' : 'text'}
            className={base}
            value={(value as string) ?? ''}
            onChange={(e) => onChange(e.target.value)}
            disabled={readOnly}
            dir="auto"
          />
        </div>
      );

    case 'textarea':
      return (
        <div>
          {label}
          <textarea
            className={`${base} min-h-[80px]`}
            value={(value as string) ?? ''}
            onChange={(e) => onChange(e.target.value)}
            disabled={readOnly}
            rows={3}
            dir="auto"
          />
        </div>
      );

    case 'number':
      return (
        <div>
          {label}
          <input
            type="number"
            className={base}
            value={(value as number) ?? ''}
            onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null)}
            disabled={readOnly}
          />
        </div>
      );

    case 'currency':
      return (
        <div>
          {label}
          <div className="relative">
            <input
              type="number"
              className={`${base} pl-16`}
              value={(value as number) ?? ''}
              onChange={(e) => onChange(e.target.value ? Number(e.target.value) : 0)}
              disabled={readOnly}
            />
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">
              {field.currency || 'EGP'}
            </span>
          </div>
        </div>
      );

    case 'date':
      return (
        <div>
          {label}
          <input
            type="date"
            className={base}
            value={(value as string) ?? ''}
            onChange={(e) => onChange(e.target.value || null)}
            disabled={readOnly}
          />
        </div>
      );

    case 'select':
      return (
        <div>
          {label}
          <select
            className={base}
            value={(value as string) ?? ''}
            onChange={(e) => onChange(e.target.value || null)}
            disabled={readOnly}
          >
            <option value="">اختر...</option>
            {field.options?.map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>
      );

    case 'multi_select': {
      const selected = (value as string[]) ?? [];
      return (
        <div>
          {label}
          <div className="flex flex-wrap gap-2">
            {field.options?.map((opt) => {
              const isSelected = selected.includes(opt);
              return (
                <button
                  key={opt}
                  type="button"
                  disabled={readOnly}
                  className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                    isSelected
                      ? 'bg-blue-100 text-blue-700 border-blue-300'
                      : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                  } ${readOnly ? 'cursor-default' : 'cursor-pointer'}`}
                  onClick={() => {
                    if (readOnly) return;
                    onChange(isSelected ? selected.filter(s => s !== opt) : [...selected, opt]);
                  }}
                >
                  {opt}
                </button>
              );
            })}
          </div>
        </div>
      );
    }

    case 'checkbox':
      return (
        <div className="flex items-center gap-2 pt-6">
          <input
            type="checkbox"
            className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            checked={!!value}
            onChange={(e) => onChange(e.target.checked)}
            disabled={readOnly}
          />
          <label className="text-sm font-medium text-gray-700">{field.label}</label>
        </div>
      );

    default:
      return (
        <div>
          {label}
          <input type="text" className={base} value={String(value ?? '')} onChange={(e) => onChange(e.target.value)} disabled={readOnly} />
        </div>
      );
  }
}
