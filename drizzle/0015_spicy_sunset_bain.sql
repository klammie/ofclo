CREATE TYPE "public"."reward_type" AS ENUM('xp', 'coins', 'badge', 'exclusive_content', 'streak_freeze', 'mystery_box');--> statement-breakpoint
CREATE TABLE "login_bonus_day_config" (
	"id" serial PRIMARY KEY NOT NULL,
	"season_id" integer NOT NULL,
	"day_slot" integer NOT NULL,
	"label" text NOT NULL,
	"icon" text NOT NULL,
	"reward_type" "reward_type" DEFAULT 'xp' NOT NULL,
	"reward_amount" integer DEFAULT 25 NOT NULL,
	"reward_label" text NOT NULL,
	"is_special_day" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "login_claim_log" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"season_id" integer NOT NULL,
	"day_slot" integer NOT NULL,
	"reward_type" "reward_type" NOT NULL,
	"reward_amount" integer NOT NULL,
	"streak_at_claim" integer NOT NULL,
	"is_vip" boolean DEFAULT false NOT NULL,
	"bonus_multiplier" integer DEFAULT 1 NOT NULL,
	"claimed_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "login_streak_milestone" (
	"id" serial PRIMARY KEY NOT NULL,
	"season_id" integer NOT NULL,
	"streak_days" integer NOT NULL,
	"title" text NOT NULL,
	"icon" text NOT NULL,
	"reward_type" "reward_type" NOT NULL,
	"reward_amount" integer DEFAULT 0 NOT NULL,
	"reward_label" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "milestone_claim_log" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"milestone_id" integer NOT NULL,
	"season_id" integer NOT NULL,
	"claimed_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_login_streak" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"season_id" integer NOT NULL,
	"current_streak" integer DEFAULT 0 NOT NULL,
	"longest_streak" integer DEFAULT 0 NOT NULL,
	"last_claimed_at" timestamp,
	"current_day_slot" integer DEFAULT 1 NOT NULL,
	"streak_freezes" integer DEFAULT 0 NOT NULL,
	"total_xp_earned" integer DEFAULT 0 NOT NULL,
	"total_coins_earned" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "user_milestone_idx" ON "milestone_claim_log" USING btree ("user_id","milestone_id");--> statement-breakpoint
CREATE UNIQUE INDEX "user_season_idx" ON "user_login_streak" USING btree ("user_id","season_id");