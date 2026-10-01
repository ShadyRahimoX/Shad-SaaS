import { Hono } from 'hono';
import { ok, err } from '../lib/response.js';
import {
  getAllSettings,
  getSetting,
  getAllowedKeys,
  setSetting,
  bulkSetSettings,
  deleteSetting,
} from '../services/settings.service.js';

export const adminSettingsRoutes = new Hono();

// Protect admin settings routes with X-Admin-Key
adminSettingsRoutes.use('*', async (c, next) => {
  const key = c.req.header('X-Admin-Key');
  const expected = process.env.ADMIN_SYNC_KEY;

  if (!expected || key !== expected) {
    return err(c, 'UNAUTHORIZED', 'Invalid admin key', 401);
  }

  await next();
});

// GET /api/admin/settings/allowed-keys
// Register before /:key to avoid route conflict!
adminSettingsRoutes.get('/allowed-keys', async (c) => {
  return ok(c, getAllowedKeys());
});

// GET /api/admin/settings
adminSettingsRoutes.get('/', async (c) => {
  const category = c.req.query('category') || undefined;
  try {
    const list = await getAllSettings({ category });
    return ok(c, list);
  } catch (error) {
    console.error('getAllSettings error:', error);
    return err(c, 'GET_SETTINGS_FAILED', 'Failed to retrieve settings', 500);
  }
});

// GET /api/admin/settings/:key
adminSettingsRoutes.get('/:key', async (c) => {
  const key = c.req.param('key');
  try {
    const setting = await getSetting(key);
    if (!setting) {
      return err(c, 'NOT_FOUND', 'Setting key not found', 404);
    }
    return ok(c, setting);
  } catch (error) {
    console.error('getSetting error:', error);
    return err(c, 'GET_SETTING_FAILED', 'Failed to retrieve setting', 500);
  }
});

// PATCH /api/admin/settings/:key
adminSettingsRoutes.patch('/:key', async (c) => {
  const key = c.req.param('key');
  const body = await c.req.json().catch(() => null);

  if (!body || body.value === undefined) {
    return err(c, 'INVALID_VALUE', 'Value field is required', 400);
  }

  try {
    const updated = await setSetting({
      key,
      value: body.value,
      category: body.category,
      isPublic: body.isPublic,
      valueType: body.valueType,
      description: body.description,
    });
    return ok(c, updated);
  } catch (error: any) {
    if (error?.message?.includes('SETTING_KEY_NOT_WHITELISTED')) {
      return err(c, 'SETTING_KEY_NOT_WHITELISTED', 'Setting key is not in whitelist', 400);
    }
    console.error('setSetting error:', error);
    return err(c, 'UPDATE_SETTING_FAILED', 'Failed to update setting', 500);
  }
});

// POST /api/admin/settings/bulk
adminSettingsRoutes.post('/bulk', async (c) => {
  const body = await c.req.json().catch(() => null);

  if (!body || !Array.isArray(body.updates) || body.updates.length === 0) {
    return err(c, 'INVALID_UPDATES', 'Updates array is required', 400);
  }

  try {
    const result = await bulkSetSettings(body.updates);
    return ok(c, result);
  } catch (error: any) {
    if (error?.message?.includes('SETTING_KEY_NOT_WHITELISTED')) {
      return err(c, 'SETTING_KEY_NOT_WHITELISTED', error.message || 'One or more setting keys are not whitelisted', 400);
    }
    console.error('bulkSetSettings error:', error);
    return err(c, 'BULK_UPDATE_FAILED', 'Failed to perform bulk update', 500);
  }
});

// DELETE /api/admin/settings/:key
adminSettingsRoutes.delete('/:key', async (c) => {
  const key = c.req.param('key');
  try {
    const result = await deleteSetting(key);
    return ok(c, result);
  } catch (error: any) {
    if (error?.message?.includes('SETTING_KEY_NOT_WHITELISTED')) {
      return err(c, 'SETTING_KEY_NOT_WHITELISTED', 'Setting key is not in whitelist', 400);
    }
    console.error('deleteSetting error:', error);
    return err(c, 'DELETE_SETTING_FAILED', 'Failed to delete setting', 500);
  }
});
