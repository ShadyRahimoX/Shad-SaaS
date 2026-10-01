ALTER TABLE "vip_levels" ADD COLUMN "cent_discount_percent" numeric(5, 2) DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE "vip_levels" ADD COLUMN "profit_floor_percent" numeric(5, 2) DEFAULT '10' NOT NULL;--> statement-breakpoint
ALTER TABLE "vip_levels" ADD COLUMN "cashback_percent" numeric(5, 2) DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE "vip_levels" ADD COLUMN "color" text DEFAULT '#6B7280';--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "total_spent_usd" numeric(20, 10) DEFAULT '0.0000000000' NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "cashback_balance_usd" numeric(20, 10) DEFAULT '0.0000000000' NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "vip_is_manual" boolean DEFAULT false NOT NULL;