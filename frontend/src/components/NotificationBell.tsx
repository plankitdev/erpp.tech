import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell } from 'lucide-react';
import { useNotifications, useUnreadCount, useMarkRead, useMarkAllRead } from '../hooks/useNotifications';
import { formatDateTime } from '../utils';

const typeIcons: Record<string, string> = {
  invoice_overdue: '🔴',
  task_assigned: '📋',
  file_sent: '📎',
  salary_paid: '💰',
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
                  className={`w-full text-right px-4 py-3 hover:bg-gray-50 border-b border-gray-50 ${
                    !notif.is_read ? 'bg-primary-50' : ''
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <span className="text-lg mt-0.5">{typeIcons[notif.type] || '🔔'}</span>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm ${!notif.is_read ? 'font-semibold text-gray-900' : 'text-gray-700'}`}>
                        {notif.title}
                      </p>
                      {notif.body && (
                        <p className="text-xs text-gray-500 mt-0.5 truncate">{notif.body}</p>
                      )}
                      <p className="text-xs text-gray-400 mt-1">{formatDateTime(notif.created_at)}</p>
                    </div>
                    {!notif.is_read && (
                      <span className="w-2 h-2 bg-primary-500 rounded-full mt-2 flex-shrink-0"></span>
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
