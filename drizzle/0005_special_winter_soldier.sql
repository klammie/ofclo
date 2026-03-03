CREATE TABLE "conversations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"participant1_id" text NOT NULL,
	"participant2_id" text NOT NULL,
	"last_message_id" uuid,
	"last_message_content" text,
	"last_message_at" timestamp,
	"unread_count_user1" integer DEFAULT 0 NOT NULL,
	"unread_count_user2" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "media_uploads" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"blob_name" text NOT NULL,
	"container" text NOT NULL,
	"url" text NOT NULL,
	"content_type" text NOT NULL,
	"size" integer NOT NULL,
	"width" integer,
	"height" integer,
	"is_deleted" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "messages" DROP CONSTRAINT "messages_from_user_id_user_id_fk";
--> statement-breakpoint
ALTER TABLE "messages" DROP CONSTRAINT "messages_to_user_id_user_id_fk";
--> statement-breakpoint
DROP INDEX "messages_from_idx";--> statement-breakpoint
DROP INDEX "messages_to_idx";--> statement-breakpoint
DROP INDEX "messages_created_at_idx";--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "read_at" timestamp;--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "updated_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "cover_url" text;--> statement-breakpoint
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_participant1_id_user_id_fk" FOREIGN KEY ("participant1_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_participant2_id_user_id_fk" FOREIGN KEY ("participant2_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "media_uploads" ADD CONSTRAINT "media_uploads_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "conv_participants_idx" ON "conversations" USING btree ("participant1_id","participant2_id");--> statement-breakpoint
CREATE INDEX "media_user_idx" ON "media_uploads" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "media_container_idx" ON "media_uploads" USING btree ("container");--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_from_user_id_user_id_fk" FOREIGN KEY ("from_user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_to_user_id_user_id_fk" FOREIGN KEY ("to_user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "msg_from_user_idx" ON "messages" USING btree ("from_user_id");--> statement-breakpoint
CREATE INDEX "msg_to_user_idx" ON "messages" USING btree ("to_user_id");--> statement-breakpoint
CREATE INDEX "msg_created_idx" ON "messages" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "msg_conversation_idx" ON "messages" USING btree ("from_user_id","to_user_id");--> statement-breakpoint
ALTER TABLE "messages" DROP COLUMN "media_url";--> statement-breakpoint
ALTER TABLE "messages" DROP COLUMN "ppv_price";