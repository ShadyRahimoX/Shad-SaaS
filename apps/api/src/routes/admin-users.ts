import { Hono } from 'hono';
import { z } from 'zod';
import { db, users, vipLevels, transactions, orders } from '@shad-saas/db';
import { eq, and, or, ilike, asc, desc, sql, gt, lte } from 'drizzle-orm';
import { ok, err } from '../lib/response.js';

export const adminUsersRoutes = new Hono();
export const adminWalletsRoutes = new Hono();

// Protect admin users routes with X-Admin-Key
adminUsersRoutes.use('*', async (c, next) => {
  const key = c.req.header('X-Admin-Key');
  const expected = process.env.ADMIN_SYNC_KEY;

  if (!expected || key !== expected) {
    return err(c, 'UNAUTHORIZED', 'Invalid admin key', 401);
  }

  await next();
});

// Protect admin wallets routes with X-Admin-Key
adminWalletsRoutes.use('*', async (c, next) => {
  const key = c.req.header('X-Admin-Key');
  const expected = process.env.ADMIN_SYNC_KEY;

  if (!expected || key !== expected) {
    return err(c, 'UNAUTHORIZED', 'Invalid admin key', 401);
  }

  await next();
});

const patchUserSchema = z.object({
  banned: z.boolean().optional(),
  firstName: z.string().max(100).optional().nullable(),
  lastName: z.string().max(100).optional().nullable(),
  phone: z.string().max(50).optional().nullable(),
  country: z.string().max(50).optional().nullable(),
});

const adjustBalanceSchema = z.object({
  amount: z.number().refine((v) => v !== 0, 'Amount cannot be zero'),
  reason: z.enum(['manual_credit', 'manual_debit', 'bonus', 'refund', 'correction']),
  note: z.string().min(1, 'Note is required').max(500),
});

// 1. GET /api/admin/users/stats
adminUsersRoutes.get('/stats', async (c) => {
  try {
    const [stats] = await db
      .select({
        total: sql<number>`count(*)::int`,
        banned: sql<number>`count(*) filter (where ${users.banned} = true)::int`,
        withBalance: sql<number>`count(*) filter (where ${users.balanceUsd}::numeric > 0)::int`,
        totalBalance: sql<string>`coalesce(sum(${users.balanceUsd}::numeric), 0)::numeric(20, 10)::text`,
        newLastWeek: sql<number>`count(*) filter (where ${users.createdAt} >= NOW() - INTERVAL '7 days')::int`,
      })
      .from(users);

    // VIP distribution counts
    const vipDistRows = await db
      .select({
        level: sql<number>`coalesce(${vipLevels.levelNumber}, 0)::int`,
        count: sql<number>`count(*)::int`,
      })
      .from(users)
      .leftJoin(vipLevels, eq(users.vipLevelId, vipLevels.id))
      .groupBy(sql`coalesce(${vipLevels.levelNumber}, 0)`);

    const vipDistribution: Record<string, number> = { '0': 0, '1': 0, '2': 0, '3': 0 };
    for (const r of vipDistRows) {
      vipDistribution[String(r.level)] = r.count;
    }

    return ok(c, {
      total: stats?.total ?? 0,
      banned: stats?.banned ?? 0,
      withBalance: stats?.withBalance ?? 0,
      totalBalance: stats?.totalBalance ?? '0.0000000000',
      newLastWeek: stats?.newLastWeek ?? 0,
      vipDistribution,
    });
  } catch (error) {
    console.error('Admin users stats error:', error);
    return err(c, 'ADMIN_USERS_STATS_FAILED', 'Failed to get users stats', 500);
  }
});

