import { pgTable, uuid, text, integer, timestamp, index } from 'drizzle-orm/pg-core';
import { users } from './users.js';

export const chatThreads = pgTable('chat_threads', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id).unique().notNull(),
  status: text('status').default('open').notNull(),
  lastMessageAt: timestamp('last_message_at'),
  unreadAdminCount: integer('unread_admin_count').default(0).notNull(),
  unreadUserCount: integer('unread_user_count').default(0).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => [
  index('chat_threads_status_last_message_idx').on(table.status, table.lastMessageAt.desc()),
]);

export const chatMessages = pgTable('chat_messages', {
  id: uuid('id').primaryKey().defaultRandom(),
  threadId: uuid('thread_id').references(() => chatThreads.id).notNull(),
  senderId: uuid('sender_id').references(() => users.id).notNull(),
  senderRole: text('sender_role').notNull(),
  body: text('body').notNull(),
  messageUuid: text('message_uuid').unique().notNull(),
  readAt: timestamp('read_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => [
  index('chat_messages_thread_created_idx').on(table.threadId, table.createdAt),
  index('chat_messages_thread_role_read_idx').on(table.threadId, table.senderRole, table.readAt),
]);
