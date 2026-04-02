import api from './axios';
import type { ApiResponse, PaginatedResponse, Project, ProjectFile, EmployeeReportData } from '../types';

export const projectsApi = {
  getAll: (params?: Record<string, unknown>) =>
    api.get<PaginatedResponse<Project>>('/projects', { params }),

  getById: (slug: string) =>
    api.get<ApiResponse<Project>>(`/projects/${slug}`),

  create: (data: Record<string, unknown>) =>
    api.post<ApiResponse<Project>>('/projects', data),

  update: (slug: string, data: Record<string, unknown>) =>
    api.put<ApiResponse<Project>>(`/projects/${slug}`, data),

  delete: (slug: string) =>
    api.delete<ApiResponse<null>>(`/projects/${slug}`),

  uploadFile: (slug: string, file: File, name?: string, parentId?: number) => {
    const formData = new FormData();
    formData.append('file', file);
    if (name) formData.append('name', name);
    if (parentId) formData.append('parent_id', String(parentId));
    return api.post<ApiResponse<ProjectFile>>(`/projects/${slug}/files`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  createFolder: (slug: string, name: string, parentId?: number) =>
    api.post<ApiResponse<ProjectFile>>(`/projects/${slug}/folders`, { name, parent_id: parentId }),

  deleteFile: (slug: string, fileId: number) =>
    api.delete<ApiResponse<null>>(`/projects/${slug}/files/${fileId}`),

  clientProfile: (slug: string) =>
    api.get<ApiResponse<unknown>>(`/projects/${slug}/client-profile`),

  employeeReport: (params: { month: number; year: number }) =>
    api.get<ApiResponse<EmployeeReportData>>('/reports/employees', { params }),
};
