import { pgTable, uuid, text, numeric, timestamp, index } from 'drizzle-orm/pg-core';
import { users } from './users.js';

export const debtTransactions = pgTable('debt_transactions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  amountUsd: numeric('amount_usd', { precision: 20, scale: 10 }).notNull(), // موجب = زيادة دين، سالب = سداد
  balanceBefore: numeric('balance_before', { precision: 20, scale: 10 }).notNull(),
  balanceAfter: numeric('balance_after', { precision: 20, scale: 10 }).notNull(),
  type: text('type').notNull(), // 'debt_increase' | 'debt_decrease' | 'debt_cleared' | 'adjustment'
  reason: text('reason'),
  adminId: uuid('admin_id').references(() => users.id),
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => [
  index('debt_transactions_user_created_idx').on(table.userId, table.createdAt.desc()),
]);
