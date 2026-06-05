CREATE TYPE "public"."accent_color" AS ENUM('pink', 'purple', 'blue', 'green', 'orange', 'red');--> statement-breakpoint
CREATE TYPE "public"."application_status" AS ENUM('draft', 'submitted', 'under_review', 'approved', 'rejected', 'more_info_required');--> statement-breakpoint
CREATE TYPE "public"."content_layout" AS ENUM('grid', 'list');--> statement-breakpoint
CREATE TYPE "public"."font_size" AS ENUM('small', 'medium', 'large');--> statement-breakpoint
CREATE TYPE "public"."id_document_type" AS ENUM('passport', 'drivers_license', 'national_id', 'residence_permit');--> statement-breakpoint
CREATE TYPE "public"."item_rarity" AS ENUM('common', 'rare', 'epic', 'legendary');--> statement-breakpoint
CREATE TYPE "public"."message_permission" AS ENUM('everyone', 'subscribers', 'nobody');--> statement-breakpoint
CREATE TYPE "public"."notification_priority" AS ENUM('low', 'medium', 'high');--> statement-breakpoint
CREATE TYPE "public"."notification_type" AS ENUM('new_subscriber', 'new_message', 'new_tip', 'new_like', 'new_comment', 'subscription_expiring', 'new_post', 'ppv_purchased', 'campaign_milestone', 'campaign_reward', 'coin_earned', 'level_up', 'streak_reminder', 'streak_broken', 'shop_purchase', 'withdrawal_approved', 'withdrawal_rejected', 'deposit_confirmed', 'system', 'welcome');--> statement-breakpoint
CREATE TYPE "public"."pass_tier" AS ENUM('free', 'premium');--> statement-breakpoint
CREATE TYPE "public"."profile_visibility" AS ENUM('public', 'followers', 'private');--> statement-breakpoint
CREATE TYPE "public"."reward_item_type" AS ENUM('coins', 'xp', 'badge', 'booster_xp', 'booster_coin', 'streak_freeze', 'mystery_box', 'exclusive_content', 'emote', 'vip_pass');--> statement-breakpoint
CREATE TYPE "public"."reward_track_tier" AS ENUM('free', 'vip');--> statement-breakpoint
CREATE TYPE "public"."season_status" AS ENUM('draft', 'active', 'ended');--> statement-breakpoint
CREATE TYPE "public"."task_type" AS ENUM('weekly', 'streak');--> statement-breakpoint
CREATE TYPE "public"."theme_mode" AS ENUM('dark', 'light', 'system');--> statement-breakpoint
CREATE TABLE "fan_pass_seasons" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"status" "season_status" DEFAULT 'draft' NOT NULL,
	"start_date" timestamp NOT NULL,
	"end_date" timestamp NOT NULL,
	"vip_price_cents" integer DEFAULT 999 NOT NULL,
	"vip_price_coins" integer DEFAULT 5000 NOT NULL,
	"max_level" integer DEFAULT 100 NOT NULL,
	"xp_per_level" integer DEFAULT 200 NOT NULL,
	"creator_id" text,
	"agency_id" text,
	"total_participants" integer DEFAULT 0 NOT NULL,
	"total_vip_subscribers" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"type" "notification_type" NOT NULL,
	"priority" "notification_priority" DEFAULT 'medium' NOT NULL,
	"title" text NOT NULL,
	"body" text NOT NULL,
	"icon" text DEFAULT '🔔' NOT NULL,
	"image_url" text,
	"action_url" text,
	"is_read" boolean DEFAULT false NOT NULL,
	"actor_id" text,
	"actor_name" text,
	"actor_avatar" text,
	"entity_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"read_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "pass_reward_track" (
	"id" serial PRIMARY KEY NOT NULL,
	"season_id" integer NOT NULL,
	"level" integer NOT NULL,
	"tier" "reward_track_tier" NOT NULL,
	"icon" text NOT NULL,
	"label" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"reward_type" "reward_item_type" NOT NULL,
	"reward_amount" integer DEFAULT 1 NOT NULL,
	"is_vip_only" boolean DEFAULT false NOT NULL,
	"rarity" "item_rarity" DEFAULT 'common' NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "post_media" (
	"id" serial PRIMARY KEY NOT NULL,
	"post_id" uuid NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"media_type" text NOT NULL,
	"media_url" text NOT NULL,
	"thumbnail_url" text,
	"duration" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reward_claims" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"season_id" integer NOT NULL,
	"reward_id" integer NOT NULL,
	"claimed_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "season_tasks" (
	"id" serial PRIMARY KEY NOT NULL,
	"season_id" integer NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"icon" text DEFAULT '⭐' NOT NULL,
	"xp_reward" integer DEFAULT 50 NOT NULL,
	"coin_reward" integer DEFAULT 0 NOT NULL,
	"tier" "pass_tier" DEFAULT 'free' NOT NULL,
	"type" "task_type" DEFAULT 'weekly' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "season_xp_reset_log" (
	"id" serial PRIMARY KEY NOT NULL,
	"season_id" integer NOT NULL,
	"affected_users" integer DEFAULT 0 NOT NULL,
	"reset_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_active_sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"device" text DEFAULT 'Unknown' NOT NULL,
	"browser" text DEFAULT 'Unknown' NOT NULL,
	"location" text DEFAULT 'Unknown' NOT NULL,
	"ip_address" text DEFAULT '' NOT NULL,
	"last_active" timestamp DEFAULT now() NOT NULL,
	"is_current" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_appearance_settings" (
	"user_id" text PRIMARY KEY NOT NULL,
	"theme" "theme_mode" DEFAULT 'dark' NOT NULL,
	"accent_color" "accent_color" DEFAULT 'purple' NOT NULL,
	"font_size" "font_size" DEFAULT 'medium' NOT NULL,
	"content_layout" "content_layout" DEFAULT 'grid' NOT NULL,
	"reduce_motion" boolean DEFAULT false NOT NULL,
	"compact_mode" boolean DEFAULT false NOT NULL,
	"show_explicit_content" boolean DEFAULT false NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_notification_prefs" (
	"user_id" text PRIMARY KEY NOT NULL,
	"in_app_new_subscriber" boolean DEFAULT true NOT NULL,
	"in_app_new_message" boolean DEFAULT true NOT NULL,
	"in_app_new_tip" boolean DEFAULT true NOT NULL,
	"in_app_new_like" boolean DEFAULT true NOT NULL,
	"in_app_new_comment" boolean DEFAULT true NOT NULL,
	"in_app_new_post" boolean DEFAULT true NOT NULL,
	"in_app_fan_pass" boolean DEFAULT true NOT NULL,
	"in_app_wallet" boolean DEFAULT true NOT NULL,
	"in_app_system" boolean DEFAULT true NOT NULL,
	"email_new_subscriber" boolean DEFAULT true NOT NULL,
	"email_new_message" boolean DEFAULT false NOT NULL,
	"email_new_tip" boolean DEFAULT true NOT NULL,
	"email_marketing" boolean DEFAULT false NOT NULL,
	"email_weekly_digest" boolean DEFAULT true NOT NULL,
	"email_security_alerts" boolean DEFAULT true NOT NULL,
	"push_enabled" boolean DEFAULT false NOT NULL,
	"push_new_message" boolean DEFAULT true NOT NULL,
	"push_new_subscriber" boolean DEFAULT true NOT NULL,
	"push_new_tip" boolean DEFAULT true NOT NULL,
	"push_fan_pass" boolean DEFAULT false NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_pass_reward_claims" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"reward_id" integer NOT NULL,
	"season_id" integer NOT NULL,
	"claimed_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_privacy_settings" (
	"user_id" text PRIMARY KEY NOT NULL,
	"profile_visibility" "profile_visibility" DEFAULT 'public' NOT NULL,
	"show_activity_status" boolean DEFAULT true NOT NULL,
	"show_subscriptions" boolean DEFAULT false NOT NULL,
	"allow_tagging" boolean DEFAULT true NOT NULL,
	"message_permission" "message_permission" DEFAULT 'subscribers' NOT NULL,
	"allow_comments" boolean DEFAULT true NOT NULL,
	"show_online_status" boolean DEFAULT true NOT NULL,
	"activity_visibility" text DEFAULT 'private' NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_profile_settings" (
	"user_id" text PRIMARY KEY NOT NULL,
	"display_name" text DEFAULT '' NOT NULL,
	"username" text DEFAULT '' NOT NULL,
	"bio" text DEFAULT '' NOT NULL,
	"location" text DEFAULT '' NOT NULL,
	"website" text DEFAULT '' NOT NULL,
	"avatar_url" text,
	"banner_url" text,
	"date_of_birth" text,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_season_progress" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"season_id" integer NOT NULL,
	"level" integer DEFAULT 1 NOT NULL,
	"total_xp" integer DEFAULT 0 NOT NULL,
	"is_vip" boolean DEFAULT false NOT NULL,
	"login_streak" integer DEFAULT 0 NOT NULL,
	"last_claimed_at" timestamp,
	"final_xp" integer,
	"final_level" integer,
	"reset_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_weekly_tasks" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"season_id" integer NOT NULL,
	"week_start_date" timestamp NOT NULL,
	"week_end_date" timestamp NOT NULL,
	"assigned_task_ids" text DEFAULT '[]' NOT NULL,
	"completion_state" text DEFAULT '{}' NOT NULL,
	"streak_progress" integer DEFAULT 0 NOT NULL,
	"streak_completed" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "creator_applications" DROP CONSTRAINT "creator_applications_user_id_user_id_fk";
--> statement-breakpoint
ALTER TABLE "creator_applications" DROP CONSTRAINT "creator_applications_reviewed_by_user_id_fk";
--> statement-breakpoint
DROP INDEX "creator_applications_user_idx";--> statement-breakpoint
DROP INDEX "creator_applications_status_idx";--> statement-breakpoint
ALTER TABLE "creator_applications" ALTER COLUMN "id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "creator_applications" ALTER COLUMN "id" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "creator_applications" ALTER COLUMN "display_name" SET DEFAULT '';--> statement-breakpoint
ALTER TABLE "creator_applications" ALTER COLUMN "bio" SET DEFAULT '';--> statement-breakpoint
ALTER TABLE "creator_applications" ALTER COLUMN "social_links" SET DEFAULT '{}';--> statement-breakpoint
ALTER TABLE "creator_applications" ALTER COLUMN "social_links" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "creator_applications" ALTER COLUMN "status" SET DEFAULT 'draft'::"public"."application_status";--> statement-breakpoint
ALTER TABLE "creator_applications" ALTER COLUMN "status" SET DATA TYPE "public"."application_status" USING "status"::"public"."application_status";--> statement-breakpoint
ALTER TABLE "creator_applications" ADD COLUMN "current_step" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "creator_applications" ADD COLUMN "legal_first_name" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "creator_applications" ADD COLUMN "legal_last_name" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "creator_applications" ADD COLUMN "date_of_birth" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "creator_applications" ADD COLUMN "country" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "creator_applications" ADD COLUMN "city" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "creator_applications" ADD COLUMN "address" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "creator_applications" ADD COLUMN "postal_code" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "creator_applications" ADD COLUMN "document_type" "id_document_type";--> statement-breakpoint
ALTER TABLE "creator_applications" ADD COLUMN "document_number" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "creator_applications" ADD COLUMN "document_expiry" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "creator_applications" ADD COLUMN "document_front_url" text;--> statement-breakpoint
ALTER TABLE "creator_applications" ADD COLUMN "document_back_url" text;--> statement-breakpoint
ALTER TABLE "creator_applications" ADD COLUMN "selfie_with_id_url" text;--> statement-breakpoint
ALTER TABLE "creator_applications" ADD COLUMN "selfie_url" text;--> statement-breakpoint
ALTER TABLE "creator_applications" ADD COLUMN "username" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "creator_applications" ADD COLUMN "categories" text DEFAULT '[]' NOT NULL;--> statement-breakpoint
ALTER TABLE "creator_applications" ADD COLUMN "subscription_price" integer DEFAULT 499 NOT NULL;--> statement-breakpoint
ALTER TABLE "creator_applications" ADD COLUMN "has_previous_experience" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "creator_applications" ADD COLUMN "previous_platforms" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "creator_applications" ADD COLUMN "content_description" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "creator_applications" ADD COLUMN "payout_method" text DEFAULT 'bank' NOT NULL;--> statement-breakpoint
ALTER TABLE "creator_applications" ADD COLUMN "bank_account_name" text;--> statement-breakpoint
ALTER TABLE "creator_applications" ADD COLUMN "bank_account_number" text;--> statement-breakpoint
ALTER TABLE "creator_applications" ADD COLUMN "bank_routing_number" text;--> statement-breakpoint
ALTER TABLE "creator_applications" ADD COLUMN "bank_name" text;--> statement-breakpoint
ALTER TABLE "creator_applications" ADD COLUMN "bank_country" text;--> statement-breakpoint
ALTER TABLE "creator_applications" ADD COLUMN "crypto_wallet_address" text;--> statement-breakpoint
ALTER TABLE "creator_applications" ADD COLUMN "crypto_currency" text;--> statement-breakpoint
ALTER TABLE "creator_applications" ADD COLUMN "tax_country" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "creator_applications" ADD COLUMN "tax_id" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "creator_applications" ADD COLUMN "is_business_account" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "creator_applications" ADD COLUMN "business_name" text;--> statement-breakpoint
ALTER TABLE "creator_applications" ADD COLUMN "agreed_to_terms" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "creator_applications" ADD COLUMN "agreed_to_content_policy" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "creator_applications" ADD COLUMN "agreed_to_age18" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "creator_applications" ADD COLUMN "agreed_to_tax_obligations" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "creator_applications" ADD COLUMN "agreed_to_privacy_policy" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "creator_applications" ADD COLUMN "signature" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "creator_applications" ADD COLUMN "submitted_at" timestamp;--> statement-breakpoint
ALTER TABLE "posts" ADD COLUMN "media_count" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "post_media" ADD CONSTRAINT "post_media_post_id_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "notif_user_id_idx" ON "notifications" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "notif_created_idx" ON "notifications" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "notif_unread_idx" ON "notifications" USING btree ("user_id","is_read");--> statement-breakpoint
CREATE UNIQUE INDEX "season_level_tier_idx" ON "pass_reward_track" USING btree ("season_id","level","tier");--> statement-breakpoint
CREATE UNIQUE INDEX "reward_claims_unique" ON "reward_claims" USING btree ("user_id","reward_id");--> statement-breakpoint
CREATE INDEX "season_tasks_season_idx" ON "season_tasks" USING btree ("season_id");--> statement-breakpoint
CREATE INDEX "season_tasks_tier_idx" ON "season_tasks" USING btree ("tier");--> statement-breakpoint
CREATE UNIQUE INDEX "user_reward_idx" ON "user_pass_reward_claims" USING btree ("user_id","reward_id");--> statement-breakpoint
CREATE UNIQUE INDEX "user_season_progress_unique" ON "user_season_progress" USING btree ("user_id","season_id");--> statement-breakpoint
CREATE INDEX "user_season_progress_season_idx" ON "user_season_progress" USING btree ("season_id");--> statement-breakpoint
CREATE UNIQUE INDEX "user_weekly_tasks_unique" ON "user_weekly_tasks" USING btree ("user_id","season_id","week_start_date");--> statement-breakpoint
ALTER TABLE "creator_applications" DROP COLUMN "why";--> statement-breakpoint
ALTER TABLE "creator_applications" DROP COLUMN "content_type";--> statement-breakpoint
ALTER TABLE "creator_applications" DROP COLUMN "expected_revenue";