import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { workflowsApi } from '../api/workflows';
import { WorkflowRule } from '../types';
import toast from 'react-hot-toast';

export function useWorkflows(params?: Record<string, string | number | boolean>) {
  return useQuery({
    queryKey: ['workflows', params],
    queryFn: () => workflowsApi.getAll(params).then(r => r.data),
  });
}

export function useWorkflowDetail(id: number | null) {
  return useQuery({
    queryKey: ['workflow', id],
    queryFn: () => workflowsApi.getById(id!).then(r => r.data.data),
    enabled: !!id,
  });
}

export function useCreateWorkflow() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<WorkflowRule>) => workflowsApi.create(data).then(r => r.data),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['workflows'] });
      toast.success(res.message);
    },
    onError: () => toast.error('فشل في إنشاء القاعدة'),
  });
}

export function useUpdateWorkflow() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<WorkflowRule> }) =>
      workflowsApi.update(id, data).then(r => r.data),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['workflows'] });
      toast.success(res.message);
    },
    onError: () => toast.error('فشل في تحديث القاعدة'),
  });
}

export function useDeleteWorkflow() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => workflowsApi.delete(id).then(r => r.data),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['workflows'] });
      toast.success(res.message);
    },
    onError: () => toast.error('فشل في حذف القاعدة'),
  });
}

export function useToggleWorkflow() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => workflowsApi.toggle(id).then(r => r.data),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['workflows'] });
      toast.success(res.message);
    },
    onError: () => toast.error('فشل في تغيير حالة القاعدة'),
  });
}

export function useWorkflowLogs(params?: Record<string, string | number>) {
  return useQuery({
    queryKey: ['workflow-logs', params],
    queryFn: () => workflowsApi.getLogs(params).then(r => r.data),
  });
}

export function useWorkflowTemplates() {
  return useQuery({
    queryKey: ['workflow-templates'],
    queryFn: () => workflowsApi.getTemplates().then(r => r.data.data),
  });
}
