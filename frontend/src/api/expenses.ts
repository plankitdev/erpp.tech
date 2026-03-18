import api from './axios';
import type { ApiResponse, PaginatedResponse, Expense } from '../types';

export const expensesApi = {
  getAll: (params?: Record<string, unknown>) =>
    api.get<PaginatedResponse<Expense>>('/expenses', { params }),

  getById: (id: number) =>
    api.get<ApiResponse<Expense>>(`/expenses/${id}`),

  create: (data: Partial<Expense>) =>
    api.post<ApiResponse<Expense>>('/expenses', data),

  update: (id: number, data: Partial<Expense>) =>
    api.put<ApiResponse<Expense>>(`/expenses/${id}`, data),

  delete: (id: number) =>
    api.delete<ApiResponse<null>>(`/expenses/${id}`),
};
