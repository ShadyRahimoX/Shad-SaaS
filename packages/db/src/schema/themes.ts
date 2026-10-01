import { pgTable, text, jsonb, boolean, timestamp, uuid } from 'drizzle-orm/pg-core';

export const themes = pgTable('themes', {
  id: uuid('id').defaultRandom().primaryKey(),
  slug: text('slug').notNull().unique(),
  nameAr: text('name_ar').notNull(),
  nameEn: text('name_en').notNull(),
  description: text('description'),
  isDark: boolean('is_dark').default(false).notNull(),
  colors: jsonb('colors').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
