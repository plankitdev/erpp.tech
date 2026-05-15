import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  chartOfAccountsApi, journalEntriesApi, costCentersApi,
  budgetsApi, bankAccountsApi, fixedAssetsApi, financialReportsApi,
} from '../api/financial';
import type {
  ChartOfAccount, JournalEntry, CostCenter,
  Budget, BankAccount, BankTransaction, FixedAsset,
} from '../types';

// ========== Chart of Accounts ==========
export function useChartOfAccounts(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: ['chart-of-accounts', params],
    queryFn: () => chartOfAccountsApi.getAll(params).then(r => r.data),
  });
}

export function useAccountTree() {
  return useQuery({
    queryKey: ['chart-of-accounts', 'tree'],
    queryFn: () => chartOfAccountsApi.getTree().then(r => r.data.data),
  });
}

export function useCreateAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<ChartOfAccount>) => chartOfAccountsApi.create(data).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['chart-of-accounts'] }),
  });
}

export function useUpdateAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<ChartOfAccount> }) =>
      chartOfAccountsApi.update(id, data).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['chart-of-accounts'] }),
  });
}

export function useDeleteAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => chartOfAccountsApi.delete(id).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['chart-of-accounts'] }),
  });
}

export function useSeedAccounts() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => chartOfAccountsApi.seed().then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['chart-of-accounts'] }),
  });
}

// ========== Journal Entries ==========
export function useJournalEntries(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: ['journal-entries', params],
    queryFn: () => journalEntriesApi.getAll(params).then(r => r.data),
  });
}

export function useJournalEntry(id: number) {
  return useQuery({
    queryKey: ['journal-entries', id],
    queryFn: () => journalEntriesApi.getById(id).then(r => r.data.data),
    enabled: !!id,
  });
}

export function useCreateJournalEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => journalEntriesApi.create(data).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['journal-entries'] }),
  });
}

export function useUpdateJournalEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Record<string, unknown> }) =>
      journalEntriesApi.update(id, data).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['journal-entries'] }),
  });
}

export function usePostJournalEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => journalEntriesApi.post(id).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['journal-entries'] }),
  });
}

export function useReverseJournalEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => journalEntriesApi.reverse(id).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['journal-entries'] }),
  });
}

export function useDeleteJournalEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => journalEntriesApi.delete(id).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['journal-entries'] }),
  });
}

// ========== Cost Centers ==========
export function useCostCenters(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: ['cost-centers', params],
    queryFn: () => costCentersApi.getAll(params).then(r => r.data),
  });
}

export function useCreateCostCenter() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<CostCenter>) => costCentersApi.create(data).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cost-centers'] }),
  });
}

export function useUpdateCostCenter() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<CostCenter> }) =>
      costCentersApi.update(id, data).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cost-centers'] }),
  });
}

export function useDeleteCostCenter() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => costCentersApi.delete(id).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cost-centers'] }),
  });
}

// ========== Budgets ==========
export function useBudgets(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: ['budgets', params],
    queryFn: () => budgetsApi.getAll(params).then(r => r.data),
  });
}

export function useBudget(id: number) {
  return useQuery({
    queryKey: ['budgets', id],
    queryFn: () => budgetsApi.getById(id).then(r => r.data.data),
    enabled: !!id,
  });
}

export function useCreateBudget() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => budgetsApi.create(data).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['budgets'] }),
  });
}

export function useUpdateBudget() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Record<string, unknown> }) =>
      budgetsApi.update(id, data).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['budgets'] }),
  });
}

export function useApproveBudget() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => budgetsApi.approve(id).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['budgets'] }),
  });
}

export function useDeleteBudget() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => budgetsApi.delete(id).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['budgets'] }),
  });
}

export function useBudgetComparison(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: ['budget-comparison', params],
    queryFn: () => budgetsApi.comparison(params).then(r => r.data.data),
  });
}

// ========== Bank Accounts ==========
export function useBankAccounts(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: ['bank-accounts', params],
    queryFn: () => bankAccountsApi.getAll(params).then(r => r.data.data),
  });
}

export function useBankAccount(id: number) {
  return useQuery({
    queryKey: ['bank-accounts', id],
    queryFn: () => bankAccountsApi.getById(id).then(r => r.data.data),
    enabled: !!id,
  });
}

export function useCreateBankAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<BankAccount>) => bankAccountsApi.create(data).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['bank-accounts'] }),
  });
}

export function useUpdateBankAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<BankAccount> }) =>
      bankAccountsApi.update(id, data).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['bank-accounts'] }),
  });
}

export function useDeleteBankAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => bankAccountsApi.delete(id).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['bank-accounts'] }),
  });
}

export function useBankTransactions(accountId: number, params?: Record<string, unknown>) {
  return useQuery({
    queryKey: ['bank-transactions', accountId, params],
    queryFn: () => bankAccountsApi.getTransactions(accountId, params).then(r => r.data),
    enabled: !!accountId,
  });
}

export function useAddBankTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ accountId, data }: { accountId: number; data: Record<string, unknown> }) =>
      bankAccountsApi.addTransaction(accountId, data).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['bank-accounts'] });
      qc.invalidateQueries({ queryKey: ['bank-transactions'] });
    },
  });
}

export function useReconcileTransactions() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ accountId, ids }: { accountId: number; ids: number[] }) =>
      bankAccountsApi.reconcile(accountId, ids).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['bank-accounts'] });
      qc.invalidateQueries({ queryKey: ['bank-transactions'] });
    },
  });
}

// ========== Fixed Assets ==========
export function useFixedAssets(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: ['fixed-assets', params],
    queryFn: () => fixedAssetsApi.getAll(params).then(r => r.data),
  });
}

export function useFixedAsset(id: number) {
  return useQuery({
    queryKey: ['fixed-assets', id],
    queryFn: () => fixedAssetsApi.getById(id).then(r => r.data.data),
    enabled: !!id,
  });
}

export function useCreateFixedAsset() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<FixedAsset>) => fixedAssetsApi.create(data).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['fixed-assets'] }),
  });
}

export function useUpdateFixedAsset() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<FixedAsset> }) =>
      fixedAssetsApi.update(id, data).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['fixed-assets'] }),
  });
}

export function useDeleteFixedAsset() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => fixedAssetsApi.delete(id).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['fixed-assets'] }),
  });
}

export function useDepreciateAssets() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => fixedAssetsApi.depreciate().then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['fixed-assets'] }),
  });
}

export function useAssetSummary() {
  return useQuery({
    queryKey: ['fixed-assets', 'summary'],
    queryFn: () => fixedAssetsApi.summary().then(r => r.data.data),
  });
}

// ========== Financial Reports ==========
export function useReceivableAging(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: ['reports', 'receivable-aging', params],
    queryFn: () => financialReportsApi.receivableAging(params).then(r => r.data.data),
  });
}

export function useClientStatement(params: Record<string, unknown>) {
  return useQuery({
    queryKey: ['reports', 'client-statement', params],
    queryFn: () => financialReportsApi.clientStatement(params).then(r => r.data.data),
    enabled: !!params?.client_id,
  });
}

export function useBalanceSheet(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: ['reports', 'balance-sheet', params],
    queryFn: () => financialReportsApi.balanceSheet(params).then(r => r.data.data),
  });
}

export function useFinancialKpis(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: ['reports', 'financial-kpis', params],
    queryFn: () => financialReportsApi.financialKpis(params).then(r => r.data.data),
  });
}
