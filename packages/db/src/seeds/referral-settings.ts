import { db } from '../client.js';
import { settings } from '../schema/index.js';
import { eq } from 'drizzle-orm';

export async function seedReferralSettings() {
  const defaults = [
    { key: 'referral_default_commission_percent', value: 5 },
    { key: 'referral_min_payout_usd', value: 5 },
    { key: 'referral_enabled', value: true },
  ];

  let created = 0;
  let updated = 0;

  for (const s of defaults) {
    const existing = await db
      .select({ key: settings.key })
      .from(settings)
      .where(eq(settings.key, s.key))
      .limit(1);

    if (existing.length > 0) {
      await db.update(settings).set({ value: s.value, updatedAt: new Date() }).where(eq(settings.key, s.key));
      updated++;
    } else {
      await db.insert(settings).values({ key: s.key, value: s.value });
      created++;
    }
  }

  return { created, updated, total: defaults.length };
}
