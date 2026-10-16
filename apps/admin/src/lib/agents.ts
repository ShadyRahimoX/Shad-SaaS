import { adminApi } from './api';

export interface AdminAgent {
  id: string;
  userId: string | null;
  username: string | null;
  name: string;
  phone: string | null;
  address: string | null;
  callSign: string | null;
  commissionPercent: string;
  active: boolean;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AgentsStats {
  total: number;
  active: number;
  inactive: number;
  linkedToUsers: number;
  avgCommissionPercent: string;
  newLast30Days: number;
}

export interface AgentsListResponse {
  agents: AdminAgent[];
  total: number;
  page: number;
  limit: number;
}

export type AgentStatusFilter = 'all' | 'active' | 'inactive';
export type AgentSortBy = 'newest' | 'name' | 'commission-desc';

export interface AgentsQuery {
  page?: number;
  limit?: number;
  search?: string;
  status?: AgentStatusFilter;
  sortBy?: AgentSortBy;
}

export interface CreateAgentInput {
  name: string;
  phone?: string | null;
  address?: string | null;
  callSign?: string | null;
  commissionPercent?: string | number;
  active?: boolean;
  notes?: string | null;
  userId?: string | null;
}

export type UpdateAgentInput = Partial<CreateAgentInput>;

export const adminAgentsApi = {
  getStats: () => adminApi.get<AgentsStats>('/api/admin/agents/stats'),
  list: (params?: AgentsQuery) => {
    const q = new URLSearchParams();
    if (params?.page) q.set('page', String(params.page));
    if (params?.limit) q.set('limit', String(params.limit));
    if (params?.search) q.set('search', params.search);
    if (params?.status && params.status !== 'all') q.set('status', params.status);
    if (params?.sortBy) q.set('sortBy', params.sortBy);
    const qs = q.toString();
    return adminApi.get<AgentsListResponse>(`/api/admin/agents${qs ? `?${qs}` : ''}`);
  },
  get: (id: string) => adminApi.get<AdminAgent>(`/api/admin/agents/${id}`),
  create: (data: CreateAgentInput) => adminApi.post<AdminAgent>('/api/admin/agents', data),
  update: (id: string, data: UpdateAgentInput) =>
    adminApi.patch<AdminAgent>(`/api/admin/agents/${id}`, data),
  remove: (id: string) =>
    adminApi.del<{ deleted: boolean; id: string }>(`/api/admin/agents/${id}`),
};
