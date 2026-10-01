INSERT INTO "settings" ("key", "value", "category", "is_public", "value_type")
VALUES
  ('branding_logo_url', '""'::jsonb, 'branding', true, 'string'),
  ('branding_logo_dark_url', '""'::jsonb, 'branding', true, 'string'),
  ('branding_favicon_url', '""'::jsonb, 'branding', true, 'string'),
  ('branding_og_image_url', '""'::jsonb, 'branding', true, 'string'),
  ('branding_apple_touch_icon_url', '""'::jsonb, 'branding', true, 'string'),
  ('branding_twitter_handle', '""'::jsonb, 'branding', true, 'string'),
  ('branding_facebook_url', '""'::jsonb, 'branding', true, 'string'),
  ('branding_instagram_url', '""'::jsonb, 'branding', true, 'string'),
  ('branding_youtube_url', '""'::jsonb, 'branding', true, 'string'),
  ('branding_telegram_url', '""'::jsonb, 'branding', true, 'string'),
  ('branding_contact_phone', '""'::jsonb, 'branding', true, 'string'),
  ('branding_contact_address', '""'::jsonb, 'branding', true, 'string'),
  ('branding_whatsapp_business', '""'::jsonb, 'branding', true, 'string'),
  ('branding_copyright', '"© {year} {site_name}. جميع الحقوق محفوظة."'::jsonb, 'branding', true, 'string'),
  ('branding_footer_text', '""'::jsonb, 'branding', true, 'string')
ON CONFLICT ("key") DO NOTHING;
