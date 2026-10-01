import { Hono } from 'hono';
import { ok, err } from '../lib/response.js';
import { getPublicSettings, getSetting } from '../services/settings.service.js';

export const publicSettingsRoutes = new Hono();

// GET /api/public/settings
publicSettingsRoutes.get('/', async (c) => {
  try {
    const list = await getPublicSettings();
    const flatObj: Record<string, any> = {};
    for (const item of list) {
      flatObj[item.key] = item.value;
    }
    return ok(c, flatObj);
  } catch (error) {
    console.error('getPublicSettings error:', error);
    return err(c, 'GET_PUBLIC_SETTINGS_FAILED', 'Failed to retrieve public settings', 500);
  }
});

// GET /api/public/settings/:key
publicSettingsRoutes.get('/:key', async (c) => {
  const key = c.req.param('key');
  try {
    const setting = await getSetting(key);
    if (!setting || !setting.isPublic) {
      return err(c, 'NOT_FOUND', 'Setting key not found', 404);
    }
    return ok(c, { [setting.key]: setting.value });
  } catch (error) {
    console.error('getPublicSetting error:', error);
    return err(c, 'GET_SETTING_FAILED', 'Failed to retrieve setting', 500);
  }
});
