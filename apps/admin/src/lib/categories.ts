import { adminApi } from './api';

export interface AdminCategory {
  id: string;
  name: string;
  nameEn: string | null;
  slug: string;
  parentId: string | null;
  imageUrl: string | null;
  iconName: string | null;
  sortOrder: number;
  active: boolean;
  createdAt: string;
  childrenCount: number;
  productsCount: number;
}

export interface CreateCategoryInput {
  name: string;
  nameEn?: string | null;
  slug: string;
  parentId?: string | null;
  imageUrl?: string | null;
  iconName?: string | null;
  sortOrder?: number;
  active?: boolean;
}

export const adminCategoriesApi = {
  list: (params?: { search?: string; active?: string; parentId?: string }) => {
    const q = new URLSearchParams();
    if (params?.search) q.set('search', params.search);
    if (params?.active && params.active !== 'all') q.set('active', params.active);
    if (params?.parentId) q.set('parentId', params.parentId);
    const qs = q.toString();
    return adminApi.get<AdminCategory[]>(`/api/admin/categories${qs ? `?${qs}` : ''}`);
  },
  create: (data: CreateCategoryInput) =>
    adminApi.post<AdminCategory>('/api/admin/categories', data),
  update: (id: string, data: Partial<CreateCategoryInput>) =>
    adminApi.patch<AdminCategory>(`/api/admin/categories/${id}`, data),
  remove: (id: string) =>
    adminApi.del<{ deleted: boolean; id: string }>(`/api/admin/categories/${id}`),
};
