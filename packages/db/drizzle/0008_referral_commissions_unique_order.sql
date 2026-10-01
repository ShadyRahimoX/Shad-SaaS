DO $$ BEGIN
  ALTER TABLE "referral_commissions" 
    ADD CONSTRAINT "referral_commissions_order_id_unique" 
    UNIQUE("order_id");
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
