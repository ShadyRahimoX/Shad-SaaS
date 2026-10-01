CREATE TABLE IF NOT EXISTS "themes" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "slug" text NOT NULL UNIQUE,
  "name_ar" text NOT NULL,
  "name_en" text NOT NULL,
  "description" text,
  "is_dark" boolean DEFAULT false NOT NULL,
  "colors" jsonb NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "themes" ADD CONSTRAINT "themes_slug_format_check" CHECK (slug ~ '^[a-z][a-z0-9-]{1,30}$');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
INSERT INTO "themes" ("slug", "name_ar", "name_en", "description", "is_dark", "colors")
VALUES
  (
    'default',
    'الافتراضي',
    'Default',
    'النمط الافتراضي الفاتح',
    false,
    '{"primary":"#4f46e5","primaryForeground":"#ffffff","secondary":"#e5e7eb","secondaryForeground":"#111827","accent":"#6366f1","accentForeground":"#ffffff","background":"#ffffff","foreground":"#111827","card":"#ffffff","cardForeground":"#111827","muted":"#f3f4f6","mutedForeground":"#6b7280","border":"#e5e7eb","input":"#e5e7eb","ring":"#6366f1","success":"#10b981","warning":"#f59e0b","error":"#ef4444","radius":"0.5rem"}'::jsonb
  ),
  (
    'dark',
    'الداكن',
    'Dark',
    'النمط الداكن الليلي',
    true,
    '{"primary":"#8b5cf6","primaryForeground":"#ffffff","secondary":"#1f2937","secondaryForeground":"#f9fafb","accent":"#a78bfa","accentForeground":"#0f172a","background":"#0f172a","foreground":"#f9fafb","card":"#1e293b","cardForeground":"#f9fafb","muted":"#334155","mutedForeground":"#94a3b8","border":"#334155","input":"#334155","ring":"#8b5cf6","success":"#22c55e","warning":"#eab308","error":"#ef4444","radius":"0.5rem"}'::jsonb
  ),
  (
    'emerald',
    'الزمردي',
    'Emerald',
    'نمط زمردي حيوي',
    false,
    '{"primary":"#059669","primaryForeground":"#ffffff","secondary":"#d1fae5","secondaryForeground":"#064e3b","accent":"#10b981","accentForeground":"#ffffff","background":"#ffffff","foreground":"#064e3b","card":"#ffffff","cardForeground":"#064e3b","muted":"#f0fdf4","mutedForeground":"#065f46","border":"#a7f3d0","input":"#a7f3d0","ring":"#10b981","success":"#10b981","warning":"#f59e0b","error":"#dc2626","radius":"0.5rem"}'::jsonb
  ),
  (
    'ocean',
    'المحيط',
    'Ocean',
    'نمط المحيط الأزرق',
    false,
    '{"primary":"#0284c7","primaryForeground":"#ffffff","secondary":"#e0f2fe","secondaryForeground":"#075985","accent":"#0ea5e9","accentForeground":"#ffffff","background":"#ffffff","foreground":"#0c4a6e","card":"#ffffff","cardForeground":"#0c4a6e","muted":"#f0f9ff","mutedForeground":"#0369a1","border":"#bae6fd","input":"#bae6fd","ring":"#0ea5e9","success":"#10b981","warning":"#f59e0b","error":"#ef4444","radius":"0.5rem"}'::jsonb
  ),
  (
    'sunset',
    'الغروب',
    'Sunset',
    'نمط غروب الشمس الدافئ',
    false,
    '{"primary":"#ea580c","primaryForeground":"#ffffff","secondary":"#ffe4d6","secondaryForeground":"#7c2d12","accent":"#f97316","accentForeground":"#ffffff","background":"#fffbf5","foreground":"#7c2d12","card":"#ffffff","cardForeground":"#7c2d12","muted":"#fff7ed","mutedForeground":"#9a3412","border":"#fed7aa","input":"#fed7aa","ring":"#f97316","success":"#16a34a","warning":"#eab308","error":"#dc2626","radius":"0.75rem"}'::jsonb
  ),
  (
    'lavender',
    'اللافندر',
    'Lavender',
    'نمط اللافندر البنفسجي الهادئ',
    false,
    '{"primary":"#9333ea","primaryForeground":"#ffffff","secondary":"#f3e8ff","secondaryForeground":"#581c87","accent":"#c084fc","accentForeground":"#3b0764","background":"#fefcff","foreground":"#4c1d95","card":"#ffffff","cardForeground":"#4c1d95","muted":"#faf5ff","mutedForeground":"#6b21a8","border":"#e9d5ff","input":"#e9d5ff","ring":"#c084fc","success":"#10b981","warning":"#f59e0b","error":"#ef4444","radius":"1rem"}'::jsonb
  ),
  (
    'rose',
    'الوردي',
    'Rose',
    'نمط الورد الأحمر والوردي',
    false,
    '{"primary":"#e11d48","primaryForeground":"#ffffff","secondary":"#ffe4e6","secondaryForeground":"#881337","accent":"#f43f5e","accentForeground":"#ffffff","background":"#fffafb","foreground":"#881337","card":"#ffffff","cardForeground":"#881337","muted":"#fff1f2","mutedForeground":"#9f1239","border":"#fecdd3","input":"#fecdd3","ring":"#f43f5e","success":"#10b981","warning":"#f59e0b","error":"#be123c","radius":"0.5rem"}'::jsonb
  ),
  (
    'slate',
    'الحجري',
    'Slate',
    'نمط رمادي داكن أحادي',
    true,
    '{"primary":"#64748b","primaryForeground":"#f8fafc","secondary":"#1e293b","secondaryForeground":"#f1f5f9","accent":"#94a3b8","accentForeground":"#0f172a","background":"#0f172a","foreground":"#f1f5f9","card":"#1e293b","cardForeground":"#f1f5f9","muted":"#334155","mutedForeground":"#94a3b8","border":"#334155","input":"#334155","ring":"#94a3b8","success":"#22c55e","warning":"#eab308","error":"#ef4444","radius":"0.25rem"}'::jsonb
  )
ON CONFLICT ("slug") DO NOTHING;
