import { Hono } from 'hono';
import { z } from 'zod';
import { db, agents, users } from '@shad-saas/db';
import { eq, and, or, ilike, asc, desc, sql } from 'drizzle-orm';
import { ok, err } from '../lib/response.js';

export const adminAgentsRoutes = new Hono();

// Protect all admin agent routes with X-Admin-Key
adminAgentsRoutes.use('*', async (c, next) => {
  const key = c.req.header('X-Admin-Key');
  const expected = process.env.ADMIN_SYNC_KEY;

  if (!expected || key !== expected) {
    return err(c, 'UNAUTHORIZED', 'Invalid admin key', 401);
  }

  await next();
});

const createAgentSchema = z.object({
  name: z.string().min(2).max(100),
  phone: z.string().max(50).optional().nullable(),
  address: z.string().max(200).optional().nullable(),
  callSign: z.string().max(50).optional().nullable(),
  commissionPercent: z.union([z.string(), z.number()]).optional(),
  active: z.boolean().optional(),
  notes: z.string().max(1000).optional().nullable(),
  userId: z.string().uuid().optional().nullable(),
});

const updateAgentSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  phone: z.string().max(50).optional().nullable(),
  address: z.string().max(200).optional().nullable(),
  callSign: z.string().max(50).optional().nullable(),
  commissionPercent: z.union([z.string(), z.number()]).optional(),
  active: z.boolean().optional(),
  notes: z.string().max(1000).optional().nullable(),
  userId: z.string().uuid().optional().nullable(),
});

// 1. GET /api/admin/agents/stats
adminAgentsRoutes.get('/stats', async (c) => {
  try {
    const [stats] = await db
      .select({
        total: sql<number>`count(*)::int`,
        active: sql<number>`count(*) filter (where ${agents.active} = true)::int`,
        inactive: sql<number>`count(*) filter (where ${agents.active} = false)::int`,
        linkedToUsers: sql<number>`count(*) filter (where ${agents.userId} is not null)::int`,
        avgCommissionPercent: sql<string>`coalesce(avg(${agents.commissionPercent}::numeric), 0)::numeric(5, 2)::text`,
        newLast30Days: sql<number>`count(*) filter (where ${agents.createdAt} >= NOW() - INTERVAL '30 days')::int`,
      })
      .from(agents);

    return ok(c, {
      total: stats?.total ?? 0,
      active: stats?.active ?? 0,
      inactive: stats?.inactive ?? 0,
      linkedToUsers: stats?.linkedToUsers ?? 0,
      avgCommissionPercent: stats?.avgCommissionPercent ?? '0.00',
      newLast30Days: stats?.newLast30Days ?? 0,
    });
  } catch (error) {
    console.error('Admin agents stats error:', error);
    return err(c, 'ADMIN_AGENTS_STATS_FAILED', 'Failed to get agents stats', 500);
  }
});

