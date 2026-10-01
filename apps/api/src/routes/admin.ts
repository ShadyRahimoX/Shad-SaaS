import { Hono } from 'hono';
import { ok, err } from '../lib/response.js';
import { syncAlkasrCategories, syncAlkasrProducts } from '../services/alkasr-sync.js';
import { setManualVip, clearManualVip, getAllVipLevels } from '../services/vip.service.js';
import { db, users, vipLevels } from '@shad-saas/db';
import { eq, desc, sql } from 'drizzle-orm';

export const adminRoutes = new Hono();

// Simple admin key middleware for protected admin sync endpoints
adminRoutes.use('*', async (c, next) => {
  const key = c.req.header('X-Admin-Key');
  const expected = process.env.ADMIN_SYNC_KEY;

  if (!expected || key !== expected) {
    return err(c, 'UNAUTHORIZED', 'Invalid admin key', 401);
  }

  await next();
});

adminRoutes.post('/sync/alkasr-categories', async (c) => {
  try {
    const result = await syncAlkasrCategories();
    return ok(c, result);
  } catch (error) {
    console.error('Sync categories failed:', error);
    return err(c, 'SYNC_FAILED', String(error), 500);
  }
});

adminRoutes.post('/sync/alkasr-products', async (c) => {
  try {
    const result = await syncAlkasrProducts();
    return ok(c, result);
  } catch (error) {
    console.error('Sync products failed:', error);
    return err(c, 'SYNC_FAILED', String(error), 500);
  }
});

// GET /api/admin/vip/levels
adminRoutes.get('/vip/levels', async (c) => {
  try {
    const levels = await getAllVipLevels();
    return ok(c, levels);
  } catch (error) {
    return err(c, 'VIP_LEVELS_FAILED', String(error), 500);
  }
});

// POST /api/admin/vip/users/:userId/assign
adminRoutes.post('/vip/users/:userId/assign', async (c) => {
  const userId = c.req.param('userId');
  const body = await c.req.json().catch(() => null);
  if (!body?.levelId) return err(c, 'MISSING_LEVEL_ID', 'levelId is required', 400);

  try {
    const result = await setManualVip(userId, body.levelId);
    return ok(c, result);
  } catch (error) {
    return err(c, 'VIP_ASSIGN_FAILED', String(error), 500);
  }
});

// POST /api/admin/vip/users/:userId/clear-manual
adminRoutes.post('/vip/users/:userId/clear-manual', async (c) => {
  const userId = c.req.param('userId');
  try {
    const result = await clearManualVip(userId);
    return ok(c, result);
  } catch (error) {
    return err(c, 'VIP_CLEAR_FAILED', String(error), 500);
  }
});

// GET /api/admin/vip/users/:userId
adminRoutes.get('/vip/users/:userId', async (c) => {
  const userId = c.req.param('userId');
  try {
    const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (!user) return err(c, 'NOT_FOUND', 'User not found', 404);
    
    const [level] = user.vipLevelId 
      ? await db.select().from(vipLevels).where(eq(vipLevels.id, user.vipLevelId)).limit(1)
      : [null];
    
    return ok(c, {
      userId: user.id,
      username: user.username,
      totalSpentUsd: user.totalSpentUsd,
      cashbackBalanceUsd: user.cashbackBalanceUsd,
      vipIsManual: user.vipIsManual,
      currentLevel: level,
    });
  } catch (error) {
    return err(c, 'VIP_USER_FAILED', String(error), 500);
  }
});
