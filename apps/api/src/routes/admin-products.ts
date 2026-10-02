import { Hono } from 'hono';
import { z } from 'zod';
import { db, products, categories, orders } from '@shad-saas/db';
import { eq, ne, and, or, ilike, asc, desc, sql } from 'drizzle-orm';
import { ok, err } from '../lib/response.js';

export const adminProductsRoutes = new Hono();

// Protect all admin product routes with X-Admin-Key
adminProductsRoutes.use('*', async (c, next) => {
  const key = c.req.header('X-Admin-Key');
  const expected = process.env.ADMIN_SYNC_KEY;

  if (!expected || key !== expected) {
    return err(c, 'UNAUTHORIZED', 'Invalid admin key', 401);
  }

  await next();
});

const createProductSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(200),
  description: z.string().max(5000).optional().nullable(),
  imageUrl: z.string().url().optional().nullable().or(z.literal('')),
  categoryId: z.string().uuid('Invalid category ID'),
  alkasrProductId: z.number().int().positive().optional().nullable(),
  priceUsd: z.union([z.string(), z.number()]),
  basePriceUsd: z.union([z.string(), z.number()]).optional(),
  productType: z.string().max(50).optional(),
  minQty: z.union([z.string(), z.number()]).optional(),
  maxQty: z.union([z.string(), z.number()]).optional().nullable(),
  qtyOptions: z.array(z.any()).optional().nullable(),
  requiredFields: z
    .array(
      z.object({
        type: z.enum(['text', 'number', 'email', 'tel', 'select']).or(z.string()),
        label: z.string().min(1).max(200),
        name: z.string().max(50).optional(),
        placeholder: z.string().max(200).optional(),
        required: z.boolean().optional(),
        options: z.array(z.string()).optional(),
      })
    )
    .optional()
    .nullable(),
  available: z.boolean().optional(),
  sortOrder: z.number().int().min(0).optional(),
});

const updateProductSchema = z.object({
  name: z.string().min(2).max(200).optional(),
  description: z.string().max(5000).optional().nullable(),
  imageUrl: z.string().url().optional().nullable().or(z.literal('')),
  categoryId: z.string().uuid().optional(),
  alkasrProductId: z.number().int().positive().optional().nullable(),
  priceUsd: z.union([z.string(), z.number()]).optional(),
  basePriceUsd: z.union([z.string(), z.number()]).optional(),
  productType: z.string().max(50).optional(),
  minQty: z.union([z.string(), z.number()]).optional(),
  maxQty: z.union([z.string(), z.number()]).optional().nullable(),
  qtyOptions: z.array(z.any()).optional().nullable(),
  requiredFields: z
    .array(
      z.object({
        type: z.enum(['text', 'number', 'email', 'tel', 'select']).or(z.string()),
        label: z.string().min(1).max(200),
        name: z.string().max(50).optional(),
        placeholder: z.string().max(200).optional(),
        required: z.boolean().optional(),
        options: z.array(z.string()).optional(),
      })
    )
    .optional()
    .nullable(),
  available: z.boolean().optional(),
  sortOrder: z.number().int().min(0).optional(),
});

// 1. GET /api/admin/products/stats (Must precede /:id)
adminProductsRoutes.get('/stats', async (c) => {
  try {
    const [stats] = await db
      .select({
        total: sql<number>`count(*)::int`,
        available: sql<number>`count(*) filter (where ${products.available} = true)::int`,
        unavailable: sql<number>`count(*) filter (where ${products.available} = false)::int`,
        withImage: sql<number>`count(*) filter (where ${products.imageUrl} is not null and ${products.imageUrl} != '')::int`,
        withRequiredFields: sql<number>`count(*) filter (where ${products.requiredFields}::text != '[]' and ${products.requiredFields} is not null)::int`,
        fromAlkasr: sql<number>`count(*) filter (where ${products.alkasrProductId} is not null)::int`,
      })
      .from(products);

    return ok(c, {
      total: stats?.total ?? 0,
      available: stats?.available ?? 0,
      unavailable: stats?.unavailable ?? 0,
      withImage: stats?.withImage ?? 0,
      withRequiredFields: stats?.withRequiredFields ?? 0,
      fromAlkasr: stats?.fromAlkasr ?? 0,
    });
  } catch (error) {
    console.error('Admin products stats error:', error);
    return err(c, 'ADMIN_PRODUCTS_STATS_FAILED', 'Failed to get products stats', 500);
  }
});

