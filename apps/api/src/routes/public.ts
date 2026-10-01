import { Hono } from 'hono';
import { db, products, categories, paymentMethods } from '@shad-saas/db';
import { eq, and, ilike, sql } from 'drizzle-orm';
import { ok, err } from '../lib/response.js';

export const publicRoutes = new Hono();

// GET /api/public/deposit-methods
publicRoutes.get('/deposit-methods', async (c) => {
  const rows = await db
    .select()
    .from(paymentMethods)
    .where(eq(paymentMethods.active, true))
    .orderBy(paymentMethods.sortOrder, paymentMethods.name);

  const formatted = rows.map((m) => {
    const cfg = (m.config as Record<string, any>) || {};
    return {
      id: m.id,
      code: m.code,
      name: m.name,
      nameEn: m.code,
      type: m.type,
      uiLayout: cfg.ui_layout || 'account',
      iconUrl: m.iconUrl,
      minAmountUsd: m.minAmountUsd,
      currencies: m.allowedCurrencies || ['USD'],
      discountPercent: 0,
      vipOnly: false,
      instructions: m.instructions,
      requiredFields: m.requiredFields || [],
    };
  });

  return ok(c, formatted);
});

publicRoutes.get('/categories', async (c) => {
  const rows = await db
    .select()
    .from(categories)
    .where(eq(categories.active, true))
    .orderBy(categories.sortOrder);
  return ok(c, rows);
});

publicRoutes.get('/products', async (c) => {
  const page = Number(c.req.query('page') || 1);
  const limit = Math.min(Number(c.req.query('limit') || 20), 100);
  const search = c.req.query('search');
  const categorySlug = c.req.query('category');
  const offset = (page - 1) * limit;

  const conditions = [eq(products.available, true)];

  if (search) {
    conditions.push(ilike(products.name, `%${search}%`));
  }

  if (categorySlug) {
    const [cat] = await db
      .select({ id: categories.id })
      .from(categories)
      .where(eq(categories.slug, categorySlug))
      .limit(1);
    if (!cat) return ok(c, { products: [], total: 0, page, limit });
    conditions.push(eq(products.categoryId, cat.id));
  }

  const rows = await db
    .select()
    .from(products)
    .where(and(...conditions))
    .limit(limit)
    .offset(offset);

  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(products)
    .where(and(...conditions));

  return ok(c, { products: rows, total: count, page, limit });
});

publicRoutes.get('/products/:id', async (c) => {
  const id = c.req.param('id');
  const [product] = await db
    .select()
    .from(products)
    .where(eq(products.id, id))
    .limit(1);

  if (!product) return err(c, 'NOT_FOUND', 'Product not found', 404);
  return ok(c, product);
});
