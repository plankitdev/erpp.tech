import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Save, Loader2, ArrowRight, Check, Archive } from 'lucide-react';
import { useUserDocument, useUpdateUserDocument, useUpdateDocumentStatus } from '../hooks/useUserDocuments';
import DynamicForm from '../components/DynamicForm';
import SaveToDriveButton from '../components/SaveToDriveButton';
import toast from 'react-hot-toast';

export default function DocumentEditor() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const docId = Number(id);

  const { data: docRes, isLoading } = useUserDocument(docId);
  const document = docRes?.data;

  const updateDoc = useUpdateUserDocument();
  const updateStatus = useUpdateDocumentStatus();

  const [formData, setFormData] = useState<Record<string, unknown>>({});
  const [title, setTitle] = useState('');
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    if (document) {
      setFormData(document.data ?? {});
      setTitle(document.title);
    }
  }, [document]);

  const handleFieldChange = (key: string, value: unknown) => {
    setFormData(prev => ({ ...prev, [key]: value }));
    setIsDirty(true);
  };

  const handleSaveDraft = () => {
    updateDoc.mutate(
      { id: docId, data: { title, data: formData } },
      {
        onSuccess: () => {
          toast.success('تم حفظ المسودة');
          setIsDirty(false);
        },
        onError: () => toast.error('فشل الحفظ'),
      }
    );
  };

  const handleComplete = () => {
    // Save data first, then change status
    updateDoc.mutate(
      { id: docId, data: { title, data: formData } },
      {
        onSuccess: () => {
          updateStatus.mutate(
            { id: docId, status: 'completed' },
            {
              onSuccess: () => {
                toast.success('تم إتمام المستند');
                setIsDirty(false);
              },
              onError: () => toast.error('فشل تحديث الحالة'),
            }
          );
        },
        onError: () => toast.error('فشل الحفظ'),
      }
    );
  };

  const handleArchive = () => {
    updateStatus.mutate(
      { id: docId, status: 'archived' },
      {
        onSuccess: () => {
          toast.success('تم أرشفة المستند');
          navigate('/my-documents');
        },
        onError: () => toast.error('فشل الأرشفة'),
      }
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="animate-spin text-blue-500" size={32} />
      </div>
    );
  }

  if (!document) {
    return (
      <div className="text-center py-20 text-gray-400">
        <p>المستند غير موجود</p>
      </div>
    );
  }

  const statusColors: Record<string, string> = {
    draft: 'bg-yellow-100 text-yellow-700',
    completed: 'bg-green-100 text-green-700',
    archived: 'bg-gray-100 text-gray-500',
  };
  const statusLabels: Record<string, string> = {
    draft: 'مسودة',
    completed: 'مكتمل',
    archived: 'مؤرشف',
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/my-documents')}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowRight size={20} className="text-gray-400" />
        </button>
        <div className="flex-1">
          <input
            type="text"
            value={title}
            onChange={(e) => { setTitle(e.target.value); setIsDirty(true); }}
            className="text-2xl font-bold text-gray-800 bg-transparent border-none outline-none w-full"
            placeholder="عنوان المستند"
          />
          <div className="flex items-center gap-3 mt-1">
            <span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[document.status]}`}>
              {statusLabels[document.status]}
            </span>
            {document.template?.category && (
              <span className="text-xs text-gray-400">
                من تيمبليت: {document.template.name}
              </span>
            )}
            {isDirty && (
              <span className="text-xs text-amber-500">تغييرات غير محفوظة</span>
            )}
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <DynamicForm
          fields={document.schema_snapshot.fields}
          sections={document.schema_snapshot.sections}
          values={formData}
          onChange={handleFieldChange}
          readOnly={document.status === 'archived'}
        />
      </div>

      {/* Actions */}
      {document.status !== 'archived' && (
        <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={handleArchive}
              className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Archive size={14} />
              أرشفة
            </button>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleSaveDraft}
              disabled={updateDoc.isPending}
              className="flex items-center gap-1.5 px-4 py-2 text-sm border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 disabled:opacity-50 transition-colors"
            >
              {updateDoc.isPending ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              حفظ مسودة
            </button>

            <SaveToDriveButton documentId={docId} />

            {document.status === 'draft' && (
              <button
                onClick={handleComplete}
                disabled={updateStatus.isPending}
                className="flex items-center gap-1.5 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {updateStatus.isPending ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                إتمام
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
