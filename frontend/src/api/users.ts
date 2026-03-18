import api from './axios';
import type { ApiResponse, PaginatedResponse, User, PermissionsData } from '../types';

export const usersApi = {
  getAll: (params?: Record<string, unknown>) =>
    api.get<PaginatedResponse<User>>('/users', { params }),

  getById: (id: number) =>
    api.get<ApiResponse<User>>(`/users/${id}`),

  create: (data: Record<string, unknown>) =>
    api.post<ApiResponse<User>>('/users', data),

  update: (id: number, data: Record<string, unknown>) =>
    api.put<ApiResponse<User>>(`/users/${id}`, data),

  delete: (id: number) =>
    api.delete<ApiResponse<null>>(`/users/${id}`),

  resetPassword: (id: number) =>
    api.post<ApiResponse<{ new_password: string }>>(`/users/${id}/reset-password`),

  getAllPermissions: () =>
    api.get<ApiResponse<PermissionsData>>('/permissions/all'),

  getDefaultPermissions: (role: string) =>
    api.get<ApiResponse<string[]>>(`/permissions/defaults/${role}`),
};
