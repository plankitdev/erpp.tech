import { CheckCircle, Clock, AlertTriangle, XCircle, Pause, Play, Ban, CircleDot, TrendingUp, UserCheck, UserX } from 'lucide-react';

type BadgeSize = 'sm' | 'md' | 'lg';

interface StatusConfig {
  label: string;
  className: string;
  icon: typeof CheckCircle;
}

const statusMap: Record<string, StatusConfig> = {
  // General
  active:      { label: 'نشط', className: 'badge-success', icon: CheckCircle },
  inactive:    { label: 'غير نشط', className: 'badge-neutral', icon: XCircle },
  pending:     { label: 'معلق', className: 'badge-warning', icon: Clock },
  completed:   { label: 'مكتمل', className: 'badge-success', icon: CheckCircle },
  cancelled:   { label: 'ملغي', className: 'badge-danger', icon: Ban },

  // Invoice
  paid:        { label: 'مدفوع', className: 'badge-success', icon: CheckCircle },
  overdue:     { label: 'متأخر', className: 'badge-danger', icon: AlertTriangle },
  partial:     { label: 'جزئي', className: 'badge-warning', icon: CircleDot },

  // Task
  todo:        { label: 'قيد الانتظار', className: 'badge-neutral', icon: Clock },
  in_progress: { label: 'قيد التنفيذ', className: 'badge-info', icon: Play },
  review:      { label: 'مراجعة', className: 'badge-purple', icon: Pause },
  done:        { label: 'منجز', className: 'badge-success', icon: CheckCircle },

  // Project
  on_hold:     { label: 'متوقف', className: 'badge-warning', icon: Pause },

  // Lead
  lead:        { label: 'عميل محتمل', className: 'badge-info', icon: TrendingUp },
  new:         { label: 'جديد', className: 'badge-info', icon: CircleDot },
  contacted:   { label: 'تم التواصل', className: 'badge-primary', icon: UserCheck },
  qualified:   { label: 'مؤهل', className: 'badge-success', icon: TrendingUp },
  lost:        { label: 'مفقود', className: 'badge-danger', icon: UserX },
  won:         { label: 'فاز', className: 'badge-success', icon: CheckCircle },
  first_contact:    { label: 'أول تواصل', className: 'badge-warning', icon: UserCheck },
  proposal_sent:    { label: 'تم إرسال العرض', className: 'badge-purple', icon: CircleDot },
  negotiation:      { label: 'تفاوض', className: 'badge-warning', icon: TrendingUp },
  contract_signed:  { label: 'تم التوقيع', className: 'badge-success', icon: CheckCircle },

  // Priority
  high:        { label: 'عالية', className: 'badge-danger', icon: AlertTriangle },
  medium:      { label: 'متوسطة', className: 'badge-warning', icon: CircleDot },
  low:         { label: 'منخفضة', className: 'badge-info', icon: CircleDot },

  // Activity Actions
  created:     { label: 'إنشاء', className: 'badge-success', icon: CheckCircle },
  updated:     { label: 'تعديل', className: 'badge-info', icon: CircleDot },
  deleted:     { label: 'حذف', className: 'badge-danger', icon: AlertTriangle },
};

const sizeClasses: Record<BadgeSize, string> = {
  sm: 'text-[10px] px-1.5 py-0.5 gap-0.5',
  md: 'text-xs px-2.5 py-1 gap-1',
  lg: 'text-sm px-3 py-1.5 gap-1.5',
};

const iconSizes: Record<BadgeSize, number> = {
  sm: 10,
  md: 12,
  lg: 14,
};

interface Props {
  status: string;
  size?: BadgeSize;
  label?: string;
  showIcon?: boolean;
}

export default function StatusBadge({ status, size = 'md', label, showIcon = true }: Props) {
  const config = statusMap[status];
  const Icon = config?.icon || CircleDot;
  const displayLabel = label || config?.label || status;
  const className = config?.className || 'badge-neutral';

  return (
    <span className={`badge ${className} ${sizeClasses[size]}`}>
      {showIcon && <Icon size={iconSizes[size]} />}
      {displayLabel}
    </span>
  );
}
