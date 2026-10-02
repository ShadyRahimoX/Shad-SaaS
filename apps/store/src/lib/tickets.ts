import { api } from './api';

export interface Ticket {
  id: string;
  userId: string;
  subject: string;
  category: 'billing' | 'technical' | 'feature_request' | 'other';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  status: 'open' | 'in_progress' | 'awaiting_user' | 'resolved' | 'closed';
  assignedTo: string | null;
  lastMessageAt: string | null;
  unreadAdminCount: number;
  unreadUserCount: number;
  createdAt: string;
  updatedAt: string;
  lastMessagePreview?: string | null;
}

export interface TicketMessage {
  id: string;
  ticketId: string;
  senderId: string;
  senderRole: 'user' | 'admin';
  body: string;
  messageUuid: string;
  readAt: string | null;
  createdAt: string;
}

export interface TicketsListResponse {
  tickets: Ticket[];
  total: number;
  page: number;
  limit: number;
}

export interface TicketDetailResponse {
  ticket: Ticket;
  lastMessage: TicketMessage | null;
}

export interface TicketMessagesResponse {
  messages: TicketMessage[];
  total: number;
  page: number;
  limit: number;
}

export const ticketsApi = {
  list: (params?: { page?: number; limit?: number; status?: string }) => {
    const q = new URLSearchParams();
    if (params?.page) q.set('page', String(params.page));
    if (params?.limit) q.set('limit', String(params.limit));
    if (params?.status && params.status !== 'all') q.set('status', params.status);
    const qs = q.toString();
    return api.get<TicketsListResponse>(`/api/me/tickets${qs ? `?${qs}` : ''}`);
  },
  create: (payload: { subject: string; category: string; priority: string }) =>
    api.post<Ticket>('/api/me/tickets', payload),
  get: (id: string) => api.get<TicketDetailResponse>(`/api/me/tickets/${id}`),
  getMessages: (id: string, params?: { page?: number; limit?: number }) => {
    const q = new URLSearchParams();
    if (params?.page) q.set('page', String(params.page));
    if (params?.limit) q.set('limit', String(params.limit));
    const qs = q.toString();
    return api.get<TicketMessagesResponse>(`/api/me/tickets/${id}/messages${qs ? `?${qs}` : ''}`);
  },
  send: (id: string, body: string, messageUuid: string) =>
    api.post<{ message: TicketMessage; ticket: Ticket }>(`/api/me/tickets/${id}/messages`, {
      body,
      messageUuid,
    }),
  markRead: (id: string) => api.post<{ markedCount: number }>(`/api/me/tickets/${id}/read`),
  close: (id: string) => api.post<Ticket>(`/api/me/tickets/${id}/close`),
};
