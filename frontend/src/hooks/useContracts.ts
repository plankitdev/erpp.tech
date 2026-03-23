import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { contractsApi } from '../api/contracts';
import type { Contract } from '../types';

export function useContracts(params?: Record<string, unknown>, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ['contracts', params],
    queryFn: () => contractsApi.getAll(params).then(r => r.data),
    enabled: options?.enabled,
  });
}

export function useClientContracts(clientId: number, params?: Record<string, unknown>) {
  return useQuery({
    queryKey: ['clients', clientId, 'contracts', params],
    queryFn: () => contractsApi.getByClient(clientId, params).then(r => r.data),
    enabled: !!clientId,
  });
}

export function useContract(id: number) {
  return useQuery({
    queryKey: ['contracts', id],
    queryFn: () => contractsApi.getById(id).then(r => r.data.data),
    enabled: !!id,
  });
}

export function useCreateContract() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ clientId, data }: { clientId: number; data: Partial<Contract> }) =>
      contractsApi.create(clientId, data).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['contracts'] });
      qc.invalidateQueries({ queryKey: ['clients'] });
    },
  });
}

export function useUpdateContract() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Contract> }) =>
      contractsApi.update(id, data).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['contracts'] }),
  });
}

export function useDeleteContract() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => contractsApi.delete(id).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['contracts'] }),
  });
}
