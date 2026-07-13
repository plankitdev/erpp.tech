import api from './axios';
import type { ApiResponse, SavedFilter } from '../types';

export const savedFiltersApi = {
  getAll: (scope?: string) =>
    api.get<ApiResponse<SavedFilter[]>>('/saved-filters', { params: scope ? { scope } : undefined }),

  create: (data: { name: string; scope: string; criteria: Record<string, unknown>; is_shared?: boolean }) =>
    api.post<ApiResponse<SavedFilter>>('/saved-filters', data),

  update: (id: number, data: Partial<Pick<SavedFilter, 'name' | 'criteria' | 'is_shared'>>) =>
    api.put<ApiResponse<SavedFilter>>(`/saved-filters/${id}`, data),

  delete: (id: number) =>
    api.delete<ApiResponse<null>>(`/saved-filters/${id}`),
};
