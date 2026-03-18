import api from './axios';
import type { ApiResponse } from '../types';

export interface TagData {
  id: number;
  name: string;
  color: string;
  clients_count?: number;
  tasks_count?: number;
  projects_count?: number;
  leads_count?: number;
}

export const tagsApi = {
  getAll: () => api.get<ApiResponse<TagData[]>>('/tags').then(r => r.data.data),
  create: (data: { name: string; color?: string }) => api.post<ApiResponse<TagData>>('/tags', data).then(r => r.data.data),
  update: (id: number, data: { name: string; color?: string }) => api.put<ApiResponse<TagData>>(`/tags/${id}`, data).then(r => r.data.data),
  remove: (id: number) => api.delete(`/tags/${id}`).then(r => r.data),
  attach: (tag_id: number, taggable_type: string, taggable_id: number) =>
    api.post('/tags/attach', { tag_id, taggable_type, taggable_id }).then(r => r.data),
  detach: (tag_id: number, taggable_type: string, taggable_id: number) =>
    api.post('/tags/detach', { tag_id, taggable_type, taggable_id }).then(r => r.data),
};
