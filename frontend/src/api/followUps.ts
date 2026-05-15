import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from './index';

export const followUpsApi = {
  getAll: (params?: any) => api.get('/follow-ups', { params }),
  getSummary: () => api.get('/follow-ups/summary'),
  resolve: (id: number, note?: string) => api.post(`/follow-ups/${id}/resolve`, { note }),
  dismiss: (id: number, note?: string) => api.post(`/follow-ups/${id}/dismiss`, { note }),
  generate: () => api.post('/follow-ups/generate'),
};

export const useFollowUps = (params?: any) => {
  return useQuery({
    queryKey: ['followUps', params],
    queryFn: () => followUpsApi.getAll(params),
  });
};

export const useFollowUpSummary = () => {
  return useQuery({
    queryKey: ['followUpsSummary'],
    queryFn: () => followUpsApi.getSummary(),
  });
};

export const useResolveFollowUp = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, note }: { id: number; note?: string }) => followUpsApi.resolve(id, note),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['followUps'] });
      qc.invalidateQueries({ queryKey: ['followUpsSummary'] });
    },
  });
};

export const useDismissFollowUp = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, note }: { id: number; note?: string }) => followUpsApi.dismiss(id, note),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['followUps'] });
      qc.invalidateQueries({ queryKey: ['followUpsSummary'] });
    },
  });
};

export const useGenerateFollowUps = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => followUpsApi.generate(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['followUps'] });
      qc.invalidateQueries({ queryKey: ['followUpsSummary'] });
    },
  });
};
