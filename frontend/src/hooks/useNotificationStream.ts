import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { playNotificationSound } from '../utils/notificationSound';
import toast from 'react-hot-toast';

interface SSENotification {
  id: number;
  type: string;
  title: string;
  body: string | null;
  link: string | null;
  read_at: string | null;
  created_at: string;
}

/**
 * Opens a Server-Sent Events connection to /api/notifications/stream.
 * When a new notification arrives it:
 *   1. Invalidates the TanStack Query caches so the bell icon updates.
 *   2. Plays a notification sound.
 *   3. Shows a toast message.
 *
 * The hook manages reconnection automatically via EventSource's built-in
 * retry mechanism and the `Last-Event-ID` header (sent by the browser).
 *
 * Should be mounted once at the Layout level, only for authenticated users.
 */
export function useNotificationStream(enabled: boolean) {
  const qc = useQueryClient();
  const esRef = useRef<EventSource | null>(null);

  useEffect(() => {
    if (!enabled) return;

    const token = localStorage.getItem('token');
    if (!token) return;

    function connect() {
      // Pass token via query string (EventSource cannot set headers)
      const url = `/api/notifications/stream?token=${encodeURIComponent(token!)}`;
      const es = new EventSource(url);
      esRef.current = es;

      es.addEventListener('notification', (e: MessageEvent) => {
        try {
          const n: SSENotification = JSON.parse(e.data);

          // Refresh notification queries so badge count and list update
          qc.invalidateQueries({ queryKey: ['notifications'] });

          // Sound + toast
          playNotificationSound('notification');
          toast(n.title, {
            icon: '🔔',
            duration: 5000,
            style: {
              background: '#1e293b',
              color: '#fff',
              borderRadius: '12px',
              padding: '12px 16px',
              fontWeight: 500,
              direction: 'rtl' as const,
              cursor: n.link ? 'pointer' : 'default',
            },
            // navigate handled via link click from in-app notification center
          });
        } catch {
          // Malformed event data — ignore
        }
      });

      es.addEventListener('close', () => {
        // Server closed cleanly — reconnect after a short delay
        es.close();
        esRef.current = null;
        setTimeout(connect, 1000);
      });

      es.onerror = () => {
        // EventSource will auto-reconnect with exponential backoff
      };
    }

    connect();

    return () => {
      esRef.current?.close();
      esRef.current = null;
    };
  }, [enabled, qc]);
}
