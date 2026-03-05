CREATE TABLE "ppv_purchases" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"message_id" uuid NOT NULL,
	"user_id" text NOT NULL,
	"price_paid" numeric(10, 2) NOT NULL,
	"purchased_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DROP INDEX "msg_from_user_idx";--> statement-breakpoint
DROP INDEX "msg_to_user_idx";--> statement-breakpoint
DROP INDEX "msg_created_idx";--> statement-breakpoint
DROP INDEX "msg_conversation_idx";--> statement-breakpoint
ALTER TABLE "messages" ALTER COLUMN "content" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "media_type" text;--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "media_url" text;--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "thumbnail_url" text;--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "is_ppv" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "ppv_price" numeric(10, 2);--> statement-breakpoint
ALTER TABLE "ppv_purchases" ADD CONSTRAINT "ppv_purchases_message_id_messages_id_fk" FOREIGN KEY ("message_id") REFERENCES "public"."messages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ppv_purchases" ADD CONSTRAINT "ppv_purchases_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "ppv_purchases_message_idx" ON "ppv_purchases" USING btree ("message_id");--> statement-breakpoint
CREATE INDEX "ppv_purchases_user_idx" ON "ppv_purchases" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "messages_from_user_idx" ON "messages" USING btree ("from_user_id");--> statement-breakpoint
CREATE INDEX "messages_to_user_idx" ON "messages" USING btree ("to_user_id");--> statement-breakpoint
CREATE INDEX "messages_created_idx" ON "messages" USING btree ("created_at");