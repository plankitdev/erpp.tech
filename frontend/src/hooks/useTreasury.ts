import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { treasuryApi } from '../api/treasury';
import type { TreasuryTransaction } from '../types';

export function useTreasury(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: ['treasury', params],
    queryFn: () => treasuryApi.getAll(params).then(r => r.data),
  });
}

export function useTreasuryTransaction(id: number) {
  return useQuery({
    queryKey: ['treasury', id],
    queryFn: () => treasuryApi.getById(id).then(r => r.data.data),
    enabled: !!id,
  });
}

export function useTreasuryBalance() {
  return useQuery({
    queryKey: ['treasury', 'balance'],
    queryFn: () => treasuryApi.getBalance().then(r => r.data.data),
  });
}

export function useCreateTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<TreasuryTransaction>) => treasuryApi.create(data).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['treasury'] }),
  });
}
