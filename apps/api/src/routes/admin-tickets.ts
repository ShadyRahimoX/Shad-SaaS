import { Hono } from 'hono';
import { streamSSE } from 'hono/streaming';
import { ok, err } from '../lib/response.js';
import {
  listAllTicketsForAdmin,
  getTicketForAdmin,
  getTicketMessages,
  sendTicketMessage,
  markTicketRead,
  updateTicketStatus,
  assignTicket,
  closeTicket,
  reopenTicket,
} from '../services/tickets.service.js';
import { getAdminUser } from '../services/chat.service.js';
import { registerConnection, unregisterConnection } from '../lib/sse.js';

export const adminTicketsRoutes = new Hono();

// Protect all admin ticket routes with X-Admin-Key
adminTicketsRoutes.use('*', async (c, next) => {
  const key = c.req.header('X-Admin-Key');
  const expected = process.env.ADMIN_SYNC_KEY;

  if (!expected || key !== expected) {
    return err(c, 'UNAUTHORIZED', 'Invalid admin key', 401);
  }

  await next();
});

// GET /api/admin/tickets
adminTicketsRoutes.get('/', async (c) => {
  const page = Math.max(1, Number(c.req.query('page') || 1));
  const limit = Math.min(100, Math.max(1, Number(c.req.query('limit') || 20)));
  const status = c.req.query('status') || undefined;
  const priority = c.req.query('priority') || undefined;
  const category = c.req.query('category') || undefined;

  try {
    const result = await listAllTicketsForAdmin({ page, limit, status, priority, category });
    return ok(c, result);
  } catch (error) {
    console.error('listAllTicketsForAdmin error:', error);
    return err(c, 'ADMIN_TICKETS_FAILED', 'Failed to list tickets', 500);
  }
});

