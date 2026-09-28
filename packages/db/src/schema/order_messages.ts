import { pgTable, uuid, text, integer, boolean, timestamp } from 'drizzle-orm/pg-core';

export const orderMessages = pgTable('order_messages', {
  id: uuid('id').primaryKey().defaultRandom(),
  status: text('status').notNull(),
  title: text('title').notNull(),
  body: text('body'),
  active: boolean('active').default(true).notNull(),
  sortOrder: integer('sort_order').default(0).notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
