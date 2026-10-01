import { db, orders, products, users, transactions, vipLevels } from '@shad-saas/db';
import { eq, and, desc, sql } from 'drizzle-orm';
import { generateUuid } from '@shad-saas/utils';
import { calculateVipPrice } from '@shad-saas/providers';
import { type CreateOrderInput, MIN_ORDER_TOTAL_USD } from '@shad-saas/validators';
import { autoUpgradeVip } from './vip.service.js';
import { processReferralCommission } from './referrals.service.js';

export class OrderError extends Error {
  constructor(
    public code: string,
    message: string,
    public statusCode: number = 400
  ) {
    super(message);
    this.name = 'OrderError';
  }
}

interface CreateOrderContext {
  userId: string;
  input: CreateOrderInput;
  dryRun: boolean;
}

export async function createOrder(ctx: CreateOrderContext) {
  const { userId, input, dryRun } = ctx;
  const { productId, qty, playerId, extraFields, orderUuid } = input;

  // 1. ابحث عن المستخدم
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user) throw new OrderError('USER_NOT_FOUND', 'User not found', 404);
  if (user.banned) throw new OrderError('USER_BANNED', 'User is banned', 403);

  // 2. ابحث عن المنتج
  const [product] = await db.select().from(products).where(eq(products.id, productId)).limit(1);
  if (!product) throw new OrderError('PRODUCT_NOT_FOUND', 'Product not found', 404);
  if (!product.available) throw new OrderError('PRODUCT_UNAVAILABLE', 'Product is not available', 400);

  // 3. تحقق من qty
  const minQty = Number(product.minQty);
  const maxQty = product.maxQty ? Number(product.maxQty) : null;
  if (qty < minQty) throw new OrderError('QTY_TOO_SMALL', `Minimum quantity is ${minQty}`, 400);
  if (maxQty !== null && qty > maxQty) throw new OrderError('QTY_TOO_LARGE', `Maximum quantity is ${maxQty}`, 400);

  // 4. ⭐ VIP Pricing
  let userVipLevel = null;
  if (user.vipLevelId) {
    const [lvl] = await db
      .select()
      .from(vipLevels)
      .where(eq(vipLevels.id, user.vipLevelId))
      .limit(1);
    userVipLevel = lvl;
  }

  const vipLevel = userVipLevel || {
    levelNumber: 0,
    centDiscountPercent: '0.00',
    profitFloorPercent: '10.00',
    cashbackPercent: '0.00',
  };

  const vip = calculateVipPrice(
    Number(product.priceUsd),
    Number(product.basePriceUsd),
    {
      levelNumber: Number(vipLevel.levelNumber),
      centDiscountPercent: Number(vipLevel.centDiscountPercent),
      profitFloorPercent: Number(vipLevel.profitFloorPercent),
      cashbackPercent: Number(vipLevel.cashbackPercent),
    }
  );

  const totalUserPrice = Number((vip.userPrice * qty).toFixed(10));
  const totalCost = Number((vip.basePrice * qty).toFixed(10));
  const totalProfit = Number((vip.sellerProfit * qty).toFixed(10));
  const totalCashback = Number((vip.cashback * qty).toFixed(10));

  if (totalUserPrice < MIN_ORDER_TOTAL_USD) {
    throw new OrderError(
      'ORDER_TOO_SMALL',
      `Minimum order total is $${MIN_ORDER_TOTAL_USD}. Got $${totalUserPrice.toFixed(6)}`,
      400
    );
  }

  const balance = Number(user.balanceUsd);
  if (balance < totalUserPrice) {
    throw new OrderError(
      'INSUFFICIENT_BALANCE',
      `Need $${totalUserPrice.toFixed(4)}, have $${balance.toFixed(4)}`,
      400
    );
  }

  // 5. تحقق من عدم تكرار order_uuid
  const [existing] = await db
    .select({ id: orders.id })
    .from(orders)
    .where(eq(orders.orderUuid, orderUuid))
    .limit(1);
  if (existing) {
    throw new OrderError('ORDER_EXISTS', 'Order with this UUID already exists', 409);
  }

  // 6. DRY_RUN mode — لا نستدعي Alkasr
  const mockProviderResponse = dryRun
    ? {
        dryRun: true,
        message: 'MOCKED: no real Alkasr call performed',
        simulatedStatus: 'accept' as const,
        simulatedOrderId: `MOCK_${orderUuid.substring(0, 8)}`,
        timestamp: new Date().toISOString(),
      }
    : null;

  if (!dryRun) {
    throw new OrderError(
      'DRY_RUN_REQUIRED',
      'Real Alkasr order creation is disabled in development. Use DRY_RUN_ORDERS=true.',
      503
    );
  }

  // 7. أنشئ الطلب + الخصم من الرصيد + تحديث الكاش باك والمصروفات في transaction واحد
  const result = await db.transaction(async (tx) => {
    // 7a. أنشئ الطلب
    const [newOrder] = await tx
      .insert(orders)
      .values({
        orderUuid,
        userId,
        productId,
        qty,
        playerId,
        extraFields: extraFields || {},
        priceUsd: totalUserPrice.toFixed(10),
        costUsd: totalCost.toFixed(10),
        profitUsd: totalProfit.toFixed(10),
        status: 'accept', // في DRY_RUN نفترض القبول
        providerOrderId: mockProviderResponse?.simulatedOrderId || null,
        providerResponse: mockProviderResponse,
      })
      .returning();

    // 7b. حدّث رصيد المستخدم والمصروفات والكاش باك
    const newBalance = Number((balance - totalUserPrice).toFixed(10));
    const currentSpent = Number(user.totalSpentUsd || 0);
    const newTotalSpent = Number((currentSpent + totalUserPrice).toFixed(10));
    const currentCashback = Number(user.cashbackBalanceUsd || 0);
    const newCashbackBalance = Number((currentCashback + totalCashback).toFixed(10));

    await tx
      .update(users)
      .set({
        balanceUsd: newBalance.toFixed(10),
        totalSpentUsd: newTotalSpent.toFixed(10),
        cashbackBalanceUsd: newCashbackBalance.toFixed(10),
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));

    // 7c. سجّل حركة الشراء
    await tx.insert(transactions).values({
      userId,
      type: 'purchase',
      amountUsd: (-totalUserPrice).toFixed(10),
      balanceBefore: balance.toFixed(10),
      balanceAfter: newBalance.toFixed(10),
      referenceType: 'order',
      referenceId: newOrder.id,
      description: `Order ${newOrder.displayId}: ${product.name} x${qty}`,
    });

    // 7d. سجّل حركة الكاش باك إن وجدت
    if (totalCashback > 0) {
      await tx.insert(transactions).values({
        userId,
        type: 'cashback',
        amountUsd: totalCashback.toFixed(10),
        balanceBefore: newBalance.toFixed(10),
        balanceAfter: newBalance.toFixed(10),
        referenceType: 'order',
        referenceId: newOrder.id,
        description: `Cashback for order ${newOrder.displayId}: $${totalCashback.toFixed(4)}`,
      });
    }

    return newOrder;
  });

  // ⭐ بعد إتمام الطلب، حاول ترقية VIP تلقائياً
  try {
    const upgradeResult = await autoUpgradeVip(userId);
    if (upgradeResult.upgraded) {
      console.log(`[VIP] User ${userId} upgraded: ${upgradeResult.fromLevel} → ${upgradeResult.toLevel}`);
    }
  } catch (err) {
    console.error('[VIP] Auto-upgrade failed:', err);
  }

  // ⭐ عمولة الإحالة
  try {
    const refResult = await processReferralCommission({
      userId,
      orderId: result.id,
      orderAmountUsd: totalUserPrice,
      orderProfitUsd: totalProfit,
    });
    if (refResult.processed) {
      console.log(`[Referral] Commission: $${refResult.commissionUsd} to ${refResult.referrerId}`);
    }
  } catch (err) {
    console.error('[Referral] Commission failed:', err);
  }

  return result;
}

export async function getOrderById(userId: string, orderId: string) {
  const [order] = await db
    .select()
    .from(orders)
    .where(and(eq(orders.id, orderId), eq(orders.userId, userId)))
    .limit(1);
  if (!order) throw new OrderError('ORDER_NOT_FOUND', 'Order not found', 404);
  return order;
}

export async function listUserOrders(userId: string, page: number, limit: number, status?: string) {
  const offset = (page - 1) * limit;
  const conditions = [eq(orders.userId, userId)];
  if (status) conditions.push(eq(orders.status, status));

  const rows = await db
    .select()
    .from(orders)
    .where(and(...conditions))
    .orderBy(desc(orders.createdAt))
    .limit(limit)
    .offset(offset);

  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(orders)
    .where(and(...conditions));

  return { orders: rows, total: count, page, limit };
}