// 2. GET /api/admin/agents
adminAgentsRoutes.get('/', async (c) => {
  const page = Math.max(1, Number(c.req.query('page') || 1));
  const limit = Math.min(100, Math.max(1, Number(c.req.query('limit') || 20)));
  const search = c.req.query('search');
  const status = c.req.query('status') || 'all';
  const sortBy = c.req.query('sortBy') || 'newest';
  const offset = (page - 1) * limit;

  try {
    const conditions = [];

    if (status === 'active') {
      conditions.push(eq(agents.active, true));
    } else if (status === 'inactive') {
      conditions.push(eq(agents.active, false));
    }

    if (search && search.trim()) {
      const term = search.trim();
      conditions.push(
        or(
          ilike(agents.name, `%${term}%`),
          ilike(agents.phone, `%${term}%`),
          ilike(agents.callSign, `%${term}%`)
        )
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    let orderExpr = desc(agents.createdAt);
    if (sortBy === 'name') {
      orderExpr = asc(agents.name);
    } else if (sortBy === 'commission-desc') {
      orderExpr = desc(sql`${agents.commissionPercent}::numeric`);
    }

    const rows = await db
      .select({
        id: agents.id,
        userId: agents.userId,
        username: users.username,
        name: agents.name,
        phone: agents.phone,
        address: agents.address,
        callSign: agents.callSign,
        commissionPercent: agents.commissionPercent,
        active: agents.active,
        notes: agents.notes,
        createdAt: agents.createdAt,
        updatedAt: agents.updatedAt,
      })
      .from(agents)
      .leftJoin(users, eq(agents.userId, users.id))
      .where(whereClause)
      .orderBy(orderExpr)
      .limit(limit)
      .offset(offset);

    const [{ count }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(agents)
      .leftJoin(users, eq(agents.userId, users.id))
      .where(whereClause);

    return ok(c, {
      agents: rows,
      total: count,
      page,
      limit,
    });
  } catch (error) {
    console.error('Admin list agents error:', error);
    return err(c, 'ADMIN_AGENTS_FAILED', 'Failed to list agents', 500);
  }
});

// 3. GET /api/admin/agents/:id
adminAgentsRoutes.get('/:id', async (c) => {
  const id = c.req.param('id');

  try {
    const [row] = await db
      .select({
        id: agents.id,
        userId: agents.userId,
        username: users.username,
        name: agents.name,
        phone: agents.phone,
        address: agents.address,
        callSign: agents.callSign,
        commissionPercent: agents.commissionPercent,
        active: agents.active,
        notes: agents.notes,
        createdAt: agents.createdAt,
        updatedAt: agents.updatedAt,
      })
      .from(agents)
      .leftJoin(users, eq(agents.userId, users.id))
      .where(eq(agents.id, id))
      .limit(1);

    if (!row) {
      return err(c, 'AGENT_NOT_FOUND', 'Agent not found', 404);
    }

    return ok(c, row);
  } catch (error) {
    console.error('Admin get agent error:', error);
    return err(c, 'ADMIN_GET_AGENT_FAILED', 'Failed to get agent details', 500);
  }
});

// 4. POST /api/admin/agents
adminAgentsRoutes.post('/', async (c) => {
  const body = await c.req.json().catch(() => null);
  if (!body) return err(c, 'INVALID_BODY', 'Invalid JSON body', 400);

  const result = createAgentSchema.safeParse(body);
  if (!result.success) {
    return err(c, 'VALIDATION_ERROR', result.error.errors.map((e) => e.message).join(', '), 400);
  }

  const data = result.data;

  try {
    if (data.userId) {
      const [userExists] = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.id, data.userId))
        .limit(1);

      if (!userExists) {
        return err(c, 'USER_NOT_FOUND', 'Linked user not found', 404);
      }
    }

    const commission = data.commissionPercent !== undefined ? String(data.commissionPercent) : '0';

    const [created] = await db
      .insert(agents)
      .values({
        name: data.name,
        phone: data.phone || null,
        address: data.address || null,
        callSign: data.callSign || null,
        commissionPercent: commission,
        active: data.active ?? true,
        notes: data.notes || null,
        userId: data.userId || null,
      })
      .returning();

    // Fetch with username
    const [row] = await db
      .select({
        id: agents.id,
        userId: agents.userId,
        username: users.username,
        name: agents.name,
        phone: agents.phone,
        address: agents.address,
        callSign: agents.callSign,
        commissionPercent: agents.commissionPercent,
        active: agents.active,
        notes: agents.notes,
        createdAt: agents.createdAt,
        updatedAt: agents.updatedAt,
      })
      .from(agents)
      .leftJoin(users, eq(agents.userId, users.id))
      .where(eq(agents.id, created.id))
      .limit(1);

    return ok(c, row, 201);
  } catch (error) {
    console.error('Admin create agent error:', error);
    return err(c, 'CREATE_AGENT_FAILED', 'Failed to create agent', 500);
  }
});

// 5. PATCH /api/admin/agents/:id
adminAgentsRoutes.patch('/:id', async (c) => {
  const id = c.req.param('id');
  const body = await c.req.json().catch(() => null);
  if (!body) return err(c, 'INVALID_BODY', 'Invalid JSON body', 400);

  const result = updateAgentSchema.safeParse(body);
  if (!result.success) {
    return err(c, 'VALIDATION_ERROR', result.error.errors.map((e) => e.message).join(', '), 400);
  }

  const data = result.data;

  try {
    const [existing] = await db.select({ id: agents.id }).from(agents).where(eq(agents.id, id)).limit(1);
    if (!existing) {
      return err(c, 'AGENT_NOT_FOUND', 'Agent not found', 404);
    }

    if (data.userId !== undefined && data.userId !== null) {
      const [userExists] = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.id, data.userId))
        .limit(1);

      if (!userExists) {
        return err(c, 'USER_NOT_FOUND', 'Linked user not found', 404);
      }
    }

    const updatePayload: Record<string, any> = {
      updatedAt: new Date(),
    };
    if (data.name !== undefined) updatePayload.name = data.name;
    if (data.phone !== undefined) updatePayload.phone = data.phone ? data.phone : null;
    if (data.address !== undefined) updatePayload.address = data.address ? data.address : null;
    if (data.callSign !== undefined) updatePayload.callSign = data.callSign ? data.callSign : null;
    if (data.commissionPercent !== undefined) updatePayload.commissionPercent = String(data.commissionPercent);
    if (data.active !== undefined) updatePayload.active = data.active;
    if (data.notes !== undefined) updatePayload.notes = data.notes ? data.notes : null;
    if (data.userId !== undefined) updatePayload.userId = data.userId ? data.userId : null;

    await db.update(agents).set(updatePayload).where(eq(agents.id, id));

    const [row] = await db
      .select({
        id: agents.id,
        userId: agents.userId,
        username: users.username,
        name: agents.name,
        phone: agents.phone,
        address: agents.address,
        callSign: agents.callSign,
        commissionPercent: agents.commissionPercent,
        active: agents.active,
        notes: agents.notes,
        createdAt: agents.createdAt,
        updatedAt: agents.updatedAt,
      })
      .from(agents)
      .leftJoin(users, eq(agents.userId, users.id))
      .where(eq(agents.id, id))
      .limit(1);

    return ok(c, row);
  } catch (error) {
    console.error('Admin update agent error:', error);
    return err(c, 'UPDATE_AGENT_FAILED', 'Failed to update agent', 500);
  }
});

// 6. DELETE /api/admin/agents/:id
adminAgentsRoutes.delete('/:id', async (c) => {
  const id = c.req.param('id');

  try {
    const [existing] = await db.select({ id: agents.id }).from(agents).where(eq(agents.id, id)).limit(1);
    if (!existing) {
      return err(c, 'AGENT_NOT_FOUND', 'Agent not found', 404);
    }

    await db.delete(agents).where(eq(agents.id, id));

    return ok(c, { deleted: true, id });
  } catch (error) {
    console.error('Admin delete agent error:', error);
    return err(c, 'DELETE_AGENT_FAILED', 'Failed to delete agent', 500);
  }
});
