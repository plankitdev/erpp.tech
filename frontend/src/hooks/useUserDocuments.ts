import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userDocumentsApi } from '../api/userDocuments';

export function useUserDocuments(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: ['user-documents', params],
    queryFn: () => userDocumentsApi.getAll(params).then(r => r.data),
  });
}

export function useUserDocument(id: number) {
  return useQuery({
    queryKey: ['user-documents', id],
    queryFn: () => userDocumentsApi.getOne(id).then(r => r.data),
    enabled: !!id,
  });
}

export function useUpdateUserDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Record<string, unknown> }) =>
      userDocumentsApi.update(id, data).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['user-documents'] }),
  });
}

export function useUpdateDocumentStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      userDocumentsApi.updateStatus(id, status).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['user-documents'] }),
  });
}

export function useSaveToDrive() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => userDocumentsApi.saveToDrive(id).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['user-documents'] }),
  });
}

export function useDeleteUserDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => userDocumentsApi.delete(id).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['user-documents'] }),
  });
}
