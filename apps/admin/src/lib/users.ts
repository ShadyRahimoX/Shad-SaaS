import { adminApi } from './api';

export interface AdminUser {
  id: string;
  displayId: number;
  username: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  country: string | null;
  avatarUrl: string | null;
  banned: boolean;
  balanceUsd: string;
  totalSpentUsd: string;
  cashbackBalanceUsd: string;
  referralBalanceUsd: string;
  vipLevelId: string | null;
  vipName: string;
  vipColor: string;
  referralCode: string | null;
  referredBy?: string | null;
  emailVerified?: boolean;
  googleId?: string | null;
  ordersCount: number;
  createdAt: string;
  updatedAt?: string;
  lastLoginAt: string | null;
  creditEnabled?: boolean;
  creditLimit?: string;
  debtUsd?: string;
  availableCreditUsd?: string;
}

export interface UsersStats {
  total: number;
  banned: number;
  withBalance: number;
  totalBalance: string;
  newLastWeek: number;
  vipDistribution: Record<string, number>;
}

export interface UsersListResponse {
  users: AdminUser[];
  total: number;
  page: number;
  limit: number;
}

export interface UserTransaction {
  id: string;
  userId: string;
  type: string;
  amountUsd: string;
  balanceBefore: string;
  balanceAfter: string;
  referenceType: string | null;
  referenceId: string | null;
  description: string | null;
  createdAt: string;
}

export interface UserTransactionsResponse {
  transactions: UserTransaction[];
  total: number;
  page: number;
  limit: number;
}

export type UserStatusFilter = 'all' | 'active' | 'banned';
export type UserHasBalanceFilter = 'all' | 'true' | 'false';
export type UserSortBy = 'newest' | 'balance-desc' | 'spent-desc' | 'name';

export interface UsersQuery {
  page?: number;
  limit?: number;
  search?: string;
  status?: UserStatusFilter;
  hasBalance?: UserHasBalanceFilter;
  sortBy?: UserSortBy;
}

export interface UserUpdateInput {
  banned?: boolean;
  firstName?: string | null;
  lastName?: string | null;
  phone?: string | null;
  country?: string | null;
  creditEnabled?: boolean;
  creditLimit?: string | number;
}

export type BalanceAdjustReason =
  | 'manual_credit'
  | 'manual_debit'
  | 'bonus'
  | 'refund'
  | 'correction';

export interface BalanceAdjustInput {
  amount: number;
  reason: BalanceAdjustReason;
  note: string;
}

export const adminUsersApi = {
  getStats: () => adminApi.get<UsersStats>('/api/admin/users/stats'),
  list: (params?: UsersQuery) => {
    const q = new URLSearchParams();
    if (params?.page) q.set('page', String(params.page));
    if (params?.limit) q.set('limit', String(params.limit));
    if (params?.search) q.set('search', params.search);
    if (params?.status && params.status !== 'all') q.set('status', params.status);
    if (params?.hasBalance && params.hasBalance !== 'all') q.set('hasBalance', params.hasBalance);
    if (params?.sortBy) q.set('sortBy', params.sortBy);
    const qs = q.toString();
    return adminApi.get<UsersListResponse>(`/api/admin/users${qs ? `?${qs}` : ''}`);
  },
  get: (id: string) => adminApi.get<AdminUser>(`/api/admin/users/${id}`),
  update: (id: string, data: UserUpdateInput) =>
    adminApi.patch<AdminUser>(`/api/admin/users/${id}`, data),
  getTransactions: (id: string, params?: { page?: number; limit?: number }) => {
    const q = new URLSearchParams();
    if (params?.page) q.set('page', String(params.page));
    if (params?.limit) q.set('limit', String(params.limit));
    const qs = q.toString();
    return adminApi.get<UserTransactionsResponse>(
      `/api/admin/users/${id}/transactions${qs ? `?${qs}` : ''}`
    );
  },
  updateBalance: (id: string, data: BalanceAdjustInput) =>
    adminApi.post<{ user: AdminUser; transaction: UserTransaction }>(
      `/api/admin/users/${id}/balance`,
      data
    ),
};
