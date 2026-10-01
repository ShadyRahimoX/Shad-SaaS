import { db } from '../client.js';
import { settings } from '../schema/index.js';
import { eq } from 'drizzle-orm';

export interface SiteSettingDefinition {
  key: string;
  value: any;
  category: 'general' | 'theme' | 'branding' | 'payment' | 'email' | 'features';
  isPublic: boolean;
  valueType: 'string' | 'number' | 'boolean' | 'json';
  description?: string;
}

export const DEFAULT_SITE_SETTINGS: SiteSettingDefinition[] = [
  { key: 'site_name', value: 'Shad Store', category: 'general', isPublic: true, valueType: 'string', description: 'اسم الموقع' },
  { key: 'site_tagline', value: 'متجرك الرقمي', category: 'general', isPublic: true, valueType: 'string', description: 'الشعار اللفظي للموقع' },
  { key: 'site_description', value: 'منصة لبيع المنتجات الرقمية', category: 'general', isPublic: true, valueType: 'string', description: 'وصف الموقع للبحث والتشارك' },
  { key: 'site_currency', value: 'USD', category: 'general', isPublic: true, valueType: 'string', description: 'العملة الأساسية' },
  { key: 'site_currency_symbol', value: '$', category: 'general', isPublic: true, valueType: 'string', description: 'رمز العملة' },
  { key: 'site_language', value: 'ar', category: 'general', isPublic: true, valueType: 'string', description: 'لغة الموقع الافتراضية' },
  { key: 'site_timezone', value: 'Asia/Damascus', category: 'general', isPublic: true, valueType: 'string', description: 'المنطقة الزمنية للموقع' },
  { key: 'active_theme_slug', value: 'default', category: 'theme', isPublic: true, valueType: 'string', description: 'معرف القالب النشط' },
  { key: 'maintenance_mode', value: false, category: 'features', isPublic: true, valueType: 'boolean', description: 'وضع الصيانة' },
  { key: 'registration_enabled', value: true, category: 'features', isPublic: true, valueType: 'boolean', description: 'تفعيل تسجيل المستخدمين' },
  { key: 'support_email', value: 'support@shad-saas.dev', category: 'general', isPublic: true, valueType: 'string', description: 'بريد الدعم الفني' },
  { key: 'min_deposit_usd', value: 1, category: 'payment', isPublic: true, valueType: 'number', description: 'الحد الأدنى للإيداع' },
];

export const WHITELIST_SETTING_KEYS = [
  'site_name',
  'site_tagline',
  'site_description',
  'site_currency',
  'site_currency_symbol',
  'site_language',
  'site_timezone',
  'active_theme_slug',
  'maintenance_mode',
  'registration_enabled',
  'support_email',
  'min_deposit_usd',
  'referral_default_commission_percent',
  'referral_min_payout_usd',
  'referral_enabled',
] as const;

export async function seedSiteSettings() {
  let created = 0;
  let skipped = 0;

  for (const s of DEFAULT_SITE_SETTINGS) {
    const [existing] = await db
      .select({ key: settings.key })
      .from(settings)
      .where(eq(settings.key, s.key))
      .limit(1);

    if (existing) {
      skipped++;
    } else {
      await db.insert(settings).values({
        key: s.key,
        value: s.value,
        category: s.category,
        isPublic: s.isPublic,
        valueType: s.valueType,
        description: s.description,
      });
      created++;
    }
  }

  return { created, skipped, total: DEFAULT_SITE_SETTINGS.length };
}
