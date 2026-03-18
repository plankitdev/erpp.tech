import api from './axios';
import type { ApiResponse, PaginatedResponse } from '../types';

export interface QuotationItem {
  description: string;
  quantity: number;
  unit_price: number;
}

export interface Quotation {
  id: number;
  reference: string;
  subject: string;
  description: string | null;
  items: QuotationItem[];
  subtotal: number;
  discount: number;
  tax_rate: number;
  tax_amount: number;
  total: number;
  currency: string;
  status: 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired';
  valid_until: string | null;
  notes: string | null;
  terms: string | null;
  client?: { id: number; name: string; company_name: string | null };
  lead?: { id: number; name: string; company_name: string | null };
  creator?: { id: number; name: string };
  created_at: string;
  updated_at: string;
}

export const quotationsApi = {
  getAll: (params?: Record<string, unknown>) =>
    api.get<PaginatedResponse<Quotation>>('/quotations', { params }),

  get: (id: number) =>
    api.get<ApiResponse<Quotation>>(`/quotations/${id}`),

  create: (data: Partial<Quotation>) =>
    api.post<ApiResponse<Quotation>>('/quotations', data),

  update: (id: number, data: Partial<Quotation>) =>
    api.put<ApiResponse<Quotation>>(`/quotations/${id}`, data),

  delete: (id: number) =>
    api.delete<ApiResponse<null>>(`/quotations/${id}`),

  downloadPdf: (id: number) =>
    api.get(`/quotations/${id}/pdf`, { responseType: 'blob' }),
};
