import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { templateLibraryApi } from '../api/templateLibrary';

export function useTemplateCategories() {
  return useQuery({
    queryKey: ['template-categories'],
    queryFn: () => templateLibraryApi.getCategories().then(r => r.data),
  });
}

export function useTemplates(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: ['templates', params],
    queryFn: () => templateLibraryApi.getAll(params).then(r => r.data),
  });
}

export function useTemplate(id: number) {
  return useQuery({
    queryKey: ['templates', id],
    queryFn: () => templateLibraryApi.getOne(id).then(r => r.data),
    enabled: !!id,
  });
}

export function useCreateTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => templateLibraryApi.create(data).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['templates'] }),
  });
}

export function useUpdateTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Record<string, unknown> }) =>
      templateLibraryApi.update(id, data).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['templates'] }),
  });
}

export function useDeleteTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => templateLibraryApi.delete(id).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['templates'] }),
  });
}

export function useUseTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => templateLibraryApi.useTemplate(id).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['templates'] });
      qc.invalidateQueries({ queryKey: ['user-documents'] });
    },
  });
}

export function useDuplicateTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => templateLibraryApi.duplicate(id).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['templates'] }),
  });
}

export function useCreateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string; color?: string; icon?: string }) =>
      templateLibraryApi.createCategory(data).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['template-categories'] }),
  });
}