// 2. GET /api/admin/products
adminProductsRoutes.get('/', async (c) => {
  const page = Math.max(1, Number(c.req.query('page') || 1));
  const limit = Math.min(100, Math.max(1, Number(c.req.query('limit') || 20)));
  const categoryId = c.req.query('categoryId');
  const search = c.req.query('search');
  const available = c.req.query('available');
  const productType = c.req.query('productType');
  const sortBy = c.req.query('sortBy') || 'newest';
  const offset = (page - 1) * limit;

  try {
    const conditions = [];

    if (available === 'true') {
      conditions.push(eq(products.available, true));
    } else if (available === 'false') {
      conditions.push(eq(products.available, false));
    }

    if (categoryId) {
      conditions.push(eq(products.categoryId, categoryId));
    }

    if (productType) {
      conditions.push(eq(products.productType, productType));
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

    let orderExpr = desc(products.createdAt);
    if (sortBy === 'name') {
      orderExpr = asc(products.name);
    } else if (sortBy === 'price-asc') {
      orderExpr = asc(products.priceUsd);
    } else if (sortBy === 'price-desc') {
      orderExpr = desc(products.priceUsd);
    } else if (sortBy === 'sortOrder') {
      orderExpr = asc(products.sortOrder);
    }

    const rows = await db
      .select({
        id: products.id,
        name: products.name,
        description: products.description,
        imageUrl: products.imageUrl,
        categoryId: products.categoryId,
        categoryName: categories.name,
        alkasrProductId: products.alkasrProductId,
        priceUsd: products.priceUsd,
        basePriceUsd: products.basePriceUsd,
        profitUsd: sql<string>`(${products.priceUsd} - ${products.basePriceUsd})::numeric(20,10)::text`,
        productType: products.productType,
        minQty: products.minQty,
        maxQty: products.maxQty,
        requiredFields: products.requiredFields,
        qtyOptions: products.qtyOptions,
        available: products.available,
        sortOrder: products.sortOrder,
        ordersCount: sql<number>`(SELECT count(*)::int FROM ${orders} o WHERE o.product_id = ${products.id})`,
        createdAt: products.createdAt,
      })
      .from(products)
      .leftJoin(categories, eq(products.categoryId, categories.id))
      .where(whereClause)
      .orderBy(orderExpr)
      .limit(limit)
      .offset(offset);

    const [{ count }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(products)
      .where(whereClause);

    return ok(c, {
      products: rows,
      total: count,
      page,
      limit,
    });
  } catch (error) {
    console.error('Admin list products error:', error);
    return err(c, 'ADMIN_PRODUCTS_FAILED', 'Failed to list products', 500);
  }
});

// 3. GET /api/admin/products/:id
adminProductsRoutes.get('/:id', async (c) => {
  const idParam = c.req.param('id');

  try {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idParam);
    const isNum = /^\d+$/.test(idParam);

    let condition = eq(products.id, idParam);
    if (!isUuid && isNum) {
      condition = eq(products.alkasrProductId, Number(idParam));
    }

    const [row] = await db
      .select({
        id: products.id,
        name: products.name,
        description: products.description,
        imageUrl: products.imageUrl,
        categoryId: products.categoryId,
        categoryName: categories.name,
        alkasrProductId: products.alkasrProductId,
        priceUsd: products.priceUsd,
        basePriceUsd: products.basePriceUsd,
        profitUsd: sql<string>`(${products.priceUsd} - ${products.basePriceUsd})::numeric(20,10)::text`,
        productType: products.productType,
        minQty: products.minQty,
        maxQty: products.maxQty,
        requiredFields: products.requiredFields,
        qtyOptions: products.qtyOptions,
        available: products.available,
        sortOrder: products.sortOrder,
        ordersCount: sql<number>`(SELECT count(*)::int FROM ${orders} o WHERE o.product_id = ${products.id})`,
        createdAt: products.createdAt,
      })
      .from(products)
      .leftJoin(categories, eq(products.categoryId, categories.id))
      .where(condition)
      .limit(1);

    if (!row) {
      return err(c, 'PRODUCT_NOT_FOUND', 'Product not found', 404);
    }

    return ok(c, row);
  } catch (error) {
    console.error('Admin get product error:', error);
    return err(c, 'ADMIN_GET_PRODUCT_FAILED', 'Failed to get product details', 500);
  }
});

// 4. POST /api/admin/products
adminProductsRoutes.post('/', async (c) => {
  const body = await c.req.json().catch(() => null);
  if (!body) return err(c, 'INVALID_BODY', 'Invalid JSON body', 400);

  const result = createProductSchema.safeParse(body);
  if (!result.success) {
    return err(c, 'VALIDATION_ERROR', result.error.errors.map((e) => e.message).join(', '), 400);
  }

  const data = result.data;

  try {
    // Check if category exists
    const [category] = await db
      .select({ id: categories.id })
      .from(categories)
      .where(eq(categories.id, data.categoryId))
      .limit(1);

    if (!category) {
      return err(c, 'CATEGORY_NOT_FOUND', 'Category not found', 400);
    }

    // Check alkasrProductId if provided
    if (data.alkasrProductId) {
      const [existingAlkasr] = await db
        .select({ id: products.id })
        .from(products)
        .where(eq(products.alkasrProductId, data.alkasrProductId))
        .limit(1);

      if (existingAlkasr) {
        return err(c, 'ALKASR_ID_TAKEN', 'Alkasr product ID is already registered', 400);
      }
    }

    const price = String(data.priceUsd);
    const basePrice = data.basePriceUsd !== undefined ? String(data.basePriceUsd) : price;

    const [created] = await db
      .insert(products)
      .values({
        name: data.name,
        description: data.description ?? null,
        imageUrl: data.imageUrl ? data.imageUrl : null,
        categoryId: data.categoryId,
        alkasrProductId: data.alkasrProductId ?? null,
        priceUsd: price,
        basePriceUsd: basePrice,
        productType: data.productType || 'package',
        minQty: data.minQty ? String(data.minQty) : '1',
        maxQty: data.maxQty ? String(data.maxQty) : null,
        qtyOptions: data.qtyOptions ?? null,
        requiredFields: data.requiredFields ?? [],
        available: data.available ?? true,
        sortOrder: data.sortOrder ?? 0,
      })
      .returning();

    return ok(c, created, 201);
  } catch (error) {
    console.error('Admin create product error:', error);
    return err(c, 'CREATE_PRODUCT_FAILED', 'Failed to create product', 500);
  }
});

// 5. PATCH /api/admin/products/:id
adminProductsRoutes.patch('/:id', async (c) => {
  const idParam = c.req.param('id');
  const body = await c.req.json().catch(() => null);
  if (!body) return err(c, 'INVALID_BODY', 'Invalid JSON body', 400);

  const result = updateProductSchema.safeParse(body);
  if (!result.success) {
    return err(c, 'VALIDATION_ERROR', result.error.errors.map((e) => e.message).join(', '), 400);
  }

  const data = result.data;

  try {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idParam);
    const isNum = /^\d+$/.test(idParam);

    let condition = eq(products.id, idParam);
    if (!isUuid && isNum) {
      condition = eq(products.alkasrProductId, Number(idParam));
    }

    const [existing] = await db.select().from(products).where(condition).limit(1);

    if (!existing) {
      return err(c, 'PRODUCT_NOT_FOUND', 'Product not found', 404);
    }

    // Check categoryId if updating
    if (data.categoryId && data.categoryId !== existing.categoryId) {
      const [category] = await db
        .select({ id: categories.id })
        .from(categories)
        .where(eq(categories.id, data.categoryId))
        .limit(1);

      if (!category) {
        return err(c, 'CATEGORY_NOT_FOUND', 'Category not found', 400);
      }
    }

    // Check alkasrProductId if updating
    if (
      data.alkasrProductId !== undefined &&
      data.alkasrProductId !== null &&
      data.alkasrProductId !== existing.alkasrProductId
    ) {
      const [existingAlkasr] = await db
        .select({ id: products.id })
        .from(products)
        .where(and(eq(products.alkasrProductId, data.alkasrProductId), ne(products.id, existing.id)))
        .limit(1);

      if (existingAlkasr) {
        return err(c, 'ALKASR_ID_TAKEN', 'Alkasr product ID is already registered', 400);
      }
    }

    const updatePayload: Record<string, any> = {};
    if (data.name !== undefined) updatePayload.name = data.name;
    if (data.description !== undefined) updatePayload.description = data.description;
    if (data.imageUrl !== undefined) updatePayload.imageUrl = data.imageUrl ? data.imageUrl : null;
    if (data.categoryId !== undefined) updatePayload.categoryId = data.categoryId;
    if (data.alkasrProductId !== undefined) updatePayload.alkasrProductId = data.alkasrProductId;
    if (data.priceUsd !== undefined) updatePayload.priceUsd = String(data.priceUsd);
    if (data.basePriceUsd !== undefined) updatePayload.basePriceUsd = String(data.basePriceUsd);
    if (data.productType !== undefined) updatePayload.productType = data.productType;
    if (data.minQty !== undefined) updatePayload.minQty = String(data.minQty);
    if (data.maxQty !== undefined) updatePayload.maxQty = data.maxQty ? String(data.maxQty) : null;
    if (data.qtyOptions !== undefined) updatePayload.qtyOptions = data.qtyOptions;
    if (data.requiredFields !== undefined) updatePayload.requiredFields = data.requiredFields;
    if (data.available !== undefined) updatePayload.available = data.available;
    if (data.sortOrder !== undefined) updatePayload.sortOrder = data.sortOrder;

    const [updated] = await db
      .update(products)
      .set(updatePayload)
      .where(eq(products.id, existing.id))
      .returning();

    return ok(c, updated);
  } catch (error) {
    console.error('Admin update product error:', error);
    return err(c, 'UPDATE_PRODUCT_FAILED', 'Failed to update product', 500);
  }
});

// 6. DELETE /api/admin/products/:id
adminProductsRoutes.delete('/:id', async (c) => {
  const idParam = c.req.param('id');

  try {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idParam);
    const isNum = /^\d+$/.test(idParam);

    let condition = eq(products.id, idParam);
    if (!isUuid && isNum) {
      condition = eq(products.alkasrProductId, Number(idParam));
    }

    const [existing] = await db
      .select({ id: products.id, name: products.name })
      .from(products)
      .where(condition)
      .limit(1);

    if (!existing) {
      return err(c, 'PRODUCT_NOT_FOUND', 'Product not found', 404);
    }

    // Check if product has orders
    const [orderCount] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(orders)
      .where(eq(orders.productId, existing.id));

    if (orderCount && orderCount.count > 0) {
      return err(
        c,
        'PRODUCT_HAS_ORDERS',
        `Cannot delete product that contains ${orderCount.count} order(s)`,
        400
      );
    }

    await db.delete(products).where(eq(products.id, existing.id));

    return ok(c, { deleted: true, id: existing.id });
  } catch (error) {
    console.error('Admin delete product error:', error);
    return err(c, 'DELETE_PRODUCT_FAILED', 'Failed to delete product', 500);
  }
});
