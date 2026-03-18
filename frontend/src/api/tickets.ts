import api from './axios';

export interface TicketReply {
  id: number;
  body: string;
  is_internal: boolean;
  user: { id: number; name: string };
  created_at: string;
}

export interface Ticket {
  id: number;
  reference: string;
  subject: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'in_progress' | 'waiting' | 'resolved' | 'closed';
  category: 'bug' | 'feature' | 'support' | 'inquiry' | 'other';
  client?: { id: number; name: string } | null;
  project?: { id: number; name: string } | null;
  creator?: { id: number; name: string };
  assignee?: { id: number; name: string } | null;
  replies_count?: number;
  replies?: TicketReply[];
  resolved_at: string | null;
  closed_at: string | null;
  created_at: string;
  updated_at: string;
}

export const ticketsApi = {
  getAll: (params?: Record<string, string | number>) =>
    api.get('/tickets', { params }).then(r => r.data),

  getById: (id: number) =>
    api.get(`/tickets/${id}`).then(r => r.data),

  create: (data: Partial<Ticket>) =>
    api.post('/tickets', data).then(r => r.data),

  update: (id: number, data: Partial<Ticket>) =>
    api.put(`/tickets/${id}`, data).then(r => r.data),

  delete: (id: number) =>
    api.delete(`/tickets/${id}`).then(r => r.data),

  reply: (ticketId: number, data: { body: string; is_internal?: boolean }) =>
    api.post(`/tickets/${ticketId}/replies`, data).then(r => r.data),
};
