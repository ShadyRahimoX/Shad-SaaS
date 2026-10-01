import 'dotenv/config';
import { seedVipLevels } from './vip-levels.js';
import { db, vipLevels } from '../index.js';

async function main() {
  console.log('=== Seeding VIP levels ===');
  const result = await seedVipLevels();
  console.log('Result:', result);

  const all = await db.select().from(vipLevels);
  console.log('Total:', all.length);
  for (const l of all) {
    console.log(` - ${l.levelNumber} | ${l.name} | min=$${l.minSpendingUsd} | disc=${l.centDiscountPercent}% | floor=${l.profitFloorPercent}% | cash=${l.cashbackPercent}%`);
  }

  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
