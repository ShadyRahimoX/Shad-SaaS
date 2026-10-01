import { Hono } from 'hono';
import { ok, err } from '../lib/response.js';
import { syncAlkasrCategories, syncAlkasrProducts } from '../services/alkasr-sync.js';

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
