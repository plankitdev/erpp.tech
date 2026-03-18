import { useNotifications, useMarkRead, useMarkAllRead } from '../hooks/useNotifications';
import { formatDateTime } from '../utils';

const typeLabels: Record<string, string> = {
  invoice_overdue: 'فاتورة متأخرة',
  task_assigned: 'مهمة جديدة',
  file_sent: 'ملف مرسل',
  salary_paid: 'راتب مُصرف',
};

const typeIcons: Record<string, string> = {
  invoice_overdue: '🔴',
  task_assigned: '📋',
  file_sent: '📎',
  salary_paid: '💰',
};

export default function Notifications() {
  const { data, isLoading } = useNotifications();
  const markRead = useMarkRead();
  const markAllRead = useMarkAllRead();

  const notifications = data?.data ?? [];

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">الإشعارات</h1>
        <button
          onClick={() => markAllRead.mutate()}
          className="btn-secondary text-sm"
        >
          تحديد الكل كمقروء
        </button>
      </div>

      <div className="card">
        {isLoading ? (
          <div className="px-6 py-12 text-center text-gray-500">جاري التحميل...</div>
        ) : notifications.length === 0 ? (
          <div className="px-6 py-12 text-center text-gray-500">لا يوجد إشعارات</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {notifications.map((notif) => (
              <div
                key={notif.id}
                className={`px-6 py-4 flex items-start gap-4 ${!notif.is_read ? 'bg-primary-50' : ''}`}
              >
                <span className="text-2xl mt-1">{typeIcons[notif.type] || '🔔'}</span>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className={`text-sm ${!notif.is_read ? 'font-semibold text-gray-900' : 'text-gray-700'}`}>
                      {notif.title}
                    </p>
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                      {typeLabels[notif.type] || notif.type}
                    </span>
                  </div>
                  {notif.body && <p className="text-sm text-gray-500 mt-1">{notif.body}</p>}
                  <p className="text-xs text-gray-400 mt-1">{formatDateTime(notif.created_at)}</p>
                </div>
                {!notif.is_read && (
                  <button
                    onClick={() => markRead.mutate(notif.id)}
                    className="text-xs text-primary-600 hover:underline whitespace-nowrap"
                  >
                    تحديد كمقروء
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
