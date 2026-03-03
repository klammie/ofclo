DROP INDEX "comments_post_idx";--> statement-breakpoint
DROP INDEX "comments_created_idx";--> statement-breakpoint
CREATE INDEX "comments_created_idx" ON "comments" USING btree ("created_at" DESC NULLS LAST);