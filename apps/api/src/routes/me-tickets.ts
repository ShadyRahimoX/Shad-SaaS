import { Hono } from 'hono';
import { ok, err } from '../lib/response.js';
import { requireAuth, type AuthVariables } from '../middleware/auth.js';
import {
  createTicket,
  getUserTickets,
  getTicketForUser,
  getTicketMessages,
  sendTicketMessage,
  markTicketRead,
  closeTicket,
  ALLOWED_CATEGORIES,
  ALLOWED_PRIORITIES,
} from '../services/tickets.service.js';

export const meTicketsRoutes = new Hono<{ Variables: AuthVariables }>();

meTicketsRoutes.use('*', requireAuth);

// GET /api/me/tickets
meTicketsRoutes.get('/', async (c) => {
  const userId = c.get('userId');
  const page = Math.max(1, Number(c.req.query('page') || 1));
  const limit = Math.min(100, Math.max(1, Number(c.req.query('limit') || 20)));
  const status = c.req.query('status') || undefined;

  try {
    const result = await getUserTickets(userId, { page, limit, status });
    return ok(c, result);
  } catch (error) {
    console.error('getUserTickets error:', error);
    return err(c, 'GET_TICKETS_FAILED', 'Failed to get tickets', 500);
  }
});

// POST /api/me/tickets
meTicketsRoutes.post('/', async (c) => {
  const userId = c.get('userId');
  const body = await c.req.json().catch(() => null);

  if (!body || typeof body.subject !== 'string' || !body.subject.trim()) {
    return err(c, 'INVALID_SUBJECT', 'Ticket subject is required (3-200 characters)', 400);
  }

  const trimmedSubject = body.subject.trim();
  if (trimmedSubject.length < 3 || trimmedSubject.length > 200) {
    return err(c, 'INVALID_SUBJECT_LENGTH', 'Ticket subject must be between 3 and 200 characters', 400);
  }

  const category = body.category || 'other';
  if (!ALLOWED_CATEGORIES.includes(category)) {
    return err(c, 'INVALID_CATEGORY', `Invalid category '${category}'. Allowed: ${ALLOWED_CATEGORIES.join(', ')}`, 400);
  }

  const priority = body.priority || 'normal';
  if (!ALLOWED_PRIORITIES.includes(priority)) {
    return err(c, 'INVALID_PRIORITY', `Invalid priority '${priority}'. Allowed: ${ALLOWED_PRIORITIES.join(', ')}`, 400);
  }

  try {
    const ticket = await createTicket({
      userId,
      subject: trimmedSubject,
      category,
      priority,
    });
    return ok(c, ticket);
  } catch (error: any) {
    console.error('createTicket error:', error);
    return err(c, 'CREATE_TICKET_FAILED', error.message || 'Failed to create ticket', 500);
  }
});

// GET /api/me/tickets/:ticketId
meTicketsRoutes.get('/:ticketId', async (c) => {
  const userId = c.get('userId');
  const ticketId = c.req.param('ticketId');

  try {
    const result = await getTicketForUser(ticketId, userId);
    if (!result) {
      return err(c, 'NOT_FOUND', 'Support ticket not found', 404);
    }
    return ok(c, result);
  } catch (error) {
    console.error('getTicketForUser error:', error);
    return err(c, 'GET_TICKET_FAILED', 'Failed to get ticket', 500);
  }
});

// GET /api/me/tickets/:ticketId/messages
meTicketsRoutes.get('/:ticketId/messages', async (c) => {
  const userId = c.get('userId');
  const ticketId = c.req.param('ticketId');
  const page = Math.max(1, Number(c.req.query('page') || 1));
  const limit = Math.min(100, Math.max(1, Number(c.req.query('limit') || 20)));

  try {
    const ticketData = await getTicketForUser(ticketId, userId);
    if (!ticketData) {
      return err(c, 'NOT_FOUND', 'Support ticket not found', 404);
    }

    const result = await getTicketMessages(ticketId, { page, limit });
    return ok(c, result);
  } catch (error) {
    console.error('getTicketMessages error:', error);
    return err(c, 'GET_MESSAGES_FAILED', 'Failed to get ticket messages', 500);
  }
});

// POST /api/me/tickets/:ticketId/messages
meTicketsRoutes.post('/:ticketId/messages', async (c) => {
  const userId = c.get('userId');
  const ticketId = c.req.param('ticketId');
  const body = await c.req.json().catch(() => null);

  try {
    const ticketData = await getTicketForUser(ticketId, userId);
    if (!ticketData) {
      return err(c, 'NOT_FOUND', 'Support ticket not found', 404);
    }

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

    const result = await sendTicketMessage({
      ticketId,
      senderId: userId,
      senderRole: 'user',
      body: trimmedBody,
      messageUuid: body.messageUuid,
    });

    return ok(c, result);
  } catch (error: any) {
    if (error?.message?.includes('INVALID_MESSAGE_UUID_FORMAT')) {
      return err(c, 'INVALID_MESSAGE_UUID_FORMAT', 'messageUuid must be a valid UUID v4', 400);
    }
    if (error?.message?.includes('MESSAGE_UUID_TAKEN')) {
      return err(c, 'MESSAGE_UUID_TAKEN', 'This messageUuid has already been used', 409);
    }
    console.error('sendTicketMessage error:', error);
    return err(c, 'SEND_MESSAGE_FAILED', 'Failed to send ticket message', 500);
  }
});

// POST /api/me/tickets/:ticketId/read
meTicketsRoutes.post('/:ticketId/read', async (c) => {
  const userId = c.get('userId');
  const ticketId = c.req.param('ticketId');

  try {
    const ticketData = await getTicketForUser(ticketId, userId);
    if (!ticketData) {
      return err(c, 'NOT_FOUND', 'Support ticket not found', 404);
    }

    const result = await markTicketRead(ticketId, 'user');
    return ok(c, result);
  } catch (error) {
    console.error('markTicketRead user error:', error);
    return err(c, 'MARK_READ_FAILED', 'Failed to mark ticket read', 500);
  }
});

// POST /api/me/tickets/:ticketId/close
meTicketsRoutes.post('/:ticketId/close', async (c) => {
  const userId = c.get('userId');
  const ticketId = c.req.param('ticketId');

  try {
    const ticketData = await getTicketForUser(ticketId, userId);
    if (!ticketData) {
      return err(c, 'NOT_FOUND', 'Support ticket not found', 404);
    }

    const result = await closeTicket(ticketId);
    return ok(c, result);
  } catch (error) {
    console.error('closeTicket user error:', error);
    return err(c, 'CLOSE_TICKET_FAILED', 'Failed to close ticket', 500);
  }
});
