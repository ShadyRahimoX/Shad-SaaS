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
  // Branding settings (15 keys)
  { key: 'branding_logo_url', value: '', category: 'branding', isPublic: true, valueType: 'string', description: 'رابط الشعار الرئيسي' },
  { key: 'branding_logo_dark_url', value: '', category: 'branding', isPublic: true, valueType: 'string', description: 'رابط الشعار للنمط الداكن' },
  { key: 'branding_favicon_url', value: '', category: 'branding', isPublic: true, valueType: 'string', description: 'أيقونة الموقع Favicon' },
  { key: 'branding_og_image_url', value: '', category: 'branding', isPublic: true, valueType: 'string', description: 'صورة المشاركة OpenGraph' },
  { key: 'branding_apple_touch_icon_url', value: '', category: 'branding', isPublic: true, valueType: 'string', description: 'أيقونة أجهزة أبل Apple Touch Icon' },
  { key: 'branding_twitter_handle', value: '', category: 'branding', isPublic: true, valueType: 'string', description: 'حساب تويتر/X' },
  { key: 'branding_facebook_url', value: '', category: 'branding', isPublic: true, valueType: 'string', description: 'رابط صفحة فيسبوك' },
  { key: 'branding_instagram_url', value: '', category: 'branding', isPublic: true, valueType: 'string', description: 'رابط حساب إنستغرام' },
  { key: 'branding_youtube_url', value: '', category: 'branding', isPublic: true, valueType: 'string', description: 'رابط قناة يوتيوب' },
  { key: 'branding_telegram_url', value: '', category: 'branding', isPublic: true, valueType: 'string', description: 'رابط قناة/مجموعة تيليجرام' },
  { key: 'branding_contact_phone', value: '', category: 'branding', isPublic: true, valueType: 'string', description: 'رقم هاتف التواصل' },
  { key: 'branding_contact_address', value: '', category: 'branding', isPublic: true, valueType: 'string', description: 'عنوان المقر' },
  { key: 'branding_whatsapp_business', value: '', category: 'branding', isPublic: true, valueType: 'string', description: 'رقم واتساب للأعمال' },
  { key: 'branding_copyright', value: '© {year} {site_name}. جميع الحقوق محفوظة.', category: 'branding', isPublic: true, valueType: 'string', description: 'نص حقوق الملكية' },
  { key: 'branding_footer_text', value: '', category: 'branding', isPublic: true, valueType: 'string', description: 'نص التذييل الإضافي' },
];

export const WHITELIST_SETTING_KEYS = DEFAULT_SITE_SETTINGS.map((s) => s.key);

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
