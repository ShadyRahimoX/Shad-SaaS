import { db, orders, products, users, transactions } from '@shad-saas/db';
import { eq, and, desc, sql } from 'drizzle-orm';
import { generateUuid } from '@shad-saas/utils';
import { type CreateOrderInput, MIN_ORDER_TOTAL_USD } from '@shad-saas/validators';

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

  // 4. تحقق من الرصيد والحد الأدنى للطلب
  const pricePerUnit = Number(product.priceUsd);
  const totalPrice = pricePerUnit * qty;

  if (totalPrice < MIN_ORDER_TOTAL_USD) {
    throw new OrderError(
      'ORDER_TOO_SMALL',
      `Minimum order total is $${MIN_ORDER_TOTAL_USD}. Got $${totalPrice.toFixed(6)}`,
      400
    );
  }

  const balance = Number(user.balanceUsd);
  if (balance < totalPrice) {
    throw new OrderError('INSUFFICIENT_BALANCE', 'Insufficient balance', 400);
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
  //    نتخيل أن الطلب قُبل فوراً
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
    // ⚠️ في هذه المرحلة، لا نُجري أي call حقيقي
    // سيُنفّذ في البرومبت القادم مع feature flag
    throw new OrderError(
      'DRY_RUN_REQUIRED',
      'Real Alkasr order creation is disabled in development. Use DRY_RUN_ORDERS=true.',
      503
    );
  }

  // 7. احسب التكلفة والربح
  const costPerUnit = Number(product.basePriceUsd);
  const totalCost = costPerUnit * qty;
  const profit = totalPrice - totalCost;

  // 8. أنشئ الطلب + الخصم من الرصيد في transaction واحد
  const result = await db.transaction(async (tx) => {
    // 8a. أنشئ الطلب
    const [newOrder] = await tx
      .insert(orders)
      .values({
        orderUuid,
        userId,
        productId,
        qty,
        playerId,
        extraFields: extraFields || {},
        priceUsd: totalPrice.toFixed(10),
        costUsd: totalCost.toFixed(10),
        profitUsd: profit.toFixed(10),
        status: 'accept', // في DRY_RUN نفترض القبول
        providerOrderId: mockProviderResponse?.simulatedOrderId || null,
        providerResponse: mockProviderResponse,
      })
      .returning();

    // 8b. اخصم من الرصيد
    const newBalance = (balance - totalPrice).toFixed(2);
    await tx
      .update(users)
      .set({ balanceUsd: newBalance, updatedAt: new Date() })
      .where(eq(users.id, userId));

    // 8c. سجّل الحركة
    await tx.insert(transactions).values({
      userId,
      type: 'purchase',
      amountUsd: (-totalPrice).toFixed(10),
      balanceBefore: balance.toFixed(10),
      balanceAfter: (balance - totalPrice).toFixed(10),
      referenceType: 'order',
      referenceId: newOrder.id,
      description: `Order ${newOrder.displayId}: ${product.name} x${qty}`,
    });

    return newOrder;
  });

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
