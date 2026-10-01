import { db } from '../client.js';
import { users } from '../schema/index.js';
import { eq } from 'drizzle-orm';

export async function ensureAdminSeedUser() {
  const adminEmail = process.env.ADMIN_SEED_EMAIL || 'admin@shad-saas.dev';
  const adminUsername = process.env.ADMIN_SEED_USERNAME || 'admin';

  const [existing] = await db
    .select({ id: users.id, email: users.email })
    .from(users)
    .where(eq(users.email, adminEmail))
    .limit(1);

  if (existing) {
    console.log(`[Seed Admin] User already exists: ${existing.email} (${existing.id})`);
    return existing;
  }

  const [created] = await db
    .insert(users)
    .values({
      username: adminUsername,
      email: adminEmail,
      passwordHash: '$2b$10$xxx',
      balanceUsd: '0.00',
      referralCode: 'REF-ADMIN',
    })
    .returning();

  console.log(`[Seed Admin] User created: ${created.email} (${created.id})`);
  return created;
}