// 2. GET /api/admin/users
adminUsersRoutes.get('/', async (c) => {
  const page = Math.max(1, Number(c.req.query('page') || 1));
  const limit = Math.min(100, Math.max(1, Number(c.req.query('limit') || 20)));
  const search = c.req.query('search');
  const status = c.req.query('status') || 'all';
  const hasBalance = c.req.query('hasBalance') || 'all';
  const sortBy = c.req.query('sortBy') || 'newest';
  const offset = (page - 1) * limit;

  try {
    const conditions = [];

    // status filter
    if (status === 'active') {
      conditions.push(eq(users.banned, false));
    } else if (status === 'banned') {
      conditions.push(eq(users.banned, true));
    }

    // hasBalance filter
    if (hasBalance === 'true') {
      conditions.push(gt(users.balanceUsd, '0'));
    } else if (hasBalance === 'false') {
      conditions.push(lte(users.balanceUsd, '0'));
    }

    // search filter
    if (search && search.trim()) {
      const term = search.trim();
      const isNum = /^\d+$/.test(term);
      if (isNum) {
        conditions.push(
          or(
            ilike(users.username, `%${term}%`),
            ilike(users.email, `%${term}%`),
            ilike(users.firstName, `%${term}%`),
            ilike(users.lastName, `%${term}%`),
            eq(users.displayId, Number(term))
          )
        );
      } else {
        conditions.push(
          or(
            ilike(users.username, `%${term}%`),
            ilike(users.email, `%${term}%`),
            ilike(users.firstName, `%${term}%`),
            ilike(users.lastName, `%${term}%`)
          )
        );
      }
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // sort expression
    let orderExpr = desc(users.createdAt);
    if (sortBy === 'balance-desc') {
      orderExpr = desc(sql`${users.balanceUsd}::numeric`);
    } else if (sortBy === 'spent-desc') {
      orderExpr = desc(sql`${users.totalSpentUsd}::numeric`);
    } else if (sortBy === 'name') {
      orderExpr = asc(users.username);
    }

    const rows = await db
      .select({
        id: users.id,
        displayId: users.displayId,
        username: users.username,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        phone: users.phone,
        country: users.country,
        avatarUrl: users.avatarUrl,
        banned: users.banned,
        balanceUsd: users.balanceUsd,
        totalSpentUsd: users.totalSpentUsd,
        cashbackBalanceUsd: users.cashbackBalanceUsd,
        referralBalanceUsd: users.referralBalanceUsd,
        vipLevelId: users.vipLevelId,
        vipName: sql<string>`coalesce(${vipLevels.name}, 'New')`,
        vipColor: sql<string>`coalesce(${vipLevels.color}, '#6B7280')`,
        referralCode: users.referralCode,
        ordersCount: sql<number>`(SELECT count(*)::int FROM ${orders} o WHERE o.user_id = ${users.id})`,
        createdAt: users.createdAt,
        lastLoginAt: users.lastLoginAt,
      })
      .from(users)
      .leftJoin(vipLevels, eq(users.vipLevelId, vipLevels.id))
      .where(whereClause)
      .orderBy(orderExpr)
      .limit(limit)
      .offset(offset);

    const [{ count }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(users)
      .where(whereClause);

    return ok(c, {
      users: rows,
      total: count,
      page,
      limit,
    });
  } catch (error) {
    console.error('Admin list users error:', error);
    return err(c, 'ADMIN_USERS_FAILED', 'Failed to list users', 500);
  }
});

// Helper to resolve user condition from idParam (UUID or displayId)
function getUserCondition(idParam: string) {
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idParam);
  const isNum = /^\d+$/.test(idParam);

  if (!isUuid && isNum) {
    return eq(users.displayId, Number(idParam));
  }
  return eq(users.id, idParam);
}

// 3. GET /api/admin/users/:id
adminUsersRoutes.get('/:id', async (c) => {
  const idParam = c.req.param('id');

  try {
    const condition = getUserCondition(idParam);

    const [row] = await db
      .select({
        id: users.id,
        displayId: users.displayId,
        username: users.username,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        phone: users.phone,
        country: users.country,
        avatarUrl: users.avatarUrl,
        banned: users.banned,
        balanceUsd: users.balanceUsd,
        totalSpentUsd: users.totalSpentUsd,
        cashbackBalanceUsd: users.cashbackBalanceUsd,
        referralBalanceUsd: users.referralBalanceUsd,
        vipLevelId: users.vipLevelId,
        vipName: sql<string>`coalesce(${vipLevels.name}, 'New')`,
        vipColor: sql<string>`coalesce(${vipLevels.color}, '#6B7280')`,
        referralCode: users.referralCode,
        referredBy: users.referredBy,
        emailVerified: users.emailVerified,
        googleId: users.googleId,
        ordersCount: sql<number>`(SELECT count(*)::int FROM ${orders} o WHERE o.user_id = ${users.id})`,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
        lastLoginAt: users.lastLoginAt,
      })
      .from(users)
      .leftJoin(vipLevels, eq(users.vipLevelId, vipLevels.id))
      .where(condition)
      .limit(1);

    if (!row) {
      return err(c, 'USER_NOT_FOUND', 'User not found', 404);
    }

    return ok(c, row);
  } catch (error) {
    console.error('Admin get user error:', error);
    return err(c, 'ADMIN_GET_USER_FAILED', 'Failed to get user details', 500);
  }
});

// 4. PATCH /api/admin/users/:id
adminUsersRoutes.patch('/:id', async (c) => {
  const idParam = c.req.param('id');
  const body = await c.req.json().catch(() => null);
  if (!body) return err(c, 'INVALID_BODY', 'Invalid JSON body', 400);

  const result = patchUserSchema.safeParse(body);
  if (!result.success) {
    return err(c, 'VALIDATION_ERROR', result.error.errors.map((e) => e.message).join(', '), 400);
  }

  const data = result.data;

  try {
    const condition = getUserCondition(idParam);
    const [existing] = await db.select({ id: users.id }).from(users).where(condition).limit(1);

    if (!existing) {
      return err(c, 'USER_NOT_FOUND', 'User not found', 404);
    }

    const updatePayload: Record<string, any> = {
      updatedAt: new Date(),
    };
    if (data.banned !== undefined) updatePayload.banned = data.banned;
    if (data.firstName !== undefined) updatePayload.firstName = data.firstName;
    if (data.lastName !== undefined) updatePayload.lastName = data.lastName;
    if (data.phone !== undefined) updatePayload.phone = data.phone;
    if (data.country !== undefined) updatePayload.country = data.country;

    const [updated] = await db
      .update(users)
      .set(updatePayload)
      .where(eq(users.id, existing.id))
      .returning();

    return ok(c, updated);
  } catch (error) {
    console.error('Admin patch user error:', error);
    return err(c, 'PATCH_USER_FAILED', 'Failed to update user', 500);
  }
});

// 5. POST /api/admin/users/:id/balance (Atomic transaction)
adminUsersRoutes.post('/:id/balance', async (c) => {
  const idParam = c.req.param('id');
  const body = await c.req.json().catch(() => null);
  if (!body) return err(c, 'INVALID_BODY', 'Invalid JSON body', 400);

  const result = adjustBalanceSchema.safeParse(body);
  if (!result.success) {
    return err(c, 'VALIDATION_ERROR', result.error.errors.map((e) => e.message).join(', '), 400);
  }

  const { amount, reason, note } = result.data;

  try {
    const txResult = await db.transaction(async (tx) => {
      const condition = getUserCondition(idParam);
      const [userRow] = await tx
        .select()
        .from(users)
        .where(condition)
        .for('update')
        .limit(1);

      if (!userRow) {
        throw { status: 404, code: 'USER_NOT_FOUND', message: 'User not found' };
      }

      const currentBalance = Number(userRow.balanceUsd) || 0;
      const delta = Number(amount);
      const newBalance = currentBalance + delta;

      if (delta < 0 && newBalance < 0) {
        throw {
          status: 400,
          code: 'INSUFFICIENT_BALANCE',
          message: `Cannot debit ${Math.abs(delta)} from current balance ${currentBalance}`,
        };
      }

      const formattedNewBalance = newBalance.toFixed(10);
      const formattedDelta = delta.toFixed(10);
      const formattedBefore = currentBalance.toFixed(10);

      const [updatedUser] = await tx
        .update(users)
        .set({
          balanceUsd: formattedNewBalance,
          updatedAt: new Date(),
        })
        .where(eq(users.id, userRow.id))
        .returning();

      const [createdTx] = await tx
        .insert(transactions)
        .values({
          userId: userRow.id,
          type: 'admin_adjustment',
          amountUsd: formattedDelta,
          balanceBefore: formattedBefore,
          balanceAfter: formattedNewBalance,
          referenceType: reason,
          description: note,
        })
        .returning();

      return {
        user: updatedUser,
        transaction: {
          id: createdTx.id,
          amountUsd: createdTx.amountUsd,
          type: createdTx.type,
          referenceType: createdTx.referenceType,
          description: createdTx.description,
          createdAt: createdTx.createdAt,
        },
      };
    });

    return ok(c, txResult);
  } catch (error: any) {
    if (error && error.status && error.code) {
      return err(c, error.code, error.message, error.status);
    }
    console.error('Admin balance adjustment error:', error);
    return err(c, 'BALANCE_ADJUSTMENT_FAILED', 'Failed to adjust user balance', 500);
  }
});

// 6. GET /api/admin/users/:id/transactions
adminUsersRoutes.get('/:id/transactions', async (c) => {
  const idParam = c.req.param('id');
  const page = Math.max(1, Number(c.req.query('page') || 1));
  const limit = Math.min(100, Math.max(1, Number(c.req.query('limit') || 20)));
  const offset = (page - 1) * limit;

  try {
    const condition = getUserCondition(idParam);
    const [userRow] = await db.select({ id: users.id }).from(users).where(condition).limit(1);

    if (!userRow) {
      return err(c, 'USER_NOT_FOUND', 'User not found', 404);
    }

    const rows = await db
      .select({
        id: transactions.id,
        userId: transactions.userId,
        type: transactions.type,
        amountUsd: transactions.amountUsd,
        balanceBefore: transactions.balanceBefore,
        balanceAfter: transactions.balanceAfter,
        referenceType: transactions.referenceType,
        referenceId: transactions.referenceId,
        description: transactions.description,
        createdAt: transactions.createdAt,
      })
      .from(transactions)
      .where(eq(transactions.userId, userRow.id))
      .orderBy(desc(transactions.createdAt))
      .limit(limit)
      .offset(offset);

    const [{ count }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(transactions)
      .where(eq(transactions.userId, userRow.id));

    return ok(c, {
      transactions: rows,
      total: count,
      page,
      limit,
    });
  } catch (error) {
    console.error('Admin user transactions error:', error);
    return err(c, 'USER_TRANSACTIONS_FAILED', 'Failed to get user transactions', 500);
  }
});

// 7. GET /api/admin/wallets/stats
adminWalletsRoutes.get('/stats', async (c) => {
  try {
    const [stats] = await db
      .select({
        totalBalance: sql<string>`coalesce(sum(${users.balanceUsd}::numeric), 0)::numeric(20, 10)::text`,
        totalCashback: sql<string>`coalesce(sum(${users.cashbackBalanceUsd}::numeric), 0)::numeric(20, 10)::text`,
        totalReferral: sql<string>`coalesce(sum(${users.referralBalanceUsd}::numeric), 0)::numeric(20, 10)::text`,
      })
      .from(users);

    const topUsers = await db
      .select({
        userId: users.id,
        username: users.username,
        balanceUsd: users.balanceUsd,
      })
      .from(users)
      .orderBy(desc(sql`${users.balanceUsd}::numeric`))
      .limit(5);

    return ok(c, {
      totalBalance: stats?.totalBalance ?? '0.0000000000',
      totalCashback: stats?.totalCashback ?? '0.0000000000',
      totalReferral: stats?.totalReferral ?? '0.0000000000',
      topBalances: topUsers,
    });
  } catch (error) {
    console.error('Admin wallets stats error:', error);
    return err(c, 'WALLETS_STATS_FAILED', 'Failed to get wallet stats', 500);
  }
});
