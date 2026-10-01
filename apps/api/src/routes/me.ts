import { Hono } from 'hono';
import { ok, err } from '../lib/response.js';
import { requireAuth, type AuthVariables } from '../middleware/auth.js';
import { getVipInfo, getAllVipLevels } from '../services/vip.service.js';
import { getReferralInfo, listUserReferrals, listReferralCommissions } from '../services/referrals.service.js';
import { db, referrals } from '@shad-saas/db';
import { and, eq } from 'drizzle-orm';

export const meRoutes = new Hono<{ Variables: AuthVariables }>();

meRoutes.use('*', requireAuth);

// GET /api/me/vip
meRoutes.get('/vip', async (c) => {
  const userId = c.get('userId');
  try {
    const info = await getVipInfo(userId);
    if (!info) return err(c, 'NOT_FOUND', 'User not found', 404);
    return ok(c, info);
  } catch (error) {
    console.error('getVipInfo error:', error);
    return err(c, 'VIP_INFO_FAILED', 'Failed to get VIP info', 500);
  }
});

// GET /api/me/vip/levels
meRoutes.get('/vip/levels', async (c) => {
  try {
    const levels = await getAllVipLevels();
    return ok(c, levels.map(l => ({
      level: l.levelNumber,
      name: l.name,
      minSpendingUsd: Number(l.minSpendingUsd),
      centDiscountPercent: Number(l.centDiscountPercent),
      profitFloorPercent: Number(l.profitFloorPercent),
      cashbackPercent: Number(l.cashbackPercent),
      color: l.color,
      badgeUrl: l.badgeUrl,
    })));
  } catch (error) {
    console.error('getAllVipLevels error:', error);
    return err(c, 'VIP_LEVELS_FAILED', 'Failed to get VIP levels', 500);
  }
});

// GET /api/me/referrals
meRoutes.get('/referrals', async (c) => {
  const userId = c.get('userId');
  try {
    const info = await getReferralInfo(userId);
    if (!info) return err(c, 'NOT_FOUND', 'User not found', 404);
    return ok(c, info);
  } catch (error) {
    console.error('getReferralInfo error:', error);
    return err(c, 'REFERRAL_INFO_FAILED', 'Failed to get referral info', 500);
  }
});

// GET /api/me/referrals/list
meRoutes.get('/referrals/list', async (c) => {
  const userId = c.get('userId');
  const page = Math.max(1, Number(c.req.query('page') || 1));
  const limit = Math.min(50, Math.max(1, Number(c.req.query('limit') || 20)));
  try {
    const result = await listUserReferrals(userId, page, limit);
    return ok(c, result);
  } catch (error) {
    console.error('listUserReferrals error:', error);
    return err(c, 'REFERRAL_LIST_FAILED', 'Failed to list referrals', 500);
  }
});

// GET /api/me/referrals/:referralId/commissions
meRoutes.get('/referrals/:referralId/commissions', async (c) => {
  const userId = c.get('userId');
  const referralId = c.req.param('referralId');
  const page = Math.max(1, Number(c.req.query('page') || 1));
  const limit = Math.min(50, Math.max(1, Number(c.req.query('limit') || 20)));

  try {
    // ⭐ Security check: verify ownership
    const [ref] = await db
      .select({ id: referrals.id })
      .from(referrals)
      .where(and(eq(referrals.id, referralId), eq(referrals.referrerId, userId)))
      .limit(1);

    if (!ref) {
      return err(c, 'NOT_FOUND', 'Referral not found', 404);
    }

    const result = await listReferralCommissions(referralId, page, limit);
    return ok(c, result);
  } catch (error) {
    console.error('listReferralCommissions error:', error);
    return err(c, 'COMMISSION_LIST_FAILED', 'Failed to list commissions', 500);
  }
});
