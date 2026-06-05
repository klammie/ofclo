CREATE TYPE "public"."tx_currency" AS ENUM('usd', 'coins', 'crypto');--> statement-breakpoint
CREATE TYPE "public"."tx_status" AS ENUM('pending', 'completed', 'failed', 'refunded');--> statement-breakpoint
CREATE TYPE "public"."tx_type" AS ENUM('deposit', 'withdrawal', 'subscription', 'tip', 'ppv', 'coin_purchase', 'coin_spend', 'coin_earn', 'refund', 'creator_earning', 'platform_fee', 'crypto_deposit');--> statement-breakpoint
CREATE TABLE "coin_packages" (
	"id" text PRIMARY KEY NOT NULL,
	"coins" integer NOT NULL,
	"price_cents" integer NOT NULL,
	"bonus_coins" integer DEFAULT 0 NOT NULL,
	"is_best_value" boolean DEFAULT false NOT NULL,
	"is_most_popular" boolean DEFAULT false NOT NULL,
	"crypto_enabled" boolean DEFAULT true NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "crypto_invoices" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"transaction_id" text NOT NULL,
	"crypto_currency" text NOT NULL,
	"crypto_amount" text NOT NULL,
	"wallet_address" text NOT NULL,
	"usd_amount_cents" integer NOT NULL,
	"status" "tx_status" DEFAULT 'pending' NOT NULL,
	"expires_at" timestamp NOT NULL,
	"confirmed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_wallet" (
	"user_id" text PRIMARY KEY NOT NULL,
	"usd_balance" integer DEFAULT 0 NOT NULL,
	"pending_balance" integer DEFAULT 0 NOT NULL,
	"lifetime_deposited" integer DEFAULT 0 NOT NULL,
	"lifetime_spent" integer DEFAULT 0 NOT NULL,
	"lifetime_earned" integer DEFAULT 0 NOT NULL,
	"lifetime_withdrawn" integer DEFAULT 0 NOT NULL,
	"coins_balance" integer DEFAULT 0 NOT NULL,
	"lifetime_coins_earned" integer DEFAULT 0 NOT NULL,
	"lifetime_coins_spent" integer DEFAULT 0 NOT NULL,
	"is_verified" boolean DEFAULT false NOT NULL,
	"can_withdraw" boolean DEFAULT false NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "wallet_transactions" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"type" "tx_type" NOT NULL,
	"status" "tx_status" DEFAULT 'pending' NOT NULL,
	"currency" "tx_currency" NOT NULL,
	"amount_cents" integer DEFAULT 0 NOT NULL,
	"coins_amount" integer DEFAULT 0 NOT NULL,
	"description" text NOT NULL,
	"metadata" text,
	"linked_user_id" text,
	"linked_entity_id" text,
	"external_tx_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
