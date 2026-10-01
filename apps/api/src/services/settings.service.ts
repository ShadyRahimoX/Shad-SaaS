import { db, settings, WHITELIST_SETTING_KEYS } from '@shad-saas/db';
import { eq, and, asc } from 'drizzle-orm';

export interface SetSettingParams {
  key: string;
  value: any;
  category?: 'general' | 'theme' | 'branding' | 'payment' | 'email' | 'features';
  isPublic?: boolean;
  valueType?: 'string' | 'number' | 'boolean' | 'json';
  description?: string | null;
}

export function getAllowedKeys(): string[] {
  return Array.from(WHITELIST_SETTING_KEYS);
}

export async function getAllSettings(options: { category?: string } = {}) {
  const conditions = [];
  if (options.category) {
    conditions.push(eq(settings.category, options.category));
  }

  const query = db.select().from(settings);
  if (conditions.length > 0) {
    query.where(and(...conditions));
  }

  return await query.orderBy(asc(settings.category), asc(settings.key));
}

export async function getSettingsByCategory(category: string) {
  return await getAllSettings({ category });
}

export async function getSetting(key: string) {
  const [row] = await db
    .select()
    .from(settings)
    .where(eq(settings.key, key))
    .limit(1);

  return row || null;
}

export async function getPublicSettings() {
  return await db
    .select()
    .from(settings)
    .where(eq(settings.isPublic, true))
    .orderBy(asc(settings.category), asc(settings.key));
}

export async function setSetting(params: SetSettingParams) {
  const { key, value } = params;

  if (!WHITELIST_SETTING_KEYS.includes(key as any)) {
    throw new Error('SETTING_KEY_NOT_WHITELISTED');
  }

  const [existing] = await db
    .select()
    .from(settings)
    .where(eq(settings.key, key))
    .limit(1);

  const now = new Date();

  if (existing) {
    const updateData: any = {
      value,
      updatedAt: now,
    };

    if (params.category !== undefined) updateData.category = params.category;
    if (params.isPublic !== undefined) updateData.isPublic = params.isPublic;
    if (params.valueType !== undefined) updateData.valueType = params.valueType;
    if (params.description !== undefined) updateData.description = params.description;

    const [updated] = await db
      .update(settings)
      .set(updateData)
      .where(eq(settings.key, key))
      .returning();

    return updated;
  } else {
    const [inserted] = await db
      .insert(settings)
      .values({
        key,
        value,
        category: params.category || 'general',
        isPublic: params.isPublic !== undefined ? params.isPublic : false,
        valueType: params.valueType || 'string',
        description: params.description || null,
        updatedAt: now,
      })
      .returning();

    return inserted;
  }
}

export async function bulkSetSettings(updates: SetSettingParams[]) {
  return await db.transaction(async (tx) => {
    let updatedCount = 0;

    for (const update of updates) {
      if (!WHITELIST_SETTING_KEYS.includes(update.key as any)) {
        throw new Error(`SETTING_KEY_NOT_WHITELISTED: Key '${update.key}' is not allowed`);
      }

      const [existing] = await tx
        .select()
        .from(settings)
        .where(eq(settings.key, update.key))
        .limit(1);

      const now = new Date();

      if (existing) {
        const updateData: any = {
          value: update.value,
          updatedAt: now,
        };

        if (update.category !== undefined) updateData.category = update.category;
        if (update.isPublic !== undefined) updateData.isPublic = update.isPublic;
        if (update.valueType !== undefined) updateData.valueType = update.valueType;
        if (update.description !== undefined) updateData.description = update.description;

        await tx
          .update(settings)
          .set(updateData)
          .where(eq(settings.key, update.key));
      } else {
        await tx.insert(settings).values({
          key: update.key,
          value: update.value,
          category: update.category || 'general',
          isPublic: update.isPublic !== undefined ? update.isPublic : false,
          valueType: update.valueType || 'string',
          description: update.description || null,
          updatedAt: now,
        });
      }

      updatedCount++;
    }

    return { updated: updatedCount };
  });
}

export async function deleteSetting(key: string) {
  if (!WHITELIST_SETTING_KEYS.includes(key as any)) {
    throw new Error('SETTING_KEY_NOT_WHITELISTED');
  }

  const result = await db
    .delete(settings)
    .where(eq(settings.key, key))
    .returning();

  return { deleted: result.length > 0 };
}
