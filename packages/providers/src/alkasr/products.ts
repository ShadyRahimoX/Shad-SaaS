import { alkasrFetch } from './client.js';
import type { AlkasrProduct, AlkasrProfile } from './types.js';

export async function getAlkasrProfile(): Promise<AlkasrProfile> {
  return alkasrFetch<AlkasrProfile>('/client/api/profile');
}

export async function getAlkasrProducts(): Promise<AlkasrProduct[]> {
  return alkasrFetch<AlkasrProduct[]>('/client/api/products');
}

export async function getAlkasrProductsByIds(ids: number[]): Promise<AlkasrProduct[]> {
  return alkasrFetch<AlkasrProduct[]>(
    `/client/api/products?products_id=${ids.join(',')}`
  );
}
