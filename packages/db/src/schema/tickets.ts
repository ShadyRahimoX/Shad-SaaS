import { pgTable, uuid, text, integer, timestamp, index } from 'drizzle-orm/pg-core';
import { users } from './users.js';

export const tickets = pgTable('tickets', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  subject: text('subject').notNull(),
  category: text('category').default('other').notNull(),
  priority: text('priority').default('normal').notNull(),
  status: text('status').default('open').notNull(),
  assignedTo: uuid('assigned_to').references(() => users.id),
  lastMessageAt: timestamp('last_message_at'),
  unreadAdminCount: integer('unread_admin_count').default(0).notNull(),
  unreadUserCount: integer('unread_user_count').default(0).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => [
  index('tickets_user_created_idx').on(table.userId, table.createdAt.desc()),
  index('tickets_status_priority_last_message_idx').on(table.status, table.priority, table.lastMessageAt.desc()),
]);

export const ticketMessages = pgTable('ticket_messages', {
  id: uuid('id').primaryKey().defaultRandom(),
  ticketId: uuid('ticket_id').references(() => tickets.id).notNull(),
  senderId: uuid('sender_id').references(() => users.id).notNull(),
  senderRole: text('sender_role').notNull(),
  body: text('body').notNull(),
  messageUuid: text('message_uuid').unique().notNull(),
  readAt: timestamp('read_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => [
  index('ticket_messages_ticket_created_idx').on(table.ticketId, table.createdAt),
  index('ticket_messages_ticket_role_read_idx').on(table.ticketId, table.senderRole, table.readAt),
]);
