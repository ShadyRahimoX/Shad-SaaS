import { Hono } from 'hono';
import { z } from 'zod';
import { db, users, debtTransactions } from '@shad-saas/db';
import { eq, and, or, ilike, asc, desc, sql, gt, lte } from 'drizzle-orm';
import { ok, err } from '../lib/response.js';

export const adminDebtsRoutes = new Hono();

// Protect all admin debt routes with X-Admin-Key
adminDebtsRoutes.use('*', async (c, next) => {
  const key = c.req.header('X-Admin-Key');
  const expected = process.env.ADMIN_SYNC_KEY;

  if (!expected || key !== expected) {
    return err(c, 'UNAUTHORIZED', 'Invalid admin key', 401);
  }

  await next();
});

const adjustDebtSchema = z.object({
  amount: z.number().refine((v) => v !== 0, 'Amount cannot be zero'),
  type: z.enum(['debt_increase', 'debt_decrease', 'debt_cleared', 'adjustment']),
  reason: z.string().max(200).optional(),
  note: z.string().min(1, 'Note is required').max(500),
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

// 1. GET /api/admin/debts/stats
adminDebtsRoutes.get('/stats', async (c) => {
  try {
    const [stats] = await db
      .select({
        totalUsersWithDebt: sql<number>`count(*) filter (where ${users.debtUsd}::numeric > 0)::int`,
        totalDebtUsd: sql<string>`coalesce(sum(${users.debtUsd}::numeric), 0)::numeric(20, 10)::text`,
        creditEnabledUsers: sql<number>`count(*) filter (where ${users.creditEnabled} = true)::int`,
        totalCreditLimitUsd: sql<string>`coalesce(sum(case when ${users.creditEnabled} = true then ${users.creditLimit}::numeric else 0 end), 0)::numeric(20, 10)::text`,
        debtsLast7Days: sql<number>`(SELECT count(*)::int FROM ${debtTransactions} dt WHERE dt.type = 'debt_increase' AND dt.created_at >= NOW() - INTERVAL '7 days')`,
        clearedLast30Days: sql<number>`(SELECT count(*)::int FROM ${debtTransactions} dt WHERE dt.type = 'debt_cleared' AND dt.created_at >= NOW() - INTERVAL '30 days')`,
      })
      .from(users);

    const availableCreditUsd = Number(stats?.totalCreditLimitUsd || 0) - Number(stats?.totalDebtUsd || 0);

    return ok(c, {
      totalUsersWithDebt: stats?.totalUsersWithDebt ?? 0,
      totalDebtUsd: stats?.totalDebtUsd ?? '0.0000000000',
      creditEnabledUsers: stats?.creditEnabledUsers ?? 0,
      totalCreditLimitUsd: stats?.totalCreditLimitUsd ?? '0.0000000000',
      availableCreditUsd: availableCreditUsd.toFixed(10),
      debtsLast7Days: stats?.debtsLast7Days ?? 0,
      clearedLast30Days: stats?.clearedLast30Days ?? 0,
    });
  } catch (error) {
    console.error('Admin debts stats error:', error);
    return err(c, 'ADMIN_DEBTS_STATS_FAILED', 'Failed to get debts stats', 500);
  }
});

// 2. GET /api/admin/debts
adminDebtsRoutes.get('/', async (c) => {
  const page = Math.max(1, Number(c.req.query('page') || 1));
  const limit = Math.min(100, Math.max(1, Number(c.req.query('limit') || 20)));
  const search = c.req.query('search');
  const status = c.req.query('status') || 'all';
  const sortBy = c.req.query('sortBy') || 'debt-desc';
  const offset = (page - 1) * limit;

  try {
    const conditions = [];

    // status filter
    if (status === 'with-debt') {
      conditions.push(gt(users.debtUsd, '0'));
    } else if (status === 'credit-enabled') {
      conditions.push(eq(users.creditEnabled, true));
    } else if (status === 'over-limit') {
      conditions.push(gt(users.debtUsd, sql`${users.creditLimit}::numeric`));
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
            eq(users.displayId, Number(term))
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

    let orderExpr = desc(sql`${users.debtUsd}::numeric`);
    if (sortBy === 'newest') {
      orderExpr = desc(users.createdAt);
    } else if (sortBy === 'credit-desc') {
      orderExpr = desc(sql`${users.creditLimit}::numeric`);
    }

    const rows = await db
      .select({
        id: users.id,
        displayId: users.displayId,
        username: users.username,
        email: users.email,
        phone: users.phone,
        avatarUrl: users.avatarUrl,
        debtUsd: users.debtUsd,
        creditEnabled: users.creditEnabled,
        creditLimit: users.creditLimit,
        banned: users.banned,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(whereClause)
      .orderBy(orderExpr)
      .limit(limit)
      .offset(offset);

    const mapped = rows.map((row) => {
      const creditLimit = Number(row.creditLimit);
      const debtUsd = Number(row.debtUsd);
      const availableCreditUsd = Math.max(0, creditLimit - debtUsd);
      const debtRatio = creditLimit > 0 ? debtUsd / creditLimit : 0;
      return { ...row, availableCreditUsd: availableCreditUsd.toFixed(10), debtRatio: Number(debtRatio.toFixed(2)) };
    });

    const [{ count }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(users)
      .where(whereClause);

    return ok(c, {
      users: mapped,
      total: count,
      page,
      limit,
    });
  } catch (error) {
    console.error('Admin list debts error:', error);
    return err(c, 'ADMIN_DEBTS_FAILED', 'Failed to list debts', 500);
  }
});

// 3. GET /api/admin/debts/:userId
adminDebtsRoutes.get('/:userId', async (c) => {
  const userIdParam = c.req.param('userId');

  try {
    const condition = getUserCondition(userIdParam);
    const [user] = await db.select().from(users).where(condition).limit(1);

    if (!user) {
      return err(c, 'USER_NOT_FOUND', 'User not found', 404);
    }

    const recentTransactions = await db
      .select()
      .from(debtTransactions)
      .where(eq(debtTransactions.userId, user.id))
      .orderBy(desc(debtTransactions.createdAt))
      .limit(10);

    const [summary] = await db
      .select({
        totalIncrease: sql<string>`coalesce(sum(case when ${debtTransactions.amountUsd}::numeric > 0 then ${debtTransactions.amountUsd}::numeric else 0 end), 0)::numeric(20, 10)::text`,
        totalPaid: sql<string>`coalesce(sum(case when ${debtTransactions.amountUsd}::numeric < 0 then abs(${debtTransactions.amountUsd}::numeric) else 0 end), 0)::numeric(20, 10)::text`,
        transactionCount: sql<number>`count(*)::int`,
      })
      .from(debtTransactions)
      .where(eq(debtTransactions.userId, user.id));

    const creditLimit = Number(user.creditLimit);
    const debtUsd = Number(user.debtUsd);
    const availableCreditUsd = Math.max(0, creditLimit - debtUsd);

    return ok(c, {
      user: {
        ...user,
        availableCreditUsd: availableCreditUsd.toFixed(10),
      },
      recentTransactions,
      summary,
    });
  } catch (error) {
    console.error('Admin get user debt error:', error);
    return err(c, 'ADMIN_GET_USER_DEBT_FAILED', 'Failed to get user debt details', 500);
  }
});

// 4. POST /api/admin/debts/:userId/adjust
adminDebtsRoutes.post('/:userId/adjust', async (c) => {
  const userIdParam = c.req.param('userId');
  const body = await c.req.json().catch(() => null);
  if (!body) return err(c, 'INVALID_BODY', 'Invalid JSON body', 400);

  const result = adjustDebtSchema.safeParse(body);
  if (!result.success) {
    return err(c, 'VALIDATION_ERROR', result.error.errors.map((e) => e.message).join(', '), 400);
  }

  const { amount, type, reason, note } = result.data;

  try {
    const txResult = await db.transaction(async (tx) => {
      const condition = getUserCondition(userIdParam);
      const [userRow] = await tx
        .select()
        .from(users)
        .where(condition)
        .for('update')
        .limit(1);

      if (!userRow) {
        throw { status: 404, code: 'USER_NOT_FOUND', message: 'User not found' };
      }

      if (amount > 0 && !userRow.creditEnabled) {
        throw { status: 400, code: 'CREDIT_NOT_ENABLED', message: 'Credit is not enabled for this user' };
      }

      const currentDebt = Number(userRow.debtUsd) || 0;
      const creditLimit = Number(userRow.creditLimit) || 0;
      const delta = Number(amount);
      const newDebt = currentDebt + delta;

      if (amount > 0 && newDebt > creditLimit) {
        throw {
          status: 400,
          code: 'EXCEEDS_CREDIT_LIMIT',
          message: `Cannot increase debt to ${newDebt} because it exceeds credit limit ${creditLimit}`,
        };
      }

      if (amount < 0 && newDebt < 0) {
        throw {
          status: 400,
          code: 'OVERPAYMENT',
          message: `Cannot pay ${Math.abs(amount)} because it exceeds debt ${currentDebt}`,
        };
      }

      const formattedNewDebt = newDebt.toFixed(10);
      const formattedDelta = delta.toFixed(10);
      const formattedBefore = currentDebt.toFixed(10);

      const [updatedUser] = await tx
        .update(users)
        .set({
          debtUsd: formattedNewDebt,
          updatedAt: new Date(),
        })
        .where(eq(users.id, userRow.id))
        .returning();

      const [createdTx] = await tx
        .insert(debtTransactions)
        .values({
          userId: userRow.id,
          amountUsd: formattedDelta,
          balanceBefore: formattedBefore,
          balanceAfter: formattedNewDebt,
          type: type,
          reason: reason,
          description: note,
        })
        .returning();

      return {
        user: updatedUser,
        transaction: createdTx,
      };
    });

    return ok(c, txResult);
  } catch (error: any) {
    if (error && error.status && error.code) {
      return err(c, error.code, error.message, error.status);
    }
    console.error('Admin adjust debt error:', error);
    return err(c, 'ADJUST_DEBT_FAILED', 'Failed to adjust debt', 500);
  }
});

// 5. GET /api/admin/debts/:userId/history
adminDebtsRoutes.get('/:userId/history', async (c) => {
  const userIdParam = c.req.param('userId');
  const page = Math.max(1, Number(c.req.query('page') || 1));
  const limit = Math.min(100, Math.max(1, Number(c.req.query('limit') || 20)));
  const typeFilter = c.req.query('type');
  const offset = (page - 1) * limit;

  try {
    const condition = getUserCondition(userIdParam);
    const [userRow] = await db.select({ id: users.id }).from(users).where(condition).limit(1);

    if (!userRow) {
      return err(c, 'USER_NOT_FOUND', 'User not found', 404);
    }

    const conditions = [eq(debtTransactions.userId, userRow.id)];
    if (typeFilter) conditions.push(eq(debtTransactions.type, typeFilter));

    const rows = await db
      .select()
      .from(debtTransactions)
      .where(and(...conditions))
      .orderBy(desc(debtTransactions.createdAt))
      .limit(limit)
      .offset(offset);

    const [{ count }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(debtTransactions)
      .where(and(...conditions));

    return ok(c, {
      transactions: rows,
      total: count,
      page,
      limit,
    });
  } catch (error) {
    console.error('Admin debt history error:', error);
    return err(c, 'DEBT_HISTORY_FAILED', 'Failed to get debt history', 500);
  }
});
