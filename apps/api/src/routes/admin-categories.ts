import { Hono } from 'hono';
import { z } from 'zod';
import { db, categories, products } from '@shad-saas/db';
import { eq, ne, and, or, ilike, asc, sql } from 'drizzle-orm';
import { ok, err } from '../lib/response.js';

export const adminCategoriesRoutes = new Hono();

// Protect all admin category routes with X-Admin-Key
adminCategoriesRoutes.use('*', async (c, next) => {
  const key = c.req.header('X-Admin-Key');
  const expected = process.env.ADMIN_SYNC_KEY;

  if (!expected || key !== expected) {
    return err(c, 'UNAUTHORIZED', 'Invalid admin key', 401);
  }

  await next();
});

const createCategorySchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  nameEn: z.string().min(2).max(100).optional().nullable(),
  slug: z
    .string()
    .regex(/^[a-z][a-z0-9-]{1,50}$/, 'Slug must start with letter and contain only lowercase, numbers, hyphens (2-50 chars)'),
  parentId: z.string().uuid().optional().nullable(),
  imageUrl: z.string().url().optional().nullable().or(z.literal('')),
  iconName: z.string().max(50).optional().nullable(),
  sortOrder: z.number().int().min(0).optional(),
  active: z.boolean().optional(),
});

const updateCategorySchema = z.object({
  name: z.string().min(2).max(100).optional(),
  nameEn: z.string().min(2).max(100).optional().nullable(),
  slug: z
    .string()
    .regex(/^[a-z][a-z0-9-]{1,50}$/, 'Slug must start with letter and contain only lowercase, numbers, hyphens (2-50 chars)')
    .optional(),
  parentId: z.string().uuid().optional().nullable(),
  imageUrl: z.string().url().optional().nullable().or(z.literal('')),
  iconName: z.string().max(50).optional().nullable(),
  sortOrder: z.number().int().min(0).optional(),
  active: z.boolean().optional(),
});

