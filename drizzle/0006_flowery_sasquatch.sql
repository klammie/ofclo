ALTER TABLE "profiles" ADD COLUMN "creator_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "user_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "name" text NOT NULL;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "bio" text;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "is_verified" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "subscriber_count" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "post_count" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "standard_price" text NOT NULL;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "vip_price" text NOT NULL;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "is_subscribed" boolean DEFAULT false NOT NULL;