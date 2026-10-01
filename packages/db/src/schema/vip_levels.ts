import { pgTable, uuid, text, numeric, boolean, timestamp, integer } from 'drizzle-orm/pg-core';

export const vipLevels = pgTable('vip_levels', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  levelNumber: integer('level_number').unique().notNull(),
  minSpendingUsd: numeric('min_spending_usd', { precision: 14, scale: 2 }).notNull(),
  profitPercentage: numeric('profit_percentage', { precision: 5, scale: 2 }).notNull(),  // قديم — اتركه للتوافق
  // ⭐ جديد:
  centDiscountPercent: numeric('cent_discount_percent', { precision: 5, scale: 2 }).default('0').notNull(),
  profitFloorPercent: numeric('profit_floor_percent', { precision: 5, scale: 2 }).default('10').notNull(),
  cashbackPercent: numeric('cashback_percent', { precision: 5, scale: 2 }).default('0').notNull(),
  badgeUrl: text('badge_url'),
  color: text('color').default('#6B7280'),
  hidden: boolean('hidden').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
