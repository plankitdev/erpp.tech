import api from './axios';
import type { ApiResponse, PaginatedResponse, Meeting } from '../types';

export const meetingsApi = {
  getAll: (params?: Record<string, unknown>) =>
    api.get<PaginatedResponse<Meeting>>('/meetings', { params }),

  getById: (id: number) =>
    api.get<ApiResponse<Meeting>>(`/meetings/${id}`),

  create: (data: Partial<Meeting>) =>
    api.post<ApiResponse<Meeting>>('/meetings', data),

  update: (id: number, data: Partial<Meeting>) =>
    api.put<ApiResponse<Meeting>>(`/meetings/${id}`, data),

  delete: (id: number) =>
    api.delete<ApiResponse<null>>(`/meetings/${id}`),

  respond: (id: number, status: 'accepted' | 'declined') =>
    api.post<ApiResponse<null>>(`/meetings/${id}/respond`, { status }),
};
