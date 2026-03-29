import api from './axios';
import type { ApiResponse } from '../types';

export interface FMFolder {
  id: number;
  name: string;
  type: 'client' | 'project' | 'general' | 'custom';
  client?: { id: number; name: string; company_name?: string } | null;
  project?: { id: number; name: string } | null;
  children_count: number;
  files_count: number;
  created_at: string;
}

export interface FMFile {
  id: number;
  name: string;
  file_path: string;
  mime_type: string;
  file_size: number;
  status: 'draft' | 'approved' | 'archived';
  uploaded_by?: { id: number; name: string } | null;
  approved_by?: { id: number; name: string } | null;
  approved_at?: string | null;
  notes?: string | null;
  created_at: string;
}

export interface FMBreadcrumb {
  id: number;
  name: string;
}

export interface FMIndexData {
  folders: FMFolder[];
  files: FMFile[];
  breadcrumbs: FMBreadcrumb[];
}

export interface FMStats {
  total_files: number;
  total_size: number;
  total_folders: number;
  by_status: Record<string, number>;
}

export interface FMSearchResult {
  folders: { id: number; name: string; type: string; parent_name?: string }[];
  files: { id: number; name: string; type: string; mime_type?: string; file_path: string; file_size: number; folder_name?: string; uploaded_by?: { id: number; name: string } }[];
}

export const fileManagerApi = {
  index: (folderId?: number | null) =>
    api.get<ApiResponse<FMIndexData>>('/file-manager', { params: { folder_id: folderId } }),

  search: (q: string) =>
    api.get<ApiResponse<FMSearchResult>>('/file-manager/search', { params: { q } }),

  stats: () =>
    api.get<ApiResponse<FMStats>>('/file-manager/stats'),

  createFolder: (data: { name: string; parent_id?: number | null; type?: string; client_id?: number; project_id?: number }) =>
    api.post<ApiResponse<FMFolder>>('/file-manager/folders', data),

  renameFolder: (id: number, name: string) =>
    api.put<ApiResponse<FMFolder>>(`/file-manager/folders/${id}/rename`, { name }),

  moveFolder: (id: number, parentId: number | null) =>
    api.put<ApiResponse<FMFolder>>(`/file-manager/folders/${id}/move`, { parent_id: parentId }),

  deleteFolder: (id: number) =>
    api.delete<ApiResponse<null>>(`/file-manager/folders/${id}`),

  uploadFile: (data: FormData) =>
    api.post<ApiResponse<FMFile>>('/file-manager/files', data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  renameFile: (id: number, name: string) =>
    api.put<ApiResponse<FMFile>>(`/file-manager/files/${id}/rename`, { name }),

  moveFile: (id: number, folderId: number | null) =>
    api.put<ApiResponse<FMFile>>(`/file-manager/files/${id}/move`, { folder_id: folderId }),

  approveFile: (id: number) =>
    api.post<ApiResponse<FMFile>>(`/file-manager/files/${id}/approve`),

  deleteFile: (id: number) =>
    api.delete<ApiResponse<null>>(`/file-manager/files/${id}`),

  downloadFile: (id: number) =>
    api.get(`/file-manager/files/${id}/download`, { responseType: 'blob' }),
};
