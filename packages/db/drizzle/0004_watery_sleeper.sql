ALTER TABLE "orders" ALTER COLUMN "price_usd" SET DATA TYPE numeric(20, 10);--> statement-breakpoint
ALTER TABLE "orders" ALTER COLUMN "cost_usd" SET DATA TYPE numeric(20, 10);--> statement-breakpoint
ALTER TABLE "orders" ALTER COLUMN "profit_usd" SET DATA TYPE numeric(20, 10);--> statement-breakpoint
ALTER TABLE "transactions" ALTER COLUMN "amount_usd" SET DATA TYPE numeric(20, 10);--> statement-breakpoint
ALTER TABLE "transactions" ALTER COLUMN "balance_before" SET DATA TYPE numeric(20, 10);--> statement-breakpoint
ALTER TABLE "transactions" ALTER COLUMN "balance_after" SET DATA TYPE numeric(20, 10);