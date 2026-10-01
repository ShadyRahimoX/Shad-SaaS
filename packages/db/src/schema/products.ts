import { pgTable, uuid, text, integer, numeric, boolean, timestamp, jsonb } from 'drizzle-orm/pg-core';
import { categories } from './categories.js';

export const products = pgTable('products', {
  id: uuid('id').primaryKey().defaultRandom(),
  categoryId: uuid('category_id').references(() => categories.id),
  alkasrProductId: integer('alkasr_product_id'),
  name: text('name').notNull(),
  description: text('description'),
  imageUrl: text('image_url'),
  priceUsd: numeric('price_usd', { precision: 20, scale: 10 }).notNull(),
  basePriceUsd: numeric('base_price_usd', { precision: 20, scale: 10 }).notNull(),
  productType: text('product_type').notNull(),
  minQty: numeric('min_qty', { precision: 20, scale: 4 }).default('1').notNull(),
  maxQty: numeric('max_qty', { precision: 20, scale: 4 }),
  qtyOptions: jsonb('qty_options'),
  requiredFields: jsonb('required_fields').default([]).notNull(),
  available: boolean('available').default(true).notNull(),
  sortOrder: integer('sort_order').default(0).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
