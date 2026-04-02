import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { personalTodosApi } from '../api/personalTodos';
import type { PersonalTodo } from '../types';

export function usePersonalTodos() {
  return useQuery({
    queryKey: ['personal-todos'],
    queryFn: () => personalTodosApi.getAll().then(r => r.data.data),
  });
}

export function useCreateTodo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { title: string; due_date?: string }) =>
      personalTodosApi.create(data).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['personal-todos'] }),
  });
}

export function useUpdateTodo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<PersonalTodo> }) =>
      personalTodosApi.update(id, data).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['personal-todos'] }),
  });
}

export function useDeleteTodo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => personalTodosApi.delete(id).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['personal-todos'] }),
  });
}

export function useReorderTodos() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (ids: number[]) => personalTodosApi.reorder(ids).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['personal-todos'] }),
  });
}
