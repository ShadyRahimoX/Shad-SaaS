import { db, users, vipLevels } from '@shad-saas/db';
import { eq, desc, and, sql, asc } from 'drizzle-orm';
import { createNotification } from './notifications.service.js';

export interface VipInfo {
  level: number;
  name: string;
  color: string | null;
  minSpendingUsd: number;
  centDiscountPercent: number;
  profitFloorPercent: number;
  cashbackPercent: number;
  nextLevel: {
    name: string;
    minSpendingUsd: number;
    remainingUsd: number;
    progressPercent: number;
  } | null;
}

/**
 * جلب كل مستويات VIP مرتبة
 */
export async function getAllVipLevels() {
  return db.select().from(vipLevels).orderBy(asc(vipLevels.levelNumber));
}

/**
 * حساب مستوى VIP المستحق بناءً على totalSpentUsd
 */
export async function calculateEligibleLevel(totalSpentUsd: number) {
  const levels = await getAllVipLevels();
  let eligible = levels[0];
  for (const l of levels) {
    if (totalSpentUsd >= Number(l.minSpendingUsd)) {
      eligible = l;
    }
  }
  return eligible;
}

/**
 * ترقية تلقائية بعد الشراء
 * - يتجاهل إذا كان المستخدم vip_is_manual = true
 * - يُرقّي فقط (لا يُخفّض)
 */
export async function autoUpgradeVip(userId: string): Promise<{
  upgraded: boolean;
  fromLevel: number;
  toLevel: number;
  reason: string;
}> {
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user) throw new Error('User not found');

  // إذا كانت VIP يدوية → لا نلمسها
  if (user.vipIsManual) {
    return { upgraded: false, fromLevel: 0, toLevel: 0, reason: 'manual_override' };
  }

  const eligible = await calculateEligibleLevel(Number(user.totalSpentUsd));

  const currentLevel = user.vipLevelId
    ? await db.select().from(vipLevels).where(eq(vipLevels.id, user.vipLevelId)).limit(1).then(r => r[0] || null)
    : null;

  const currentLevelNum = currentLevel?.levelNumber ?? -1;

  // فقط لو المستوى الجديد أعلى
  if (eligible.levelNumber <= currentLevelNum) {
    return {
      upgraded: false,
      fromLevel: currentLevelNum,
      toLevel: eligible.levelNumber,
      reason: 'no_higher_level',
    };
  }

  await db.update(users)
    .set({ vipLevelId: eligible.id, updatedAt: new Date() })
    .where(eq(users.id, userId));

  // ⭐ Notification: vip.upgraded
  try {
    await createNotification({
      userId,
      type: 'vip.upgraded',
      title: 'تم ترقية مستواك في VIP!',
      body: `مبارك! تم ترقيتك إلى المستوى ${eligible.name} بنجاح.`,
      payload: { fromLevel: currentLevelNum, toLevel: eligible.levelNumber, levelName: eligible.name },
    });
  } catch (err) {
    console.error('[Notification] vip.upgraded failed:', err);
  }

  return {
    upgraded: true,
    fromLevel: currentLevelNum,
    toLevel: eligible.levelNumber,
    reason: 'threshold_reached',
  };
}

/**
 * معلومات VIP كاملة لمستخدم (للعرض في profile)
 */
export async function getVipInfo(userId: string): Promise<VipInfo | null> {
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user) return null;

  const allLevels = await getAllVipLevels();
  const currentLevel = user.vipLevelId
    ? allLevels.find(l => l.id === user.vipLevelId) || allLevels[0]
    : allLevels[0];

  const totalSpent = Number(user.totalSpentUsd);

  // ابحث عن المستوى التالي
  const next = allLevels.find(l => l.levelNumber === currentLevel.levelNumber + 1);

  let nextLevelData = null;
  if (next) {
    const nextMin = Number(next.minSpendingUsd);
    const remaining = Math.max(0, nextMin - totalSpent);
    const progress = nextMin > 0 ? Math.min(100, (totalSpent / nextMin) * 100) : 100;
    nextLevelData = {
      name: next.name,
      minSpendingUsd: nextMin,
      remainingUsd: Number(remaining.toFixed(2)),
      progressPercent: Number(progress.toFixed(2)),
    };
  }

  return {
    level: currentLevel.levelNumber,
    name: currentLevel.name,
    color: currentLevel.color,
    minSpendingUsd: Number(currentLevel.minSpendingUsd),
    centDiscountPercent: Number(currentLevel.centDiscountPercent),
    profitFloorPercent: Number(currentLevel.profitFloorPercent),
    cashbackPercent: Number(currentLevel.cashbackPercent),
    nextLevel: nextLevelData,
  };
}

/**
 * تعيين VIP يدوياً (Admin)
 */
export async function setManualVip(userId: string, levelId: string) {
  const [level] = await db.select().from(vipLevels).where(eq(vipLevels.id, levelId)).limit(1);
  if (!level) throw new Error('VIP level not found');

  await db.update(users)
    .set({ vipLevelId: level.id, vipIsManual: true, updatedAt: new Date() })
    .where(eq(users.id, userId));

  return { userId, levelId: level.id, levelName: level.name };
}

/**
 * إزالة التثبيت اليدوي (سيرجع للنظام التلقائي في الطلب القادم)
 */
export async function clearManualVip(userId: string) {
  await db.update(users)
    .set({ vipIsManual: false, updatedAt: new Date() })
    .where(eq(users.id, userId));
  return { userId, cleared: true };
}
