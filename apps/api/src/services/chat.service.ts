import { db, chatThreads, chatMessages, users } from '@shad-saas/db';
import { eq, and, desc, sql } from 'drizzle-orm';
import { pushToUser } from '../lib/sse.js';
import { createNotification } from './notifications.service.js';

export async function getAdminUser() {
  const adminEmail = process.env.ADMIN_SEED_EMAIL || 'admin@shad-saas.dev';
  const adminUsername = process.env.ADMIN_SEED_USERNAME || 'admin';

  const [existing] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, adminEmail))
    .limit(1);

  if (existing) {
    return existing.id;
  }

  const [existingUser] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.username, adminUsername))
    .limit(1);

  if (existingUser) {
    return existingUser.id;
  }

  throw new Error(`Admin user with ADMIN_SEED_EMAIL '${adminEmail}' not found in users table`);
}

export async function getOrCreateUserThread(userId: string) {
  const [existing] = await db
    .select()
    .from(chatThreads)
    .where(eq(chatThreads.userId, userId))
    .limit(1);

  if (existing) {
    return existing;
  }

  try {
    const [created] = await db
      .insert(chatThreads)
      .values({
        userId,
        status: 'open',
        unreadAdminCount: 0,
        unreadUserCount: 0,
      })
      .returning();

    return created;
  } catch (error) {
    const [concurrent] = await db
      .select()
      .from(chatThreads)
      .where(eq(chatThreads.userId, userId))
      .limit(1);

    if (concurrent) {
      return concurrent;
    }
    throw error;
  }
}

export interface SendMessageParams {
  threadId: string;
  senderId: string;
  senderRole: 'user' | 'admin';
  body: string;
  messageUuid: string;
}

export async function sendMessage(params: SendMessageParams) {
  const { threadId, senderId, senderRole, body, messageUuid } = params;

  // 1. Constrained Idempotency check first (restricted to senderId + threadId + messageUuid)
  const [existingMsg] = await db
    .select()
    .from(chatMessages)
    .where(
      and(
        eq(chatMessages.messageUuid, messageUuid),
        eq(chatMessages.senderId, senderId),
        eq(chatMessages.threadId, threadId)
      )
    )
    .limit(1);

  if (existingMsg) {
    const [currentThread] = await db
      .select()
      .from(chatThreads)
      .where(eq(chatThreads.id, threadId))
      .limit(1);

    return { message: existingMsg, thread: currentThread };
  }

  const [thread] = await db
    .select()
    .from(chatThreads)
    .where(eq(chatThreads.id, threadId))
    .limit(1);

  if (!thread) {
    throw new Error('Chat thread not found');
  }

  // 2. Transaction for inserting message and updating thread
  const now = new Date();

  let newMessage: typeof chatMessages.$inferSelect;
  let updatedThread: typeof chatThreads.$inferSelect;

  try {
    const result = await db.transaction(async (tx) => {
      const [msg] = await tx
        .insert(chatMessages)
        .values({
          threadId,
          senderId,
          senderRole,
          body,
          messageUuid,
        })
        .returning();

      const [updated] = await tx
        .update(chatThreads)
        .set({
          lastMessageAt: now,
          updatedAt: now,
          unreadAdminCount: senderRole === 'user'
            ? sql`${chatThreads.unreadAdminCount} + 1`
            : chatThreads.unreadAdminCount,
          unreadUserCount: senderRole === 'admin'
            ? sql`${chatThreads.unreadUserCount} + 1`
            : chatThreads.unreadUserCount,
        })
        .where(eq(chatThreads.id, threadId))
        .returning();

      return { newMessage: msg, updatedThread: updated };
    });

    newMessage = result.newMessage;
    updatedThread = result.updatedThread;
  } catch (dbErr: any) {
    if (dbErr?.code === '23505' || dbErr?.cause?.code === '23505') {
      const [retryMsg] = await db
        .select()
        .from(chatMessages)
        .where(
          and(
            eq(chatMessages.messageUuid, messageUuid),
            eq(chatMessages.senderId, senderId),
            eq(chatMessages.threadId, threadId)
          )
        )
        .limit(1);

      if (retryMsg) {
        const [currentThread] = await db
          .select()
          .from(chatThreads)
          .where(eq(chatThreads.id, threadId))
          .limit(1);

        return { message: retryMsg, thread: currentThread };
      }

      throw new Error('MESSAGE_UUID_TAKEN: This messageUuid has already been used by another user/thread');
    }

    throw dbErr;
  }

  // 3. SSE push after commit
  try {
    pushToUser(thread.userId, {
      type: 'chat.message',
      payload: newMessage,
    });

    pushToUser('@admin', {
      type: 'chat.message',
      payload: { ...newMessage, userId: thread.userId },
    });
  } catch (sseErr) {
    console.error('[Chat] SSE push error:', sseErr);
  }

  // 4. Create notification
  try {
    const adminUserId = await getAdminUser();
    if (senderRole === 'user') {
      await createNotification({
        userId: adminUserId,
        type: 'chat.message',
        title: 'رسالة محادثة جديدة من مستخدم',
        body: body.length > 100 ? body.substring(0, 100) + '...' : body,
        payload: { threadId, messageId: newMessage.id },
      });
    } else if (senderRole === 'admin') {
      await createNotification({
        userId: thread.userId,
        type: 'chat.message',
        title: 'رسالة محادثة جديدة من الدعم',
        body: body.length > 100 ? body.substring(0, 100) + '...' : body,
        payload: { threadId, messageId: newMessage.id },
      });
    }
  } catch (notifErr) {
    console.error('[Chat] Notification creation error:', notifErr);
  }

  return { message: newMessage, thread: updatedThread };
}

