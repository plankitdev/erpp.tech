import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { leadsApi } from '../api/leads';
import type { Lead, LeadActivity } from '../types';

export function useLeads(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: ['leads', params],
    queryFn: () => leadsApi.getAll(params).then(r => r.data),
  });
}

export function useLead(id: number) {
  return useQuery({
    queryKey: ['leads', id],
    queryFn: () => leadsApi.getById(id).then(r => r.data.data),
    enabled: !!id,
  });
}

export function useCreateLead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Lead>) => leadsApi.create(data).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['leads'] }),
  });
}

export function useUpdateLead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: Partial<Lead> & { id: number }) =>
      leadsApi.update(id, data).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['leads'] }),
  });
}

export function useDeleteLead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => leadsApi.delete(id).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['leads'] }),
  });
}

export function useUpdateLeadStage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, stage, lost_reason }: { id: number; stage: string; lost_reason?: string }) =>
      leadsApi.updateStage(id, stage, lost_reason).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['leads'] }),
  });
}

export function useConvertLead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: number } & Record<string, unknown>) =>
      leadsApi.convertToClient(id, data).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['leads'] }),
  });
}

export function useLeadActivities(leadId: number) {
  return useQuery({
    queryKey: ['leads', leadId, 'activities'],
    queryFn: () => leadsApi.getActivities(leadId).then(r => r.data),
    enabled: !!leadId,
  });
}

export function useAddLeadActivity() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ leadId, ...data }: { leadId: number } & Partial<LeadActivity>) =>
      leadsApi.addActivity(leadId, data).then(r => r.data),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['leads', vars.leadId, 'activities'] });
      qc.invalidateQueries({ queryKey: ['leads'] });
    },
  });
}

export function useSalesDashboard() {
  return useQuery({
    queryKey: ['sales', 'dashboard'],
    queryFn: () => leadsApi.dashboard().then(r => r.data.data),
  });
}

export function useSalesReport(params?: { month?: number; year?: number }) {
  return useQuery({
    queryKey: ['sales', 'report', params],
    queryFn: () => leadsApi.report(params).then(r => r.data.data),
  });
}

export function useImportLeads() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => leadsApi.importLeads(file).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['leads'] }),
  });
}
