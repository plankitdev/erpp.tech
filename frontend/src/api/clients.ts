import api from './axios';
import type { ApiResponse, PaginatedResponse, Client, ClientFinancialSummary } from '../types';

export const clientsApi = {
  getAll: (params?: Record<string, unknown>) =>
    api.get<PaginatedResponse<Client>>('/clients', { params }),

  getBySlug: (slug: string) =>
    api.get<ApiResponse<Client>>(`/clients/${slug}`),

  create: (data: Partial<Client>) =>
    api.post<ApiResponse<Client>>('/clients', data),

  update: (slug: string, data: Partial<Client>) =>
    api.put<ApiResponse<Client>>(`/clients/${slug}`, data),

  delete: (slug: string) =>
    api.delete<ApiResponse<null>>(`/clients/${slug}`),

  batchDelete: (ids: number[]) =>
    api.post<ApiResponse<null>>('/clients/batch-delete', { ids }),

  getFinancialSummary: (params?: Record<string, unknown>) =>
    api.get<ApiResponse<ClientFinancialSummary[]>>('/clients/financial-summary', { params }),
};
