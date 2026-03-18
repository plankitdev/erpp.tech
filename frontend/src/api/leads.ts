import api from './axios';
import type { ApiResponse, PaginatedResponse, Lead, LeadActivity, SalesDashboardData, SalesReportData, LeadImportResult } from '../types';

export const leadsApi = {
  getAll: (params?: Record<string, unknown>) =>
    api.get<PaginatedResponse<Lead>>('/leads', { params }),

  getById: (id: number) =>
    api.get<ApiResponse<Lead>>(`/leads/${id}`),

  create: (data: Partial<Lead>) =>
    api.post<ApiResponse<Lead>>('/leads', data),

  update: (id: number, data: Partial<Lead>) =>
    api.put<ApiResponse<Lead>>(`/leads/${id}`, data),

  delete: (id: number) =>
    api.delete<ApiResponse<null>>(`/leads/${id}`),

  updateStage: (id: number, stage: string) =>
    api.post<ApiResponse<Lead>>(`/leads/${id}/stage`, { stage }),

  convertToClient: (id: number, data: Record<string, unknown>) =>
    api.post<ApiResponse<{ client_id: number; contract_id: number }>>(`/leads/${id}/convert`, data),

  // Activities
  getActivities: (leadId: number) =>
    api.get<PaginatedResponse<LeadActivity>>(`/leads/${leadId}/activities`),

  addActivity: (leadId: number, data: Partial<LeadActivity>) =>
    api.post<ApiResponse<LeadActivity>>(`/leads/${leadId}/activities`, data),

  // Dashboard
  dashboard: () =>
    api.get<ApiResponse<SalesDashboardData>>('/sales/dashboard'),

  // Report
  report: (params?: { month?: number; year?: number }) =>
    api.get<ApiResponse<SalesReportData>>('/sales/report', { params }),

  // Import
  importLeads: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post<ApiResponse<LeadImportResult>>('/leads/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  downloadTemplate: () =>
    api.get('/leads/import-template', { responseType: 'blob' }),
};
