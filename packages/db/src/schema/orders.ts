import { pgTable, uuid, text, integer, numeric, timestamp, jsonb, serial, index } from 'drizzle-orm/pg-core';
import { users } from './users.js';
import { products } from './products.js';

export const orders = pgTable('orders', {
  id: uuid('id').primaryKey().defaultRandom(),
  orderUuid: uuid('order_uuid').defaultRandom().unique().notNull(),
  displayId: serial('display_id'),
  userId: uuid('user_id').references(() => users.id).notNull(),
  productId: uuid('product_id').references(() => products.id).notNull(),
  qty: integer('qty').notNull(),
  playerId: text('player_id').notNull(),
  extraFields: jsonb('extra_fields').default({}).notNull(),
  priceUsd: numeric('price_usd', { precision: 14, scale: 4 }).notNull(),
  costUsd: numeric('cost_usd', { precision: 14, scale: 4 }).notNull(),
  profitUsd: numeric('profit_usd', { precision: 14, scale: 4 }).notNull(),
  status: text('status').default('pending').notNull(),
  providerOrderId: text('provider_order_id'),
  providerResponse: jsonb('provider_response'),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => [
  index('orders_user_created_idx').on(table.userId, table.createdAt.desc()),
  index('orders_status_idx').on(table.status),
]);
