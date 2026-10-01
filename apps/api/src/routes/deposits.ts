import { Hono } from 'hono';
import { z } from 'zod';
import { db, deposits } from '@shad-saas/db';
import { eq, and } from 'drizzle-orm';
import { createDepositSchema } from '@shad-saas/validators';
import { ok, err } from '../lib/response.js';
import { requireAuth, type AuthVariables } from '../middleware/auth.js';
import {
  DepositError,
  createDeposit,
  getDepositById,
  listUserDeposits,
} from '../services/deposits.service.js';

export const depositsRoutes = new Hono<{ Variables: AuthVariables }>();

depositsRoutes.use('*', requireAuth);

// POST /api/deposits
depositsRoutes.post('/', async (c) => {
  const body = await c.req.json().catch(() => null);
  if (!body) return err(c, 'INVALID_BODY', 'Invalid JSON body', 400);

  const result = createDepositSchema.safeParse(body);
  if (!result.success) {
    return err(c, 'VALIDATION_ERROR', result.error.errors.map((e) => e.message).join(', '), 400);
  }

  const userId = c.get('userId');
  const dryRun = process.env.DRY_RUN_DEPOSITS === 'true';

  try {
    const data = await createDeposit({ userId, input: result.data, dryRun });
    return ok(c, data, 201);
  } catch (error) {
    if (error instanceof DepositError) {
      return err(c, error.code, error.message, error.statusCode);
    }
    console.error('Create deposit error:', error);
    return err(c, 'DEPOSIT_FAILED', 'Failed to create deposit', 500);
  }
});

// GET /api/deposits
depositsRoutes.get('/', async (c) => {
  const userId = c.get('userId');
  const page = Math.max(1, Number(c.req.query('page') || 1));
  const limit = Math.min(50, Math.max(1, Number(c.req.query('limit') || 20)));
  const status = c.req.query('status');

  try {
    const result = await listUserDeposits(userId, page, limit, status);
    return ok(c, result);
  } catch (error) {
    console.error('List deposits error:', error);
    return err(c, 'LIST_FAILED', 'Failed to list deposits', 500);
  }
});

// GET /api/deposits/:id
depositsRoutes.get('/:id', async (c) => {
  const userId = c.get('userId');
  const depositId = c.req.param('id');

  try {
    const deposit = await getDepositById(userId, depositId);
    return ok(c, deposit);
  } catch (error) {
    if (error instanceof DepositError) {
      return err(c, error.code, error.message, error.statusCode);
    }
    console.error('Get deposit error:', error);
    return err(c, 'GET_FAILED', 'Failed to get deposit', 500);
  }
});

// POST /api/deposits/:id/verify
depositsRoutes.post('/:id/verify', async (c) => {
  const userId = c.get('userId');
  const depositId = c.req.param('id');

  const body = await c.req.json().catch(() => null);
  if (!body) return err(c, 'INVALID_BODY', 'Invalid JSON body', 400);

  const schema = z.object({
    transactionRef: z.string().min(1).max(200),
    extraFields: z.record(z.union([z.string(), z.number(), z.boolean()])).optional(),
  });

  const result = schema.safeParse(body);
  if (!result.success) {
    return err(c, 'VALIDATION_ERROR', result.error.errors.map((e) => e.message).join(', '), 400);
  }

  const [deposit] = await db
    .select()
    .from(deposits)
    .where(and(eq(deposits.id, depositId), eq(deposits.userId, userId)))
    .limit(1);

  if (!deposit) {
    return err(c, 'NOT_FOUND', 'Deposit not found', 404);
  }

  if (deposit.status !== 'pending') {
    return err(c, 'NOT_PENDING', 'Deposit is not pending verification', 400);
  }

  const updateData: any = {
    transactionRef: result.data.transactionRef,
    updatedAt: new Date(),
  };

  if (result.data.extraFields) {
    const existingResp = (deposit.providerResponse as Record<string, any>) || {};
    updateData.providerResponse = {
      ...existingResp,
      extraFields: {
        ...(existingResp.extraFields || {}),
        ...result.data.extraFields,
      },
    };
  }

  const [updated] = await db
    .update(deposits)
    .set(updateData)
    .where(eq(deposits.id, depositId))
    .returning();

  return ok(c, updated);
});
