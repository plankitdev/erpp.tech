import api from './axios';
import type { ApiResponse } from '../types';

export interface DriveStatus {
  connected: boolean;
  folder_selected: boolean;
  folder_name: string | null;
  last_synced_at: string | null;
}

export interface DriveFolder {
  id: string;
  name: string;
}

export interface DriveSyncResult {
  pushed: number;
  pulled: number;
  deleted: number;
  errors: number;
}

export interface DriveImportResult {
  imported_folders: number;
  imported_files: number;
  errors: number;
}

export const googleDriveApi = {
  status: () =>
    api.get<ApiResponse<DriveStatus>>('/google-drive/status'),

  getAuthUrl: () =>
    api.get<ApiResponse<{ url: string }>>('/google-drive/auth-url'),

  callback: (code: string) =>
    api.post<ApiResponse<null>>('/google-drive/callback', { code }),

  listFolders: (parentId?: string) =>
    api.get<ApiResponse<DriveFolder[]>>('/google-drive/folders', { params: { parent_id: parentId } }),

  selectFolder: (folderId: string, folderName: string) =>
    api.post<ApiResponse<null>>('/google-drive/select-folder', { folder_id: folderId, folder_name: folderName }),

  importFiles: () =>
    api.post<ApiResponse<DriveImportResult>>('/google-drive/import'),

  sync: () =>
    api.post<ApiResponse<DriveSyncResult>>('/google-drive/sync'),

  disconnect: () =>
    api.post<ApiResponse<null>>('/google-drive/disconnect'),
};
