import api from './axios';
import type { PaginatedResponse, FileTemplate, ApiResponse } from '../types';

export const fileTemplatesApi = {
  getAll: (params?: Record<string, unknown>) =>
    api.get<PaginatedResponse<FileTemplate>>('/file-templates', { params }),

  create: (data: FormData) =>
    api.post<ApiResponse<FileTemplate>>('/file-templates', data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  update: (id: number, data: Record<string, unknown>) =>
    api.put<ApiResponse<FileTemplate>>(`/file-templates/${id}`, data),

  delete: (id: number) =>
    api.delete<ApiResponse<null>>(`/file-templates/${id}`),
};
