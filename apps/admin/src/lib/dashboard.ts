import { adminApi, type ApiResponse } from './api';

export interface DashboardStats {
  orders: { total: number | null; pending: number | null };
  users: { total: number | null };
  products: { total: number };
  tickets: { open: number | null; total: number | null };
  balance: { totalUsd: number | null };
}

export const dashboardApi = {
  // Fetch partial stats from available endpoints
  getStats: async (): Promise<DashboardStats> => {
    const [productsRes, ticketsRes] = await Promise.all([
      fetch('/api/public/products?limit=1')
        .then((r) => r.json())
        .catch(() => ({ success: false, data: null })),
      adminApi
        .get<any>('/api/admin/tickets?limit=1')
        .catch(() => ({ success: false, data: null } as ApiResponse<any>)),
    ]);

    return {
      orders: { total: null, pending: null },
      users: { total: null },
      products: { total: productsRes?.data?.total ?? 0 },
      tickets: {
        total: (ticketsRes as ApiResponse<any>)?.data?.total ?? null,
        open: null,
      },
      balance: { totalUsd: null },
    };
  },
  getMaintenanceMode: async (): Promise<boolean> => {
    const res = await adminApi.get<{ key: string; value: any }>(
      '/api/admin/settings/maintenance_mode'
    );
    if (res.success && res.data) {
      return Boolean(res.data.value);
    }
    return false;
  },
  setMaintenanceMode: async (value: boolean) => {
    return adminApi.patch('/api/admin/settings/maintenance_mode', { value });
  },
};
