import api from './axios';
import type { ApiResponse, PaginatedResponse, Notification } from '../types';

export const notificationsApi = {
  getAll: (params?: Record<string, unknown>) =>
    api.get<PaginatedResponse<Notification>>('/notifications', { params }),

  unreadCount: () =>
    api.get<ApiResponse<{ count: number }>>('/notifications/unread-count'),

  markRead: (id: number) =>
    api.post<ApiResponse<Notification>>(`/notifications/${id}/read`),

  markAllRead: () =>
    api.post<ApiResponse<null>>('/notifications/read-all'),
};
