import type { Currency } from '../types';

const currencySymbols: Record<Currency, string> = {
  EGP: 'ج.م',
  USD: '$',
  SAR: 'ر.س',
};

export function formatCurrency(amount: number, currency: Currency = 'EGP'): string {
  const formatted = new Intl.NumberFormat('ar-EG', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
  return `${formatted} ${currencySymbols[currency]}`;
}

export function formatDate(date: string | null | undefined): string {
  if (!date) return '-';
  return new Intl.DateTimeFormat('ar-EG', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(date));
}

export function formatDateTime(date: string | null | undefined): string {
  if (!date) return '-';
  return new Intl.DateTimeFormat('ar-EG', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
}

export const statusLabels = {
  client: { active: 'نشط', inactive: 'غير نشط', lead: 'عميل محتمل' },
  contract: { active: 'ساري', completed: 'مكتمل', cancelled: 'ملغي' },
  invoice: { pending: 'معلقة', paid: 'مدفوعة', overdue: 'متأخرة', partial: 'مدفوعة جزئياً' },
  task: { todo: 'قيد الانتظار', in_progress: 'قيد التنفيذ', review: 'مراجعة', done: 'مكتملة' },
  priority: { high: 'عالية', medium: 'متوسطة', low: 'منخفضة' },
  payment_type: { monthly: 'شهري', installments: 'أقساط', one_time: 'دفعة واحدة' },
  role: { super_admin: 'مدير النظام', manager: 'مدير', accountant: 'محاسب', sales: 'مبيعات', employee: 'موظف', marketing_manager: 'مدير تسويق' },
} as const;

export const statusColors = {
  client: { active: 'bg-green-100 text-green-800', inactive: 'bg-gray-100 text-gray-800', lead: 'bg-blue-100 text-blue-800' },
  contract: { active: 'bg-green-100 text-green-800', completed: 'bg-blue-100 text-blue-800', cancelled: 'bg-red-100 text-red-800' },
  invoice: { pending: 'bg-yellow-100 text-yellow-800', paid: 'bg-green-100 text-green-800', overdue: 'bg-red-100 text-red-800', partial: 'bg-orange-100 text-orange-800' },
  task: { todo: 'bg-gray-100 text-gray-800', in_progress: 'bg-blue-100 text-blue-800', review: 'bg-purple-100 text-purple-800', done: 'bg-green-100 text-green-800' },
  priority: { high: 'bg-red-100 text-red-800', medium: 'bg-yellow-100 text-yellow-800', low: 'bg-green-100 text-green-800' },
} as const;
