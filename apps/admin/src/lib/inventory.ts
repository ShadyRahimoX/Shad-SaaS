import { adminApi } from './api';

export type StockStatus = 'unlimited' | 'out' | 'low' | 'ok';

export interface InventoryItem {
  id: string;
  name: string;
  imageUrl: string | null;
  categoryId: string | null;
  categoryName: string | null;
  alkasrProductId: number | null;
  stock: number | null;
  available: boolean;
  priceUsd: string;
  ordersCount: number;
  stockStatus: StockStatus;
}

export interface InventoryStats {
  total: number;
  tracked: number;
  unlimited: number;
  lowStock: number;
  outOfStock: number;
}

export interface InventoryListResponse {
  products: InventoryItem[];
  total: number;
  page: number;
  limit: number;
}

export type InventoryFilter = 'all' | 'tracked' | 'unlimited' | 'low' | 'out';

export const adminInventoryApi = {
  getStats: () => adminApi.get<InventoryStats>('/api/admin/inventory/stats'),
  list: (params?: {
    page?: number;
    limit?: number;
    filter?: InventoryFilter;
    categoryId?: string;
    search?: string;
  }) => {
    const q = new URLSearchParams();
    if (params?.page) q.set('page', String(params.page));
    if (params?.limit) q.set('limit', String(params.limit));
    if (params?.filter && params.filter !== 'all') q.set('filter', params.filter);
    if (params?.categoryId) q.set('categoryId', params.categoryId);
    if (params?.search) q.set('search', params.search);
    const qs = q.toString();
    return adminApi.get<InventoryListResponse>(`/api/admin/inventory${qs ? `?${qs}` : ''}`);
  },
  setStock: (productId: string, stock: number | null, note?: string) =>
    adminApi.patch(`/api/admin/products/${productId}/stock`, { stock, note }),
};
