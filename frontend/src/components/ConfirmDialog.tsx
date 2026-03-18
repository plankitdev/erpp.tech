import { AlertTriangle, Trash2, X } from 'lucide-react';
import { useEffect, useRef } from 'react';

interface Props {
  open: boolean;
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
  onConfirm: () => void;
  onCancel: () => void;
}

const variants = {
  danger: {
    icon: Trash2,
    iconBg: 'bg-red-100',
    iconColor: 'text-red-600',
    btnClass: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500/20',
  },
  warning: {
    icon: AlertTriangle,
    iconBg: 'bg-amber-100',
    iconColor: 'text-amber-600',
    btnClass: 'bg-amber-600 text-white hover:bg-amber-700 focus:ring-amber-500/20',
  },
  info: {
    icon: AlertTriangle,
    iconBg: 'bg-primary-100',
    iconColor: 'text-primary-600',
    btnClass: 'bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-500/20',
  },
};

export default function ConfirmDialog({
  open,
  title = 'تأكيد الإجراء',
  message,
  confirmText = 'تأكيد',
  cancelText = 'إلغاء',
  variant = 'danger',
  onConfirm,
  onCancel,
}: Props) {
  const cancelRef = useRef<HTMLButtonElement>(null);
  const v = variants[variant];
  const Icon = v.icon;

  useEffect(() => {
    if (open) cancelRef.current?.focus();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true">
      <div className="modal-backdrop" onClick={onCancel} />
      <div className="modal-content max-w-sm animate-scale-in">
        <div className="p-6 text-center">
          <div className={`w-14 h-14 rounded-2xl ${v.iconBg} flex items-center justify-center mx-auto mb-4`}>
            <Icon size={24} className={v.iconColor} />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">{title}</h3>
          <p className="text-sm text-gray-500 leading-relaxed">{message}</p>
        </div>
        <div className="flex gap-3 px-6 pb-6">
          <button
            ref={cancelRef}
            onClick={onCancel}
            className="btn flex-1 bg-gray-100 text-gray-700 hover:bg-gray-200"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={`btn flex-1 ${v.btnClass} focus:ring-2`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
