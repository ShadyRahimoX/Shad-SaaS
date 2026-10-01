import { db, themes } from '@shad-saas/db';
import { eq, asc } from 'drizzle-orm';
import { getSetting, setSetting } from './settings.service.js';

export const REQUIRED_COLOR_KEYS = [
  'primary',
  'primaryForeground',
  'secondary',
  'secondaryForeground',
  'accent',
  'accentForeground',
  'background',
  'foreground',
  'card',
  'cardForeground',
  'muted',
  'mutedForeground',
  'border',
  'input',
  'ring',
  'success',
  'warning',
  'error',
  'radius',
] as const;

export const THEME_SLUG_REGEX = /^[a-z][a-z0-9-]{1,30}$/;

export function validateThemeColors(colors: any): boolean {
  if (!colors || typeof colors !== 'object') return false;
  for (const k of REQUIRED_COLOR_KEYS) {
    if (typeof colors[k] !== 'string' || !colors[k].trim()) {
      return false;
    }
  }
  return true;
}

export function colorsToCssVariables(colors: Record<string, any>): Record<string, string> {
  const variables: Record<string, string> = {};
  for (const [key, val] of Object.entries(colors)) {
    const kebab = key.replace(/([A-Z])/g, '-$1').toLowerCase();
    variables[`--${kebab}`] = String(val);
  }
  return variables;
}

export async function listThemes() {
  return await db.select().from(themes).orderBy(asc(themes.slug));
}

export async function getThemeBySlug(slug: string) {
  const [row] = await db
    .select()
    .from(themes)
    .where(eq(themes.slug, slug))
    .limit(1);

  return row || null;
}

export async function getActiveTheme() {
  const activeSlugSetting = await getSetting('active_theme_slug');
  const activeSlug = typeof activeSlugSetting?.value === 'string'
    ? activeSlugSetting.value
    : 'default';

  let theme = await getThemeBySlug(activeSlug);
  if (!theme && activeSlug !== 'default') {
    theme = await getThemeBySlug('default');
  }

  if (!theme) {
    const [first] = await db.select().from(themes).limit(1);
    return first;
  }

  return theme;
}

export async function getActiveThemeAsCssVariables() {
  const theme = await getActiveTheme();
  const variables = colorsToCssVariables(theme.colors as Record<string, any>);

  return {
    slug: theme.slug,
    nameAr: theme.nameAr,
    nameEn: theme.nameEn,
    isDark: theme.isDark,
    variables,
  };
}

export async function activateTheme(slug: string) {
  const theme = await getThemeBySlug(slug);
  if (!theme) {
    throw new Error('THEME_NOT_FOUND');
  }

  await setSetting({
    key: 'active_theme_slug',
    value: slug,
  });

  return theme;
}

export interface CreateThemeParams {
  slug: string;
  nameAr: string;
  nameEn: string;
  description?: string | null;
  isDark?: boolean;
  colors: Record<string, any>;
}

export async function createTheme(params: CreateThemeParams) {
  const { slug, nameAr, nameEn, description, isDark, colors } = params;

  if (!slug || !THEME_SLUG_REGEX.test(slug)) {
    throw new Error('INVALID_THEME_SLUG');
  }

  if (!validateThemeColors(colors)) {
    throw new Error('INVALID_THEME_COLORS');
  }

  const existing = await getThemeBySlug(slug);
  if (existing) {
    throw new Error('THEME_SLUG_TAKEN');
  }

  try {
    const [created] = await db
      .insert(themes)
      .values({
        slug,
        nameAr,
        nameEn,
        description: description || null,
        isDark: isDark ?? false,
        colors,
      })
      .returning();

    return created;
  } catch (error: any) {
    if (error?.code === '23505') {
      throw new Error('THEME_SLUG_TAKEN');
    }
    throw error;
  }
}

export interface UpdateThemeParams {
  nameAr?: string;
  nameEn?: string;
  description?: string | null;
  isDark?: boolean;
  colors?: Record<string, any>;
}

export async function updateTheme(slug: string, patch: UpdateThemeParams) {
  const existing = await getThemeBySlug(slug);
  if (!existing) {
    return null;
  }

  if (patch.colors !== undefined) {
    if (!validateThemeColors(patch.colors)) {
      throw new Error('INVALID_THEME_COLORS');
    }
  }

  const updateData: any = {
    updatedAt: new Date(),
  };

  if (patch.nameAr !== undefined) updateData.nameAr = patch.nameAr;
  if (patch.nameEn !== undefined) updateData.nameEn = patch.nameEn;
  if (patch.description !== undefined) updateData.description = patch.description;
  if (patch.isDark !== undefined) updateData.isDark = patch.isDark;
  if (patch.colors !== undefined) updateData.colors = patch.colors;

  const [updated] = await db
    .update(themes)
    .set(updateData)
    .where(eq(themes.slug, slug))
    .returning();

  return updated;
}

export async function deleteTheme(slug: string) {
  if (slug === 'default') {
    throw new Error('CANNOT_DELETE_DEFAULT_THEME');
  }

  const activeTheme = await getActiveTheme();
  if (activeTheme && activeTheme.slug === slug) {
    throw new Error('CANNOT_DELETE_ACTIVE_THEME');
  }

  const existing = await getThemeBySlug(slug);
  if (!existing) {
    return { deleted: false };
  }

  const result = await db
    .delete(themes)
    .where(eq(themes.slug, slug))
    .returning();

  return { deleted: result.length > 0 };
}
