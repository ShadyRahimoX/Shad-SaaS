ALTER TABLE "products" ALTER COLUMN "price_usd" SET DATA TYPE numeric(14, 6);--> statement-breakpoint
ALTER TABLE "products" ALTER COLUMN "base_price_usd" SET DATA TYPE numeric(14, 6);--> statement-breakpoint
ALTER TABLE "products" ALTER COLUMN "min_qty" SET DATA TYPE numeric(14, 4);--> statement-breakpoint
ALTER TABLE "products" ALTER COLUMN "min_qty" SET DEFAULT '1';--> statement-breakpoint
ALTER TABLE "products" ALTER COLUMN "max_qty" SET DATA TYPE numeric(14, 4);--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "qty_options" jsonb;