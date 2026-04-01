import { HardDrive, Loader2 } from 'lucide-react';
import { useSaveToDrive } from '../hooks/useUserDocuments';
import toast from 'react-hot-toast';

interface SaveToDriveButtonProps {
  documentId: number;
  disabled?: boolean;
  onSuccess?: () => void;
}

export default function SaveToDriveButton({ documentId, disabled, onSuccess }: SaveToDriveButtonProps) {
  const saveToDrive = useSaveToDrive();

  const handleSave = () => {
    saveToDrive.mutate(documentId, {
      onSuccess: () => {
        toast.success('تم حفظ المستند في مدير الملفات');
        onSuccess?.();
      },
      onError: () => {
        toast.error('فشل حفظ المستند');
      },
    });
  };

  return (
    <button
      onClick={handleSave}
      disabled={disabled || saveToDrive.isPending}
      className="flex items-center gap-2 px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
    >
      {saveToDrive.isPending ? (
        <Loader2 size={14} className="animate-spin" />
      ) : (
        <HardDrive size={14} />
      )}
      حفظ في الدرايف
    </button>
  );
}
