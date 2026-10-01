CREATE TABLE IF NOT EXISTS "tickets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"subject" text NOT NULL,
	"category" text DEFAULT 'other' NOT NULL,
	"priority" text DEFAULT 'normal' NOT NULL,
	"status" text DEFAULT 'open' NOT NULL,
	"assigned_to" uuid,
	"last_message_at" timestamp,
	"unread_admin_count" integer DEFAULT 0 NOT NULL,
	"unread_user_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "ticket_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ticket_id" uuid NOT NULL,
	"sender_id" uuid NOT NULL,
	"sender_role" text NOT NULL,
	"body" text NOT NULL,
	"message_uuid" text NOT NULL,
	"read_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "ticket_messages_message_uuid_unique" UNIQUE("message_uuid")
);
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "tickets" ADD CONSTRAINT "tickets_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "tickets" ADD CONSTRAINT "tickets_assigned_to_users_id_fk" FOREIGN KEY ("assigned_to") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "ticket_messages" ADD CONSTRAINT "ticket_messages_ticket_id_tickets_id_fk" FOREIGN KEY ("ticket_id") REFERENCES "public"."tickets"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "ticket_messages" ADD CONSTRAINT "ticket_messages_sender_id_users_id_fk" FOREIGN KEY ("sender_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "tickets_user_created_idx" ON "tickets" USING btree ("user_id", "created_at" DESC);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "tickets_status_priority_last_message_idx" ON "tickets" USING btree ("status", "priority", "last_message_at" DESC NULLS LAST);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "ticket_messages_ticket_created_idx" ON "ticket_messages" USING btree ("ticket_id", "created_at" ASC);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "ticket_messages_ticket_role_read_idx" ON "ticket_messages" USING btree ("ticket_id", "sender_role", "read_at");
--> statement-breakpoint
INSERT INTO "notification_types" ("key", "label_ar", "label_en", "default_channel")
VALUES 
  ('ticket.created', 'تذكرة دعم جديدة', 'New support ticket', 'in_app'),
  ('ticket.replied', 'رد على تذكرة الدعم', 'Ticket replied', 'in_app'),
  ('ticket.status_changed', 'تحديث حالة التذكرة', 'Ticket status changed', 'in_app')
ON CONFLICT ("key") DO NOTHING;
