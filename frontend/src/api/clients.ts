import api from './axios';
import type { ApiResponse, PaginatedResponse, Client } from '../types';

export const clientsApi = {
  getAll: (params?: Record<string, unknown>) =>
    api.get<PaginatedResponse<Client>>('/clients', { params }),

  getById: (id: number) =>
    api.get<ApiResponse<Client>>(`/clients/${id}`),

  create: (data: Partial<Client>) =>
    api.post<ApiResponse<Client>>('/clients', data),

  update: (id: number, data: Partial<Client>) =>
    api.put<ApiResponse<Client>>(`/clients/${id}`, data),

  delete: (id: number) =>
    api.delete<ApiResponse<null>>(`/clients/${id}`),
};
