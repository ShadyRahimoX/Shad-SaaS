import { pgTable, uuid, text, integer, boolean, timestamp, type AnyPgColumn } from 'drizzle-orm/pg-core';

export const categories = pgTable('categories', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  nameEn: text('name_en'),
  slug: text('slug').unique().notNull(),
  parentId: uuid('parent_id').references((): AnyPgColumn => categories.id),
  imageUrl: text('image_url'),
  iconName: text('icon_name'),
  sortOrder: integer('sort_order').default(0).notNull(),
  active: boolean('active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
