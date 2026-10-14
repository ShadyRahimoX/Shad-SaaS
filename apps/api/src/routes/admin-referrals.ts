import { Hono } from 'hono';
import { db, referrals, referralCommissions, users } from '@shad-saas/db';
import { eq, and, or, ilike, asc, desc, sql, sum, count } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import { ok, err } from '../lib/response.js';

export const adminReferralsRoutes = new Hono();

// Protect all admin referral routes with X-Admin-Key
adminReferralsRoutes.use('*', async (c, next) => {
  const key = c.req.header('X-Admin-Key');
  const expected = process.env.ADMIN_SYNC_KEY;

  if (!expected || key !== expected) {
    return err(c, 'UNAUTHORIZED', 'Invalid admin key', 401);
  }

  await next();
});

const referrerUser = alias(users, 'referrer');
const referredUser = alias(users, 'referred');

// 1. GET /api/admin/referrals/stats
adminReferralsRoutes.get('/stats', async (c) => {
  try {
    const [stats] = await db
      .select({
        totalReferrals: sql<number>`count(*)::int`,
        totalCommissionPaidUsd: sql<string>`coalesce(sum(${referrals.totalEarnedUsd}::numeric), 0)::numeric(20, 10)::text`,
        commissionsLast7Days: sql<number>`(SELECT count(*)::int FROM ${referralCommissions} rc WHERE rc.created_at >= NOW() - INTERVAL '7 days')`,
        referralsLast7Days: sql<number>`count(*) filter (where ${referrals.createdAt} >= NOW() - INTERVAL '7 days')::int`,
      })
      .from(referrals);

    // Active referrers (referrers with at least 1 referral)
    const [activeRefRow] = await db
      .select({
        activeReferrers: sql<number>`count(DISTINCT ${referrals.referrerId})::int`,
      })
      .from(referrals);

    // Total referral balance held by users
    const [balanceRow] = await db
      .select({
        totalReferralBalanceHeldUsd: sql<string>`coalesce(sum(${users.referralBalanceUsd}::numeric), 0)::numeric(20, 10)::text`,
      })
      .from(users);

    return ok(c, {
      totalReferrals: stats?.totalReferrals ?? 0,
      totalCommissionPaidUsd: stats?.totalCommissionPaidUsd ?? '0.0000000000',
      totalReferralBalanceHeldUsd: balanceRow?.totalReferralBalanceHeldUsd ?? '0.0000000000',
      activeReferrers: activeRefRow?.activeReferrers ?? 0,
      commissionsLast7Days: stats?.commissionsLast7Days ?? 0,
      referralsLast7Days: stats?.referralsLast7Days ?? 0,
    });
  } catch (error) {
    console.error('Admin referrals stats error:', error);
    return err(c, 'ADMIN_REFERRALS_STATS_FAILED', 'Failed to get referrals stats', 500);
  }
});

