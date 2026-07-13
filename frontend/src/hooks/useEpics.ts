import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { epicsApi } from '../api/epics';
import type { Epic } from '../types';

export function useEpics(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: ['epics', params],
    queryFn: () => epicsApi.getAll(params).then(r => r.data.data),
  });
}

export function useCreateEpic() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Epic>) => epicsApi.create(data).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['epics'] }),
  });
}

export function useUpdateEpic() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Epic> }) =>
      epicsApi.update(id, data).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['epics'] }),
  });
}

export function useDeleteEpic() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => epicsApi.delete(id).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['epics'] });
      qc.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
}
