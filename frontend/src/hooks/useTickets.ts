import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ticketsApi } from '../api/tickets';
import toast from 'react-hot-toast';

export function useTickets(params?: Record<string, string | number>) {
  return useQuery({
    queryKey: ['tickets', params],
    queryFn: () => ticketsApi.getAll(params),
  });
}

export function useTicket(id: number) {
  return useQuery({
    queryKey: ['tickets', id],
    queryFn: () => ticketsApi.getById(id),
    enabled: !!id,
  });
}

export function useCreateTicket() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ticketsApi.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tickets'] });
      toast.success('تم إنشاء التذكرة بنجاح');
    },
    onError: () => toast.error('فشل إنشاء التذكرة'),
  });
}

export function useUpdateTicket() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Record<string, unknown> }) =>
      ticketsApi.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tickets'] });
      toast.success('تم تحديث التذكرة');
    },
    onError: () => toast.error('فشل تحديث التذكرة'),
  });
}

export function useDeleteTicket() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ticketsApi.delete,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tickets'] });
      toast.success('تم حذف التذكرة');
    },
    onError: () => toast.error('فشل حذف التذكرة'),
  });
}

export function useTicketReply() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ ticketId, data }: { ticketId: number; data: { body: string; is_internal?: boolean } }) =>
      ticketsApi.reply(ticketId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tickets'] });
      toast.success('تم إضافة الرد');
    },
    onError: () => toast.error('فشل إضافة الرد'),
  });
}
