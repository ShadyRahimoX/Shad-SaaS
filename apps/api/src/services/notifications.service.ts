import { db, notifications, notificationTypes } from '@shad-saas/db';
import { eq, and, desc, sql } from 'drizzle-orm';
import { pushToUser } from '../lib/sse.js';

export interface CreateNotificationParams {
  userId: string;
  type: string;
  title: string;
  body: string;
  payload?: any;
}

export async function createNotification(params: CreateNotificationParams) {
  const { userId, type, title, body, payload } = params;

  // 1. Verify notification type exists
  const [typeRow] = await db
    .select({ key: notificationTypes.key })
    .from(notificationTypes)
    .where(eq(notificationTypes.key, type))
    .limit(1);

  if (!typeRow) {
    throw new Error(`Notification type '${type}' does not exist in notification_types`);
  }

  // 2. Insert notification
  const [newNotif] = await db
    .insert(notifications)
    .values({
      userId,
      type,
      title,
      body,
      payload: payload || null,
      isRead: false,
    })
    .returning();

  // 3. Attempt SSE push safely
  try {
    pushToUser(userId, {
      type: newNotif.type,
      payload: newNotif,
    });
  } catch (err) {
    console.error(`[Notification] SSE push error for user ${userId}:`, err);
  }

  return newNotif;
}

export async function getUserNotifications(
  userId: string,
  options: { page?: number; limit?: number; unreadOnly?: boolean } = {}
) {
  const page = Math.max(1, options.page || 1);
  const limit = Math.min(100, Math.max(1, options.limit || 20));
  const offset = (page - 1) * limit;

  const conditions = [eq(notifications.userId, userId)];
  if (options.unreadOnly) {
    conditions.push(eq(notifications.isRead, false));
  }

  const rows = await db
    .select()
    .from(notifications)
    .where(and(...conditions))
    .orderBy(desc(notifications.createdAt))
    .limit(limit)
    .offset(offset);

  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(notifications)
    .where(and(...conditions));

  return { notifications: rows, total: count, page, limit };
}

export async function getUnreadCount(userId: string) {
  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(notifications)
    .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));

  return { count };
}

export async function markAsRead(userId: string, notificationId: string) {
  const [updated] = await db
    .update(notifications)
    .set({
      isRead: true,
      readAt: new Date(),
    })
    .where(and(eq(notifications.id, notificationId), eq(notifications.userId, userId)))
    .returning();

  return updated || null;
}

export async function markAllAsRead(userId: string) {
  const updated = await db
    .update(notifications)
    .set({
      isRead: true,
      readAt: new Date(),
    })
    .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)))
    .returning();

  return { updatedCount: updated.length };
}

export async function deleteNotification(userId: string, notificationId: string) {
  const [deleted] = await db
    .delete(notifications)
    .where(and(eq(notifications.id, notificationId), eq(notifications.userId, userId)))
    .returning();

  return deleted || null;
}
