import { api, type ApiResponse } from './api';

export interface DepositMethod {
  id: string;
  code: string;
  name: string;
  nameEn: string;
  type: 'invoice' | 'manual';
  uiLayout: 'invoice' | 'address' | 'account';
  iconUrl: string | null;
  minAmountUsd: string;
  currencies: string[];
  instructions?: string;
  discountPercent?: number;
  vipOnly?: boolean;
  requiredFields: Array<{
    name: string;
    type: 'text' | 'image' | 'number' | 'email' | 'tel';
    label: string;
    required: boolean;
    placeholder?: string;
  }>;
}

export interface Deposit {
  id: string;
  displayId: number;
  userId: string;
  paymentMethodId: string;
  method: string;
  amount: string;
  currency: string;
  amountUsd: string;
  exchangeRate: string;
  invoiceId: string | null;
  transactionRef: string | null;
  status: 'pending' | 'approved' | 'rejected' | 'expired';
  paymentUrl: string | null;
  expiresAt: string | null;
  paidAt: string | null;
  proofImageUrl: string | null;
  notes: string | null;
  createdAt: string;
}

export interface CreateDepositResponse {
  deposit: Deposit;
  method: DepositMethod;
}

export interface DepositsListResponse {
  deposits: Deposit[];
  total: number;
  page: number;
  limit: number;
}

export const depositsApi = {
  getMethods: () => api.get<DepositMethod[]>('/api/public/deposit-methods'),
  getMethodByCode: async (code: string): Promise<ApiResponse<DepositMethod>> => {
    const res = await api.get<DepositMethod[]>('/api/public/deposit-methods');
    if (!res.success || !res.data) {
      return {
        success: false,
        error: res.error || { code: 'NOT_FOUND', message: 'طرق الدفع غير متوفرة' },
      };
    }
    const found = res.data.find((m) => m.code === code);
    if (!found) {
      return {
        success: false,
        error: { code: 'METHOD_NOT_FOUND', message: 'طريقة الدفع غير موجودة' },
      };
    }
    return { success: true, data: found };
  },
  create: (payload: {
    methodCode: string;
    amount: number;
    currency: string;
    transactionRef?: string;
    proofImageUrl?: string;
  }) => api.post<CreateDepositResponse>('/api/deposits', payload),
  get: (id: string) => api.get<Deposit>(`/api/deposits/${id}`),
  list: (params?: { page?: number; limit?: number; status?: string }) => {
    const q = new URLSearchParams();
    if (params?.page) q.set('page', String(params.page));
    if (params?.limit) q.set('limit', String(params.limit));
    if (params?.status) q.set('status', params.status);
    const queryStr = q.toString();
    return api.get<DepositsListResponse>(`/api/deposits${queryStr ? `?${queryStr}` : ''}`);
  },
  verify: (id: string, transactionRef: string) =>
    api.post<Deposit>(`/api/deposits/${id}/verify`, { transactionRef }),
};
