import { Hono } from 'hono';
import { db, orders, users, products } from '@shad-saas/db';
import { eq, and, or, ilike, desc, sql } from 'drizzle-orm';
import { ok, err } from '../lib/response.js';

export const adminOrdersRoutes = new Hono();

// Protect all admin order routes with X-Admin-Key
adminOrdersRoutes.use('*', async (c, next) => {
  const key = c.req.header('X-Admin-Key');
  const expected = process.env.ADMIN_SYNC_KEY;

  if (!expected || key !== expected) {
    return err(c, 'UNAUTHORIZED', 'Invalid admin key', 401);
  }

  await next();
});

// 1. GET /api/admin/orders/stats (Must be registered before /:id)
adminOrdersRoutes.get('/stats', async (c) => {
  try {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [stats] = await db
      .select({
        total: sql<number>`count(*)::int`,
        accept: sql<number>`count(*) filter (where ${orders.status} = 'accept')::int`,
        waiting: sql<number>`count(*) filter (where ${orders.status} in ('waiting', 'pending'))::int`,
        reject: sql<number>`count(*) filter (where ${orders.status} = 'reject')::int`,
        cancelled: sql<number>`count(*) filter (where ${orders.status} = 'cancelled')::int`,
        todayTotal: sql<number>`count(*) filter (where ${orders.createdAt} >= ${startOfToday})::int`,
        thisMonthTotal: sql<number>`count(*) filter (where ${orders.createdAt} >= ${startOfMonth})::int`,
      })
      .from(orders);

    return ok(c, {
      total: stats?.total ?? 0,
      accept: stats?.accept ?? 0,
      waiting: stats?.waiting ?? 0,
      reject: stats?.reject ?? 0,
      cancelled: stats?.cancelled ?? 0,
      todayTotal: stats?.todayTotal ?? 0,
      thisMonthTotal: stats?.thisMonthTotal ?? 0,
    });
  } catch (error) {
    console.error('Admin orders stats error:', error);
    return err(c, 'ADMIN_ORDERS_STATS_FAILED', 'Failed to get orders stats', 500);
  }
});

// 2. GET /api/admin/orders
adminOrdersRoutes.get('/', async (c) => {
  const page = Math.max(1, Number(c.req.query('page') || 1));
  const limit = Math.min(100, Math.max(1, Number(c.req.query('limit') || 20)));
  const status = c.req.query('status');
  const search = c.req.query('search');
  const userId = c.req.query('userId');
  const offset = (page - 1) * limit;

  try {
    const conditions = [];

    if (status && status !== 'all') {
      if (status === 'waiting') {
        conditions.push(or(eq(orders.status, 'waiting'), eq(orders.status, 'pending')));
      } else {
        conditions.push(eq(orders.status, status));
      }
    }

    if (userId) {
      conditions.push(eq(orders.userId, userId));
    }

    if (search && search.trim()) {
      const term = search.trim();
      const isNum = /^\d+$/.test(term);
      if (isNum) {
        conditions.push(
          or(
            eq(orders.displayId, Number(term)),
            ilike(users.username, `%${term}%`),
            ilike(users.email, `%${term}%`)
          )
        );
      } else {
        conditions.push(
          or(
            ilike(users.username, `%${term}%`),
            ilike(users.email, `%${term}%`)
          )
        );
      }
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const rows = await db
      .select({
        id: orders.id,
        orderUuid: orders.orderUuid,
        displayId: orders.displayId,
        userId: orders.userId,
        username: users.username,
        email: users.email,
        productId: orders.productId,
        productName: products.name,
        qty: orders.qty,
        playerId: orders.playerId,
        priceUsd: orders.priceUsd,
        costUsd: orders.costUsd,
        profitUsd: orders.profitUsd,
        status: orders.status,
        providerOrderId: orders.providerOrderId,
        createdAt: orders.createdAt,
      })
      .from(orders)
      .innerJoin(users, eq(orders.userId, users.id))
      .innerJoin(products, eq(orders.productId, products.id))
      .where(whereClause)
      .orderBy(desc(orders.createdAt))
      .limit(limit)
      .offset(offset);

    const [{ count }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(orders)
      .innerJoin(users, eq(orders.userId, users.id))
      .innerJoin(products, eq(orders.productId, products.id))
      .where(whereClause);

    return ok(c, {
      orders: rows,
      total: count,
      page,
      limit,
    });
  } catch (error) {
    console.error('Admin list orders error:', error);
    return err(c, 'ADMIN_ORDERS_FAILED', 'Failed to list orders', 500);
  }
});

// 3. GET /api/admin/orders/:id
adminOrdersRoutes.get('/:id', async (c) => {
  const orderId = c.req.param('id');

  try {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(orderId);
    const isNum = /^\d+$/.test(orderId);

    let condition = eq(orders.id, orderId);
    if (!isUuid && isNum) {
      condition = eq(orders.displayId, Number(orderId));
    }

    const [row] = await db
      .select({
        id: orders.id,
        orderUuid: orders.orderUuid,
        displayId: orders.displayId,
        userId: orders.userId,
        username: users.username,
        email: users.email,
        phone: users.phone,
        country: users.country,
        productId: orders.productId,
        productName: products.name,
        productType: products.productType,
        qty: orders.qty,
        playerId: orders.playerId,
        extraFields: orders.extraFields,
        priceUsd: orders.priceUsd,
        costUsd: orders.costUsd,
        profitUsd: orders.profitUsd,
        status: orders.status,
        providerOrderId: orders.providerOrderId,
        providerResponse: orders.providerResponse,
        notes: orders.notes,
        createdAt: orders.createdAt,
        updatedAt: orders.updatedAt,
      })
      .from(orders)
      .innerJoin(users, eq(orders.userId, users.id))
      .innerJoin(products, eq(orders.productId, products.id))
      .where(condition)
      .limit(1);

    if (!row) {
      return err(c, 'ORDER_NOT_FOUND', 'Order not found', 404);
    }

    return ok(c, row);
  } catch (error) {
    console.error('Admin get order error:', error);
    return err(c, 'ADMIN_GET_ORDER_FAILED', 'Failed to get order details', 500);
  }
});
