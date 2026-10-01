import { pgTable, uuid, text, numeric, boolean, timestamp, integer, index } from 'drizzle-orm/pg-core';
import { users } from './users.js';

export const referrals = pgTable('referrals', {
  id: uuid('id').primaryKey().defaultRandom(),
  referrerId: uuid('referrer_id').references(() => users.id).notNull(),
  referredUserId: uuid('referred_user_id').references(() => users.id).notNull().unique(),
  referralCode: text('referral_code').notNull(),
  commissionPercent: numeric('commission_percent', { precision: 5, scale: 2 }).notNull(),
  totalEarnedUsd: numeric('total_earned_usd', { precision: 20, scale: 10 }).default('0.0000000000').notNull(),
  totalOrdersCount: integer('total_orders_count').default(0).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => [
  index('referrals_referrer_idx').on(table.referrerId),
]);

// سجل عمولات الإحالات (لكل عملية شراء)
export const referralCommissions = pgTable('referral_commissions', {
  id: uuid('id').primaryKey().defaultRandom(),
  referralId: uuid('referral_id').references(() => referrals.id).notNull(),
  orderId: uuid('order_id').notNull(),  // لا FK مؤقتاً لتجنب cyclic
  orderAmountUsd: numeric('order_amount_usd', { precision: 20, scale: 10 }).notNull(),
  orderProfitUsd: numeric('order_profit_usd', { precision: 20, scale: 10 }).notNull(),
  commissionUsd: numeric('commission_usd', { precision: 20, scale: 10 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => [
  index('referral_commissions_referral_idx').on(table.referralId),
]);
