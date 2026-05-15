import { useState, useRef, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, CheckSquare, Paperclip, Wallet, Clock, AlertTriangle, Target, Trophy, FolderKanban, CreditCard, CalendarDays, CircleCheck, CircleDot, Layers } from 'lucide-react';
import { useNotifications, useUnreadCount, useMarkRead, useMarkAllRead } from '../hooks/useNotifications';
import { formatDateTime } from '../utils';

const typeConfig: Record<string, { icon: typeof Bell; color: string; bg: string }> = {
  invoice_overdue:  { icon: AlertTriangle, color: 'text-red-500',     bg: 'bg-red-50'     },
  task_assigned:    { icon: CheckSquare,   color: 'text-blue-500',    bg: 'bg-blue-50'    },
  task_overdue:     { icon: AlertTriangle, color: 'text-orange-500',  bg: 'bg-orange-50'  },
  task_completed:   { icon: CircleDot,     color: 'text-emerald-500', bg: 'bg-emerald-50' },
  file_sent:        { icon: Paperclip,     color: 'text-violet-500',  bg: 'bg-violet-50'  },
  salary_paid:      { icon: Wallet,        color: 'text-emerald-500', bg: 'bg-emerald-50' },
  contract_expiring:{ icon: Clock,         color: 'text-amber-500',   bg: 'bg-amber-50'   },
  lead_new:         { icon: Target,        color: 'text-indigo-500',  bg: 'bg-indigo-50'  },
  lead_won:         { icon: Trophy,        color: 'text-yellow-500',  bg: 'bg-yellow-50'  },
  project_created:  { icon: FolderKanban,  color: 'text-teal-500',    bg: 'bg-teal-50'    },
  expense_created:  { icon: CreditCard,    color: 'text-pink-500',    bg: 'bg-pink-50'    },
  meeting_reminder: { icon: CalendarDays,  color: 'text-purple-500',  bg: 'bg-purple-50'  },
  payment_received: { icon: CircleCheck,   color: 'text-green-500',   bg: 'bg-green-50'   },
};

type TabKey = 'all' | 'tasks' | 'finance' | 'meetings' | 'system';

const TABS: { key: TabKey; label: string; types?: string[] }[] = [
  { key: 'all',      label: 'الكل' },
  { key: 'tasks',    label: 'مهام',    types: ['task_assigned', 'task_overdue', 'task_completed'] },
  { key: 'finance',  label: 'مالية',   types: ['invoice_overdue', 'payment_received', 'expense_created', 'salary_paid', 'contract_expiring'] },
  { key: 'meetings', label: 'اجتماعات', types: ['meeting_reminder'] },
  { key: 'system',   label: 'نظام',    types: ['lead_new', 'lead_won', 'project_created', 'file_sent'] },
];

export default function NotificationBell() {
  const [open, setOpen]     = useState(false);
  const [tab, setTab]       = useState<TabKey>('all');
  const ref                 = useRef<HTMLDivElement>(null);
  const navigate            = useNavigate();

  const { data: unreadCount = 0 } = useUnreadCount();
  const { data: notifData }       = useNotifications({ per_page: 30 });
  const markRead                  = useMarkRead();
  const markAllRead               = useMarkAllRead();

  const allNotifications = notifData?.data ?? [];

  const filtered = useMemo(() => {
    const found = TABS.find(t => t.key === tab);
    if (!found?.types) return allNotifications;
    return allNotifications.filter(n => found.types!.includes(n.type));
  }, [allNotifications, tab]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleItemClick = (notif: { id: number; link: string | null; is_read: boolean }) => {
    if (!notif.is_read) markRead.mutate(notif.id);
    if (notif.link) navigate(notif.link);
    setOpen(false);
  };

  return (
    <div className="relative" ref={ref}>
      {/* Bell button */}
      <button
        onClick={() => setOpen(!open)}
        className="relative text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200
                   p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-700 transition-all
                   border border-transparent hover:border-gray-200/80 dark:hover:border-slate-600"
      >
        <Bell size={18} className={unreadCount > 0 ? 'animate-bounce' : ''} />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full
                           min-w-[18px] h-[18px] flex items-center justify-center px-1
                           ring-2 ring-white dark:ring-slate-800 shadow-sm">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-2 w-[340px]
                        bg-white dark:bg-slate-800
                        rounded-2xl shadow-2xl
                        border border-gray-200/80 dark:border-slate-700
                        z-50 animate-scale-in origin-top-left overflow-hidden">

          {/* Header */}
          <div className="flex items-center justify-between px-4 pt-3 pb-2 border-b border-gray-100 dark:border-slate-700">
            <h3 className="font-semibold text-gray-800 dark:text-slate-100 flex items-center gap-2">
              <Layers size={15} className="text-primary-500" />
              الإشعارات
              {unreadCount > 0 && (
                <span className="bg-red-500 text-white text-[10px] font-bold rounded-full px-1.5 py-0.5">
                  {unreadCount}
                </span>
              )}
            </h3>
            {unreadCount > 0 && (
              <button
                onClick={() => markAllRead.mutate()}
                className="text-xs text-primary-600 dark:text-primary-400 hover:underline"
              >
                تحديد الكل كمقروء
              </button>
            )}
          </div>

          {/* Tabs */}
          <div className="flex gap-0.5 px-3 pt-2 pb-0 overflow-x-auto hide-scrollbar">
            {TABS.map(t => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors
                  ${tab === t.key
                    ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                    : 'text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-700'
                  }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* List */}
          <div className="max-h-72 overflow-y-auto mt-1">
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 gap-2 text-gray-400 dark:text-slate-500">
                <Bell size={28} className="opacity-30" />
                <p className="text-sm">لا يوجد إشعارات</p>
              </div>
            ) : (
              filtered.map((notif) => {
                const cfg = typeConfig[notif.type] || { icon: Bell, color: 'text-gray-500', bg: 'bg-gray-50' };
                const Icon = cfg.icon;
                return (
                  <button
                    key={notif.id}
                    onClick={() => handleItemClick(notif)}
                    className={`w-full text-right px-4 py-3 border-b transition-colors
                      ${!notif.is_read
                        ? 'bg-blue-50/60 dark:bg-blue-900/20 border-blue-50 dark:border-blue-900/30'
                        : 'border-gray-50 dark:border-slate-700/50 hover:bg-gray-50 dark:hover:bg-slate-700/50'
                      }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-8 h-8 rounded-lg ${cfg.bg} flex items-center justify-center shrink-0 mt-0.5`}>
                        <Icon size={15} className={cfg.color} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm leading-snug ${
                          !notif.is_read
                            ? 'font-semibold text-gray-900 dark:text-slate-100'
                            : 'text-gray-700 dark:text-slate-300'
                        }`}>
                          {notif.title}
                        </p>
                        {notif.body && (
                          <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5 truncate">{notif.body}</p>
                        )}
                        <p className="text-[11px] text-gray-400 dark:text-slate-500 mt-1">{formatDateTime(notif.created_at)}</p>
                      </div>
                      {!notif.is_read && (
                        <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></span>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Footer */}
          <button
            onClick={() => { navigate('/notifications'); setOpen(false); }}
            className="w-full px-4 py-3 text-center text-sm text-primary-600 dark:text-primary-400
                       hover:bg-gray-50 dark:hover:bg-slate-700/60
                       border-t border-gray-100 dark:border-slate-700 transition-colors"
          >
            عرض جميع الإشعارات ←
          </button>
        </div>
      )}
    </div>
  );
}
