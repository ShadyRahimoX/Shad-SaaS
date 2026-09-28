export interface ApiResponse<T = unknown> {
  status: 'ok' | 'error';
  message?: string;
  data?: T;
  error?: string;
}

export interface Tenant {
  id: string;
  subdomain: string;
  displayName: string | null;
  plan: string | null;
  status: string;
  createdAt: Date;
}

export interface User {
  id: string;
  tenantId: string | null;
  username: string;
  email: string;
  passwordHash: string;
  balanceUsd: string;
  banned: boolean;
  createdAt: Date;
}
