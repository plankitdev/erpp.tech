import api from './axios';
import type { ApiResponse, PaginatedResponse, TreasuryTransaction } from '../types';

export interface TreasuryBalance {
  EGP: number;
  USD: number;
  SAR: number;
}

export const treasuryApi = {
  getAll: (params?: Record<string, unknown>) =>
    api.get<PaginatedResponse<TreasuryTransaction>>('/treasury', { params }),

  getById: (id: number) =>
    api.get<ApiResponse<TreasuryTransaction>>(`/treasury/${id}`),

  create: (data: Partial<TreasuryTransaction>) =>
    api.post<ApiResponse<TreasuryTransaction>>('/treasury', data),

  getBalance: () =>
    api.get<ApiResponse<TreasuryBalance>>('/treasury/balance'),
};