// 1. GET /api/admin/categories
adminCategoriesRoutes.get('/', async (c) => {
  const search = c.req.query('search');
  const active = c.req.query('active');
  const parentId = c.req.query('parentId');

  try {
    const conditions = [];

    if (active === 'true') {
      conditions.push(eq(categories.active, true));
    } else if (active === 'false') {
      conditions.push(eq(categories.active, false));
    }

    if (parentId) {
      if (parentId === 'null' || parentId === 'root') {
        conditions.push(sql`${categories.parentId} IS NULL`);
      } else {
        conditions.push(eq(categories.parentId, parentId));
      }
    }

    if (search && search.trim()) {
      const term = search.trim();
      conditions.push(
        or(
          ilike(categories.name, `%${term}%`),
          ilike(categories.nameEn, `%${term}%`),
          ilike(categories.slug, `%${term}%`)
        )
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const rows = await db
      .select({
        id: categories.id,
        name: categories.name,
        nameEn: categories.nameEn,
        slug: categories.slug,
        parentId: categories.parentId,
        imageUrl: categories.imageUrl,
        iconName: categories.iconName,
        sortOrder: categories.sortOrder,
        active: categories.active,
        createdAt: categories.createdAt,
        childrenCount: sql<number>`(SELECT count(*)::int FROM ${categories} sub WHERE sub.parent_id = ${categories.id})`,
        productsCount: sql<number>`(SELECT count(*)::int FROM ${products} p WHERE p.category_id = ${categories.id})`,
      })
      .from(categories)
      .where(whereClause)
      .orderBy(asc(categories.sortOrder), asc(categories.name));

    return ok(c, rows);
  } catch (error) {
    console.error('Admin list categories error:', error);
    return err(c, 'ADMIN_CATEGORIES_FAILED', 'Failed to list categories', 500);
  }
});

// 2. POST /api/admin/categories
adminCategoriesRoutes.post('/', async (c) => {
  const body = await c.req.json().catch(() => null);
  if (!body) return err(c, 'INVALID_BODY', 'Invalid JSON body', 400);

  const result = createCategorySchema.safeParse(body);
  if (!result.success) {
    return err(c, 'VALIDATION_ERROR', result.error.errors.map((e) => e.message).join(', '), 400);
  }

  const data = result.data;

  try {
    // Check if slug is unique
    const [existingSlug] = await db
      .select({ id: categories.id })
      .from(categories)
      .where(eq(categories.slug, data.slug))
      .limit(1);

    if (existingSlug) {
      return err(c, 'SLUG_TAKEN', 'Category slug already exists', 400);
    }

    // Check parent if provided
    if (data.parentId) {
      const [parent] = await db
        .select({ id: categories.id })
        .from(categories)
        .where(eq(categories.id, data.parentId))
        .limit(1);

      if (!parent) {
        return err(c, 'PARENT_NOT_FOUND', 'Parent category not found', 400);
      }
    }

    const [created] = await db
      .insert(categories)
      .values({
        name: data.name,
        nameEn: data.nameEn ?? null,
        slug: data.slug,
        parentId: data.parentId ?? null,
        imageUrl: data.imageUrl ? data.imageUrl : null,
        iconName: data.iconName ?? null,
        sortOrder: data.sortOrder ?? 0,
        active: data.active ?? true,
      })
      .returning();

    return ok(c, created, 201);
  } catch (error) {
    console.error('Admin create category error:', error);
    return err(c, 'CREATE_CATEGORY_FAILED', 'Failed to create category', 500);
  }
});

// 3. PATCH /api/admin/categories/:id
adminCategoriesRoutes.patch('/:id', async (c) => {
  const id = c.req.param('id');
  const body = await c.req.json().catch(() => null);
  if (!body) return err(c, 'INVALID_BODY', 'Invalid JSON body', 400);

  const result = updateCategorySchema.safeParse(body);
  if (!result.success) {
    return err(c, 'VALIDATION_ERROR', result.error.errors.map((e) => e.message).join(', '), 400);
  }

  const data = result.data;

  try {
    const [existing] = await db
      .select()
      .from(categories)
      .where(eq(categories.id, id))
      .limit(1);

    if (!existing) {
      return err(c, 'CATEGORY_NOT_FOUND', 'Category not found', 404);
    }

    // If slug is being updated, verify uniqueness
    if (data.slug && data.slug !== existing.slug) {
      const [slugTaken] = await db
        .select({ id: categories.id })
        .from(categories)
        .where(and(eq(categories.slug, data.slug), ne(categories.id, id)))
        .limit(1);

      if (slugTaken) {
        return err(c, 'SLUG_TAKEN', 'Category slug already exists', 400);
      }
    }

    // If parentId is being updated, verify not self & exists
    if (data.parentId !== undefined) {
      if (data.parentId === id) {
        return err(c, 'INVALID_PARENT', 'Category cannot be its own parent', 400);
      }

      if (data.parentId !== null) {
        const [parent] = await db
          .select({ id: categories.id })
          .from(categories)
          .where(eq(categories.id, data.parentId))
          .limit(1);

        if (!parent) {
          return err(c, 'PARENT_NOT_FOUND', 'Parent category not found', 400);
        }
      }
    }

    const updatePayload: Record<string, any> = {};
    if (data.name !== undefined) updatePayload.name = data.name;
    if (data.nameEn !== undefined) updatePayload.nameEn = data.nameEn;
    if (data.slug !== undefined) updatePayload.slug = data.slug;
    if (data.parentId !== undefined) updatePayload.parentId = data.parentId;
    if (data.imageUrl !== undefined) updatePayload.imageUrl = data.imageUrl ? data.imageUrl : null;
    if (data.iconName !== undefined) updatePayload.iconName = data.iconName;
    if (data.sortOrder !== undefined) updatePayload.sortOrder = data.sortOrder;
    if (data.active !== undefined) updatePayload.active = data.active;

    const [updated] = await db
      .update(categories)
      .set(updatePayload)
      .where(eq(categories.id, id))
      .returning();

    return ok(c, updated);
  } catch (error) {
    console.error('Admin update category error:', error);
    return err(c, 'UPDATE_CATEGORY_FAILED', 'Failed to update category', 500);
  }
});

// 4. DELETE /api/admin/categories/:id
adminCategoriesRoutes.delete('/:id', async (c) => {
  const id = c.req.param('id');

  try {
    const [existing] = await db
      .select({ id: categories.id })
      .from(categories)
      .where(eq(categories.id, id))
      .limit(1);

    if (!existing) {
      return err(c, 'CATEGORY_NOT_FOUND', 'Category not found', 404);
    }

    // Check if category has associated products
    const [prodCount] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(products)
      .where(eq(products.categoryId, id));

    if (prodCount && prodCount.count > 0) {
      return err(
        c,
        'CATEGORY_HAS_PRODUCTS',
        `Cannot delete category that contains ${prodCount.count} product(s)`,
        400
      );
    }

    // Check if category has child subcategories
    const [childCount] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(categories)
      .where(eq(categories.parentId, id));

    if (childCount && childCount.count > 0) {
      return err(
        c,
        'CATEGORY_HAS_CHILDREN',
        `Cannot delete category that contains ${childCount.count} subcategory/ies`,
        400
      );
    }

    await db.delete(categories).where(eq(categories.id, id));

    return ok(c, { deleted: true, id });
  } catch (error) {
    console.error('Admin delete category error:', error);
    return err(c, 'DELETE_CATEGORY_FAILED', 'Failed to delete category', 500);
  }
});
