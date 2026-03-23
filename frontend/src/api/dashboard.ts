import api from './axios';
import type { ApiResponse, DashboardData } from '../types';

export const dashboardApi = {
  getData: (params?: Record<string, unknown>) =>
    api.get<ApiResponse<DashboardData>>('/dashboard', { params }),
  
  getRoleData: (params?: Record<string, unknown>) =>
    api.get<ApiResponse<Record<string, unknown>>>('/dashboard', { params }),

  getBadges: () =>
    api.get<ApiResponse<{ new_tasks: number; upcoming_meetings: number; new_projects: number }>>('/dashboard/badges'),
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

  profitLoss: (params?: Record<string, unknown>) =>
    api.get<ApiResponse<unknown>>('/reports/profit-loss', { params }),

  cashFlow: (params?: Record<string, unknown>) =>
    api.get<ApiResponse<unknown>>('/reports/cash-flow', { params }),
};
