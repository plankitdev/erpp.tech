import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { checklistsApi } from '../api/checklists';
import type { TaskChecklist } from '../types';

export function useChecklists(taskId: number) {
  return useQuery({
    queryKey: ['checklists', taskId],
    queryFn: () => checklistsApi.getAll(taskId).then(r => r.data.data),
    enabled: !!taskId,
  });
}

export function useCreateChecklist() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ taskId, title }: { taskId: number; title: string }) =>
      checklistsApi.create(taskId, { title }).then(r => r.data),
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ['checklists', vars.taskId] });
      qc.invalidateQueries({ queryKey: ['tasks', vars.taskId] });
    },
  });
}

export function useUpdateChecklist() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ taskId, id, data }: { taskId: number; id: number; data: Partial<TaskChecklist> }) =>
      checklistsApi.update(taskId, id, data).then(r => r.data),
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ['checklists', vars.taskId] });
      qc.invalidateQueries({ queryKey: ['tasks', vars.taskId] });
    },
  });
}

export function useDeleteChecklist() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ taskId, id }: { taskId: number; id: number }) =>
      checklistsApi.delete(taskId, id).then(r => r.data),
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ['checklists', vars.taskId] });
      qc.invalidateQueries({ queryKey: ['tasks', vars.taskId] });
    },
  });
}
