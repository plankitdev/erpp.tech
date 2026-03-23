import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { chatApi } from '../api/chat';
import toast from 'react-hot-toast';

export function useChatChannels() {
  return useQuery({ queryKey: ['chat-channels'], queryFn: chatApi.getChannels, refetchInterval: 10000, staleTime: 0, refetchIntervalInBackground: true, refetchOnWindowFocus: true });
}

export function useChatMessages(channelId: number | null) {
  return useQuery({
    queryKey: ['chat-messages', channelId],
    queryFn: () => chatApi.getMessages(channelId!),
    enabled: !!channelId,
    refetchInterval: 3000,
    staleTime: 0,
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: true,
  });
}

export function useChatUsers() {
  return useQuery({ queryKey: ['chat-users'], queryFn: chatApi.getUsers });
}

export function useCreateChannel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: chatApi.createChannel,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['chat-channels'] }); toast.success('تم إنشاء القناة'); },
    onError: () => toast.error('فشل إنشاء القناة'),
  });
}

export function useSendMessage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ channelId, data }: { channelId: number; data: FormData }) => chatApi.sendMessage(channelId, data),
    onSuccess: (_, vars) => { qc.invalidateQueries({ queryKey: ['chat-messages', vars.channelId] }); qc.invalidateQueries({ queryKey: ['chat-channels'] }); qc.invalidateQueries({ queryKey: ['chat-unread'] }); },
    onError: () => toast.error('فشل إرسال الرسالة'),
  });
}

export function useDeleteMessage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ channelId, messageId }: { channelId: number; messageId: number }) => chatApi.deleteMessage(channelId, messageId),
    onSuccess: (_, vars) => { qc.invalidateQueries({ queryKey: ['chat-messages', vars.channelId] }); },
    onError: () => toast.error('فشل حذف الرسالة'),
  });
}

export function useDeleteChannel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: chatApi.deleteChannel,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['chat-channels'] }); toast.success('تم حذف القناة'); },
    onError: () => toast.error('فشل حذف القناة'),
  });
}

export function useMarkRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: chatApi.markRead,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['chat-channels'] }); qc.invalidateQueries({ queryKey: ['chat-unread'] }); },
  });
}

export function useChatUnreadCount() {
  return useQuery({ queryKey: ['chat-unread'], queryFn: chatApi.getTotalUnread, refetchInterval: 15000 });
}

export function useAddMembers() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ channelId, memberIds }: { channelId: number; memberIds: number[] }) => chatApi.addMembers(channelId, memberIds),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['chat-channels'] }); toast.success('تم إضافة الأعضاء'); },
    onError: () => toast.error('فشل إضافة الأعضاء'),
  });
}

export function useRemoveMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ channelId, userId }: { channelId: number; userId: number }) => chatApi.removeMember(channelId, userId),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['chat-channels'] }); toast.success('تم إزالة العضو'); },
    onError: () => toast.error('فشل إزالة العضو'),
  });
}
