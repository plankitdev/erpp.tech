import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { timeEntriesApi } from '../api/timeEntries';
import type { TimeEntry } from '../types';

export function useTimeEntries(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: ['time-entries', params],
    queryFn: () => timeEntriesApi.getAll(params).then(r => r.data),
  });
}

export function useRunningTimer() {
  return useQuery({
    queryKey: ['time-entries', 'running'],
    queryFn: () => timeEntriesApi.running().then(r => r.data.data),
    refetchInterval: 30000,
  });
}

export function useStartTimer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (taskId: number) => timeEntriesApi.start(taskId).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['time-entries'] });
    },
  });
}

export function useStopTimer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => timeEntriesApi.stop(id).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['time-entries'] });
    },
  });
}

export function useCreateTimeEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Parameters<typeof timeEntriesApi.create>[0]) =>
      timeEntriesApi.create(data).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['time-entries'] }),
  });
}

export function useDeleteTimeEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => timeEntriesApi.delete(id).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['time-entries'] }),
  });
}

export function useTimeSummary(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: ['time-entries', 'summary', params],
    queryFn: () => timeEntriesApi.summary(params).then(r => r.data.data),
  });
}
