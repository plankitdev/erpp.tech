import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { installmentApi } from '../api/installments';

export function useInstallments(contractId: number) {
  return useQuery({
    queryKey: ['installments', contractId],
    queryFn: () => installmentApi.getByContract(contractId).then(r => r.data),
    enabled: !!contractId,
  });
}

export function useGenerateInstallments() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (contractId: number) => installmentApi.generate(contractId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['installments'] }),
  });
}

export function useMarkInstallmentPaid() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data?: { paid_date?: string; notes?: string } }) =>
      installmentApi.markPaid(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['installments'] }),
  });
}
