-- 1. Add credit fields to users
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "credit_enabled" boolean DEFAULT false NOT NULL;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "credit_limit" numeric(20, 10) DEFAULT '0.0000000000' NOT NULL;
--> statement-breakpoint

-- 2. Create agents table
CREATE TABLE IF NOT EXISTS "agents" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid,
  "name" text NOT NULL,
  "phone" text,
  "address" text,
  "call_sign" text,
  "commission_percent" numeric(5, 2) DEFAULT '0' NOT NULL,
  "active" boolean DEFAULT true NOT NULL,
  "notes" text,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint

-- 3. Create debt_transactions table
CREATE TABLE IF NOT EXISTS "debt_transactions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL,
  "amount_usd" numeric(20, 10) NOT NULL,
  "balance_before" numeric(20, 10) NOT NULL,
  "balance_after" numeric(20, 10) NOT NULL,
  "type" text NOT NULL,
  "reason" text,
  "admin_id" uuid,
  "description" text,
  "created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint

-- 4. Foreign keys (idempotent via DO blocks)
DO $$ BEGIN
  ALTER TABLE "agents" ADD CONSTRAINT "agents_user_id_users_id_fk" 
    FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE SET NULL;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

DO $$ BEGIN
  ALTER TABLE "debt_transactions" ADD CONSTRAINT "debt_transactions_user_id_users_id_fk" 
    FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

DO $$ BEGIN
  ALTER TABLE "debt_transactions" ADD CONSTRAINT "debt_transactions_admin_id_users_id_fk" 
    FOREIGN KEY ("admin_id") REFERENCES "public"."users"("id") ON DELETE SET NULL;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

-- 5. Indexes
CREATE INDEX IF NOT EXISTS "agents_active_idx" ON "agents" USING btree ("active");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "agents_name_idx" ON "agents" USING btree ("name");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "debt_transactions_user_created_idx" ON "debt_transactions" USING btree ("user_id", "created_at" DESC);
