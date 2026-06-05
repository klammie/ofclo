CREATE TYPE "public"."shop_currency" AS ENUM('coins', 'real');--> statement-breakpoint
CREATE TYPE "public"."shop_item_rarity" AS ENUM('common', 'rare', 'epic', 'legendary');--> statement-breakpoint
CREATE TYPE "public"."shop_item_type" AS ENUM('badge', 'booster_xp', 'booster_coin', 'gift', 'vip_pass', 'streak_freeze', 'mystery_box', 'emote');--> statement-breakpoint
CREATE TABLE "shop_items" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"icon" text NOT NULL,
	"type" "shop_item_type" NOT NULL,
	"category" text NOT NULL,
	"rarity" "shop_item_rarity" DEFAULT 'common' NOT NULL,
	"coin_price" integer DEFAULT 0 NOT NULL,
	"real_price_cents" integer,
	"is_coins_only" boolean DEFAULT true NOT NULL,
	"is_real_money_only" boolean DEFAULT false NOT NULL,
	"is_featured" boolean DEFAULT false NOT NULL,
	"is_limited_time" boolean DEFAULT false NOT NULL,
	"expires_at" timestamp,
	"stock" integer,
	"booster_multiplier" integer,
	"booster_duration_hours" integer,
	"is_active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "shop_purchase_log" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"item_id" text NOT NULL,
	"currency" "shop_currency" NOT NULL,
	"coin_amount" integer,
	"real_amount_cents" integer,
	"coins_after_purchase" integer,
	"purchased_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_coin_balance" (
	"user_id" text PRIMARY KEY NOT NULL,
	"balance" integer DEFAULT 0 NOT NULL,
	"lifetime_earned" integer DEFAULT 0 NOT NULL,
	"lifetime_spent" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_inventory" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"item_id" text NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"booster_active_until" timestamp,
	"purchased_at" timestamp DEFAULT now() NOT NULL
);
