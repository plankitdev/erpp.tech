import { useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationsApi } from '../api/notifications';
import toast from 'react-hot-toast';

export function useNotifications(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: ['notifications', params],
    queryFn: () => notificationsApi.getAll(params).then(r => r.data),
  });
}

export function useUnreadCount() {
  const prevCount = useRef<number | null>(null);

  return useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: async () => {
      const count = await notificationsApi.unreadCount().then(r => r.data.data.count);
      if (prevCount.current !== null && count > prevCount.current) {
        toast('لديك إشعارات جديدة 🔔', { icon: '🔔', duration: 4000 });
      }
      prevCount.current = count;
      return count;
    },
    refetchInterval: 15000,
  });
}

export function useMarkRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => notificationsApi.markRead(id).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

export function useMarkAllRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => notificationsApi.markAllRead().then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}
