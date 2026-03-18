import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { partnersApi } from '../api/partners';
import type { Partner } from '../types';

export function usePartners(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: ['partners', params],
    queryFn: () => partnersApi.getAll(params).then(r => r.data),
  });
}

export function useCreatePartner() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Partner>) => partnersApi.create(data).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['partners'] }),
  });
}

export function useDeletePartner() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => partnersApi.delete(id).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['partners'] }),
  });
}

export function usePartnerProfits(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: ['partners', 'profits', params],
    queryFn: () => partnersApi.getProfits(params).then(r => r.data),
  });
}

export function useMonthlyProfit(month: number, year: number) {
  return useQuery({
    queryKey: ['partners', 'monthly-profit', month, year],
    queryFn: () => partnersApi.getMonthlyProfit({ month, year }).then(r => r.data),
  });
}

export function usePartnerStatement(partnerId: number, year: number) {
  return useQuery({
    queryKey: ['partners', partnerId, 'statement', year],
    queryFn: () => partnersApi.getStatement(partnerId, year).then(r => r.data),
    enabled: partnerId > 0,
  });
}

export function useRecordPartnerPayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ partnerId, data }: { partnerId: number; data: Record<string, unknown> }) =>
      partnersApi.recordPayment(partnerId, data).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['partners'] });
    },
  });
}

export function useDeletePartnerPayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ partnerId, paymentId }: { partnerId: number; paymentId: number }) =>
      partnersApi.deletePayment(partnerId, paymentId).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['partners'] });
    },
  });
}
