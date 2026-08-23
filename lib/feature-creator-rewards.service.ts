// lib/featured-creator-rewards.service.ts
// ─────────────────────────────────────────────────────────────────────────────
// Handles random assignment of the season's featured creator's locked/PPV
// posts to reward track slots. Once a (user, reward) pair is assigned a post,
// that choice is locked in via featuredCreatorRewardMedia so re-claiming or
// re-viewing the reward always shows the same post (no re-rolling).
//
// VIP vs Free tier behavior:
//   - VIP users:  pool = ALL locked posts by the featured creator (photos + videos)
//   - Free users: pool = only a smaller curated subset (e.g. photos only, or
//                 posts marked lower-tier) — adjust the WHERE clause below to
//                 match how you want to gate content quality between tiers.
// ─────────────────────────────────────────────────────────────────────────────

import { db } from "@/db";
import { posts, featuredCreatorRewardMedia, fanPassSeasons, creators } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";

interface FeaturedMediaResult {
  postId:       string;
  mediaUrl:     string | null;
  mediaType:    "image" | "video" | null;
  thumbnailUrl: string | null;
  caption:      string | null;
}

// ─── Get (or assign) the featured-creator post for a specific reward ─────────
export async function getFeaturedRewardMedia(
  userId: string,
  seasonId: number,
  rewardId: number,
  isVip: boolean
): Promise<FeaturedMediaResult | null> {

  // 1. Already assigned? Return the locked-in choice.
  const existing = await db.query.featuredCreatorRewardMedia.findFirst({
    where: and(
      eq(featuredCreatorRewardMedia.userId,   userId),
      eq(featuredCreatorRewardMedia.rewardId, rewardId),
    ),
  });

  if (existing) {
    const post = await db.query.posts.findFirst({ where: eq(posts.id, existing.postId) });
    if (!post) return null;
    return {
      postId:       post.id,
      mediaUrl:     post.mediaUrl,
      mediaType:    post.mediaType as "image" | "video" | null,
      thumbnailUrl: post.thumbnailUrl,
      caption:      post.description ?? post.title ?? null, // posts has no "caption" column
    };
  }

  // 2. Get the season's featured creator
  const season = await db.query.fanPassSeasons.findFirst({
    where: eq(fanPassSeasons.id, seasonId),
  });
  if (!season?.featuredCreatorId) return null;

  // 2b. season.featuredCreatorId stores the creator's USER id (set when the
  //     agency picks a featured creator), but posts.creatorId references the
  //     creators table's own id — resolve the actual creators.id first.
  const featuredCreatorRow = await db.query.creators.findFirst({
    where: eq(creators.userId, season.featuredCreatorId),
  });
  if (!featuredCreatorRow) return null;
  const featuredCreatorsTableId = featuredCreatorRow.id;

  // 3. Build the pool of eligible posts.
  //    VIP: all locked/PPV posts (photos + videos)
  //    Free: locked posts only, images preferred (smaller/lower-value pool)
  const pool = await db
    .select({
      id:           posts.id,
      mediaUrl:     posts.mediaUrl,
      mediaType:    posts.mediaType,
      thumbnailUrl: posts.thumbnailUrl,
      title:        posts.title,
      description:  posts.description,
    })
    .from(posts)
    .where(
      isVip
        ? and(
            eq(posts.creatorId, featuredCreatorsTableId),
            eq(posts.isLocked, true),
          )
        : and(
            eq(posts.creatorId, featuredCreatorsTableId),
            eq(posts.isLocked, true),
            eq(posts.mediaType, "image"), // free tier: images only, no video
          )
    );

  if (pool.length === 0) return null;

  // 4. Pick one at random
  const chosen = pool[Math.floor(Math.random() * pool.length)];

  // 5. Lock the choice in so it doesn't change on re-fetch
  try {
    await db.insert(featuredCreatorRewardMedia).values({
      userId,
      seasonId,
      rewardId,
      postId: chosen.id,
    });
  } catch {
    // Unique constraint race — someone else (or a duplicate request) already
    // inserted it. Re-fetch the locked-in row instead of failing.
    const recovered = await db.query.featuredCreatorRewardMedia.findFirst({
      where: and(
        eq(featuredCreatorRewardMedia.userId,   userId),
        eq(featuredCreatorRewardMedia.rewardId, rewardId),
      ),
    });
    if (recovered) {
      const post = await db.query.posts.findFirst({ where: eq(posts.id, recovered.postId) });
      if (post) {
        return {
          postId:       post.id,
          mediaUrl:     post.mediaUrl,
          mediaType:    post.mediaType as "image" | "video" | null,
          thumbnailUrl: post.thumbnailUrl,
          caption:      post.description ?? post.title ?? null,
        };
      }
    }
  }

  return {
    postId:       chosen.id,
    mediaUrl:     chosen.mediaUrl,
    mediaType:    chosen.mediaType as "image" | "video" | null,
    thumbnailUrl: chosen.thumbnailUrl,
    caption:      chosen.description ?? chosen.title ?? null,
  };
}

// ─── How many exclusive media rewards a tier gets per season ─────────────────
// Used when building the reward track UI — VIP sees more "exclusive content"
// reward slots than free tier.
export const EXCLUSIVE_MEDIA_SLOTS = {
  free: 3,   // free tier: 3 exclusive-content reward slots across the whole track
  vip:  10,  // VIP: 10 — significantly more incentive to upgrade
};