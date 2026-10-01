import { db, tickets, ticketMessages, users } from '@shad-saas/db';
import { eq, and, desc, sql } from 'drizzle-orm';
import { pushToUser } from '../lib/sse.js';
import { createNotification } from './notifications.service.js';
import { getAdminUser } from './chat.service.js';

export const ALLOWED_CATEGORIES = ['billing', 'technical', 'feature_request', 'other'] as const;
export const ALLOWED_PRIORITIES = ['low', 'normal', 'high', 'urgent'] as const;
export const ALLOWED_STATUSES = ['open', 'in_progress', 'awaiting_user', 'resolved', 'closed'] as const;

export interface CreateTicketParams {
  userId: string;
  subject: string;
  category?: string;
  priority?: string;
}

export async function createTicket(params: CreateTicketParams) {
  const { userId, subject } = params;
  const category = params.category || 'other';
  const priority = params.priority || 'normal';

  if (!ALLOWED_CATEGORIES.includes(category as any)) {
    throw new Error(`Invalid ticket category '${category}'. Allowed: ${ALLOWED_CATEGORIES.join(', ')}`);
  }

  if (!ALLOWED_PRIORITIES.includes(priority as any)) {
    throw new Error(`Invalid ticket priority '${priority}'. Allowed: ${ALLOWED_PRIORITIES.join(', ')}`);
  }

  const [ticket] = await db
    .insert(tickets)
    .values({
      userId,
      subject,
      category,
      priority,
      status: 'open',
      unreadAdminCount: 0,
      unreadUserCount: 0,
    })
    .returning();

  try {
    const adminUserId = await getAdminUser();
    await createNotification({
      userId: adminUserId,
      type: 'ticket.created',
      title: 'تذكرة دعم جديدة',
      body: subject,
      payload: { ticketId: ticket.id },
    });
  } catch (notifErr) {
    console.error('[Tickets] Admin notification creation error:', notifErr);
  }

  return ticket;
}

export async function getUserTickets(
  userId: string,
  options: { page?: number; limit?: number; status?: string } = {}
) {
  const page = Math.max(1, options.page || 1);
  const limit = Math.min(100, Math.max(1, options.limit || 20));
  const offset = (page - 1) * limit;

  const conditions = [eq(tickets.userId, userId)];
  if (options.status) {
    conditions.push(eq(tickets.status, options.status));
  }

  const rows = await db
    .select()
    .from(tickets)
    .where(and(...conditions))
    .orderBy(desc(tickets.createdAt))
    .limit(limit)
    .offset(offset);

  const ticketsWithPreview = await Promise.all(
    rows.map(async (t) => {
      const [lastMsg] = await db
        .select({ body: ticketMessages.body })
        .from(ticketMessages)
        .where(eq(ticketMessages.ticketId, t.id))
        .orderBy(desc(ticketMessages.createdAt))
        .limit(1);

      return {
        ...t,
        lastMessagePreview: lastMsg ? (lastMsg.body.length > 100 ? lastMsg.body.substring(0, 100) + '...' : lastMsg.body) : null,
      };
    })
  );

  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(tickets)
    .where(and(...conditions));

  return { tickets: ticketsWithPreview, total: count, page, limit };
}

export async function getTicketForUser(ticketId: string, userId: string) {
  const [ticket] = await db
    .select()
    .from(tickets)
    .where(and(eq(tickets.id, ticketId), eq(tickets.userId, userId)))
    .limit(1);

  if (!ticket) {
    return null;
  }

  const [lastMsg] = await db
    .select()
    .from(ticketMessages)
    .where(eq(ticketMessages.ticketId, ticketId))
    .orderBy(desc(ticketMessages.createdAt))
    .limit(1);

  return { ticket, lastMessage: lastMsg || null };
}

export async function getTicketMessages(
  ticketId: string,
  options: { page?: number; limit?: number } = {}
) {
  const page = Math.max(1, options.page || 1);
  const limit = Math.min(100, Math.max(1, options.limit || 20));
  const offset = (page - 1) * limit;

  const messages = await db
    .select()
    .from(ticketMessages)
    .where(eq(ticketMessages.ticketId, ticketId))
    .orderBy(desc(ticketMessages.createdAt))
    .limit(limit)
    .offset(offset);

  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(ticketMessages)
    .where(eq(ticketMessages.ticketId, ticketId));

  return { messages, total: count, page, limit };
}

export interface SendTicketMessageParams {
  ticketId: string;
  senderId: string;
  senderRole: 'user' | 'admin';
  body: string;
  messageUuid: string;
}

