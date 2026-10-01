import { z } from 'zod';

export const MIN_ORDER_TOTAL_USD = 0.01;

export const createOrderSchema = z.object({
  productId: z.string().uuid('Invalid product ID'),
  qty: z.number().int().positive('Quantity must be positive'),
  playerId: z.string().min(1, 'Player ID is required').max(100),
  extraFields: z.record(z.string()).optional(),
  orderUuid: z.string().uuid('Order UUID must be a valid UUIDv4'),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;

export const orderStatusSchema = z.enum(['pending', 'waiting', 'accept', 'reject', 'cancelled']);
export type OrderStatus = z.infer<typeof orderStatusSchema>;
