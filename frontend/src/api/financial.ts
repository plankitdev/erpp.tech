import api from './axios';
import type {
  ApiResponse, PaginatedResponse,
  ChartOfAccount, JournalEntry, CostCenter,
  Budget, BankAccount, BankTransaction, FixedAsset,
  AgingReport, FinancialKpis,
} from '../types';

// ========== Chart of Accounts ==========
export const chartOfAccountsApi = {
  getAll: (params?: Record<string, unknown>) =>
    api.get<PaginatedResponse<ChartOfAccount>>('/chart-of-accounts', { params }),

  getTree: () =>
    api.get<ApiResponse<ChartOfAccount[]>>('/chart-of-accounts/tree'),

  getById: (id: number) =>
    api.get<ApiResponse<ChartOfAccount>>(`/chart-of-accounts/${id}`),

  create: (data: Partial<ChartOfAccount>) =>
    api.post<ApiResponse<ChartOfAccount>>('/chart-of-accounts', data),

  update: (id: number, data: Partial<ChartOfAccount>) =>
    api.put<ApiResponse<ChartOfAccount>>(`/chart-of-accounts/${id}`, data),

  delete: (id: number) =>
    api.delete<ApiResponse<null>>(`/chart-of-accounts/${id}`),

  seed: () =>
    api.post<ApiResponse<null>>('/chart-of-accounts/seed'),
};

// ========== Journal Entries ==========
export const journalEntriesApi = {
  getAll: (params?: Record<string, unknown>) =>
    api.get<PaginatedResponse<JournalEntry>>('/journal-entries', { params }),

  getById: (id: number) =>
    api.get<ApiResponse<JournalEntry>>(`/journal-entries/${id}`),

  create: (data: Record<string, unknown>) =>
    api.post<ApiResponse<JournalEntry>>('/journal-entries', data),

  update: (id: number, data: Record<string, unknown>) =>
    api.put<ApiResponse<JournalEntry>>(`/journal-entries/${id}`, data),

  delete: (id: number) =>
    api.delete<ApiResponse<null>>(`/journal-entries/${id}`),

  post: (id: number) =>
    api.post<ApiResponse<JournalEntry>>(`/journal-entries/${id}/post`),

  reverse: (id: number) =>
    api.post<ApiResponse<JournalEntry>>(`/journal-entries/${id}/reverse`),
};

// ========== Cost Centers ==========
export const costCentersApi = {
  getAll: (params?: Record<string, unknown>) =>
    api.get<PaginatedResponse<CostCenter>>('/cost-centers', { params }),

  getById: (id: number) =>
    api.get<ApiResponse<CostCenter>>(`/cost-centers/${id}`),

  create: (data: Partial<CostCenter>) =>
    api.post<ApiResponse<CostCenter>>('/cost-centers', data),

  update: (id: number, data: Partial<CostCenter>) =>
    api.put<ApiResponse<CostCenter>>(`/cost-centers/${id}`, data),

  delete: (id: number) =>
    api.delete<ApiResponse<null>>(`/cost-centers/${id}`),
};

// ========== Budgets ==========
export const budgetsApi = {
  getAll: (params?: Record<string, unknown>) =>
    api.get<PaginatedResponse<Budget>>('/budgets', { params }),

  getById: (id: number) =>
    api.get<ApiResponse<Budget>>(`/budgets/${id}`),

  create: (data: Record<string, unknown>) =>
    api.post<ApiResponse<Budget>>('/budgets', data),

  update: (id: number, data: Record<string, unknown>) =>
    api.put<ApiResponse<Budget>>(`/budgets/${id}`, data),

  delete: (id: number) =>
    api.delete<ApiResponse<null>>(`/budgets/${id}`),

  approve: (id: number) =>
    api.post<ApiResponse<Budget>>(`/budgets/${id}/approve`),

  comparison: (params?: Record<string, unknown>) =>
    api.get<ApiResponse<unknown>>('/reports/budget-comparison', { params }),
};

// ========== Bank Accounts ==========
export const bankAccountsApi = {
  getAll: (params?: Record<string, unknown>) =>
    api.get<ApiResponse<BankAccount[]>>('/bank-accounts', { params }),

  getById: (id: number) =>
    api.get<ApiResponse<BankAccount>>(`/bank-accounts/${id}`),

  create: (data: Partial<BankAccount>) =>
    api.post<ApiResponse<BankAccount>>('/bank-accounts', data),

  update: (id: number, data: Partial<BankAccount>) =>
    api.put<ApiResponse<BankAccount>>(`/bank-accounts/${id}`, data),

  delete: (id: number) =>
    api.delete<ApiResponse<null>>(`/bank-accounts/${id}`),

  getTransactions: (accountId: number, params?: Record<string, unknown>) =>
    api.get<PaginatedResponse<BankTransaction>>(`/bank-accounts/${accountId}/transactions`, { params }),

  addTransaction: (accountId: number, data: Record<string, unknown>) =>
    api.post<ApiResponse<BankTransaction>>(`/bank-accounts/${accountId}/transactions`, data),

  reconcile: (accountId: number, transactionIds: number[]) =>
    api.post<ApiResponse<{ reconciled_count: number }>>(`/bank-accounts/${accountId}/reconcile`, { transaction_ids: transactionIds }),
};

// ========== Fixed Assets ==========
export const fixedAssetsApi = {
  getAll: (params?: Record<string, unknown>) =>
    api.get<PaginatedResponse<FixedAsset>>('/fixed-assets', { params }),

  getById: (id: number) =>
    api.get<ApiResponse<FixedAsset>>(`/fixed-assets/${id}`),

  create: (data: Partial<FixedAsset>) =>
    api.post<ApiResponse<FixedAsset>>('/fixed-assets', data),

  update: (id: number, data: Partial<FixedAsset>) =>
    api.put<ApiResponse<FixedAsset>>(`/fixed-assets/${id}`, data),

  delete: (id: number) =>
    api.delete<ApiResponse<null>>(`/fixed-assets/${id}`),

  depreciate: () =>
    api.post<ApiResponse<{ depreciated_count: number }>>('/fixed-assets/depreciate'),

  summary: () =>
    api.get<ApiResponse<unknown>>('/fixed-assets/summary'),
};

// ========== Financial Reports ==========
export const financialReportsApi = {
  receivableAging: (params?: Record<string, unknown>) =>
    api.get<ApiResponse<AgingReport>>('/reports/receivable-aging', { params }),

  clientStatement: (params: Record<string, unknown>) =>
    api.get<ApiResponse<unknown>>('/reports/client-statement', { params }),

  balanceSheet: (params?: Record<string, unknown>) =>
    api.get<ApiResponse<unknown>>('/reports/balance-sheet', { params }),

  financialKpis: (params?: Record<string, unknown>) =>
    api.get<ApiResponse<FinancialKpis>>('/reports/financial-kpis', { params }),
};
