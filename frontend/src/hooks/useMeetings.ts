import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { meetingsApi } from '../api/meetings';
import type { Meeting } from '../types';

export function useMeetings(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: ['meetings', params],
    queryFn: () => meetingsApi.getAll(params).then(r => r.data),
  });
}

export function useMeeting(id: number) {
  return useQuery({
    queryKey: ['meetings', id],
    queryFn: () => meetingsApi.getById(id).then(r => r.data.data),
    enabled: !!id,
  });
}

export function useCreateMeeting() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Meeting>) => meetingsApi.create(data).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['meetings'] });
      qc.invalidateQueries({ queryKey: ['calendar'] });
    },
  });
}

export function useUpdateMeeting() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Meeting> }) =>
      meetingsApi.update(id, data).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['meetings'] });
      qc.invalidateQueries({ queryKey: ['calendar'] });
    },
  });
}

export function useDeleteMeeting() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => meetingsApi.delete(id).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['meetings'] });
      qc.invalidateQueries({ queryKey: ['calendar'] });
    },
  });
}

export function useRespondMeeting() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: number; status: 'accepted' | 'declined' }) =>
      meetingsApi.respond(id, status).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['meetings'] }),
  });
}
