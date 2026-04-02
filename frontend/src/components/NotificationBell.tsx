import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, FileText, CheckSquare, Paperclip, Wallet, Clock, AlertTriangle, Target, Trophy, FolderKanban, CreditCard, CalendarDays, CircleCheck, CircleDot } from 'lucide-react';
import { useNotifications, useUnreadCount, useMarkRead, useMarkAllRead } from '../hooks/useNotifications';
import { formatDateTime } from '../utils';

const typeConfig: Record<string, { icon: typeof Bell; color: string; bg: string }> = {
  invoice_overdue: { icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50' },
  task_assigned: { icon: CheckSquare, color: 'text-blue-600', bg: 'bg-blue-50' },
  file_sent: { icon: Paperclip, color: 'text-violet-600', bg: 'bg-violet-50' },
  salary_paid: { icon: Wallet, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  contract_expiring: { icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
  task_overdue: { icon: AlertTriangle, color: 'text-orange-600', bg: 'bg-orange-50' },
  lead_new: { icon: Target, color: 'text-indigo-600', bg: 'bg-indigo-50' },
  lead_won: { icon: Trophy, color: 'text-yellow-600', bg: 'bg-yellow-50' },
  project_created: { icon: FolderKanban, color: 'text-teal-600', bg: 'bg-teal-50' },
  expense_created: { icon: CreditCard, color: 'text-pink-600', bg: 'bg-pink-50' },
  meeting_reminder: { icon: CalendarDays, color: 'text-purple-600', bg: 'bg-purple-50' },
  payment_received: { icon: CircleCheck, color: 'text-green-600', bg: 'bg-green-50' },
  task_completed: { icon: CircleDot, color: 'text-emerald-600', bg: 'bg-emerald-50' },
};

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const { data: unreadCount = 0 } = useUnreadCount();
  const { data: notifData } = useNotifications({ per_page: 10 });
  const markRead = useMarkRead();
  const markAllRead = useMarkAllRead();

  const notifications = notifData?.data ?? [];

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleClick = (notif: { id: number; link: string | null; is_read: boolean }) => {
    if (!notif.is_read) {
      markRead.mutate(notif.id);
    }
    if (notif.link) {
      navigate(notif.link);
    }
    setOpen(false);
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="relative text-gray-500 hover:text-gray-700 p-2 rounded-xl hover:bg-gray-100 transition-all border border-transparent hover:border-gray-200/80"
      >
        <Bell size={18} className={unreadCount > 0 ? 'animate-bounce' : ''} />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 ring-2 ring-white shadow-sm">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-gray-200/80 z-50 animate-scale-in origin-top-left overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <h3 className="font-semibold text-gray-800">الإشعارات</h3>
            {unreadCount > 0 && (
              <button
                onClick={() => markAllRead.mutate()}
                className="text-xs text-primary-600 hover:underline"
              >
                تحديد الكل كمقروء
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-gray-500">لا يوجد إشعارات</p>
            ) : (
              notifications.map((notif) => (
                <button
                  key={notif.id}
                  onClick={() => handleClick(notif)}
                  className={`w-full text-right px-4 py-3 hover:bg-gray-50 border-b border-gray-50 transition-colors ${
                    !notif.is_read ? 'bg-blue-50/50' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {(() => {
                      const cfg = typeConfig[notif.type] || { icon: Bell, color: 'text-gray-600', bg: 'bg-gray-50' };
                      const Icon = cfg.icon;
                      return (
                        <div className={`w-8 h-8 rounded-lg ${cfg.bg} flex items-center justify-center shrink-0 mt-0.5`}>
                          <Icon size={15} className={cfg.color} />
                        </div>
                      );
                    })()}
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm leading-relaxed ${!notif.is_read ? 'font-semibold text-gray-900' : 'text-gray-700'}`}>
                        {notif.title}
                      </p>
                      {notif.body && (
                        <p className="text-xs text-gray-500 mt-0.5 truncate">{notif.body}</p>
                      )}
                      <p className="text-[11px] text-gray-400 mt-1">{formatDateTime(notif.created_at)}</p>
                    </div>
                    {!notif.is_read && (
                      <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></span>
                    )}
                  </div>
                </button>
              ))
            )}
          </div>

          {notifications.length > 0 && (
            <button
              onClick={() => { navigate('/notifications'); setOpen(false); }}
              className="w-full px-4 py-3 text-center text-sm text-primary-600 hover:bg-gray-50 border-t border-gray-100"
            >
              عرض جميع الإشعارات
            </button>
          )}
        </div>
      )}
    </div>
  );
}
