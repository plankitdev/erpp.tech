import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { quotationsApi } from '../api/quotations';
import type { Quotation } from '../api/quotations';

export function useQuotations(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: ['quotations', params],
    queryFn: () => quotationsApi.getAll(params).then(r => r.data),
  });
}

export function useQuotation(id: number) {
  return useQuery({
    queryKey: ['quotations', id],
    queryFn: () => quotationsApi.get(id).then(r => r.data.data),
    enabled: !!id,
  });
}

export function useCreateQuotation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Quotation>) => quotationsApi.create(data).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['quotations'] }),
  });
}

export function useUpdateQuotation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Quotation> }) => quotationsApi.update(id, data).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['quotations'] }),
  });
}

export function useDeleteQuotation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => quotationsApi.delete(id).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['quotations'] }),
  });
}
