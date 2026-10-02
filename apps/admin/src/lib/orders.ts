import { adminApi } from './api';

export type OrderStatus = 'accept' | 'waiting' | 'pending' | 'reject' | 'cancelled';

export interface AdminOrder {
  id: string;
  orderUuid: string;
  displayId: number;
  userId: string;
  username: string;
  email: string;
  productId: string;
  productName: string;
  qty: number;
  playerId: string;
  priceUsd: string;
  costUsd: string;
  profitUsd: string;
  status: OrderStatus;
  providerOrderId: string | null;
  createdAt: string;
}

export interface AdminOrderDetail extends AdminOrder {
  phone: string | null;
  country: string | null;
  productType: string | null;
  extraFields: Record<string, any>;
  providerResponse: Record<string, any> | null;
  notes: string | null;
  updatedAt: string;
}

export interface OrdersListResponse {
  orders: AdminOrder[];
  total: number;
  page: number;
  limit: number;
}

export interface OrdersStats {
  total: number;
  accept: number;
  waiting: number;
  reject: number;
  cancelled: number;
  todayTotal: number;
  thisMonthTotal: number;
}

export const adminOrdersApi = {
  list: (params?: {
    page?: number;
    limit?: number;
    status?: string;
    search?: string;
    userId?: string;
  }) => {
    const q = new URLSearchParams();
    if (params?.page) q.set('page', String(params.page));
    if (params?.limit) q.set('limit', String(params.limit));
    if (params?.status && params.status !== 'all') q.set('status', params.status);
    if (params?.search) q.set('search', params.search);
    if (params?.userId) q.set('userId', params.userId);
    const qs = q.toString();
    return adminApi.get<OrdersListResponse>(`/api/admin/orders${qs ? `?${qs}` : ''}`);
  },
  getStats: () => adminApi.get<OrdersStats>('/api/admin/orders/stats'),
  get: (id: string) => adminApi.get<AdminOrderDetail>(`/api/admin/orders/${id}`),
};