export async function sendTicketMessage(params: SendTicketMessageParams) {
  const { ticketId, senderId, senderRole, body, messageUuid } = params;

  const [existingMsg] = await db
    .select()
    .from(ticketMessages)
    .where(
      and(
        eq(ticketMessages.messageUuid, messageUuid),
        eq(ticketMessages.senderId, senderId),
        eq(ticketMessages.ticketId, ticketId)
      )
    )
    .limit(1);

  if (existingMsg) {
    const [currentTicket] = await db
      .select()
      .from(tickets)
      .where(eq(tickets.id, ticketId))
      .limit(1);

    return { message: existingMsg, ticket: currentTicket };
  }

  const [ticket] = await db
    .select()
    .from(tickets)
    .where(eq(tickets.id, ticketId))
    .limit(1);

  if (!ticket) {
    throw new Error('Support ticket not found');
  }

  const now = new Date();
  let newStatus = ticket.status;
  if (senderRole === 'admin' && ticket.status === 'awaiting_user') {
    newStatus = 'in_progress';
  }

  let newMessage: typeof ticketMessages.$inferSelect;
  let updatedTicket: typeof tickets.$inferSelect;

  try {
    const result = await db.transaction(async (tx) => {
      const [msg] = await tx
        .insert(ticketMessages)
        .values({
          ticketId,
          senderId,
          senderRole,
          body,
          messageUuid,
        })
        .returning();

      const [updated] = await tx
        .update(tickets)
        .set({
          lastMessageAt: now,
          updatedAt: now,
          status: newStatus,
          unreadAdminCount: senderRole === 'user'
            ? sql`${tickets.unreadAdminCount} + 1`
            : tickets.unreadAdminCount,
          unreadUserCount: senderRole === 'admin'
            ? sql`${tickets.unreadUserCount} + 1`
            : tickets.unreadUserCount,
        })
        .where(eq(tickets.id, ticketId))
        .returning();

      return { newMessage: msg, updatedTicket: updated };
    });

    newMessage = result.newMessage;
    updatedTicket = result.updatedTicket;
  } catch (dbErr: any) {
    if (dbErr?.code === '23505' || dbErr?.cause?.code === '23505') {
      const [retryMsg] = await db
        .select()
        .from(ticketMessages)
        .where(
          and(
            eq(ticketMessages.messageUuid, messageUuid),
            eq(ticketMessages.senderId, senderId),
            eq(ticketMessages.ticketId, ticketId)
          )
        )
        .limit(1);

      if (retryMsg) {
        const [currentTicket] = await db
          .select()
          .from(tickets)
          .where(eq(tickets.id, ticketId))
          .limit(1);

        return { message: retryMsg, ticket: currentTicket };
      }

      throw new Error('MESSAGE_UUID_TAKEN: This messageUuid has already been used');
    }

    throw dbErr;
  }

  try {
    if (senderRole === 'user') {
      pushToUser('@admin', {
        type: 'ticket.message',
        payload: { ...newMessage, ticketId, userId: ticket.userId },
      });

      const adminUserId = await getAdminUser();
      await createNotification({
        userId: adminUserId,
        type: 'ticket.replied',
        title: 'رد جديد على تذكرة دعم',
        body: body.length > 100 ? body.substring(0, 100) + '...' : body,
        payload: { ticketId, messageId: newMessage.id },
      });
    } else if (senderRole === 'admin') {
      pushToUser(ticket.userId, {
        type: 'ticket.message',
        payload: newMessage,
      });

      await createNotification({
        userId: ticket.userId,
        type: 'ticket.replied',
        title: 'رد جديد على تذكرة الدعم الخاصة بك',
        body: body.length > 100 ? body.substring(0, 100) + '...' : body,
        payload: { ticketId, messageId: newMessage.id },
      });
    }
  } catch (err) {
    console.error('[Tickets] SSE / Notification error:', err);
  }

  return { message: newMessage, ticket: updatedTicket };
}

export async function markTicketRead(ticketId: string, readerRole: 'user' | 'admin') {
  const now = new Date();

  return await db.transaction(async (tx) => {
    let updatedMsgs = [];
    if (readerRole === 'user') {
      updatedMsgs = await tx
        .update(ticketMessages)
        .set({ readAt: now })
        .where(
          and(
            eq(ticketMessages.ticketId, ticketId),
            eq(ticketMessages.senderRole, 'admin'),
            sql`${ticketMessages.readAt} IS NULL`
          )
        )
        .returning();

      await tx
        .update(tickets)
        .set({ unreadUserCount: 0 })
        .where(eq(tickets.id, ticketId));
    } else {
      updatedMsgs = await tx
        .update(ticketMessages)
        .set({ readAt: now })
        .where(
          and(
            eq(ticketMessages.ticketId, ticketId),
            eq(ticketMessages.senderRole, 'user'),
            sql`${ticketMessages.readAt} IS NULL`
          )
        )
        .returning();

      await tx
        .update(tickets)
        .set({ unreadAdminCount: 0 })
        .where(eq(tickets.id, ticketId));
    }

    return { markedCount: updatedMsgs.length };
  });
}

