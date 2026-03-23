import api from './axios';
import type { ApiResponse, PaginatedResponse } from '../types';

export interface Announcement {
  id: number;
  title: string;
  body: string;
  priority: 'normal' | 'important' | 'urgent';
  is_pinned: boolean;
  likes_count: number;
  is_liked: boolean;
  likes?: { id: number; name: string }[];
  creator?: { id: number; name: string };
  created_at: string;
}

export const announcementsApi = {
  getAll: (params?: Record<string, unknown>) =>
    api.get<PaginatedResponse<Announcement>>('/announcements', { params }),

  create: (data: Partial<Announcement>) =>
    api.post<ApiResponse<Announcement>>('/announcements', data),

  update: (id: number, data: Partial<Announcement>) =>
    api.put<ApiResponse<Announcement>>(`/announcements/${id}`, data),

  delete: (id: number) =>
    api.delete<ApiResponse<null>>(`/announcements/${id}`),

  toggleLike: (id: number) =>
    api.post<ApiResponse<{ likes_count: number; is_liked: boolean }>>(`/announcements/${id}/toggle-like`),

  getUnreadCount: () =>
    api.get<ApiResponse<{ count: number }>>('/announcements/unread-count'),

  markRead: () =>
    api.post<ApiResponse<null>>('/announcements/mark-read'),
};
