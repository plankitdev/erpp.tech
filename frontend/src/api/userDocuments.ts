import api from './axios';
import type { PaginatedResponse, ApiResponse, UserDocument } from '../types';

export const userDocumentsApi = {
  getAll: (params?: Record<string, unknown>) =>
    api.get<PaginatedResponse<UserDocument>>('/user-documents', { params }),

  getOne: (id: number) =>
    api.get<ApiResponse<UserDocument>>(`/user-documents/${id}`),

  update: (id: number, data: Record<string, unknown>) =>
    api.put<ApiResponse<UserDocument>>(`/user-documents/${id}`, data),

  updateStatus: (id: number, status: string) =>
    api.put<ApiResponse<UserDocument>>(`/user-documents/${id}/status`, { status }),

  saveToDrive: (id: number) =>
    api.post<ApiResponse<UserDocument>>(`/user-documents/${id}/save-to-drive`),

  delete: (id: number) =>
    api.delete<ApiResponse<null>>(`/user-documents/${id}`),
};
