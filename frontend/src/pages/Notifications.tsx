import { useState } from 'react';
import { useNotifications, useMarkRead, useMarkAllRead } from '../hooks/useNotifications';
import { formatDateTime } from '../utils';
import { SkeletonNotification } from '../components/Skeletons';
import {
  AlertCircle, ClipboardList, Paperclip, Wallet, Clock, AlertTriangle,
  Target, Trophy, FolderPlus, Receipt, CalendarDays, CheckCircle2, Bell,
  type LucideIcon,
} from 'lucide-react';

const typeLabels: Record<string, string> = {
  invoice_overdue: 'فاتورة متأخرة',
  task_assigned: 'مهمة جديدة',
  file_sent: 'ملف مرسل',
  salary_paid: 'راتب مُصرف',
  contract_expiring: 'عقد ينتهي',
  task_overdue: 'مهمة متأخرة',
  lead_new: 'عميل محتمل جديد',
  lead_won: 'فرصة بيع ناجحة',
  project_created: 'مشروع جديد',
  expense_created: 'مصروف جديد',
  meeting_reminder: 'تذكير اجتماع',
  payment_received: 'دفعة مستلمة',
  task_completed: 'مهمة مكتملة',
};

const typeIconConfig: Record<string, { icon: LucideIcon; bg: string; color: string }> = {
  invoice_overdue: { icon: AlertCircle, bg: 'bg-red-100', color: 'text-red-600' },
  task_assigned: { icon: ClipboardList, bg: 'bg-blue-100', color: 'text-blue-600' },
  file_sent: { icon: Paperclip, bg: 'bg-indigo-100', color: 'text-indigo-600' },
  salary_paid: { icon: Wallet, bg: 'bg-emerald-100', color: 'text-emerald-600' },
  contract_expiring: { icon: Clock, bg: 'bg-amber-100', color: 'text-amber-600' },
  task_overdue: { icon: AlertTriangle, bg: 'bg-orange-100', color: 'text-orange-600' },
  lead_new: { icon: Target, bg: 'bg-cyan-100', color: 'text-cyan-600' },
  lead_won: { icon: Trophy, bg: 'bg-yellow-100', color: 'text-yellow-600' },
  project_created: { icon: FolderPlus, bg: 'bg-purple-100', color: 'text-purple-600' },
  expense_created: { icon: Receipt, bg: 'bg-pink-100', color: 'text-pink-600' },
  meeting_reminder: { icon: CalendarDays, bg: 'bg-teal-100', color: 'text-teal-600' },
  payment_received: { icon: CheckCircle2, bg: 'bg-green-100', color: 'text-green-600' },
  task_completed: { icon: CheckCircle2, bg: 'bg-emerald-100', color: 'text-emerald-600' },
};

const defaultIconConfig = { icon: Bell, bg: 'bg-gray-100', color: 'text-gray-600' };

type CategoryKey = 'all' | 'tasks' | 'finance' | 'meetings' | 'system';
const categories: { key: CategoryKey; label: string }[] = [
  { key: 'all', label: 'الكل' },
  { key: 'tasks', label: 'المهام' },
  { key: 'finance', label: 'المالية' },
  { key: 'meetings', label: 'الاجتماعات' },
  { key: 'system', label: 'النظام' },
];

const categoryTypes: Record<CategoryKey, string[] | null> = {
  all: null,
  tasks: ['task_assigned', 'task_overdue', 'task_completed'],
  finance: ['invoice_overdue', 'salary_paid', 'expense_created', 'payment_received'],
  meetings: ['meeting_reminder'],
  system: ['file_sent', 'contract_expiring', 'lead_new', 'lead_won', 'project_created'],
};

export default function Notifications() {
  const { data, isLoading } = useNotifications();
  const markRead = useMarkRead();
  const markAllRead = useMarkAllRead();
  const [activeCategory, setActiveCategory] = useState<CategoryKey>('all');

  const notifications = data?.data ?? [];
  const filtered = activeCategory === 'all'
    ? notifications
    : notifications.filter(n => categoryTypes[activeCategory]?.includes(n.type));

  const unreadByCategory = categories.reduce((acc, cat) => {
    const types = categoryTypes[cat.key];
    acc[cat.key] = types
      ? notifications.filter(n => !n.is_read && types.includes(n.type)).length
      : notifications.filter(n => !n.is_read).length;
    return acc;
  }, {} as Record<CategoryKey, number>);

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">الإشعارات</h1>
        <button
          onClick={() => markAllRead.mutate()}
          className="btn-secondary text-sm"
          disabled={markAllRead.isPending}
        >
          تحديد الكل كمقروء
        </button>
      </div>

      {/* Category Tabs */}
      <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1 mb-4 overflow-x-auto">
        {categories.map(cat => (
          <button
            key={cat.key}
            onClick={() => setActiveCategory(cat.key)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
              activeCategory === cat.key
                ? 'bg-white text-primary-700 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {cat.label}
            {unreadByCategory[cat.key] > 0 && (
              <span className={`text-[10px] min-w-[18px] h-[18px] flex items-center justify-center rounded-full font-bold ${
                activeCategory === cat.key ? 'bg-primary-100 text-primary-700' : 'bg-gray-200 text-gray-600'
              }`}>
                {unreadByCategory[cat.key]}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="card overflow-hidden">
        {isLoading ? (
          <div className="divide-y divide-gray-100">
            {[1,2,3,4,5].map(i => <SkeletonNotification key={i} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <Bell size={40} className="text-gray-200 mx-auto mb-3" />
            <p className="text-gray-500">لا يوجد إشعارات</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filtered.map((notif) => {
              const iconCfg = typeIconConfig[notif.type] || defaultIconConfig;
              const IconComp = iconCfg.icon;
              return (
                <div
                  key={notif.id}
                  className={`px-6 py-4 flex items-start gap-4 transition-colors hover:bg-gray-50 ${!notif.is_read ? 'bg-primary-50/50' : ''}`}
                >
                  <div className={`w-10 h-10 rounded-xl ${iconCfg.bg} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                    <IconComp size={18} className={iconCfg.color} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className={`text-sm ${!notif.is_read ? 'font-semibold text-gray-900' : 'text-gray-700'}`}>
                        {notif.title}
                      </p>
                      <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${iconCfg.bg} ${iconCfg.color}`}>
                        {typeLabels[notif.type] || notif.type}
                      </span>
                    </div>
                    {notif.body && <p className="text-sm text-gray-500 mt-1 line-clamp-2">{notif.body}</p>}
                    <p className="text-xs text-gray-400 mt-1.5">{formatDateTime(notif.created_at)}</p>
                  </div>
                  {!notif.is_read && (
                    <button
                      onClick={() => markRead.mutate(notif.id)}
                      className="text-xs text-primary-600 hover:underline whitespace-nowrap mt-1"
                    >
                      تحديد كمقروء
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
