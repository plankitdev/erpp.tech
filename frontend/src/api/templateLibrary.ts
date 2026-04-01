import api from './axios';
import type { PaginatedResponse, ApiResponse, Template, TemplateCategory } from '../types';

export const templateLibraryApi = {
  // Categories
  getCategories: () =>
    api.get<ApiResponse<TemplateCategory[]>>('/template-library/categories'),

  createCategory: (data: { name: string; color?: string; icon?: string }) =>
    api.post<ApiResponse<TemplateCategory>>('/template-library/categories', data),

  updateCategory: (id: number, data: Partial<TemplateCategory>) =>
    api.put<ApiResponse<TemplateCategory>>(`/template-library/categories/${id}`, data),

  deleteCategory: (id: number) =>
    api.delete<ApiResponse<null>>(`/template-library/categories/${id}`),

  // Templates
  getAll: (params?: Record<string, unknown>) =>
    api.get<PaginatedResponse<Template>>('/template-library', { params }),

  getOne: (id: number) =>
    api.get<ApiResponse<Template>>(`/template-library/${id}`),

  create: (data: Record<string, unknown>) =>
    api.post<ApiResponse<Template>>('/template-library', data),

  update: (id: number, data: Record<string, unknown>) =>
    api.put<ApiResponse<Template>>(`/template-library/${id}`, data),

  delete: (id: number) =>
    api.delete<ApiResponse<null>>(`/template-library/${id}`),

  useTemplate: (id: number) =>
    api.post<ApiResponse<import('../types').UserDocument>>(`/template-library/${id}/use`),

  duplicate: (id: number) =>
    api.post<ApiResponse<Template>>(`/template-library/${id}/duplicate`),
};
