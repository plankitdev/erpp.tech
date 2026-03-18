import api from './axios';
import type { ApiResponse, PaginatedResponse, Contract } from '../types';

export const contractsApi = {
  getAll: (params?: Record<string, unknown>) =>
    api.get<PaginatedResponse<Contract>>('/contracts', { params }),

  getByClient: (clientId: number, params?: Record<string, unknown>) =>
    api.get<PaginatedResponse<Contract>>(`/clients/${clientId}/contracts`, { params }),

  getById: (id: number) =>
    api.get<ApiResponse<Contract>>(`/contracts/${id}`),

  create: (clientId: number, data: Partial<Contract>) =>
    api.post<ApiResponse<Contract>>(`/clients/${clientId}/contracts`, data),

  update: (id: number, data: Partial<Contract>) =>
    api.put<ApiResponse<Contract>>(`/contracts/${id}`, data),

  delete: (id: number) =>
    api.delete<ApiResponse<null>>(`/contracts/${id}`),
};
