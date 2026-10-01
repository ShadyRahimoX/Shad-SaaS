import { Hono } from 'hono';
import { streamSSE } from 'hono/streaming';
import { ok, err } from '../lib/response.js';
import {
  listAllThreadsForAdmin,
  getThreadForAdmin,
  getThreadMessages,
  sendMessage,
  markThreadRead,
  closeThread,
  reopenThread,
  getAdminUser,
} from '../services/chat.service.js';
import { registerConnection, unregisterConnection } from '../lib/sse.js';

export const adminChatRoutes = new Hono();

// Protect all admin chat routes with X-Admin-Key
adminChatRoutes.use('*', async (c, next) => {
  const key = c.req.header('X-Admin-Key');
  const expected = process.env.ADMIN_SYNC_KEY;

  if (!expected || key !== expected) {
    return err(c, 'UNAUTHORIZED', 'Invalid admin key', 401);
  }

  await next();
});

// GET /api/admin/chat/threads
adminChatRoutes.get('/threads', async (c) => {
  const page = Math.max(1, Number(c.req.query('page') || 1));
  const limit = Math.min(100, Math.max(1, Number(c.req.query('limit') || 20)));
  const status = c.req.query('status') || undefined;

  try {
    const result = await listAllThreadsForAdmin({ page, limit, status });
    return ok(c, result);
  } catch (error) {
    console.error('listAllThreadsForAdmin error:', error);
    return err(c, 'ADMIN_THREADS_FAILED', 'Failed to list threads', 500);
  }
});

// GET /api/admin/chat/stream (SSE for admin)
adminChatRoutes.get('/stream', async (c) => {
  c.header('Content-Type', 'text/event-stream');
  c.header('Cache-Control', 'no-cache');
  c.header('Connection', 'keep-alive');

  return streamSSE(c, async (stream) => {
    registerConnection('@admin', stream);

    c.req.raw.signal.addEventListener('abort', () => {
      unregisterConnection('@admin', stream);
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

// GET /api/admin/chat/threads/:threadId
adminChatRoutes.get('/threads/:threadId', async (c) => {
  const threadId = c.req.param('threadId');
  try {
    const result = await getThreadForAdmin(threadId);
    if (!result) {
      return err(c, 'NOT_FOUND', 'Thread not found', 404);
    }
    return ok(c, result);
  } catch (error) {
    console.error('getThreadForAdmin error:', error);
    return err(c, 'GET_THREAD_FAILED', 'Failed to get thread', 500);
  }
});

// GET /api/admin/chat/threads/:threadId/messages
adminChatRoutes.get('/threads/:threadId/messages', async (c) => {
  const threadId = c.req.param('threadId');
  const page = Math.max(1, Number(c.req.query('page') || 1));
  const limit = Math.min(100, Math.max(1, Number(c.req.query('limit') || 20)));

  try {
    const result = await getThreadMessages(threadId, { page, limit });
    return ok(c, result);
  } catch (error) {
    console.error('getThreadMessages admin error:', error);
    return err(c, 'MESSAGES_FAILED', 'Failed to get messages', 500);
  }
});

// POST /api/admin/chat/threads/:threadId/messages
adminChatRoutes.post('/threads/:threadId/messages', async (c) => {
  const threadId = c.req.param('threadId');
  const body = await c.req.json().catch(() => null);

  if (!body || typeof body.body !== 'string' || !body.body.trim()) {
    return err(c, 'INVALID_BODY', 'Message body is required (1-2000 characters)', 400);
  }

  const trimmedBody = body.body.trim();
  if (trimmedBody.length > 2000) {
    return err(c, 'BODY_TOO_LONG', 'Message body must not exceed 2000 characters', 400);
  }

  if (!body.messageUuid || typeof body.messageUuid !== 'string') {
    return err(c, 'INVALID_MESSAGE_UUID', 'messageUuid is required', 400);
  }

  try {
    const adminUserId = await getAdminUser();
    const result = await sendMessage({
      threadId,
      senderId: adminUserId,
      senderRole: 'admin',
      body: trimmedBody,
      messageUuid: body.messageUuid,
    });
    return ok(c, result);
  } catch (error: any) {
    if (error?.message?.includes('ADMIN_SEED_EMAIL')) {
      console.error('Admin user missing error:', error);
      return err(c, 'ADMIN_USER_MISSING', 'Admin seed user not found in database', 500);
    }
    if (error?.message?.includes('MESSAGE_UUID_TAKEN')) {
      return err(c, 'MESSAGE_UUID_TAKEN', 'This messageUuid has already been used', 409);
    }
    console.error('sendMessage admin error:', error);
    return err(c, 'SEND_MESSAGE_FAILED', 'Failed to send message', 500);
  }
});

// POST /api/admin/chat/threads/:threadId/read
adminChatRoutes.post('/threads/:threadId/read', async (c) => {
  const threadId = c.req.param('threadId');
  try {
    const result = await markThreadRead(threadId, 'admin');
    return ok(c, result);
  } catch (error) {
    console.error('markThreadRead admin error:', error);
    return err(c, 'MARK_READ_FAILED', 'Failed to mark thread read', 500);
  }
});

// POST /api/admin/chat/threads/:threadId/close
adminChatRoutes.post('/threads/:threadId/close', async (c) => {
  const threadId = c.req.param('threadId');
  try {
    const result = await closeThread(threadId);
    if (!result) {
      return err(c, 'NOT_FOUND', 'Thread not found', 404);
    }
    return ok(c, result);
  } catch (error) {
    console.error('closeThread error:', error);
    return err(c, 'CLOSE_THREAD_FAILED', 'Failed to close thread', 500);
  }
});

// POST /api/admin/chat/threads/:threadId/reopen
adminChatRoutes.post('/threads/:threadId/reopen', async (c) => {
  const threadId = c.req.param('threadId');
  try {
    const result = await reopenThread(threadId);
    if (!result) {
      return err(c, 'NOT_FOUND', 'Thread not found', 404);
    }
    return ok(c, result);
  } catch (error) {
    console.error('reopenThread error:', error);
    return err(c, 'REOPEN_THREAD_FAILED', 'Failed to reopen thread', 500);
  }
});
