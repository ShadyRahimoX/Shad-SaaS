import { Hono } from 'hono';
import { db, products, categories, orders } from '@shad-saas/db';
import { eq, and, or, ilike, asc, isNull, isNotNull, lte, gt, sql } from 'drizzle-orm';
import { ok, err } from '../lib/response.js';

export const adminInventoryRoutes = new Hono();

// Protect all admin inventory routes with X-Admin-Key
adminInventoryRoutes.use('*', async (c, next) => {
  const key = c.req.header('X-Admin-Key');
  const expected = process.env.ADMIN_SYNC_KEY;

  if (!expected || key !== expected) {
    return err(c, 'UNAUTHORIZED', 'Invalid admin key', 401);
  }

  await next();
});

// 1. GET /api/admin/inventory/stats
adminInventoryRoutes.get('/stats', async (c) => {
  try {
    const [stats] = await db
      .select({
        total: sql<number>`count(*)::int`,
        tracked: sql<number>`count(*) filter (where ${products.stock} is not null)::int`,
        unlimited: sql<number>`count(*) filter (where ${products.stock} is null)::int`,
        lowStock: sql<number>`count(*) filter (where ${products.stock} > 0 and ${products.stock} <= 5)::int`,
        outOfStock: sql<number>`count(*) filter (where ${products.stock} = 0)::int`,
      })
      .from(products);

    return ok(c, {
      total: stats?.total ?? 0,
      tracked: stats?.tracked ?? 0,
      unlimited: stats?.unlimited ?? 0,
      lowStock: stats?.lowStock ?? 0,
      outOfStock: stats?.outOfStock ?? 0,
    });
  } catch (error) {
    console.error('Admin inventory stats error:', error);
    return err(c, 'ADMIN_INVENTORY_STATS_FAILED', 'Failed to get inventory stats', 500);
  }
});

// 2. GET /api/admin/inventory
adminInventoryRoutes.get('/', async (c) => {
  const page = Math.max(1, Number(c.req.query('page') || 1));
  const limit = Math.min(100, Math.max(1, Number(c.req.query('limit') || 20)));
  const filter = c.req.query('filter') || 'all';
  const categoryId = c.req.query('categoryId');
  const search = c.req.query('search');
  const offset = (page - 1) * limit;

  try {
    const conditions = [];

    // Filter logic
    if (filter === 'tracked') {
      conditions.push(isNotNull(products.stock));
    } else if (filter === 'unlimited') {
      conditions.push(isNull(products.stock));
    } else if (filter === 'low') {
      conditions.push(and(gt(products.stock, 0), lte(products.stock, 5)));
    } else if (filter === 'out') {
      conditions.push(eq(products.stock, 0));
    }

    if (categoryId) {
      conditions.push(eq(products.categoryId, categoryId));
    }

    if (search && search.trim()) {
      const term = search.trim();
      const isNum = /^\d+$/.test(term);
      if (isNum) {
        conditions.push(
          or(
            ilike(products.name, `%${term}%`),
            eq(products.alkasrProductId, Number(term))
          )
        );
      } else {
        conditions.push(ilike(products.name, `%${term}%`));
      }
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const rows = await db
      .select({
        id: products.id,
        name: products.name,
        imageUrl: products.imageUrl,
        categoryId: products.categoryId,
        categoryName: categories.name,
        alkasrProductId: products.alkasrProductId,
        stock: products.stock,
        available: products.available,
        priceUsd: products.priceUsd,
        ordersCount: sql<number>`(SELECT count(*)::int FROM ${orders} o WHERE o.product_id = ${products.id})`,
      })
      .from(products)
      .leftJoin(categories, eq(products.categoryId, categories.id))
      .where(whereClause)
      .orderBy(sql`${products.stock} ASC NULLS LAST`, asc(products.name))
      .limit(limit)
      .offset(offset);

    const [{ count }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(products)
      .where(whereClause);

    const mapped = rows.map((row) => {
      let stockStatus: 'unlimited' | 'out' | 'low' | 'ok' = 'unlimited';
      if (row.stock === null) {
        stockStatus = 'unlimited';
      } else if (row.stock === 0) {
        stockStatus = 'out';
      } else if (row.stock <= 5) {
        stockStatus = 'low';
      } else {
        stockStatus = 'ok';
      }

      return {
        ...row,
        stockStatus,
      };
    });

    return ok(c, {
      products: mapped,
      total: count,
      page,
      limit,
    });
  } catch (error) {
    console.error('Admin inventory list error:', error);
    return err(c, 'ADMIN_INVENTORY_FAILED', 'Failed to list inventory', 500);
  }
});
