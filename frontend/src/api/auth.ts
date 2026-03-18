import api from './axios';
import type { ApiResponse, LoginResponse, User, Company } from '../types';

export const authApi = {
  login: (email: string, password: string) =>
    api.post<LoginResponse>('/auth/login', { email, password }),

  logout: () =>
    api.post('/auth/logout'),

  me: () =>
    api.get<ApiResponse<User>>('/auth/me'),

  changePassword: (data: { current_password: string; password: string; password_confirmation: string }) =>
    api.post('/auth/change-password', data),
};

export const superAdminApi = {
  getCompanies: () =>
    api.get<ApiResponse<Company[]>>('/super-admin/companies'),

  switchCompany: (companyId: number) =>
    api.post<LoginResponse>(`/super-admin/companies/${companyId}/switch`),
};
