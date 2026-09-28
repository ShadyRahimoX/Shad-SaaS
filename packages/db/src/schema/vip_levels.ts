import { pgTable, uuid, text, integer, numeric, boolean, timestamp } from 'drizzle-orm/pg-core';

export const vipLevels = pgTable('vip_levels', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  levelNumber: integer('level_number').unique().notNull(),
  minSpendingUsd: numeric('min_spending_usd', { precision: 14, scale: 2 }).notNull(),
  profitPercentage: numeric('profit_percentage', { precision: 5, scale: 2 }).notNull(),
  badgeUrl: text('badge_url'),
  hidden: boolean('hidden').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
