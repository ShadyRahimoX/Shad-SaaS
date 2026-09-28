import { pgTable, uuid, text, timestamp } from 'drizzle-orm/pg-core';
import { users } from './users.js';

export const notifications = pgTable('notifications', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id),
  targetType: text('target_type').notNull(),
  targetValue: text('target_value'),
  title: text('title').notNull(),
  body: text('body').notNull(),
  icon: text('icon'),
  imageUrl: text('image_url'),
  actionUrl: text('action_url'),
  priority: text('priority').default('normal').notNull(),
  readAt: timestamp('read_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  expiresAt: timestamp('expires_at'),
});
