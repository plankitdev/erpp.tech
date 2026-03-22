import api from './axios';
import type { ApiResponse, PaginatedResponse, Invoice, InvoicePayment } from '../types';

export const invoicesApi = {
  getAll: (params?: Record<string, unknown>) =>
    api.get<PaginatedResponse<Invoice>>('/invoices', { params }),

  getById: (id: number) =>
    api.get<ApiResponse<Invoice>>(`/invoices/${id}`),

  create: (data: Partial<Invoice>) =>
    api.post<ApiResponse<Invoice>>('/invoices', data),

  update: (id: number, data: Partial<Invoice>) =>
    api.put<ApiResponse<Invoice>>(`/invoices/${id}`, data),

  delete: (id: number) =>
    api.delete<ApiResponse<null>>(`/invoices/${id}`),

  batchDelete: (ids: number[]) =>
    api.post<ApiResponse<null>>('/invoices/batch-delete', { ids }),

  recordPayment: (invoiceId: number, data: { amount: number; paid_at?: string; notes?: string }) =>
    api.post<ApiResponse<InvoicePayment>>(`/invoices/${invoiceId}/payments`, data),
};
