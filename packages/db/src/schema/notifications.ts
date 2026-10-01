import { pgTable, uuid, text, boolean, timestamp, jsonb, index } from 'drizzle-orm/pg-core';
import { users } from './users.js';

export const notificationTypes = pgTable('notification_types', {
  id: uuid('id').primaryKey().defaultRandom(),
  key: text('key').unique().notNull(),
  labelAr: text('label_ar').notNull(),
  labelEn: text('label_en').notNull(),
  defaultChannel: text('default_channel').default('in_app').notNull(),
});

export const notifications = pgTable('notifications', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  type: text('type').references(() => notificationTypes.key).notNull(),
  title: text('title').notNull(),
  body: text('body').notNull(),
  payload: jsonb('payload'),
  isRead: boolean('is_read').default(false).notNull(),
  readAt: timestamp('read_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => [
  index('notifications_user_is_read_idx').on(table.userId, table.isRead),
  index('notifications_user_created_at_idx').on(table.userId, table.createdAt),
]);
