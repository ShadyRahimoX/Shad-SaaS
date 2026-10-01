import { db } from '../client.js';
import { vipLevels } from '../schema/index.js';
import { eq } from 'drizzle-orm';

interface SeedVipLevel {
  name: string;
  levelNumber: number;
  minSpendingUsd: number;
  centDiscountPercent: number;
  profitFloorPercent: number;
  cashbackPercent: number;
  color: string;
}

const LEVELS: SeedVipLevel[] = [
  {
    name: 'New',
    levelNumber: 0,
    minSpendingUsd: 0,
    centDiscountPercent: 0,
    profitFloorPercent: 10,   // ربح 10% للعادي
    cashbackPercent: 0,
    color: '#6B7280',
  },
  {
    name: 'برونزي',
    levelNumber: 1,
    minSpendingUsd: 50,
    centDiscountPercent: 15,
    profitFloorPercent: 7,
    cashbackPercent: 1,
    color: '#CD7F32',
  },
  {
    name: 'فضي',
    levelNumber: 2,
    minSpendingUsd: 200,
    centDiscountPercent: 30,
    profitFloorPercent: 5,
    cashbackPercent: 2,
    color: '#C0C0C0',
  },
  {
    name: 'ذهبي',
    levelNumber: 3,
    minSpendingUsd: 500,
    centDiscountPercent: 50,
    profitFloorPercent: 4,
    cashbackPercent: 3,
    color: '#FFD700',
  },
];

export async function seedVipLevels() {
  let created = 0;
  let updated = 0;

  for (const l of LEVELS) {
    try {
      const existing = await db
        .select({ id: vipLevels.id })
        .from(vipLevels)
        .where(eq(vipLevels.levelNumber, l.levelNumber))
        .limit(1);

      const data = {
        name: l.name,
        levelNumber: l.levelNumber,
        minSpendingUsd: l.minSpendingUsd.toFixed(2),
        profitPercentage: '0.00',  // legacy field
        centDiscountPercent: l.centDiscountPercent.toFixed(2),
        profitFloorPercent: l.profitFloorPercent.toFixed(2),
        cashbackPercent: l.cashbackPercent.toFixed(2),
        color: l.color,
      };

      if (existing.length > 0) {
        await db.update(vipLevels).set(data).where(eq(vipLevels.id, existing[0].id));
        updated++;
      } else {
        await db.insert(vipLevels).values(data);
        created++;
      }
    } catch (err) {
      console.error(`Failed VIP level ${l.levelNumber}:`, err);
    }
  }

  return { created, updated, total: LEVELS.length };
}
