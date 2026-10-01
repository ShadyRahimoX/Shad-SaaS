import { Hono } from 'hono';
import { ok, err } from '../lib/response.js';
import {
  listThemes,
  getThemeBySlug,
  getActiveTheme,
  activateTheme,
  createTheme,
  updateTheme,
  deleteTheme,
} from '../services/themes.service.js';

export const adminThemesRoutes = new Hono();

// Auth middleware for admin themes routes
adminThemesRoutes.use('*', async (c, next) => {
  const key = c.req.header('X-Admin-Key');
  const expected = process.env.ADMIN_SYNC_KEY;

  if (!expected || key !== expected) {
    return err(c, 'UNAUTHORIZED', 'Invalid admin key', 401);
  }

  await next();
});

// GET /api/admin/themes/active
adminThemesRoutes.get('/active', async (c) => {
  try {
    const active = await getActiveTheme();
    return ok(c, active);
  } catch (error) {
    console.error('getActiveTheme error:', error);
    return err(c, 'GET_ACTIVE_THEME_FAILED', 'Failed to retrieve active theme', 500);
  }
});

// GET /api/admin/themes
adminThemesRoutes.get('/', async (c) => {
  try {
    const list = await listThemes();
    return ok(c, list);
  } catch (error) {
    console.error('listThemes error:', error);
    return err(c, 'LIST_THEMES_FAILED', 'Failed to retrieve themes', 500);
  }
});

// GET /api/admin/themes/:slug
adminThemesRoutes.get('/:slug', async (c) => {
  const slug = c.req.param('slug');
  try {
    const theme = await getThemeBySlug(slug);
    if (!theme) {
      return err(c, 'NOT_FOUND', 'Theme not found', 404);
    }
    return ok(c, theme);
  } catch (error) {
    console.error('getThemeBySlug error:', error);
    return err(c, 'GET_THEME_FAILED', 'Failed to retrieve theme', 500);
  }
});

// POST /api/admin/themes
adminThemesRoutes.post('/', async (c) => {
  const body = await c.req.json().catch(() => null);

  if (!body) {
    return err(c, 'INVALID_BODY', 'Request body is required', 400);
  }

  try {
    const created = await createTheme({
      slug: body.slug,
      nameAr: body.nameAr,
      nameEn: body.nameEn,
      description: body.description,
      isDark: body.isDark,
      colors: body.colors,
    });
    return ok(c, created, 201);
  } catch (error: any) {
    if (error?.message === 'INVALID_THEME_SLUG') {
      return err(c, 'INVALID_THEME_SLUG', 'Theme slug must be 2-30 lowercase alphanumeric characters', 400);
    }
    if (error?.message === 'INVALID_THEME_COLORS') {
      return err(c, 'INVALID_THEME_COLORS', 'Theme colors must include all 18 required color keys and radius', 400);
    }
    if (error?.message === 'THEME_SLUG_TAKEN') {
      return err(c, 'THEME_SLUG_TAKEN', 'Theme slug already exists', 400);
    }
    console.error('createTheme error:', error);
    return err(c, 'CREATE_THEME_FAILED', 'Failed to create theme', 500);
  }
});

// PATCH /api/admin/themes/:slug
adminThemesRoutes.patch('/:slug', async (c) => {
  const slug = c.req.param('slug');
  const body = await c.req.json().catch(() => null);

  if (!body) {
    return err(c, 'INVALID_BODY', 'Request body is required', 400);
  }

  try {
    const updated = await updateTheme(slug, {
      nameAr: body.nameAr,
      nameEn: body.nameEn,
      description: body.description,
      isDark: body.isDark,
      colors: body.colors,
    });

    if (!updated) {
      return err(c, 'NOT_FOUND', 'Theme not found', 404);
    }

    return ok(c, updated);
  } catch (error: any) {
    if (error?.message === 'INVALID_THEME_COLORS') {
      return err(c, 'INVALID_THEME_COLORS', 'Theme colors must include all required keys', 400);
    }
    console.error('updateTheme error:', error);
    return err(c, 'UPDATE_THEME_FAILED', 'Failed to update theme', 500);
  }
});

// DELETE /api/admin/themes/:slug
adminThemesRoutes.delete('/:slug', async (c) => {
  const slug = c.req.param('slug');

  try {
    const result = await deleteTheme(slug);
    return ok(c, result);
  } catch (error: any) {
    if (error?.message === 'CANNOT_DELETE_DEFAULT_THEME') {
      return err(c, 'CANNOT_DELETE_DEFAULT_THEME', 'Cannot delete default theme', 400);
    }
    if (error?.message === 'CANNOT_DELETE_ACTIVE_THEME') {
      return err(c, 'CANNOT_DELETE_ACTIVE_THEME', 'Cannot delete active theme', 400);
    }
    console.error('deleteTheme error:', error);
    return err(c, 'DELETE_THEME_FAILED', 'Failed to delete theme', 500);
  }
});

// POST /api/admin/themes/:slug/activate
adminThemesRoutes.post('/:slug/activate', async (c) => {
  const slug = c.req.param('slug');

  try {
    const activated = await activateTheme(slug);
    return ok(c, activated);
  } catch (error: any) {
    if (error?.message === 'THEME_NOT_FOUND') {
      return err(c, 'THEME_NOT_FOUND', 'Theme not found', 404);
    }
    console.error('activateTheme error:', error);
    return err(c, 'ACTIVATE_THEME_FAILED', 'Failed to activate theme', 500);
  }
});
