CREATE TABLE "agency_creators" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"agency_id" uuid NOT NULL,
	"creator_id" uuid NOT NULL,
	"added_at" timestamp DEFAULT now() NOT NULL,
	"permissions" text DEFAULT 'full' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "auto_message_queue" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"auto_message_id" uuid NOT NULL,
	"user_id" text NOT NULL,
	"scheduled_for" timestamp NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"sent_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "auto_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"creator_id" uuid NOT NULL,
	"trigger_type" text NOT NULL,
	"tier" text,
	"message_text" text NOT NULL,
	"media_url" text,
	"media_type" text,
	"delay_minutes" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"sent_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bookmarks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"post_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "campaign_donations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"campaign_id" uuid NOT NULL,
	"user_id" text NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"message" text,
	"is_anonymous" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "campaigns" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"creator_id" uuid NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"goal_amount" numeric(10, 2) NOT NULL,
	"current_amount" numeric(10, 2) DEFAULT '0.00' NOT NULL,
	"currency" text DEFAULT 'USD' NOT NULL,
	"deadline" timestamp,
	"status" text DEFAULT 'active' NOT NULL,
	"image_url" text,
	"donor_count" integer DEFAULT 0 NOT NULL,
	"top_donor_id" text,
	"top_donor_amount" numeric(10, 2) DEFAULT '0.00',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "creator_applications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"display_name" text NOT NULL,
	"bio" text NOT NULL,
	"why" text NOT NULL,
	"social_links" text,
	"content_type" text NOT NULL,
	"expected_revenue" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"reviewed_by" text,
	"reviewed_at" timestamp,
	"rejection_reason" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "creator_applications_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "top_fan_badges" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"creator_id" uuid NOT NULL,
	"badge_type" text NOT NULL,
	"earned_at" timestamp DEFAULT now() NOT NULL,
	"metadata" text
);
--> statement-breakpoint
ALTER TABLE "tips" DROP CONSTRAINT "tips_from_user_id_user_id_fk";
--> statement-breakpoint
ALTER TABLE "tips" DROP CONSTRAINT "tips_to_creator_id_creators_id_fk";
--> statement-breakpoint
DROP INDEX "agencies_user_id_idx";--> statement-breakpoint
DROP INDEX "posts_creator_id_idx";--> statement-breakpoint
DROP INDEX "posts_created_at_idx";--> statement-breakpoint
DROP INDEX "tips_order_id_idx";--> statement-breakpoint
ALTER TABLE "posts" ALTER COLUMN "title" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "agencies" ADD COLUMN "email" text NOT NULL;--> statement-breakpoint
ALTER TABLE "agencies" ADD COLUMN "website_url" text;--> statement-breakpoint
ALTER TABLE "agencies" ADD COLUMN "total_creators" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "agencies" ADD COLUMN "total_revenue" numeric(12, 2) DEFAULT '0.00' NOT NULL;--> statement-breakpoint
ALTER TABLE "posts" ADD COLUMN "media_type" text NOT NULL;--> statement-breakpoint
ALTER TABLE "posts" ADD COLUMN "duration" integer;--> statement-breakpoint
ALTER TABLE "posts" ADD COLUMN "status" text DEFAULT 'published' NOT NULL;--> statement-breakpoint
ALTER TABLE "posts" ADD COLUMN "scheduled_for" timestamp;--> statement-breakpoint
ALTER TABLE "posts" ADD COLUMN "published_at" timestamp;--> statement-breakpoint
ALTER TABLE "posts" ADD COLUMN "unlock_count" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "posts" ADD COLUMN "revenue" numeric(10, 2) DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE "tips" ADD COLUMN "post_id" uuid;--> statement-breakpoint
ALTER TABLE "tips" ADD COLUMN "message_id" uuid;--> statement-breakpoint
ALTER TABLE "tips" ADD COLUMN "status" text DEFAULT 'completed' NOT NULL;--> statement-breakpoint
ALTER TABLE "agency_creators" ADD CONSTRAINT "agency_creators_agency_id_agencies_id_fk" FOREIGN KEY ("agency_id") REFERENCES "public"."agencies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agency_creators" ADD CONSTRAINT "agency_creators_creator_id_creators_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."creators"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auto_message_queue" ADD CONSTRAINT "auto_message_queue_auto_message_id_auto_messages_id_fk" FOREIGN KEY ("auto_message_id") REFERENCES "public"."auto_messages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auto_message_queue" ADD CONSTRAINT "auto_message_queue_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auto_messages" ADD CONSTRAINT "auto_messages_creator_id_creators_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."creators"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookmarks" ADD CONSTRAINT "bookmarks_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookmarks" ADD CONSTRAINT "bookmarks_post_id_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaign_donations" ADD CONSTRAINT "campaign_donations_campaign_id_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaign_donations" ADD CONSTRAINT "campaign_donations_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_creator_id_creators_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."creators"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_top_donor_id_user_id_fk" FOREIGN KEY ("top_donor_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "creator_applications" ADD CONSTRAINT "creator_applications_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "creator_applications" ADD CONSTRAINT "creator_applications_reviewed_by_user_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "top_fan_badges" ADD CONSTRAINT "top_fan_badges_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "top_fan_badges" ADD CONSTRAINT "top_fan_badges_creator_id_creators_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."creators"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "agency_creators_agency_idx" ON "agency_creators" USING btree ("agency_id");--> statement-breakpoint
CREATE INDEX "agency_creators_creator_idx" ON "agency_creators" USING btree ("creator_id");--> statement-breakpoint
CREATE INDEX "agency_creators_unique_idx" ON "agency_creators" USING btree ("agency_id","creator_id");--> statement-breakpoint
CREATE INDEX "auto_message_queue_scheduled_idx" ON "auto_message_queue" USING btree ("scheduled_for");--> statement-breakpoint
CREATE INDEX "auto_message_queue_status_idx" ON "auto_message_queue" USING btree ("status");--> statement-breakpoint
CREATE INDEX "auto_messages_creator_idx" ON "auto_messages" USING btree ("creator_id");--> statement-breakpoint
CREATE INDEX "auto_messages_trigger_idx" ON "auto_messages" USING btree ("trigger_type");--> statement-breakpoint
CREATE INDEX "bookmarks_user_idx" ON "bookmarks" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "bookmarks_post_idx" ON "bookmarks" USING btree ("post_id");--> statement-breakpoint
CREATE INDEX "bookmarks_unique_idx" ON "bookmarks" USING btree ("user_id","post_id");--> statement-breakpoint
CREATE INDEX "campaign_donations_campaign_idx" ON "campaign_donations" USING btree ("campaign_id");--> statement-breakpoint
CREATE INDEX "campaign_donations_user_idx" ON "campaign_donations" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "campaign_donations_created_idx" ON "campaign_donations" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "campaigns_creator_idx" ON "campaigns" USING btree ("creator_id");--> statement-breakpoint
CREATE INDEX "campaigns_status_idx" ON "campaigns" USING btree ("status");--> statement-breakpoint
CREATE INDEX "creator_applications_user_idx" ON "creator_applications" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "creator_applications_status_idx" ON "creator_applications" USING btree ("status");--> statement-breakpoint
CREATE INDEX "top_fan_badges_user_idx" ON "top_fan_badges" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "top_fan_badges_creator_idx" ON "top_fan_badges" USING btree ("creator_id");--> statement-breakpoint
CREATE INDEX "top_fan_badges_unique_idx" ON "top_fan_badges" USING btree ("user_id","creator_id","badge_type");--> statement-breakpoint
ALTER TABLE "tips" ADD CONSTRAINT "tips_post_id_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tips" ADD CONSTRAINT "tips_message_id_messages_id_fk" FOREIGN KEY ("message_id") REFERENCES "public"."messages"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tips" ADD CONSTRAINT "tips_from_user_id_user_id_fk" FOREIGN KEY ("from_user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tips" ADD CONSTRAINT "tips_to_creator_id_creators_id_fk" FOREIGN KEY ("to_creator_id") REFERENCES "public"."creators"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "agencies_user_idx" ON "agencies" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "posts_creator_idx" ON "posts" USING btree ("creator_id");--> statement-breakpoint
CREATE INDEX "posts_created_idx" ON "posts" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "posts_status_idx" ON "posts" USING btree ("status");--> statement-breakpoint
CREATE INDEX "posts_scheduled_idx" ON "posts" USING btree ("scheduled_for");--> statement-breakpoint
CREATE INDEX "tips_post_idx" ON "tips" USING btree ("post_id");--> statement-breakpoint
CREATE INDEX "tips_created_idx" ON "tips" USING btree ("created_at");--> statement-breakpoint
ALTER TABLE "agencies" DROP COLUMN "commission_rate";--> statement-breakpoint
ALTER TABLE "agencies" DROP COLUMN "is_verified";--> statement-breakpoint
ALTER TABLE "posts" DROP COLUMN "content_type";--> statement-breakpoint
ALTER TABLE "posts" DROP COLUMN "is_published";--> statement-breakpoint
ALTER TABLE "posts" DROP COLUMN "scheduled_at";--> statement-breakpoint
ALTER TABLE "tips" DROP COLUMN "is_anonymous";--> statement-breakpoint
ALTER TABLE "tips" DROP COLUMN "maxelpay_order_id";--> statement-breakpoint
ALTER TABLE "tips" DROP COLUMN "crypto_currency";--> statement-breakpoint
ALTER TABLE "tips" DROP COLUMN "payment_status";--> statement-breakpoint
ALTER TABLE "agencies" ADD CONSTRAINT "agencies_user_id_unique" UNIQUE("user_id");