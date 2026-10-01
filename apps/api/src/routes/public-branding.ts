import { Hono } from 'hono';
import { ok, err } from '../lib/response.js';
import { db, settings } from '@shad-saas/db';
import { and, eq, asc } from 'drizzle-orm';

export const publicBrandingRoutes = new Hono();

// GET /api/public/branding
publicBrandingRoutes.get('/', async (c) => {
  try {
    const rows = await db
      .select()
      .from(settings)
      .where(and(eq(settings.category, 'branding'), eq(settings.isPublic, true)))
      .orderBy(asc(settings.key));

    const flat: Record<string, any> = {};
    for (const row of rows) {
      const cleanKey = row.key.startsWith('branding_')
        ? row.key.replace(/^branding_/, '')
        : row.key;
      flat[cleanKey] = row.value;
    }

    return ok(c, flat);
  } catch (error) {
    console.error('getPublicBranding error:', error);
    return err(c, 'GET_BRANDING_FAILED', 'Failed to retrieve branding settings', 500);
  }
});
