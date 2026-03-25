import api from './axios';
import type { ApiResponse } from '../types';

export interface DriveStatus {
  connected: boolean;
  last_synced_at: string | null;
}

export interface DriveSyncResult {
  synced_files: number;
  errors: number;
  total_files: number;
  total_folders: number;
}

export const googleDriveApi = {
  status: () =>
    api.get<ApiResponse<DriveStatus>>('/google-drive/status'),

  getAuthUrl: () =>
    api.get<ApiResponse<{ url: string }>>('/google-drive/auth-url'),

  callback: (code: string) =>
    api.post<ApiResponse<null>>('/google-drive/callback', { code }),

  sync: () =>
    api.post<ApiResponse<DriveSyncResult>>('/google-drive/sync'),

  disconnect: () =>
    api.post<ApiResponse<null>>('/google-drive/disconnect'),
};
