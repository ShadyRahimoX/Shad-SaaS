import { pgTable, uuid, text, numeric, boolean, timestamp, serial, type AnyPgColumn } from 'drizzle-orm/pg-core';
import { tenants } from './tenants.js';
import { vipLevels } from './vip_levels.js';

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').references(() => tenants.id),
  displayId: serial('display_id'),
  username: text('username').unique().notNull(),
  email: text('email').unique().notNull(),
  passwordHash: text('password_hash').notNull(),
  googleId: text('google_id'),
  firstName: text('first_name'),
  lastName: text('last_name'),
  phone: text('phone'),
  country: text('country'),
  avatarUrl: text('avatar_url'),
  vipLevelId: uuid('vip_level_id').references(() => vipLevels.id),
  balanceUsd: numeric('balance_usd', { precision: 14, scale: 2 }).default('0.00').notNull(),
  referralCode: text('referral_code').unique(),
  referredBy: uuid('referred_by').references((): AnyPgColumn => users.id),
  emailVerified: boolean('email_verified').default(false).notNull(),
  banned: boolean('banned').default(false).notNull(),
  totpSecret: text('totp_secret'),
  totalSpentUsd: numeric('total_spent_usd', { precision: 20, scale: 10 }).default('0.0000000000').notNull(),
  cashbackBalanceUsd: numeric('cashback_balance_usd', { precision: 20, scale: 10 }).default('0.0000000000').notNull(),
  referralBalanceUsd: numeric('referral_balance_usd', { precision: 20, scale: 10 }).default('0.0000000000').notNull(),
  vipIsManual: boolean('vip_is_manual').default(false).notNull(),
  lastLoginAt: timestamp('last_login_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'),
});
