import { db, deposits, paymentMethods, transactions, users } from '@shad-saas/db';
import { eq, and, desc, sql } from 'drizzle-orm';
import { createInvoice } from '@shad-saas/providers';
import { convertToUsd } from '@shad-saas/providers';
import type { CreateDepositInput } from '@shad-saas/validators';

export class DepositError extends Error {
  constructor(
    public code: string,
    message: string,
    public statusCode: number = 400
  ) {
    super(message);
    this.name = 'DepositError';
  }
}

interface CreateDepositContext {
  userId: string;
  input: CreateDepositInput;
  dryRun: boolean;  // DRY_RUN_DEPOSITS env
}

export async function createDeposit(ctx: CreateDepositContext) {
  const { userId, input, dryRun } = ctx;
  const { methodCode, amount, currency, transactionRef, proofImageUrl, extraFields } = input;

  // 1. ابحث عن المستخدم
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user) throw new DepositError('USER_NOT_FOUND', 'User not found', 404);
  if (user.banned) throw new DepositError('USER_BANNED', 'User is banned', 403);

  // 2. ابحث عن طريقة الدفع
  const [method] = await db
    .select()
    .from(paymentMethods)
    .where(and(eq(paymentMethods.code, methodCode), eq(paymentMethods.active, true)))
    .limit(1);

  if (!method) throw new DepositError('METHOD_NOT_FOUND', 'Payment method not found or inactive', 404);

  // 3. تحقق من العملة
  const allowedCurrencies = method.allowedCurrencies as string[];
  if (!allowedCurrencies.includes(currency)) {
    throw new DepositError(
      'CURRENCY_NOT_ALLOWED',
      `Currency ${currency} is not allowed for this method. Allowed: ${allowedCurrencies.join(', ')}`,
      400
    );
  }

  // 4. حوّل إلى USD
  let amountUsd: number;
  try {
    amountUsd = convertToUsd(amount, currency);
  } catch (err) {
    throw new DepositError('CURRENCY_CONVERSION_FAILED', `Cannot convert ${currency} to USD`, 400);
  }

  // 5. تحقق من min/max
  const minUsd = Number(method.minAmountUsd);
  const maxUsd = method.maxAmountUsd ? Number(method.maxAmountUsd) : null;

  if (amountUsd < minUsd) {
    throw new DepositError('AMOUNT_TOO_SMALL', `Minimum is $${minUsd}. Got $${amountUsd.toFixed(4)}`, 400);
  }
  if (maxUsd !== null && amountUsd > maxUsd) {
    throw new DepositError('AMOUNT_TOO_LARGE', `Maximum is $${maxUsd}. Got $${amountUsd.toFixed(4)}`, 400);
  }

  // 6. تحقق من الحقول المطلوبة
  const requiredFields = (method.requiredFields as Array<{ name: string; required: boolean }>) || [];
  for (const rf of requiredFields) {
    if (!rf.required) continue;
    if (rf.name === 'transactionRef' && !transactionRef) {
      throw new DepositError('MISSING_FIELD', `Required field: ${rf.name}`, 400);
    }
    if (rf.name === 'proofImage' && !proofImageUrl) {
      throw new DepositError('MISSING_FIELD', `Required field: proofImage (proofImageUrl)`, 400);
    }
  }

  // 7. DRY_RUN guard
  if (!dryRun && method.type === 'invoice') {
    // ⚠️ في E3b سنستدعي SAM هنا
    throw new DepositError(
      'DRY_RUN_REQUIRED',
      'Real SAM invoice creation is disabled. Use DRY_RUN_DEPOSITS=true.',
      503
    );
  }

  // 8. أنشئ الإيداع + provider response
  let invoiceId: string | null = null;
  let paymentUrl: string | null = null;
  let expiresAt: Date | null = null;
  let providerResponse: Record<string, unknown> | null = null;

  if (dryRun && method.type === 'invoice') {
    // MOCK: نُحاكي رد SAM
    invoiceId = `MOCK_INV_${Date.now()}`;
    paymentUrl = `https://mock.sam-api.pro/pay/${invoiceId}`;
    expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 دقيقة
    providerResponse = {
      dryRun: true,
      message: 'MOCKED: no real SAM invoice created',
      simulatedInvoiceId: invoiceId,
      simulatedPaymentUrl: paymentUrl,
      timestamp: new Date().toISOString(),
    };
  }

  // 9. أدرج الإيداع
  const [newDeposit] = await db
    .insert(deposits)
    .values({
      userId,
      paymentMethodId: method.id,
      method: methodCode,
      amount: amount.toFixed(4),
      currency: currency.toUpperCase(),
      amountUsd: amountUsd.toFixed(10),
      exchangeRate: '1.000000',
      invoiceId,
      transactionRef: transactionRef || null,
      status: 'pending',
      paymentUrl,
      expiresAt,
      proofImageUrl: proofImageUrl || null,
      providerResponse: providerResponse,
      approvedVia: null,
      notes: null,
    })
    .returning();

  return {
    deposit: newDeposit,
    method: {
      code: method.code,
      name: method.name,
      type: method.type,
      uiLayout: (method.config as any)?.ui_layout,
      instructions: method.instructions,
      config: method.config,
      requiredFields: method.requiredFields,
    },
  };
}

export async function getDepositById(userId: string, depositId: string) {
  const [deposit] = await db
    .select()
    .from(deposits)
    .where(and(eq(deposits.id, depositId), eq(deposits.userId, userId)))
    .limit(1);
  if (!deposit) throw new DepositError('DEPOSIT_NOT_FOUND', 'Deposit not found', 404);
  return deposit;
}

export async function listUserDeposits(
  userId: string,
  page: number,
  limit: number,
  status?: string
) {
  const offset = (page - 1) * limit;
  const conditions = [eq(deposits.userId, userId)];
  if (status) conditions.push(eq(deposits.status, status));

  const rows = await db
    .select()
    .from(deposits)
    .where(and(...conditions))
    .orderBy(desc(deposits.createdAt))
    .limit(limit)
    .offset(offset);

  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(deposits)
    .where(and(...conditions));

  return { deposits: rows, total: count, page, limit };
}
