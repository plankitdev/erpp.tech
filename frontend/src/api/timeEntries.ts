import api from './axios';
import type { ApiResponse, PaginatedResponse, TimeEntry, TimeSummary } from '../types';

export const timeEntriesApi = {
  getAll: (params?: Record<string, unknown>) =>
    api.get<PaginatedResponse<TimeEntry>>('/time-entries', { params }),

  create: (data: { task_id: number; description?: string; started_at: string; ended_at: string; duration_minutes: number }) =>
    api.post<ApiResponse<TimeEntry>>('/time-entries', data),

  update: (id: number, data: Partial<TimeEntry>) =>
    api.put<ApiResponse<TimeEntry>>(`/time-entries/${id}`, data),

  delete: (id: number) =>
    api.delete<ApiResponse<null>>(`/time-entries/${id}`),

  start: (taskId: number) =>
    api.post<ApiResponse<TimeEntry>>(`/time-entries/start`, { task_id: taskId }),

  stop: (id: number) =>
    api.post<ApiResponse<TimeEntry>>(`/time-entries/${id}/stop`),

  running: () =>
    api.get<ApiResponse<TimeEntry | null>>('/time-entries/running'),

  summary: (params?: Record<string, unknown>) =>
    api.get<ApiResponse<TimeSummary[]>>('/time-entries/summary', { params }),
};
