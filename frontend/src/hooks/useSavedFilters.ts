import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { savedFiltersApi } from '../api/savedFilters';
import type { SavedFilter } from '../types';

export function useSavedFilters(scope: string) {
  return useQuery({
    queryKey: ['saved-filters', scope],
    queryFn: () => savedFiltersApi.getAll(scope).then(r => r.data.data),
  });
}

export function useCreateSavedFilter() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string; scope: string; criteria: Record<string, unknown>; is_shared?: boolean }) =>
      savedFiltersApi.create(data).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['saved-filters'] }),
  });
}

export function useDeleteSavedFilter() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => savedFiltersApi.delete(id).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['saved-filters'] }),
  });
}

export type { SavedFilter };
