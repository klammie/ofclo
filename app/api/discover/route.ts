/**
 * app/api/discover/route.ts
 *
 * Place this file at: app/api/discover/route.ts
 *
 * Uses your exact schema tables and columns:
 *   user            → id, name, image, role, createdAt
 *   profiles        → id (= userId), username, avatarUrl, coverUrl, bio
 *   creators        → id (uuid), userId, bio, coverImageUrl, standardPrice,
 *                     vipPrice, isVerified, status, subscriberCount, postCount
 *   posts           → id, creatorId, mediaType, mediaUrl, thumbnailUrl,
 *                     description, isLocked, likeCount, commentCount,
 *                     status, createdAt
 *   subscriptions   → userId, creatorId, status
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/db";
import {
  user,
  profiles,
  creators,
  posts,
  subscriptions,
} from "@/db/schema";
import {
  eq,
  and,
  ne,
  or,
  ilike,
  inArray,
  desc,
  asc,
  sql,
} from "drizzle-orm";

// ─── Rarity from subscriber count ─────────────────────────────────────────────

function getRarity(n: number) {
  if (n >= 10000) return "legendary";
  if (n >= 1000)  return "epic";
  if (n >= 100)   return "rare";
  return "common";
}

// ─── GET /api/discover ────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const search  = searchParams.get("search")  ?? "";
  const rarity  = searchParams.get("rarity")  ?? "all";
  const sortBy  = searchParams.get("sortBy")  ?? "trending";
  const limit   = Math.min(parseInt(searchParams.get("limit") ?? "24"), 50);
  const page    = parseInt(searchParams.get("page") ?? "0");
  const offset  = page * limit;

  try {
    // ── Step 1: Fetch active creators with their profile ──────────────────────
    //
    // creators.userId → user.id (text FK)
    // profiles.id     → user.id (same PK, one-to-one)
    //
    // We left-join profiles because a creator might not have created
    // their profile row yet.

    const creatorsRaw = await db
      .select({
        // creator row
        creatorId:       creators.id,           // uuid PK on creators table
        userId:          creators.userId,        // text FK → user.id
        bio:             creators.bio,
        coverImageUrl:   creators.coverImageUrl,
        standardPrice:   creators.standardPrice, // integer (cents)
        vipPrice:        creators.vipPrice,      // decimal string
        isVerified:      creators.isVerified,
        subscriberCount: creators.subscriberCount,
        postCount:       creators.postCount,
        createdAt:       creators.createdAt,
        // user row
        userName:        user.name,
        userImage:       user.image,
        // profile row (may be null if profile not created yet)
        username:        profiles.username,
        avatarUrl:       profiles.avatarUrl,
        coverUrl:        profiles.coverUrl,
        profileBio:      profiles.bio,
      })
      .from(creators)
      .innerJoin(user,     eq(user.id,     creators.userId))
      .leftJoin(profiles,  eq(profiles.id, creators.userId))
      .where(
        and(
          // Only show approved/active creators
          eq(creators.status, "active"),
          // Exclude the current viewer
          ne(creators.userId, session.user.id),
          // Search filter across name and username
          search
            ? or(
                ilike(user.name,      `%${search}%`),
                ilike(profiles.username, `%${search}%`),
              )
            : undefined,
        )
      )
      .orderBy(
        sortBy === "top"        ? desc(creators.subscriberCount)
        : sortBy === "price_low"  ? asc(creators.standardPrice)
        : sortBy === "price_high" ? desc(creators.standardPrice)
        : sortBy === "new"        ? desc(creators.createdAt)
        : desc(creators.subscriberCount) // trending = highest subscribers first
      )
      .limit(limit)
      .offset(offset);

    if (creatorsRaw.length === 0) {
      return NextResponse.json({ creators: [], total: 0, hasMore: false });
    }

    // creatorId is the uuid PK — use it for post/subscription joins
    const creatorUuids = creatorsRaw.map((c) => c.creatorId);
    // userId is the text FK — use it for subscription userId check
    const userIds      = creatorsRaw.map((c) => c.userId);

    // ── Step 2: Which creators does the current user subscribe to? ─────────────
    //
    // subscriptions.userId    → text (better-auth user id)
    // subscriptions.creatorId → uuid (creators.id)
    // subscriptions.status    → "active" | "cancelled" | "expired" | "paused"

    const activeSubs = await db
      .select({ creatorId: subscriptions.creatorId })
      .from(subscriptions)
      .where(
        and(
          eq(subscriptions.userId,   session.user.id),
          eq(subscriptions.status,   "active"),
          inArray(subscriptions.creatorId, creatorUuids),
        )
      );

    // Set of creator UUIDs the viewer is subscribed to
    const subscribedSet = new Set(activeSubs.map((s) => s.creatorId));

    // ── Step 3: Fetch teaser posts for all creators in one query ───────────────
    //
    // posts.creatorId   → uuid (creators.id)
    // posts.isLocked    → boolean (true = subscriber-only, blur it)
    // posts.status      → "published" | "draft" | "scheduled"
    // posts.mediaUrl    → the actual media (image or video)
    // posts.mediaType   → "image" | "video"
    // posts.likeCount   → integer
    // posts.commentCount → integer
    // posts.description → caption text

    const rawPosts = await db
      .select({
        id:           posts.id,
        creatorId:    posts.creatorId,
        mediaUrl:     posts.mediaUrl,
        thumbnailUrl: posts.thumbnailUrl,
        mediaType:    posts.mediaType,
        caption:      posts.description,   // description = caption in your schema
        isLocked:     posts.isLocked,      // true = blurred for non-subscribers
        likeCount:    posts.likeCount,
        commentCount: posts.commentCount,
        createdAt:    posts.createdAt,
      })
      .from(posts)
      .where(
        and(
          inArray(posts.creatorId, creatorUuids),
          eq(posts.status, "published"),   // only published posts as teasers
        )
      )
      .orderBy(desc(posts.createdAt))
      .limit(creatorUuids.length * 6);    // up to 6 per creator, trimmed below

    // ── Step 4: Group posts per creator — 2 public + 2 locked, interleaved ────

    const teasersByCreator = new Map<string, {
      id: string;
      imageUrl: string | null;
      videoThumbnail: string | null;
      type: "image" | "video" | "text";
      likesCount: number;
      commentsCount: number;
      caption: string | null;
      isBlurred: boolean;
    }[]>();

    for (const creatorId of creatorUuids) {
      const mine     = rawPosts.filter((p) => p.creatorId === creatorId);
      const free     = mine.filter((p) => !p.isLocked).slice(0, 2);  // public posts
      const locked   = mine.filter((p) =>  p.isLocked).slice(0, 2);  // subscriber-only

      // Interleave so grid shows: public, locked, public, locked
      const mixed: typeof teasersByCreator extends Map<string, infer V> ? V : never = [];
      for (let i = 0; i < 2; i++) {
        if (free[i]) {
          mixed.push({
            id:             free[i].id,
            imageUrl:       free[i].mediaType === "image" ? free[i].mediaUrl : null,
            videoThumbnail: free[i].mediaType === "video" ? (free[i].thumbnailUrl ?? free[i].mediaUrl) : null,
            type:           (free[i].mediaType as "image" | "video") ?? "image",
            likesCount:     free[i].likeCount    ?? 0,
            commentsCount:  free[i].commentCount ?? 0,
            caption:        free[i].caption      ?? null,
            isBlurred:      false,   // public — show clearly
          });
        }
        if (locked[i]) {
          mixed.push({
            id:             locked[i].id,
            imageUrl:       locked[i].mediaType === "image" ? locked[i].mediaUrl : null,
            videoThumbnail: locked[i].mediaType === "video" ? (locked[i].thumbnailUrl ?? locked[i].mediaUrl) : null,
            type:           (locked[i].mediaType as "image" | "video") ?? "image",
            likesCount:     locked[i].likeCount    ?? 0,
            commentsCount:  locked[i].commentCount ?? 0,
            caption:        locked[i].caption      ?? null,
            isBlurred:      true,   // locked — show blurred with 🔒
          });
        }
      }

      teasersByCreator.set(creatorId, mixed.slice(0, 4));
    }

    // ── Step 5: Map to CreatorCardData shape ──────────────────────────────────

    const mapped = creatorsRaw.map((row) => ({
      // id = creator UUID (used for subscription API calls)
      id:             row.creatorId,
      // userId = better-auth user id (used for message routing)
      userId:         row.userId,
      // Name from better-auth user table
      name:           row.userName,
      // Username from profiles table (fallback to user name if no profile yet)
      username:       row.username ?? row.userName.toLowerCase().replace(/\s+/g, "_"),
      // Avatar: prefer profiles.avatarUrl, fallback to user.image (Google OAuth etc.)
      avatarUrl:      row.avatarUrl ?? row.userImage ?? null,
      // Cover: prefer creators.coverImageUrl, fallback to profiles.coverUrl
      coverImageUrl:  row.coverImageUrl ?? row.coverUrl ?? null,
      // Bio: prefer creators.bio (creator-specific), fallback to profiles.bio
      bio:            row.bio ?? row.profileBio ?? null,
      isVerified:     row.isVerified,
      subscriberCount: row.subscriberCount,
      postCount:       row.postCount,
      // standardPrice is integer cents (e.g. 999 = $9.99)
      standardPrice:   row.standardPrice,
      // vipPrice is decimal string (e.g. "24.99") — convert to cents
      vipPrice:        Math.round(parseFloat(row.vipPrice as string) * 100),
      previewImage:    null,
      isSubscribed:    subscribedSet.has(row.creatorId),
      teaserContent:   teasersByCreator.get(row.creatorId) ?? [],
    }));

    // ── Step 6: Rarity filter (JS-side, needs subscriberCount) ────────────────

    const rarityFiltered = rarity === "all"
      ? mapped
      : mapped.filter((c) => getRarity(c.subscriberCount) === rarity);

    // Free filter
    const final = sortBy === "free"
      ? rarityFiltered.filter((c) => c.standardPrice === 0)
      : rarityFiltered;

    return NextResponse.json({
      creators: final,
      total:    final.length,
      hasMore:  creatorsRaw.length === limit,
    });

  } catch (e) {
    console.error("[GET /api/discover]", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// ─── POST /api/discover — not used directly (subscribe goes through ────────────
// app/api/subscriptions/subscribe/route.ts) but kept for follow toggle

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const { creatorId, action } = body as { creatorId: string; action: "subscribe" | "unsubscribe" };

  if (!creatorId || !action) {
    return NextResponse.json({ error: "Missing creatorId or action" }, { status: 400 });
  }

  try {
    if (action === "subscribe") {
      // Delegate to your existing subscribe route logic
      // or inline a quick insert here:
      await db
        .insert(subscriptions)
        .values({
          userId:              session.user.id,
          creatorId,
          tier:                "standard",
          status:              "active",
          priceAtSubscription: "0.00",
          currentPeriodStart:  new Date(),
          currentPeriodEnd:    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        })
        .onConflictDoNothing(); // uniqueActiveSub index prevents duplicates
    } else {
      await db
        .update(subscriptions)
        .set({ status: "cancelled", cancelledAt: new Date() })
        .where(
          and(
            eq(subscriptions.userId,    session.user.id),
            eq(subscriptions.creatorId, creatorId),
            eq(subscriptions.status,    "active"),
          )
        );
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("[POST /api/discover]", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}