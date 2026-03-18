import api from './axios';
import type { ApiResponse, Company } from '../types';

export const companiesApi = {
  getAll: (params?: Record<string, unknown>) =>
    api.get<ApiResponse<Company[]>>('/companies', { params }),

  getById: (id: number) =>
    api.get<ApiResponse<Company>>(`/companies/${id}`),

  create: (data: FormData | Partial<Company>) =>
    api.post<ApiResponse<Company>>('/companies', data),

  update: (id: number, data: Partial<Company>) =>
    api.put<ApiResponse<Company>>(`/companies/${id}`, data),

  updateWithLogo: (id: number, data: FormData) => {
    data.append('_method', 'PUT');
    return api.post<ApiResponse<Company>>(`/companies/${id}`, data);
  },

  delete: (id: number) =>
    api.delete<ApiResponse<null>>(`/companies/${id}`),
};
