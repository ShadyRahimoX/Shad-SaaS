import { api, type ApiResponse } from './api';

export interface VipNextLevel {
  name: string;
  minSpendingUsd: number;
  remainingUsd: number;
  progressPercent: number;
}

export interface VipInfo {
  level: number;
  name: string;
  color: string;
  minSpendingUsd: number;
  centDiscountPercent: number;
  profitFloorPercent: number;
  cashbackPercent: number;
  nextLevel: VipNextLevel | null;
}

export interface VipLevel {
  level: number;
  name: string;
  minSpendingUsd: number;
  centDiscountPercent: number;
  profitFloorPercent: number;
  cashbackPercent: number;
  color: string;
  badgeUrl?: string | null;
}

export interface ReferralInfo {
  referralCode: string;
  referralLink: string;
  referralBalanceUsd: number;
  totalReferred: number;
  totalEarned: number;
  totalOrders: number;
}

export interface ReferralEntry {
  id: string;
  referredUserId: string;
  referredUsername: string;
  totalEarnedUsd: string;
  totalOrdersCount: number;
  createdAt: string;
}

export interface ReferralListResponse {
  referrals: ReferralEntry[];
  total: number;
  page: number;
  limit: number;
}

export interface ReferralCommission {
  id: string;
  orderId: string;
  orderAmountUsd: string;
  commissionPercent: string;
  commissionAmountUsd: string;
  createdAt: string;
}

export interface ReferralCommissionsResponse {
  commissions: ReferralCommission[];
  total: number;
  page: number;
  limit: number;
}

export const profileApi = {
  getVipInfo: () => api.get<VipInfo>('/api/me/vip'),
  getVipLevels: () => api.get<VipLevel[]>('/api/me/vip/levels'),
  getReferralInfo: () => api.get<ReferralInfo>('/api/me/referrals'),
  listReferrals: (params?: { page?: number; limit?: number }) => {
    const q = new URLSearchParams();
    if (params?.page) q.set('page', String(params.page));
    if (params?.limit) q.set('limit', String(params.limit));
    const qs = q.toString();
    return api.get<ReferralListResponse>(`/api/me/referrals/list${qs ? `?${qs}` : ''}`);
  },
  listCommissions: (referralId: string, params?: { page?: number; limit?: number }) => {
    const q = new URLSearchParams();
    if (params?.page) q.set('page', String(params.page));
    if (params?.limit) q.set('limit', String(params.limit));
    const qs = q.toString();
    return api.get<ReferralCommissionsResponse>(
      `/api/me/referrals/${referralId}/commissions${qs ? `?${qs}` : ''}`
    );
  },
};
