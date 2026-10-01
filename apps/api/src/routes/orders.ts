import { Hono } from 'hono';
import { createOrderSchema } from '@shad-saas/validators';
import { ok, err } from '../lib/response.js';
import { requireAuth, type AuthVariables } from '../middleware/auth.js';
import { OrderError, createOrder, getOrderById, listUserOrders } from '../services/orders.service.js';

export const ordersRoutes = new Hono<{ Variables: AuthVariables }>();

ordersRoutes.use('*', requireAuth);

// POST /api/orders
ordersRoutes.post('/', async (c) => {
  const body = await c.req.json().catch(() => null);
  if (!body) return err(c, 'INVALID_BODY', 'Invalid JSON body', 400);

  const result = createOrderSchema.safeParse(body);
  if (!result.success) {
    return err(c, 'VALIDATION_ERROR', result.error.errors.map(e => e.message).join(', '), 400);
  }

  const userId = c.get('userId');
  const dryRun = process.env.DRY_RUN_ORDERS === 'true';

  try {
    const order = await createOrder({ userId, input: result.data, dryRun });
    return ok(c, order, 201);
  } catch (error) {
    if (error instanceof OrderError) {
      return err(c, error.code, error.message, error.statusCode);
    }
    console.error('Create order error:', error);
    return err(c, 'ORDER_FAILED', 'Failed to create order', 500);
  }
});

// GET /api/orders
ordersRoutes.get('/', async (c) => {
  const userId = c.get('userId');
  const page = Math.max(1, Number(c.req.query('page') || 1));
  const limit = Math.min(50, Math.max(1, Number(c.req.query('limit') || 20)));
  const status = c.req.query('status');

  try {
    const result = await listUserOrders(userId, page, limit, status);
    return ok(c, result);
  } catch (error) {
    console.error('List orders error:', error);
    return err(c, 'LIST_FAILED', 'Failed to list orders', 500);
  }
});

// GET /api/orders/:id
ordersRoutes.get('/:id', async (c) => {
  const userId = c.get('userId');
  const orderId = c.req.param('id');

  try {
    const order = await getOrderById(userId, orderId);
    return ok(c, order);
  } catch (error) {
    if (error instanceof OrderError) {
      return err(c, error.code, error.message, error.statusCode);
    }
    console.error('Get order error:', error);
    return err(c, 'GET_FAILED', 'Failed to get order', 500);
  }
});
