CREATE TABLE IF NOT EXISTS "chat_threads" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"status" text DEFAULT 'open' NOT NULL,
	"last_message_at" timestamp,
	"unread_admin_count" integer DEFAULT 0 NOT NULL,
	"unread_user_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "chat_threads_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "chat_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"thread_id" uuid NOT NULL,
	"sender_id" uuid NOT NULL,
	"sender_role" text NOT NULL,
	"body" text NOT NULL,
	"message_uuid" text NOT NULL,
	"read_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "chat_messages_message_uuid_unique" UNIQUE("message_uuid")
);
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "chat_threads" ADD CONSTRAINT "chat_threads_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_thread_id_chat_threads_id_fk" FOREIGN KEY ("thread_id") REFERENCES "public"."chat_threads"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_sender_id_users_id_fk" FOREIGN KEY ("sender_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "chat_threads_status_last_message_idx" ON "chat_threads" USING btree ("status", "last_message_at" DESC NULLS LAST);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "chat_messages_thread_created_idx" ON "chat_messages" USING btree ("thread_id", "created_at" ASC);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "chat_messages_thread_role_read_idx" ON "chat_messages" USING btree ("thread_id", "sender_role", "read_at");
--> statement-breakpoint
INSERT INTO "notification_types" ("key", "label_ar", "label_en", "default_channel")
VALUES ('chat.message', 'رسالة محادثة جديدة', 'New chat message', 'in_app')
ON CONFLICT ("key") DO NOTHING;
