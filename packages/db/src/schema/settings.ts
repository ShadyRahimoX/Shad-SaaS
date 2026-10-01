import { pgTable, text, jsonb, boolean, timestamp } from 'drizzle-orm/pg-core';

export const settings = pgTable('settings', {
  key: text('key').primaryKey(),
  value: jsonb('value').notNull(),
  category: text('category').default('general').notNull(),
  isPublic: boolean('is_public').default(false).notNull(),
  valueType: text('value_type').default('string').notNull(),
  description: text('description'),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
