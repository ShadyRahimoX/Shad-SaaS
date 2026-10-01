import { Hono } from 'hono';
import { streamSSE } from 'hono/streaming';
import { ok, err } from '../lib/response.js';
import { requireAuth, type AuthVariables } from '../middleware/auth.js';
import {
  getOrCreateUserThread,
  getUserThreadWithStats,
  getThreadMessages,
  sendMessage,
  markThreadRead,
} from '../services/chat.service.js';
import { registerConnection, unregisterConnection } from '../lib/sse.js';

export const meChatRoutes = new Hono<{ Variables: AuthVariables }>();

meChatRoutes.use('*', requireAuth);

// GET /api/me/chat/thread
meChatRoutes.get('/thread', async (c) => {
  const userId = c.get('userId');
  try {
    const result = await getUserThreadWithStats(userId);
    return ok(c, result);
  } catch (error) {
    console.error('getUserThreadWithStats error:', error);
    return err(c, 'CHAT_THREAD_FAILED', 'Failed to get chat thread', 500);
  }
});

// GET /api/me/chat/thread/messages
meChatRoutes.get('/thread/messages', async (c) => {
  const userId = c.get('userId');
  const page = Math.max(1, Number(c.req.query('page') || 1));
  const limit = Math.min(100, Math.max(1, Number(c.req.query('limit') || 20)));

  try {
    const thread = await getOrCreateUserThread(userId);
    const result = await getThreadMessages(thread.id, { page, limit });
    return ok(c, result);
  } catch (error) {
    console.error('getThreadMessages error:', error);
    return err(c, 'CHAT_MESSAGES_FAILED', 'Failed to get chat messages', 500);
  }
});

// POST /api/me/chat/thread/messages
meChatRoutes.post('/thread/messages', async (c) => {
  const userId = c.get('userId');
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
    const thread = await getOrCreateUserThread(userId);
    const result = await sendMessage({
      threadId: thread.id,
      senderId: userId,
      senderRole: 'user',
      body: trimmedBody,
      messageUuid: body.messageUuid,
    });
    return ok(c, result);
  } catch (error: any) {
    if (error?.message?.includes('MESSAGE_UUID_TAKEN')) {
      return err(c, 'MESSAGE_UUID_TAKEN', 'This messageUuid has already been used', 409);
    }
    console.error('sendMessage error:', error);
    return err(c, 'SEND_MESSAGE_FAILED', 'Failed to send message', 500);
  }
});

// POST /api/me/chat/thread/messages/read
meChatRoutes.post('/thread/messages/read', async (c) => {
  const userId = c.get('userId');
  try {
    const thread = await getOrCreateUserThread(userId);
    const result = await markThreadRead(thread.id, 'user');
    return ok(c, result);
  } catch (error) {
    console.error('markThreadRead error:', error);
    return err(c, 'MARK_READ_FAILED', 'Failed to mark messages as read', 500);
  }
});

// GET /api/me/chat/thread/stream
meChatRoutes.get('/thread/stream', async (c) => {
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
