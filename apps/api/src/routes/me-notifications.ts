import { Hono } from 'hono';
import { streamSSE } from 'hono/streaming';
import { ok, err } from '../lib/response.js';
import { requireAuth, type AuthVariables } from '../middleware/auth.js';
import {
  getUserNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
} from '../services/notifications.service.js';
import { registerConnection, unregisterConnection } from '../lib/sse.js';

export const meNotificationsRoutes = new Hono<{ Variables: AuthVariables }>();

meNotificationsRoutes.use('*', requireAuth);

// GET /api/me/notifications
meNotificationsRoutes.get('/', async (c) => {
  const userId = c.get('userId');
  const page = Math.max(1, Number(c.req.query('page') || 1));
  const limit = Math.min(100, Math.max(1, Number(c.req.query('limit') || 20)));
  const unreadOnly = c.req.query('unreadOnly') === 'true';

  try {
    const result = await getUserNotifications(userId, { page, limit, unreadOnly });
    return ok(c, result);
  } catch (error) {
    console.error('getUserNotifications error:', error);
    return err(c, 'NOTIFICATIONS_FAILED', 'Failed to get notifications', 500);
  }
});

// GET /api/me/notifications/unread-count
meNotificationsRoutes.get('/unread-count', async (c) => {
  const userId = c.get('userId');
  try {
    const result = await getUnreadCount(userId);
    return ok(c, result);
  } catch (error) {
    console.error('getUnreadCount error:', error);
    return err(c, 'UNREAD_COUNT_FAILED', 'Failed to get unread count', 500);
  }
});

// POST /api/me/notifications/read-all
meNotificationsRoutes.post('/read-all', async (c) => {
  const userId = c.get('userId');
  try {
    const result = await markAllAsRead(userId);
    return ok(c, result);
  } catch (error) {
    console.error('markAllAsRead error:', error);
    return err(c, 'MARK_ALL_READ_FAILED', 'Failed to mark all as read', 500);
  }
});

// POST /api/me/notifications/:id/read
meNotificationsRoutes.post('/:id/read', async (c) => {
  const userId = c.get('userId');
  const notificationId = c.req.param('id');
  try {
    const updated = await markAsRead(userId, notificationId);
    if (!updated) {
      return err(c, 'NOT_FOUND', 'Notification not found', 404);
    }
    return ok(c, updated);
  } catch (error) {
    console.error('markAsRead error:', error);
    return err(c, 'MARK_READ_FAILED', 'Failed to mark notification as read', 500);
  }
});

// DELETE /api/me/notifications/:id
meNotificationsRoutes.delete('/:id', async (c) => {
  const userId = c.get('userId');
  const notificationId = c.req.param('id');
  try {
    const deleted = await deleteNotification(userId, notificationId);
    if (!deleted) {
      return err(c, 'NOT_FOUND', 'Notification not found', 404);
    }
    return ok(c, { id: deleted.id, deleted: true });
  } catch (error) {
    console.error('deleteNotification error:', error);
    return err(c, 'DELETE_NOTIFICATION_FAILED', 'Failed to delete notification', 500);
  }
});

// GET /api/me/notifications/stream (SSE)
meNotificationsRoutes.get('/stream', async (c) => {
  const userId = c.get('userId');

  c.header('Content-Type', 'text/event-stream');
  c.header('Cache-Control', 'no-cache');
  c.header('Connection', 'keep-alive');

  return streamSSE(c, async (stream) => {
    registerConnection(userId, stream);

    c.req.raw.signal.addEventListener('abort', () => {
      unregisterConnection(userId, stream);
    });

    while (!c.req.raw.signal.aborted) {
      await stream.sleep(25000);
      if (!c.req.raw.signal.aborted) {
        await stream.writeSSE({
          event: 'ping',
          data: JSON.stringify({ timestamp: new Date().toISOString() }),
        });
      }
    }
  });
});
