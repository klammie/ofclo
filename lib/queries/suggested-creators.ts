import { db } from "@/db";
import { creators, subscriptions, user, profiles } from "@/db/schema";
import { and, eq, ne, notInArray, sql } from "drizzle-orm";

export type SuggestedCreator = {
  id:              string;
  userId:          string;
  name:            string;
  username:        string;
  avatarUrl:       string | null;
  bio:             string | null;
  isVerified:      boolean;
  subscriberCount: number;
  postCount:       number;
  standardPrice:   number | null;
  rarity:          "common" | "rare" | "epic" | "legendary";
};

function getRarity(n: number): SuggestedCreator["rarity"] {
  if (n >= 10000) return "legendary";
  if (n >= 1000)  return "epic";
  if (n >= 100)   return "rare";
  return "common";
}

export async function getSuggestedCreators(
  userId: string | null,
  excludeCreatorUserId?: string, // exclude the profile being viewed
  limit = 6,
): Promise<SuggestedCreator[]> {
  try {
    const subscribedIds: string[] = [];

    if (userId) {
      const activeSubs = await db
        .select({ creatorId: subscriptions.creatorId })
        .from(subscriptions)
        .where(and(eq(subscriptions.userId, userId), eq(subscriptions.status, "active")));
      subscribedIds.push(...activeSubs.map((s) => s.creatorId));
    }

    const rows = await db
      .select({
        creatorId:       creators.id,
        creatorUserId:   creators.userId,
        creatorName:     user.name,
        creatorImage:    user.image,
        creatorVerified: creators.isVerified,
        subscriberCount: creators.subscriberCount,
        postCount:       creators.postCount,
        standardPrice:   creators.standardPrice,
        bio:             creators.bio,
        username:        profiles.username,
        avatarUrl:       profiles.avatarUrl,
      })
      .from(creators)
      .innerJoin(user,    eq(user.id,     creators.userId))
      .leftJoin(profiles, eq(profiles.id, creators.userId))
      .where(
        and(
          eq(creators.status, "active"),
          // Exclude the current user's own creator profile
          userId             ? ne(creators.userId, userId)                         : sql`true`,
          // Exclude the creator whose profile page we're on
          excludeCreatorUserId ? ne(creators.userId, excludeCreatorUserId)         : sql`true`,
          // Exclude already-subscribed creators
          subscribedIds.length > 0 ? notInArray(creators.id, subscribedIds) : sql`true`,
        )
      )
      .orderBy(sql`RANDOM()`)
      .limit(limit);

    return rows.map((r) => ({
      id:              r.creatorId,
      userId:          r.creatorUserId,
      name:            r.creatorName,
      username:        r.username ?? r.creatorName.toLowerCase().replace(/\s+/g, "_"),
      avatarUrl:       r.avatarUrl ?? r.creatorImage ?? null,
      bio:             r.bio ?? null,
      isVerified:      r.creatorVerified ?? false,
      subscriberCount: r.subscriberCount ?? 0,
      postCount:       r.postCount ?? 0,
      standardPrice:   r.standardPrice ?? null,
      rarity:          getRarity(r.subscriberCount ?? 0),
    }));
  } catch {
    return [];
  }
}