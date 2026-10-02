import { adminApi } from './api';

export type ProductType = 'package' | 'specificPackage' | 'amount' | 'custom';

export interface RequiredField {
  type: 'text' | 'number' | 'email' | 'tel' | 'select' | string;
  label: string;
  name?: string;
  placeholder?: string;
  required?: boolean;
  options?: string[];
}

export interface AdminProduct {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  categoryId: string | null;
  categoryName: string | null;
  alkasrProductId: number | null;
  priceUsd: string;
  basePriceUsd: string;
  profitUsd: string;
  productType: string;
  minQty: string;
  maxQty: string | null;
  requiredFields: RequiredField[];
  qtyOptions: any[] | Record<string, any> | null;
  available: boolean;
  sortOrder: number;
  ordersCount: number;
  createdAt: string;
}

export interface AdminProductDetail extends AdminProduct {}

export interface ProductsListResponse {
  products: AdminProduct[];
  total: number;
  page: number;
  limit: number;
}

export interface ProductsStats {
  total: number;
  available: number;
  unavailable: number;
  withImage: number;
  withRequiredFields: number;
  fromAlkasr: number;
}

export interface ProductsQuery {
  page?: number;
  limit?: number;
  categoryId?: string;
  search?: string;
  available?: 'true' | 'false' | 'all';
  productType?: string;
  sortBy?: 'newest' | 'name' | 'price-asc' | 'price-desc' | 'sortOrder';
}

export const adminProductsApi = {
  list: (params?: ProductsQuery) => {
    const q = new URLSearchParams();
    if (params?.page) q.set('page', String(params.page));
    if (params?.limit) q.set('limit', String(params.limit));
    if (params?.categoryId) q.set('categoryId', params.categoryId);
    if (params?.search) q.set('search', params.search);
    if (params?.available && params.available !== 'all') q.set('available', params.available);
    if (params?.productType) q.set('productType', params.productType);
    if (params?.sortBy) q.set('sortBy', params.sortBy);
    const qs = q.toString();
    return adminApi.get<ProductsListResponse>(`/api/admin/products${qs ? `?${qs}` : ''}`);
  },
  getStats: () => adminApi.get<ProductsStats>('/api/admin/products/stats'),
  get: (idOrAlkasrId: string | number) =>
    adminApi.get<AdminProductDetail>(`/api/admin/products/${idOrAlkasrId}`),
  create: (data: Partial<AdminProduct>) =>
    adminApi.post<AdminProduct>('/api/admin/products', data),
  update: (id: string, data: Partial<AdminProduct>) =>
    adminApi.patch<AdminProduct>(`/api/admin/products/${id}`, data),
  remove: (id: string) =>
    adminApi.del<{ deleted: boolean; id: string }>(`/api/admin/products/${id}`),
};
