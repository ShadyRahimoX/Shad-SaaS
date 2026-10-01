import { Hono } from 'hono';
import { ok, err } from '../lib/response.js';
import {
  getActiveThemeAsCssVariables,
  listThemes,
  getThemeBySlug,
} from '../services/themes.service.js';

export const publicThemesRoutes = new Hono();

// GET /api/public/theme
publicThemesRoutes.get('/', async (c) => {
  try {
    const data = await getActiveThemeAsCssVariables();
    return ok(c, data);
  } catch (error) {
    console.error('getActiveThemeAsCssVariables error:', error);
    return err(c, 'GET_THEME_FAILED', 'Failed to retrieve active theme', 500);
  }
});

// GET /api/public/theme/all
publicThemesRoutes.get('/all', async (c) => {
  try {
    const list = await listThemes();
    const formatted = list.map((t) => ({
      slug: t.slug,
      nameAr: t.nameAr,
      nameEn: t.nameEn,
      description: t.description,
      isDark: t.isDark,
      colors: t.colors,
    }));
    return ok(c, formatted);
  } catch (error) {
    console.error('listThemes error:', error);
    return err(c, 'LIST_THEMES_FAILED', 'Failed to retrieve themes', 500);
  }
});

// GET /api/public/theme/:slug
publicThemesRoutes.get('/:slug', async (c) => {
  const slug = c.req.param('slug');
  try {
    const theme = await getThemeBySlug(slug);
    if (!theme) {
      return err(c, 'NOT_FOUND', 'Theme not found', 404);
    }
    return ok(c, {
      slug: theme.slug,
      nameAr: theme.nameAr,
      nameEn: theme.nameEn,
      description: theme.description,
      isDark: theme.isDark,
      colors: theme.colors,
    });
  } catch (error) {
    console.error('getThemeBySlug error:', error);
    return err(c, 'GET_THEME_FAILED', 'Failed to retrieve theme', 500);
  }
});