// 2. GET /api/admin/referrals
adminReferralsRoutes.get('/', async (c) => {
  const page = Math.max(1, Number(c.req.query('page') || 1));
  const limit = Math.min(100, Math.max(1, Number(c.req.query('limit') || 20)));
  const search = c.req.query('search');
  const sortBy = c.req.query('sortBy') || 'newest';
  const offset = (page - 1) * limit;

  try {
    const conditions = [];

    if (search && search.trim()) {
      const term = search.trim();
      conditions.push(
        or(
          ilike(referrerUser.username, `%${term}%`),
          ilike(referrerUser.email, `%${term}%`),
          ilike(referredUser.username, `%${term}%`),
          ilike(referredUser.email, `%${term}%`)
        )
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    let orderExpr = desc(referrals.createdAt);
    if (sortBy === 'totalEarned-desc') {
      orderExpr = desc(sql`${referrals.totalEarnedUsd}::numeric`);
    } else if (sortBy === 'ordersCount-desc') {
      orderExpr = desc(referrals.totalOrdersCount);
    }

    const rows = await db
      .select({
        id: referrals.id,
        referrerId: referrals.referrerId,
        referrerUsername: referrerUser.username,
        referrerEmail: referrerUser.email,
        referredUserId: referrals.referredUserId,
        referredUsername: referredUser.username,
        referredEmail: referredUser.email,
        referralCode: referrals.referralCode,
        commissionPercent: referrals.commissionPercent,
        totalEarnedUsd: referrals.totalEarnedUsd,
        totalOrdersCount: referrals.totalOrdersCount,
        createdAt: referrals.createdAt,
        updatedAt: referrals.updatedAt,
      })
      .from(referrals)
      .innerJoin(referrerUser, eq(referrals.referrerId, referrerUser.id))
      .innerJoin(referredUser, eq(referrals.referredUserId, referredUser.id))
      .where(whereClause)
      .orderBy(orderExpr)
      .limit(limit)
      .offset(offset);

    const [{ count }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(referrals)
      .innerJoin(referrerUser, eq(referrals.referrerId, referrerUser.id))
      .innerJoin(referredUser, eq(referrals.referredUserId, referredUser.id))
      .where(whereClause);

    return ok(c, {
      referrals: rows,
      total: count,
      page,
      limit,
    });
  } catch (error) {
    console.error('Admin list referrals error:', error);
    return err(c, 'ADMIN_REFERRALS_FAILED', 'Failed to list referrals', 500);
  }
});

// 3. GET /api/admin/referrals/top-referrers
adminReferralsRoutes.get('/top-referrers', async (c) => {
  const limit = Math.min(50, Math.max(1, Number(c.req.query('limit') || 10)));

  try {
    const rows = await db
      .select({
        userId: referrerUser.id,
        displayId: referrerUser.displayId,
        username: referrerUser.username,
        email: referrerUser.email,
        referralCode: referrerUser.referralCode,
        referralBalanceUsd: referrerUser.referralBalanceUsd,
        totalReferred: sql<number>`count(${referrals.id})::int`,
        totalEarnedUsd: sql<string>`coalesce(sum(${referrals.totalEarnedUsd}::numeric), 0)::numeric(20, 10)::text`,
        totalOrdersCount: sql<number>`coalesce(sum(${referrals.totalOrdersCount}), 0)::int`,
      })
      .from(users)
      .innerJoin(referrals, eq(users.id, referrals.referrerId))
      .leftJoin(referrerUser, eq(users.id, referrerUser.id))
      .groupBy(
        referrerUser.id,
        referrerUser.displayId,
        referrerUser.username,
        referrerUser.email,
        referrerUser.referralCode,
        referrerUser.referralBalanceUsd
      )
      .orderBy(desc(sql`sum(${referrals.totalEarnedUsd}::numeric)`))
      .limit(limit);

    return ok(c, {
      referrers: rows,
    });
  } catch (error) {
    console.error('Admin top referrers error:', error);
    return err(c, 'ADMIN_TOP_REFERRERS_FAILED', 'Failed to get top referrers', 500);
  }
});

// 4. GET /api/admin/referrals/:id
adminReferralsRoutes.get('/:id', async (c) => {
  const id = c.req.param('id');

  try {
    const [row] = await db
      .select({
        id: referrals.id,
        referrerId: referrals.referrerId,
        referrerUsername: referrerUser.username,
        referrerEmail: referrerUser.email,
        referredUserId: referrals.referredUserId,
        referredUsername: referredUser.username,
        referredEmail: referredUser.email,
        referralCode: referrals.referralCode,
        commissionPercent: referrals.commissionPercent,
        totalEarnedUsd: referrals.totalEarnedUsd,
        totalOrdersCount: referrals.totalOrdersCount,
        createdAt: referrals.createdAt,
        updatedAt: referrals.updatedAt,
      })
      .from(referrals)
      .innerJoin(referrerUser, eq(referrals.referrerId, referrerUser.id))
      .innerJoin(referredUser, eq(referrals.referredUserId, referredUser.id))
      .where(eq(referrals.id, id))
      .limit(1);

    if (!row) {
      return err(c, 'REFERRAL_NOT_FOUND', 'Referral relationship not found', 404);
    }

    return ok(c, row);
  } catch (error) {
    console.error('Admin get referral error:', error);
    return err(c, 'ADMIN_GET_REFERRAL_FAILED', 'Failed to get referral details', 500);
  }
});

// 5. GET /api/admin/referrals/:id/commissions
adminReferralsRoutes.get('/:id/commissions', async (c) => {
  const referralId = c.req.param('id');
  const page = Math.max(1, Number(c.req.query('page') || 1));
  const limit = Math.min(100, Math.max(1, Number(c.req.query('limit') || 20)));
  const offset = (page - 1) * limit;

  try {
    // Check referral exists
    const [exists] = await db
      .select({ id: referrals.id })
      .from(referrals)
      .where(eq(referrals.id, referralId))
      .limit(1);

    if (!exists) {
      return err(c, 'REFERRAL_NOT_FOUND', 'Referral relationship not found', 404);
    }

    const rows = await db
      .select({
        id: referralCommissions.id,
        referralId: referralCommissions.referralId,
        orderId: referralCommissions.orderId,
        orderAmountUsd: referralCommissions.orderAmountUsd,
        orderProfitUsd: referralCommissions.orderProfitUsd,
        commissionUsd: referralCommissions.commissionUsd,
        createdAt: referralCommissions.createdAt,
      })
      .from(referralCommissions)
      .where(eq(referralCommissions.referralId, referralId))
      .orderBy(desc(referralCommissions.createdAt))
      .limit(limit)
      .offset(offset);

    const [{ count }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(referralCommissions)
      .where(eq(referralCommissions.referralId, referralId));

    return ok(c, {
      commissions: rows,
      total: count,
      page,
      limit,
    });
  } catch (error) {
    console.error('Admin referral commissions error:', error);
    return err(c, 'ADMIN_REFERRAL_COMMISSIONS_FAILED', 'Failed to get referral commissions', 500);
  }
});
