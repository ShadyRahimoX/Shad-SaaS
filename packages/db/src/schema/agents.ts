import { pgTable, uuid, text, numeric, boolean, timestamp, index } from 'drizzle-orm/pg-core';
import { users } from './users.js';

export const agents = pgTable('agents', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id), // optional link
  name: text('name').notNull(),
  phone: text('phone'),
  address: text('address'),
  callSign: text('call_sign'), // النداء
  commissionPercent: numeric('commission_percent', { precision: 5, scale: 2 }).default('0').notNull(),
  active: boolean('active').default(true).notNull(),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => [
  index('agents_active_idx').on(table.active),
  index('agents_name_idx').on(table.name),
]);