export async function listAllTicketsForAdmin(options: {
  page?: number;
  limit?: number;
  status?: string;
  priority?: string;
  category?: string;
} = {}) {
  const page = Math.max(1, options.page || 1);
  const limit = Math.min(100, Math.max(1, options.limit || 20));
  const offset = (page - 1) * limit;

  const conditions = [];
  if (options.status) {
    conditions.push(eq(tickets.status, options.status));
  }
  if (options.priority) {
    conditions.push(eq(tickets.priority, options.priority));
  }
  if (options.category) {
    conditions.push(eq(tickets.category, options.category));
  }

  const baseQuery = db
    .select({
      id: tickets.id,
      userId: tickets.userId,
      subject: tickets.subject,
      category: tickets.category,
      priority: tickets.priority,
      status: tickets.status,
      assignedTo: tickets.assignedTo,
      unreadAdminCount: tickets.unreadAdminCount,
      unreadUserCount: tickets.unreadUserCount,
      lastMessageAt: tickets.lastMessageAt,
      createdAt: tickets.createdAt,
      updatedAt: tickets.updatedAt,
      username: users.username,
      email: users.email,
    })
    .from(tickets)
    .innerJoin(users, eq(users.id, tickets.userId));

  if (conditions.length > 0) {
    baseQuery.where(and(...conditions));
  }

  const rows = await baseQuery
    .orderBy(sql`${tickets.lastMessageAt} DESC NULLS LAST`)
    .limit(limit)
    .offset(offset);

  const ticketsWithPreview = await Promise.all(
    rows.map(async (row) => {
      const [lastMsg] = await db
        .select({ body: ticketMessages.body })
        .from(ticketMessages)
        .where(eq(ticketMessages.ticketId, row.id))
        .orderBy(desc(ticketMessages.createdAt))
        .limit(1);

      return {
        ...row,
        lastMessagePreview: lastMsg ? (lastMsg.body.length > 100 ? lastMsg.body.substring(0, 100) + '...' : lastMsg.body) : null,
      };
    })
  );

  const countQuery = db
    .select({ count: sql<number>`count(*)::int` })
    .from(tickets);

  if (conditions.length > 0) {
    countQuery.where(and(...conditions));
  }

  const [{ count }] = await countQuery;

  return { tickets: ticketsWithPreview, total: count, page, limit };
}

export async function getTicketForAdmin(ticketId: string) {
  const [ticket] = await db
    .select()
    .from(tickets)
    .where(eq(tickets.id, ticketId))
    .limit(1);

  if (!ticket) {
    return null;
  }

  const [userRow] = await db
    .select({ id: users.id, username: users.username, email: users.email })
    .from(users)
    .where(eq(users.id, ticket.userId))
    .limit(1);

  return { ticket, user: userRow || null };
}

export async function updateTicketStatus(ticketId: string, newStatus: string, adminUserId?: string) {
  if (!ALLOWED_STATUSES.includes(newStatus as any)) {
    throw new Error(`Invalid status '${newStatus}'. Allowed: ${ALLOWED_STATUSES.join(', ')}`);
  }

  const [existing] = await db
    .select()
    .from(tickets)
    .where(eq(tickets.id, ticketId))
    .limit(1);

  if (!existing) {
    return null;
  }

  const oldStatus = existing.status;

  const [updated] = await db
    .update(tickets)
    .set({
      status: newStatus,
      updatedAt: new Date(),
    })
    .where(eq(tickets.id, ticketId))
    .returning();

  try {
    await createNotification({
      userId: existing.userId,
      type: 'ticket.status_changed',
      title: 'تحديث حالة تذكرة الدعم',
      body: `تم تغيير حالة التذكرة إلى ${newStatus}`,
      payload: { ticketId, oldStatus, newStatus },
    });
  } catch (err) {
    console.error('[Tickets] Status notification error:', err);
  }

  return updated;
}

export async function assignTicket(ticketId: string, adminUserId: string | null) {
  const [updated] = await db
    .update(tickets)
    .set({
      assignedTo: adminUserId,
      updatedAt: new Date(),
    })
    .where(eq(tickets.id, ticketId))
    .returning();

  return updated || null;
}

export async function closeTicket(ticketId: string) {
  const [updated] = await db
    .update(tickets)
    .set({
      status: 'closed',
      updatedAt: new Date(),
    })
    .where(eq(tickets.id, ticketId))
    .returning();

  return updated || null;
}

export async function reopenTicket(ticketId: string) {
  const [updated] = await db
    .update(tickets)
    .set({
      status: 'open',
      updatedAt: new Date(),
    })
    .where(eq(tickets.id, ticketId))
    .returning();

  return updated || null;
}
