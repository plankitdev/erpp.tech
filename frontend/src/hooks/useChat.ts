import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { chatApi } from '../api/chat';
import toast from 'react-hot-toast';

export function useChatChannels() {
  return useQuery({ queryKey: ['chat-channels'], queryFn: chatApi.getChannels, refetchInterval: 10000 });
}

export function useChatMessages(channelId: number | null) {
  return useQuery({
    queryKey: ['chat-messages', channelId],
    queryFn: () => chatApi.getMessages(channelId!),
    enabled: !!channelId,
    refetchInterval: 5000,
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
    onSuccess: (_, vars) => { qc.invalidateQueries({ queryKey: ['chat-messages', vars.channelId] }); qc.invalidateQueries({ queryKey: ['chat-channels'] }); },
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
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['chat-channels'] }); },
  });
}
