DO $$ BEGIN
  ALTER TABLE "chat_threads" ADD CONSTRAINT "chat_threads_status_check" CHECK (status IN ('open','closed'));
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_sender_role_check" CHECK (sender_role IN ('user','admin'));
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "tickets" ADD CONSTRAINT "tickets_status_check" CHECK (status IN ('open','in_progress','awaiting_user','resolved','closed'));
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "tickets" ADD CONSTRAINT "tickets_priority_check" CHECK (priority IN ('low','normal','high','urgent'));
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "tickets" ADD CONSTRAINT "tickets_category_check" CHECK (category IN ('billing','technical','feature_request','other'));
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "ticket_messages" ADD CONSTRAINT "ticket_messages_sender_role_check" CHECK (sender_role IN ('user','admin'));
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
