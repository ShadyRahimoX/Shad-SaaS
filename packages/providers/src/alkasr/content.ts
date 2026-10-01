import { alkasrFetch } from './client.js';
import type { AlkasrContent } from './types.js';

export async function getAlkasrContent(parentId = 0): Promise<AlkasrContent> {
  return alkasrFetch<AlkasrContent>(`/client/api/content/${parentId}`);
}
