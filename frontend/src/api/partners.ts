import api from './axios';
import type { ApiResponse, PaginatedResponse, Partner, MonthlyProfitData, PartnerStatementData } from '../types';

export const partnersApi = {
  getAll: (params?: Record<string, unknown>) =>
    api.get<PaginatedResponse<Partner>>('/partners', { params }),

  create: (data: Partial<Partner>) =>
    api.post<ApiResponse<Partner>>('/partners', data),

  update: (id: number, data: Partial<Partner>) =>
    api.put<ApiResponse<Partner>>(`/partners/${id}`, data),

  delete: (id: number) =>
    api.delete<ApiResponse<null>>(`/partners/${id}`),

  getProfits: (params?: Record<string, unknown>) =>
    api.get<ApiResponse<unknown>>('/partners/profits', { params }),

  getMonthlyProfit: (params: { month: number; year: number }) =>
    api.get<ApiResponse<MonthlyProfitData>>('/partners/monthly-profit', { params }),

  getStatement: (partnerId: number, year: number) =>
    api.get<ApiResponse<PartnerStatementData>>(`/partners/${partnerId}/statement`, { params: { year } }),

  getPayments: (partnerId: number, params?: Record<string, unknown>) =>
    api.get<PaginatedResponse<unknown>>(`/partners/${partnerId}/payments`, { params }),

  recordPayment: (partnerId: number, data: Record<string, unknown>) =>
    api.post<ApiResponse<unknown>>(`/partners/${partnerId}/payments`, data),

  deletePayment: (partnerId: number, paymentId: number) =>
    api.delete<ApiResponse<null>>(`/partners/${partnerId}/payments/${paymentId}`),
};
