import { Inbox, Plus } from 'lucide-react';
import type { ReactNode } from 'react';

interface Props {
  message?: string;
  description?: string;
  icon?: ReactNode;
  actionLabel?: string;
  onAction?: () => void;
}

export default function EmptyState({
  message = 'لا توجد بيانات',
  description,
  icon,
  actionLabel,
  onAction,
}: Props) {
  return (
    <div className="empty-state py-20">
      <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
        {icon || <Inbox size={28} className="text-gray-400" />}
      </div>
      <p className="text-gray-700 font-semibold text-base mb-1">{message}</p>
      {description && <p className="text-sm text-gray-400 max-w-xs">{description}</p>}
      {actionLabel && onAction && (
        <button onClick={onAction} className="btn-primary mt-5 gap-1.5">
          <Plus size={16} />
          {actionLabel}
        </button>
      )}
    </div>
  );
}