// GET /api/admin/tickets/stream (SSE for admin)
adminTicketsRoutes.get('/stream', async (c) => {
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

// GET /api/admin/tickets/:ticketId
adminTicketsRoutes.get('/:ticketId', async (c) => {
  const ticketId = c.req.param('ticketId');
  try {
    const result = await getTicketForAdmin(ticketId);
    if (!result) {
      return err(c, 'NOT_FOUND', 'Support ticket not found', 404);
    }
    return ok(c, result);
  } catch (error) {
    console.error('getTicketForAdmin error:', error);
    return err(c, 'GET_TICKET_FAILED', 'Failed to get ticket', 500);
  }
});

// GET /api/admin/tickets/:ticketId/messages
adminTicketsRoutes.get('/:ticketId/messages', async (c) => {
  const ticketId = c.req.param('ticketId');
  const page = Math.max(1, Number(c.req.query('page') || 1));
  const limit = Math.min(100, Math.max(1, Number(c.req.query('limit') || 20)));

  try {
    const ticketData = await getTicketForAdmin(ticketId);
    if (!ticketData) {
      return err(c, 'NOT_FOUND', 'Support ticket not found', 404);
    }

    const result = await getTicketMessages(ticketId, { page, limit });
    return ok(c, result);
  } catch (error) {
    console.error('getTicketMessages admin error:', error);
    return err(c, 'GET_MESSAGES_FAILED', 'Failed to get ticket messages', 500);
  }
});

// POST /api/admin/tickets/:ticketId/messages
adminTicketsRoutes.post('/:ticketId/messages', async (c) => {
  const ticketId = c.req.param('ticketId');
  const body = await c.req.json().catch(() => null);

  if (!body || typeof body.body !== 'string' || !body.body.trim()) {
    return err(c, 'INVALID_BODY', 'Message body is required (1-5000 characters)', 400);
  }

  const trimmedBody = body.body.trim();
  if (trimmedBody.length > 5000) {
    return err(c, 'BODY_TOO_LONG', 'Message body must not exceed 5000 characters', 400);
  }

  if (!body.messageUuid || typeof body.messageUuid !== 'string') {
    return err(c, 'INVALID_MESSAGE_UUID', 'messageUuid is required', 400);
  }

  try {
    const adminUserId = await getAdminUser();
    const result = await sendTicketMessage({
      ticketId,
      senderId: adminUserId,
      senderRole: 'admin',
      body: trimmedBody,
      messageUuid: body.messageUuid,
    });
    return ok(c, result);
  } catch (error: any) {
    if (error?.message?.includes('INVALID_MESSAGE_UUID_FORMAT')) {
      return err(c, 'INVALID_MESSAGE_UUID_FORMAT', 'messageUuid must be a valid UUID v4', 400);
    }
    if (error?.message?.includes('ADMIN_SEED_EMAIL')) {
      return err(c, 'ADMIN_USER_MISSING', 'Admin seed user not found in database', 500);
    }
    if (error?.message?.includes('MESSAGE_UUID_TAKEN')) {
      return err(c, 'MESSAGE_UUID_TAKEN', 'This messageUuid has already been used', 409);
    }
    console.error('sendTicketMessage admin error:', error);
    return err(c, 'SEND_MESSAGE_FAILED', 'Failed to send ticket message', 500);
  }
});

// POST /api/admin/tickets/:ticketId/read
adminTicketsRoutes.post('/:ticketId/read', async (c) => {
  const ticketId = c.req.param('ticketId');
  try {
    const result = await markTicketRead(ticketId, 'admin');
    return ok(c, result);
  } catch (error) {
    console.error('markTicketRead admin error:', error);
    return err(c, 'MARK_READ_FAILED', 'Failed to mark ticket read', 500);
  }
});

// PATCH /api/admin/tickets/:ticketId/status
adminTicketsRoutes.patch('/:ticketId/status', async (c) => {
  const ticketId = c.req.param('ticketId');
  const body = await c.req.json().catch(() => null);

  if (!body || typeof body.status !== 'string') {
    return err(c, 'INVALID_STATUS', 'Status field is required', 400);
  }

  try {
    const adminUserId = await getAdminUser();
    const result = await updateTicketStatus(ticketId, body.status, adminUserId);
    if (!result) {
      return err(c, 'NOT_FOUND', 'Support ticket not found', 404);
    }
    return ok(c, result);
  } catch (error: any) {
    if (error?.message?.includes('Invalid status')) {
      return err(c, 'INVALID_STATUS', error.message, 400);
    }
    console.error('updateTicketStatus error:', error);
    return err(c, 'UPDATE_STATUS_FAILED', 'Failed to update ticket status', 500);
  }
});

// PATCH /api/admin/tickets/:ticketId/assign
adminTicketsRoutes.patch('/:ticketId/assign', async (c) => {
  const ticketId = c.req.param('ticketId');
  const body = await c.req.json().catch(() => null);

  const assignedTo = body?.assignedTo !== undefined ? body.assignedTo : null;

  try {
    const result = await assignTicket(ticketId, assignedTo);
    if (!result) {
      return err(c, 'NOT_FOUND', 'Support ticket not found', 404);
    }
    return ok(c, result);
  } catch (error: any) {
    if (error?.message?.includes('ASSIGNED_USER_NOT_FOUND')) {
      return err(c, 'ASSIGNED_USER_NOT_FOUND', 'Assigned user not found in database', 400);
    }
    console.error('assignTicket error:', error);
    return err(c, 'ASSIGN_TICKET_FAILED', 'Failed to assign ticket', 500);
  }
});

// POST /api/admin/tickets/:ticketId/close
adminTicketsRoutes.post('/:ticketId/close', async (c) => {
  const ticketId = c.req.param('ticketId');
  try {
    const result = await closeTicket(ticketId);
    if (!result) {
      return err(c, 'NOT_FOUND', 'Support ticket not found', 404);
    }
    return ok(c, result);
  } catch (error) {
    console.error('closeTicket admin error:', error);
    return err(c, 'CLOSE_TICKET_FAILED', 'Failed to close ticket', 500);
  }
});

// POST /api/admin/tickets/:ticketId/reopen
adminTicketsRoutes.post('/:ticketId/reopen', async (c) => {
  const ticketId = c.req.param('ticketId');
  try {
    const result = await reopenTicket(ticketId);
    if (!result) {
      return err(c, 'NOT_FOUND', 'Support ticket not found', 404);
    }
    return ok(c, result);
  } catch (error) {
    console.error('reopenTicket admin error:', error);
    return err(c, 'REOPEN_TICKET_FAILED', 'Failed to reopen ticket', 500);
  }
});
