import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { clientsApi } from '../api/clients';
import type { Client } from '../types';

export function useClients(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: ['clients', params],
    queryFn: () => clientsApi.getAll(params).then(r => r.data),
  });
}

export function useClient(slug: string) {
  return useQuery({
    queryKey: ['clients', slug],
    queryFn: () => clientsApi.getBySlug(slug).then(r => r.data.data),
    enabled: !!slug,
  });
}

export function useCreateClient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Client>) => clientsApi.create(data).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['clients'] }),
  });
}

export function useUpdateClient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ slug, data }: { slug: string; data: Partial<Client> }) =>
      clientsApi.update(slug, data).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['clients'] }),
  });
}

export function useDeleteClient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (slug: string) => clientsApi.delete(slug).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['clients'] }),
  });
}

export function useBatchDeleteClients() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (ids: number[]) => clientsApi.batchDelete(ids).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['clients'] }),
  });
}

export function useFinancialSummary(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: ['clients', 'financial-summary', params],
    queryFn: () => clientsApi.getFinancialSummary(params).then(r => r.data.data),
  });
}
