import api from './axios';
import type { ApiResponse, Epic } from '../types';

export const epicsApi = {
  getAll: (params?: Record<string, unknown>) =>
    api.get<ApiResponse<Epic[]>>('/epics', { params }),

  getById: (id: number) =>
    api.get<ApiResponse<Epic>>(`/epics/${id}`),

  create: (data: Partial<Epic>) =>
    api.post<ApiResponse<Epic>>('/epics', data),

  update: (id: number, data: Partial<Epic>) =>
    api.put<ApiResponse<Epic>>(`/epics/${id}`, data),

  delete: (id: number) =>
    api.delete<ApiResponse<null>>(`/epics/${id}`),
};
