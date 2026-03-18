import api from './axios';
import { ApiResponse, PaginatedResponse, WorkflowRule, WorkflowLog } from '../types';

export const workflowsApi = {
  getAll: (params?: Record<string, string | number | boolean>) =>
    api.get<PaginatedResponse<WorkflowRule>>('/workflows', { params }),

  getById: (id: number) =>
    api.get<ApiResponse<WorkflowRule & { logs: WorkflowLog[] }>>(`/workflows/${id}`),

  create: (data: Partial<WorkflowRule>) =>
    api.post<ApiResponse<WorkflowRule>>('/workflows', data),

  update: (id: number, data: Partial<WorkflowRule>) =>
    api.put<ApiResponse<WorkflowRule>>(`/workflows/${id}`, data),

  delete: (id: number) =>
    api.delete<ApiResponse<null>>(`/workflows/${id}`),

  toggle: (id: number) =>
    api.post<ApiResponse<WorkflowRule>>(`/workflows/${id}/toggle`),

  getLogs: (params?: Record<string, string | number>) =>
    api.get<PaginatedResponse<WorkflowLog>>('/workflow-logs', { params }),

  getTemplates: () =>
    api.get<ApiResponse<Partial<WorkflowRule>[]>>('/workflow-templates'),
};
