import { db, deposits, transactions, users } from '@shad-saas/db';
import { eq } from 'drizzle-orm';
import type { SamWebhookPayload } from '@shad-saas/providers';
import { createNotification } from './notifications.service.js';

export class WebhookError extends Error {
  constructor(public code: string, message: string, public statusCode = 400) {
    super(message);
    this.name = 'WebhookError';
  }
}

/**
 * Process invoice.paid event:
 * - Find deposit by invoiceId
 * - Skip if already processed (idempotency)
 * - Credit user's balance
 * - Create transaction record
 * - Update deposit status
 */
export async function processInvoicePaid(payload: SamWebhookPayload) {
  const { invoiceId, transactionRef, paidAt, counterparty } = payload;

  // 1. ابحث عن الإيداع
  const [deposit] = await db
    .select()
    .from(deposits)
    .where(eq(deposits.invoiceId, invoiceId))
    .limit(1);

  if (!deposit) {
    throw new WebhookError('DEPOSIT_NOT_FOUND', `No deposit with invoiceId ${invoiceId}`, 404);
  }

  // 2. Idempotency — إذا كان paid بالفعل، تجاهل
  if (deposit.status === 'paid') {
    console.log(`[Webhook] Deposit ${deposit.id} already paid, skipping`);
    return { deposit, skipped: true, reason: 'already_paid' };
  }

  // 3. لا نعالج إذا كان rejected/expired
  if (deposit.status !== 'pending') {
    console.log(`[Webhook] Deposit ${deposit.id} status is ${deposit.status}, skipping credit`);
    return { deposit, skipped: true, reason: `status_${deposit.status}` };
  }

  // 4. ابحث عن المستخدم
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, deposit.userId))
    .limit(1);

  if (!user) {
    throw new WebhookError('USER_NOT_FOUND', `User ${deposit.userId} not found`, 404);
  }

  // 5. Credit في transaction واحد
  const amountUsd = Number(deposit.amountUsd);
  const balanceBefore = Number(user.balanceUsd);
  const balanceAfter = balanceBefore + amountUsd;

  const result = await db.transaction(async (tx) => {
    // 5a. حدّث الإيداع
    const [updated] = await tx
      .update(deposits)
      .set({
        status: 'paid',
        paidAt: paidAt ? new Date(paidAt) : new Date(),
        transactionRef: transactionRef || deposit.transactionRef,
        approvedVia: 'webhook',
      })
      .where(eq(deposits.id, deposit.id))
      .returning();

    // 5b. حدّث رصيد المستخدم
    await tx
      .update(users)
      .set({
        balanceUsd: balanceAfter.toFixed(10),
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id));

    // 5c. سجّل الحركة
    await tx.insert(transactions).values({
      userId: user.id,
      type: 'deposit',
      amountUsd: amountUsd.toFixed(10),
      balanceBefore: balanceBefore.toFixed(10),
      balanceAfter: balanceAfter.toFixed(10),
      referenceType: 'deposit',
      referenceId: deposit.id,
      description: `Deposit via ${deposit.method}: $${amountUsd.toFixed(2)}${counterparty ? ` from ${counterparty}` : ''}`,
    });

    return updated;
  });

  // ⭐ Notification: deposit.approved
  try {
    await createNotification({
      userId: user.id,
      type: 'deposit.approved',
      title: 'تمت الموافقة على الإيداع',
      body: `تم إضافة $${amountUsd.toFixed(2)} لرصيدك بنجاح.`,
      payload: { depositId: result.id, amountUsd },
    });
  } catch (err) {
    console.error('[Notification] deposit.approved failed:', err);
  }

  return {
    deposit: result,
    skipped: false,
    credited: amountUsd,
    balanceBefore,
    balanceAfter,
  };
}

/**
 * Process invoice.expired event
 */
export async function processInvoiceExpired(payload: SamWebhookPayload) {
  const { invoiceId } = payload;

  const [deposit] = await db
    .select()
    .from(deposits)
    .where(eq(deposits.invoiceId, invoiceId))
    .limit(1);

  if (!deposit) {
    throw new WebhookError('DEPOSIT_NOT_FOUND', `No deposit with invoiceId ${invoiceId}`, 404);
  }

  // Idempotency
  if (deposit.status !== 'pending') {
    return { deposit, skipped: true, reason: `status_${deposit.status}` };
  }

  const [updated] = await db
    .update(deposits)
    .set({ status: 'expired' })
    .where(eq(deposits.id, deposit.id))
    .returning();

  // ⭐ Notification: deposit.rejected
  try {
    await createNotification({
      userId: deposit.userId,
      type: 'deposit.rejected',
      title: 'انتهت صلاحية الإيداع',
      body: `انتهت صلاحية طلب الإيداع بقيمة $${Number(deposit.amountUsd).toFixed(2)}.`,
      payload: { depositId: updated.id },
    });
  } catch (err) {
    console.error('[Notification] deposit.rejected failed:', err);
  }

  return { deposit: updated, skipped: false };
}
