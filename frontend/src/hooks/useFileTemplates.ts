import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fileTemplatesApi } from '../api/fileTemplates';

export function useFileTemplates(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: ['file-templates', params],
    queryFn: () => fileTemplatesApi.getAll(params).then(r => r.data),
  });
}

export function useCreateFileTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: FormData) => fileTemplatesApi.create(data).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['file-templates'] }),
  });
}

export function useDeleteFileTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => fileTemplatesApi.delete(id).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['file-templates'] }),
  });
}
