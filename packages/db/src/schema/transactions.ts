import { pgTable, uuid, text, numeric, timestamp, index } from 'drizzle-orm/pg-core';
import { users } from './users.js';

export const transactions = pgTable('transactions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  type: text('type').notNull(),
  amountUsd: numeric('amount_usd', { precision: 20, scale: 10 }).notNull(),
  balanceBefore: numeric('balance_before', { precision: 20, scale: 10 }).notNull(),
  balanceAfter: numeric('balance_after', { precision: 20, scale: 10 }).notNull(),
  referenceType: text('reference_type'),
  referenceId: uuid('reference_id'),
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => [
  index('transactions_user_created_idx').on(table.userId, table.createdAt.desc()),
]);
