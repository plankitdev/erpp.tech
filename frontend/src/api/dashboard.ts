import api from './axios';
import type { ApiResponse, DashboardData } from '../types';

export const dashboardApi = {
  getData: () =>
    api.get<ApiResponse<DashboardData>>('/dashboard'),
  
  getRoleData: () =>
    api.get<ApiResponse<Record<string, unknown>>>('/dashboard'),
};

export const reportsApi = {
  monthly: (params?: Record<string, unknown>) =>
    api.get<ApiResponse<unknown>>('/reports/monthly', { params }),

  yearly: (params?: Record<string, unknown>) =>
    api.get<ApiResponse<unknown>>('/reports/yearly', { params }),

  clients: (params?: Record<string, unknown>) =>
    api.get<ApiResponse<unknown>>('/reports/clients', { params }),

  salaries: (params?: Record<string, unknown>) =>
    api.get<ApiResponse<unknown>>('/reports/salaries', { params }),

  treasury: (params?: Record<string, unknown>) =>
    api.get<ApiResponse<unknown>>('/reports/treasury', { params }),

  partners: (params?: Record<string, unknown>) =>
    api.get<ApiResponse<unknown>>('/reports/partners', { params }),
};
