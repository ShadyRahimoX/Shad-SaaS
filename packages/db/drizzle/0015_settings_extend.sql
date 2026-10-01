ALTER TABLE "settings" ADD COLUMN IF NOT EXISTS "category" text DEFAULT 'general' NOT NULL;
--> statement-breakpoint
ALTER TABLE "settings" ADD COLUMN IF NOT EXISTS "is_public" boolean DEFAULT false NOT NULL;
--> statement-breakpoint
ALTER TABLE "settings" ADD COLUMN IF NOT EXISTS "value_type" text DEFAULT 'string' NOT NULL;
--> statement-breakpoint
ALTER TABLE "settings" ADD COLUMN IF NOT EXISTS "description" text;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "settings" ADD CONSTRAINT "settings_category_check" CHECK (category IN ('general','theme','branding','payment','email','features'));
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "settings" ADD CONSTRAINT "settings_value_type_check" CHECK (value_type IN ('string','number','boolean','json'));
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
