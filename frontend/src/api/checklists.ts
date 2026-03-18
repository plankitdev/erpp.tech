import api from './axios';
import type { ApiResponse, TaskChecklist } from '../types';

export const checklistsApi = {
  getAll: (taskId: number) =>
    api.get<ApiResponse<TaskChecklist[]>>(`/tasks/${taskId}/checklists`),

  create: (taskId: number, data: { title: string }) =>
    api.post<ApiResponse<TaskChecklist>>(`/tasks/${taskId}/checklists`, data),

  update: (taskId: number, id: number, data: Partial<TaskChecklist>) =>
    api.put<ApiResponse<TaskChecklist>>(`/tasks/${taskId}/checklists/${id}`, data),

  delete: (taskId: number, id: number) =>
    api.delete<ApiResponse<null>>(`/tasks/${taskId}/checklists/${id}`),

  reorder: (taskId: number, ids: number[]) =>
    api.post<ApiResponse<null>>(`/tasks/${taskId}/checklists/reorder`, { ids }),
};
