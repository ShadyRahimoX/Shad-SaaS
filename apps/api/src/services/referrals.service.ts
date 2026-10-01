import { db, users, referrals, referralCommissions, settings } from '@shad-saas/db';
import { eq, and, desc, sql, asc } from 'drizzle-orm';

/**
 * يُعالج عمولة الإحالة عند نجاح طلب.
 * - يجد المُحيل (referrer) لهذا المستخدم
 * - يحسب العمولة = profit × commissionPercent / 100
 * - يضيف للمحفظة referral_balance_usd
 * - يسجل الحركة
 */
export async function processReferralCommission(params: {
  userId: string;         // من اشترى
  orderId: string;
  orderAmountUsd: number;
  orderProfitUsd: number;
}): Promise<{
  processed: boolean;
  commissionUsd: number;
  referrerId?: string;
  reason?: string;
}> {
  const { userId, orderId, orderAmountUsd, orderProfitUsd } = params;

  // 1. ابحث عن الإحالة لهذا المستخدم
  const [referral] = await db
    .select()
    .from(referrals)
    .where(eq(referrals.referredUserId, userId))
    .limit(1);

  if (!referral) {
    return { processed: false, commissionUsd: 0, reason: 'no_referral' };
  }

  // 2. احسب العمولة = profit × percent
  const percent = Number(referral.commissionPercent);
  const commission = Number(((orderProfitUsd * percent) / 100).toFixed(10));

  if (commission <= 0) {
    return { processed: false, commissionUsd: 0, reason: 'zero_commission' };
  }

  // ⭐ Idempotency check
  const [existing] = await db
    .select({ id: referralCommissions.id })
    .from(referralCommissions)
    .where(eq(referralCommissions.orderId, orderId))
    .limit(1);

  if (existing) {
    return { processed: false, commissionUsd: 0, reason: 'already_processed' };
  }

  // 3. transaction: أضف للرصيد + سجل في commissions + حدّث referral
  await db.transaction(async (tx) => {
    // 3a. جلب referrer
    const [referrer] = await tx
      .select()
      .from(users)
      .where(eq(users.id, referral.referrerId))
      .limit(1);

    if (!referrer) throw new Error('Referrer not found');

    const currentBalance = Number(referrer.referralBalanceUsd || 0);
    const newBalance = Number((currentBalance + commission).toFixed(10));

    // 3b. حدّث رصيد المُحيل
    await tx
      .update(users)
      .set({ referralBalanceUsd: newBalance.toFixed(10), updatedAt: new Date() })
      .where(eq(users.id, referral.referrerId));

    // 3c. سجّل العمولة
    await tx.insert(referralCommissions).values({
      referralId: referral.id,
      orderId,
      orderAmountUsd: orderAmountUsd.toFixed(10),
      orderProfitUsd: orderProfitUsd.toFixed(10),
      commissionUsd: commission.toFixed(10),
    });

    // 3d. حدّث إجمالي الأرباح
    const newTotalEarned = Number((Number(referral.totalEarnedUsd) + commission).toFixed(10));
    await tx
      .update(referrals)
      .set({
        totalEarnedUsd: newTotalEarned.toFixed(10),
        totalOrdersCount: referral.totalOrdersCount + 1,
        updatedAt: new Date(),
      })
      .where(eq(referrals.id, referral.id));
  });

  return {
    processed: true,
    commissionUsd: commission,
    referrerId: referral.referrerId,
  };
}

/**
 * معلومات الإحالة لمستخدم (للعرض في profile)
 */
export async function getReferralInfo(userId: string) {
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user) return null;

  // احصاء الإحالات
  const stats = await db
    .select({
      totalReferred: sql<number>`count(*)::int`,
      totalEarned: sql<string>`coalesce(sum(total_earned_usd), 0)::text`,
      totalOrders: sql<number>`coalesce(sum(total_orders_count), 0)::int`,
    })
    .from(referrals)
    .where(eq(referrals.referrerId, userId));

  const s = stats[0];

  return {
    referralCode: user.referralCode,
    referralLink: `https://store.shad-saas.com/register?ref=${user.referralCode}`,
    referralBalanceUsd: Number(user.referralBalanceUsd),
    totalReferred: s.totalReferred,
    totalEarned: Number(s.totalEarned),
    totalOrders: s.totalOrders,
  };
}

/**
 * سجل الإحالات المفصّل
 */
export async function listUserReferrals(userId: string, page = 1, limit = 20) {
  const offset = (page - 1) * limit;

  const rows = await db
    .select({
      id: referrals.id,
      referredUserId: referrals.referredUserId,
      totalEarnedUsd: referrals.totalEarnedUsd,
      totalOrdersCount: referrals.totalOrdersCount,
      createdAt: referrals.createdAt,
      referredUsername: users.username,
    })
    .from(referrals)
    .leftJoin(users, eq(users.id, referrals.referredUserId))
    .where(eq(referrals.referrerId, userId))
    .orderBy(desc(referrals.createdAt))
    .limit(limit)
    .offset(offset);

  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(referrals)
    .where(eq(referrals.referrerId, userId));

  return { referrals: rows, total: count, page, limit };
}

/**
 * سجل العمولات التفصيلي
 */
export async function listReferralCommissions(referralId: string, page = 1, limit = 20) {
  const offset = (page - 1) * limit;

  const rows = await db
    .select()
    .from(referralCommissions)
    .where(eq(referralCommissions.referralId, referralId))
    .orderBy(desc(referralCommissions.createdAt))
    .limit(limit)
    .offset(offset);

  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(referralCommissions)
    .where(eq(referralCommissions.referralId, referralId));

  return { commissions: rows, total: count, page, limit };
}
