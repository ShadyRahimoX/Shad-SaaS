import { alkasrFetch } from './client.js';
import type { AlkasrOrderResponse } from './types.js';

export async function createAlkasrOrder(params: {
  productId: number;
  qty: number;
  orderUuid: string;
  playerId: string;
  extraFields?: Record<string, string>;
}): Promise<AlkasrOrderResponse> {
  const { productId, qty, orderUuid, playerId, extraFields } = params;
  const query = new URLSearchParams({
    qty: String(qty),
    playerId,
    order_uuid: orderUuid,
    ...extraFields,
  });
  return alkasrFetch<AlkasrOrderResponse>(
    `/client/api/newOrder/${productId}/params?${query.toString()}`
  );
}

export async function checkAlkasrOrders(orderIds: string[]): Promise<unknown> {
  return alkasrFetch(`/client/api/check?orders=[${orderIds.join(',')}]`);
}
