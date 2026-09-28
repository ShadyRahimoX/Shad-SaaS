import { pgTable, text, jsonb, timestamp } from 'drizzle-orm/pg-core';

export const themeSettings = pgTable('theme_settings', {
  key: text('key').primaryKey(),
  value: jsonb('value').notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
