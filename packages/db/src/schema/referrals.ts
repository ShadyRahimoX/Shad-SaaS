import { pgTable, uuid, numeric, timestamp } from 'drizzle-orm/pg-core';
import { users } from './users.js';

export const referrals = pgTable('referrals', {
  id: uuid('id').primaryKey().defaultRandom(),
  referrerId: uuid('referrer_id').references(() => users.id).notNull(),
  referredUserId: uuid('referred_user_id').references(() => users.id).notNull(),
  commissionEarnedUsd: numeric('commission_earned_usd', { precision: 14, scale: 2 }).default('0.00').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
