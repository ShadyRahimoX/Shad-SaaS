import { api } from './api';

export interface Category {
  id: string;
  name: string;
  nameEn?: string | null;
  slug: string;
  imageUrl?: string | null;
  iconName?: string | null;
  iconUrl?: string | null;
  parentId?: string | null;
  sortOrder?: number;
  active?: boolean;
}

export interface Product {
  id: string;
  name: string;
  slug?: string;
  description?: string | null;
  priceUsd: string;
  basePriceUsd?: string;
  compareAtPriceUsd?: string;
  stock?: number;
  categoryId: string;
  imageUrl?: string | null;
  available: boolean;
  productType?: string;
  minQty?: string;
  maxQty?: string;
  requiredFields?: any[];
}

export interface ProductsResponse {
  products: Product[];
  total: number;
  page: number;
  limit: number;
}

export const productsApi = {
  getCategories: () => api.get<Category[]>('/api/public/categories'),

  getCategory: async (slug: string) => {
    const res = await api.get<Category[]>('/api/public/categories');
    if (!res.success || !res.data) {
      return { success: false, error: { code: 'NOT_FOUND', message: 'Category not found' } };
    }
    const found = res.data.find((c) => c.slug === slug || c.id === slug);
    if (!found) {
      return { success: false, error: { code: 'NOT_FOUND', message: 'Category not found' } };
    }
    return { success: true, data: found };
  },

  getProducts: (params?: { category?: string; categoryId?: string; search?: string; page?: number; limit?: number }) => {
    const query = new URLSearchParams();
    const categoryParam = params?.category || params?.categoryId;
    if (categoryParam) query.set('category', categoryParam);
    if (params?.search) query.set('search', params.search);
    if (params?.page) query.set('page', String(params.page));
    if (params?.limit) query.set('limit', String(params.limit));

    const qs = query.toString();
    return api.get<ProductsResponse>(`/api/public/products${qs ? `?${qs}` : ''}`);
  },

  getProduct: (idOrSlug: string) => api.get<Product>(`/api/public/products/${idOrSlug}`),
};
