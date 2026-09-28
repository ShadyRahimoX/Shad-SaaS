import { pgTable, uuid, text, integer, numeric, boolean, timestamp, jsonb } from 'drizzle-orm/pg-core';

export const paymentMethods = pgTable('payment_methods', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  code: text('code').unique().notNull(),
  type: text('type').notNull(),
  iconUrl: text('icon_url'),
  bgColor: text('bg_color'),
  minAmountUsd: numeric('min_amount_usd', { precision: 14, scale: 2 }).default('1.00').notNull(),
  maxAmountUsd: numeric('max_amount_usd', { precision: 14, scale: 2 }),
  allowedCurrencies: jsonb('allowed_currencies').default(['USD']).notNull(),
  allowedVipLevels: jsonb('allowed_vip_levels').default(['all']).notNull(),
  requiredFields: jsonb('required_fields').default([]).notNull(),
  instructions: text('instructions'),
  config: jsonb('config').default({}).notNull(),
  active: boolean('active').default(true).notNull(),
  sortOrder: integer('sort_order').default(0).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
