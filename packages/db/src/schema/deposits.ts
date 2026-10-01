import { pgTable, uuid, text, numeric, timestamp, serial, index, jsonb } from 'drizzle-orm/pg-core';
import { users } from './users.js';
import { paymentMethods } from './payment_methods.js';
import { admins } from './admins.js';

export const deposits = pgTable('deposits', {
  id: uuid('id').primaryKey().defaultRandom(),
  displayId: serial('display_id'),
  userId: uuid('user_id').references(() => users.id).notNull(),
  paymentMethodId: uuid('payment_method_id').references(() => paymentMethods.id),
  amount: numeric('amount', { precision: 14, scale: 2 }).notNull(),
  currency: text('currency').notNull(),
  amountUsd: numeric('amount_usd', { precision: 14, scale: 2 }).notNull(),
  exchangeRate: numeric('exchange_rate', { precision: 14, scale: 6 }).default('1.000000').notNull(),
  method: text('method').notNull(),
  invoiceId: text('invoice_id'),
  transactionRef: text('transaction_ref'),
  status: text('status').default('pending').notNull(),
  paymentUrl: text('payment_url'),
  expiresAt: timestamp('expires_at'),
  paidAt: timestamp('paid_at'),
  approvedVia: text('approved_via'),
  approvedBy: uuid('approved_by').references(() => admins.id),
  proofImageUrl: text('proof_image_url'),
  providerResponse: jsonb('provider_response'),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => [
  index('deposits_user_created_idx').on(table.userId, table.createdAt.desc()),
  index('deposits_status_idx').on(table.status),
]);
