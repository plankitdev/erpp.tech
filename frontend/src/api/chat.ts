import api from './axios';
import type { ApiResponse, PaginatedResponse, ChatChannel, ChatMessage, ChatUser } from '../types';

export const chatApi = {
  getChannels: () =>
    api.get<ApiResponse<ChatChannel[]>>('/chat/channels').then(r => r.data.data),

  createChannel: (data: { name: string; type: string; description?: string; member_ids: number[] }) =>
    api.post<ApiResponse<ChatChannel>>('/chat/channels', data).then(r => r.data.data),

  updateChannel: (id: number, data: { name: string; description?: string }) =>
    api.put<ApiResponse<ChatChannel>>(`/chat/channels/${id}`, data).then(r => r.data.data),

  deleteChannel: (id: number) =>
    api.delete<ApiResponse<null>>(`/chat/channels/${id}`).then(r => r.data),

  addMembers: (channelId: number, member_ids: number[]) =>
    api.post<ApiResponse<ChatChannel>>(`/chat/channels/${channelId}/members`, { member_ids }).then(r => r.data.data),

  removeMember: (channelId: number, userId: number) =>
    api.delete<ApiResponse<null>>(`/chat/channels/${channelId}/members/${userId}`).then(r => r.data),

  getMessages: (channelId: number, page = 1) =>
    api.get<PaginatedResponse<ChatMessage>>(`/chat/channels/${channelId}/messages?page=${page}`).then(r => r.data),

  sendMessage: (channelId: number, data: FormData) =>
    api.post<ApiResponse<ChatMessage>>(`/chat/channels/${channelId}/messages`, data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then(r => r.data.data),

  deleteMessage: (channelId: number, messageId: number) =>
    api.delete<ApiResponse<null>>(`/chat/channels/${channelId}/messages/${messageId}`).then(r => r.data),

  toggleReaction: (channelId: number, messageId: number, emoji: string) =>
    api.post<ApiResponse<any>>(`/chat/channels/${channelId}/messages/${messageId}/reactions`, { emoji }).then(r => r.data.data),

  markRead: (channelId: number) =>
    api.post<ApiResponse<null>>(`/chat/channels/${channelId}/read`).then(r => r.data),

  getUsers: () =>
    api.get<ApiResponse<ChatUser[]>>('/chat/users').then(r => r.data.data),

  getTotalUnread: () =>
    api.get<ApiResponse<{ count: number }>>('/chat/unread-count').then(r => r.data.data.count),
};
