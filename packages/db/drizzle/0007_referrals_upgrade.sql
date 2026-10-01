CREATE TABLE IF NOT EXISTS "referral_commissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"referral_id" uuid NOT NULL,
	"order_id" uuid NOT NULL,
	"order_amount_usd" numeric(20, 10) NOT NULL,
	"order_profit_usd" numeric(20, 10) NOT NULL,
	"commission_usd" numeric(20, 10) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "referrals" ADD COLUMN IF NOT EXISTS "referral_code" text NOT NULL DEFAULT 'LEGACY';
--> statement-breakpoint
ALTER TABLE "referrals" ALTER COLUMN "referral_code" DROP DEFAULT;
--> statement-breakpoint
ALTER TABLE "referrals" ADD COLUMN IF NOT EXISTS "commission_percent" numeric(5, 2) NOT NULL DEFAULT '5.00';
--> statement-breakpoint
ALTER TABLE "referrals" ALTER COLUMN "commission_percent" DROP DEFAULT;
--> statement-breakpoint
ALTER TABLE "referrals" ADD COLUMN IF NOT EXISTS "total_earned_usd" numeric(20, 10) DEFAULT '0.0000000000' NOT NULL;
--> statement-breakpoint
ALTER TABLE "referrals" ADD COLUMN IF NOT EXISTS "total_orders_count" integer DEFAULT 0 NOT NULL;
--> statement-breakpoint
ALTER TABLE "referrals" ADD COLUMN IF NOT EXISTS "updated_at" timestamp DEFAULT now() NOT NULL;
--> statement-breakpoint
ALTER TABLE "referrals" DROP COLUMN IF EXISTS "commission_earned_usd";
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "referral_balance_usd" numeric(20, 10) DEFAULT '0.0000000000' NOT NULL;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "referrals" ADD CONSTRAINT "referrals_referred_user_id_unique" UNIQUE("referred_user_id");
EXCEPTION
  WHEN duplicate_table THEN null;
  WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "referral_commissions" ADD CONSTRAINT "referral_commissions_referral_id_referrals_id_fk" FOREIGN KEY ("referral_id") REFERENCES "public"."referrals"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "referrals_referrer_idx" ON "referrals" USING btree ("referrer_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "referral_commissions_referral_idx" ON "referral_commissions" USING btree ("referral_id");
