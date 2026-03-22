import api from './axios';
import type { ApiResponse, PaginatedResponse, Task, TaskComment } from '../types';

export const tasksApi = {
  getAll: (params?: Record<string, unknown>) =>
    api.get<PaginatedResponse<Task>>('/tasks', { params }),

  getById: (id: number) =>
    api.get<ApiResponse<Task>>(`/tasks/${id}`),

  create: (data: Partial<Task>) =>
    api.post<ApiResponse<Task>>('/tasks', data),

  update: (id: number, data: Partial<Task>) =>
    api.put<ApiResponse<Task>>(`/tasks/${id}`, data),

  delete: (id: number) =>
    api.delete<ApiResponse<null>>(`/tasks/${id}`),

  batchDelete: (ids: number[]) =>
    api.post<ApiResponse<null>>('/tasks/batch-delete', { ids }),

  addComment: (taskId: number, data: { comment: string; attachment?: File }) => {
    const formData = new FormData();
    formData.append('comment', data.comment);
    if (data.attachment) formData.append('attachment', data.attachment);
    return api.post<ApiResponse<TaskComment>>(`/tasks/${taskId}/comments`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};