export async function getThreadMessages(
  threadId: string,
  options: { page?: number; limit?: number } = {}
) {
  const page = Math.max(1, options.page || 1);
  const limit = Math.min(100, Math.max(1, options.limit || 20));
  const offset = (page - 1) * limit;

  const messages = await db
    .select()
    .from(chatMessages)
    .where(eq(chatMessages.threadId, threadId))
    .orderBy(desc(chatMessages.createdAt))
    .limit(limit)
    .offset(offset);

  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(chatMessages)
    .where(eq(chatMessages.threadId, threadId));

  return { messages, total: count, page, limit };
}

export async function markThreadRead(threadId: string, readerRole: 'user' | 'admin') {
  const now = new Date();

  return await db.transaction(async (tx) => {
    let updatedMsgs = [];
    if (readerRole === 'user') {
      updatedMsgs = await tx
        .update(chatMessages)
        .set({ readAt: now })
        .where(
          and(
            eq(chatMessages.threadId, threadId),
            eq(chatMessages.senderRole, 'admin'),
            sql`${chatMessages.readAt} IS NULL`
          )
        )
        .returning();

      await tx
        .update(chatThreads)
        .set({ unreadUserCount: 0 })
        .where(eq(chatThreads.id, threadId));
    } else {
      updatedMsgs = await tx
        .update(chatMessages)
        .set({ readAt: now })
        .where(
          and(
            eq(chatMessages.threadId, threadId),
            eq(chatMessages.senderRole, 'user'),
            sql`${chatMessages.readAt} IS NULL`
          )
        )
        .returning();

      await tx
        .update(chatThreads)
        .set({ unreadAdminCount: 0 })
        .where(eq(chatThreads.id, threadId));
    }

    return { markedCount: updatedMsgs.length };
  });
}

export async function getUserThreadWithStats(userId: string) {
  const thread = await getOrCreateUserThread(userId);

  const [lastMessage] = await db
    .select()
    .from(chatMessages)
    .where(eq(chatMessages.threadId, thread.id))
    .orderBy(desc(chatMessages.createdAt))
    .limit(1);

  return {
    thread,
    lastMessage: lastMessage || null,
    unreadAdminCount: thread.unreadAdminCount,
    unreadUserCount: thread.unreadUserCount,
  };
}

export async function listAllThreadsForAdmin(options: {
  page?: number;
  limit?: number;
  status?: string;
} = {}) {
  const page = Math.max(1, options.page || 1);
  const limit = Math.min(100, Math.max(1, options.limit || 20));
  const offset = (page - 1) * limit;

  const conditions = [];
  if (options.status) {
    conditions.push(eq(chatThreads.status, options.status));
  }

  const baseQuery = db
    .select({
      id: chatThreads.id,
      userId: chatThreads.userId,
      username: users.username,
      email: users.email,
      status: chatThreads.status,
      unreadAdminCount: chatThreads.unreadAdminCount,
      unreadUserCount: chatThreads.unreadUserCount,
      lastMessageAt: chatThreads.lastMessageAt,
      createdAt: chatThreads.createdAt,
      updatedAt: chatThreads.updatedAt,
    })
    .from(chatThreads)
    .innerJoin(users, eq(users.id, chatThreads.userId));

  if (conditions.length > 0) {
    baseQuery.where(and(...conditions));
  }

  const rows = await baseQuery
    .orderBy(sql`${chatThreads.lastMessageAt} DESC NULLS LAST`)
    .limit(limit)
    .offset(offset);

  const threadsWithPreview = await Promise.all(
    rows.map(async (row) => {
      const [lastMsg] = await db
        .select({ body: chatMessages.body })
        .from(chatMessages)
        .where(eq(chatMessages.threadId, row.id))
        .orderBy(desc(chatMessages.createdAt))
        .limit(1);

      return {
        ...row,
        lastMessagePreview: lastMsg ? (lastMsg.body.length > 60 ? lastMsg.body.substring(0, 60) + '...' : lastMsg.body) : null,
      };
    })
  );

  const countQuery = db
    .select({ count: sql<number>`count(*)::int` })
    .from(chatThreads);

  if (conditions.length > 0) {
    countQuery.where(and(...conditions));
  }

  const [{ count }] = await countQuery;

  return { threads: threadsWithPreview, total: count, page, limit };
}

export async function getThreadForAdmin(threadId: string) {
  const [thread] = await db
    .select()
    .from(chatThreads)
    .where(eq(chatThreads.id, threadId))
    .limit(1);

  if (!thread) {
    return null;
  }

  const [userRow] = await db
    .select({ id: users.id, username: users.username, email: users.email })
    .from(users)
    .where(eq(users.id, thread.userId))
    .limit(1);

  return { thread, user: userRow || null };
}

export async function closeThread(threadId: string) {
  const [updated] = await db
    .update(chatThreads)
    .set({ status: 'closed', updatedAt: new Date() })
    .where(eq(chatThreads.id, threadId))
    .returning();

  return updated || null;
}

export async function reopenThread(threadId: string) {
  const [updated] = await db
    .update(chatThreads)
    .set({ status: 'open', updatedAt: new Date() })
    .where(eq(chatThreads.id, threadId))
    .returning();

  return updated || null;
}
