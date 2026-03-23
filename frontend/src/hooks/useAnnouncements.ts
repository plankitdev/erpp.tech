import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { announcementsApi, type Announcement } from '../api/announcements';

export function useAnnouncements(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: ['announcements', params],
    queryFn: () => announcementsApi.getAll(params).then(r => r.data),
  });
}

export function useCreateAnnouncement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Announcement>) => announcementsApi.create(data).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['announcements'] }),
  });
}

export function useUpdateAnnouncement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Announcement> }) =>
      announcementsApi.update(id, data).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['announcements'] }),
  });
}

export function useDeleteAnnouncement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => announcementsApi.delete(id).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['announcements'] }),
  });
}
