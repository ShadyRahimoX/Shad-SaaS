import { adminApi } from './api';

export type DebtTransactionType =
  | 'debt_increase'
  | 'debt_decrease'
  | 'debt_cleared'
  | 'adjustment';

export interface DebtUser {
  id: string;
  displayId: number;
  username: string;
  email: string;
  phone: string | null;
  avatarUrl: string | null;
  debtUsd: string;
  creditEnabled: boolean;
  creditLimit: string;
  banned: boolean;
  createdAt: string;
  availableCreditUsd: string;
  debtRatio: number;
}

export interface DebtTransaction {
  id: string;
  userId: string;
  amountUsd: string;
  balanceBefore: string;
  balanceAfter: string;
  type: DebtTransactionType;
  reason: string | null;
  adminId: string | null;
  description: string | null;
  createdAt: string;
}

export interface DebtsStats {
  totalUsersWithDebt: number;
  totalDebtUsd: string;
  creditEnabledUsers: number;
  totalCreditLimitUsd: string;
  availableCreditUsd: string;
  debtsLast7Days: number;
  clearedLast30Days: number;
}

export interface DebtsListResponse {
  users: DebtUser[];
  total: number;
  page: number;
  limit: number;
}

export interface DebtDetailResponse {
  user: DebtUser & {
    // extra fields from user row
    [key: string]: any;
  };
  recentTransactions: DebtTransaction[];
  summary: {
    totalIncrease: string;
    totalPaid: string;
    transactionCount: number;
  };
}

export interface DebtHistoryResponse {
  transactions: DebtTransaction[];
  total: number;
  page: number;
  limit: number;
}

export type DebtStatusFilter = 'all' | 'with-debt' | 'credit-enabled' | 'over-limit';
export type DebtSortBy = 'debt-desc' | 'newest' | 'credit-desc';

export interface DebtAdjustInput {
  amount: number;
  type: DebtTransactionType;
  reason?: string;
  note: string;
}

export const adminDebtsApi = {
  getStats: () => adminApi.get<DebtsStats>('/api/admin/debts/stats'),
  list: (params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: DebtStatusFilter;
    sortBy?: DebtSortBy;
  }) => {
    const q = new URLSearchParams();
    if (params?.page) q.set('page', String(params.page));
    if (params?.limit) q.set('limit', String(params.limit));
    if (params?.search) q.set('search', params.search);
    if (params?.status && params.status !== 'all') q.set('status', params.status);
    if (params?.sortBy) q.set('sortBy', params.sortBy);
    const qs = q.toString();
    return adminApi.get<DebtsListResponse>(`/api/admin/debts${qs ? `?${qs}` : ''}`);
  },
  get: (userId: string) => adminApi.get<DebtDetailResponse>(`/api/admin/debts/${userId}`),
  adjust: (userId: string, data: DebtAdjustInput) =>
    adminApi.post<{ user: any; transaction: DebtTransaction }>(
      `/api/admin/debts/${userId}/adjust`,
      data
    ),
  getHistory: (userId: string, params?: { page?: number; limit?: number; type?: string }) => {
    const q = new URLSearchParams();
    if (params?.page) q.set('page', String(params.page));
    if (params?.limit) q.set('limit', String(params.limit));
    if (params?.type) q.set('type', params.type);
    const qs = q.toString();
    return adminApi.get<DebtHistoryResponse>(
      `/api/admin/debts/${userId}/history${qs ? `?${qs}` : ''}`
    );
  },
};
