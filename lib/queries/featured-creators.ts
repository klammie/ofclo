// lib/queries/featured-creators.ts
// Fetches one random creator per rarity tier (legendary, epic, rare, common)
// for the landing page creator showcase section.
// Called server-side from app/page.tsx on each request.

import { db } from "@/db";
import { creators, profiles, user } from "@/db/schema";
import { eq, sql } from "drizzle-orm";

export type FeaturedCreator = {
  id:              string;
  userId:          string;
  name:            string;
  username:        string;
  avatarUrl:       string | null;
  coverUrl:        string | null;
  subscriberCount: number;
  bio:             string | null;
  rarity:          "common" | "rare" | "epic" | "legendary";
  standardPrice:   number | null;
};

function getRarity(subscriberCount: number): FeaturedCreator["rarity"] {
  if (subscriberCount >= 10000) return "legendary";
  if (subscriberCount >= 1000)  return "epic";
  if (subscriberCount >= 100)   return "rare";
  return "common";
}

export async function getFeaturedCreators(): Promise<FeaturedCreator[]> {
  try {
    // Fetch all active creators with their profile
    const rows = await db
      .select({
        creatorId:       creators.id,
        userId:          creators.userId,
        name:            user.name,
        username:        profiles.username,
        avatarUrl:       profiles.avatarUrl,
        coverUrl:        profiles.coverUrl,
        subscriberCount: creators.subscriberCount,
        bio:             creators.bio,
        standardPrice:   creators.standardPrice,
      })
      .from(creators)
      .innerJoin(user,    eq(user.id,     creators.userId))
      .leftJoin(profiles, eq(profiles.id, creators.userId))
      .where(eq(creators.status, "active"))
      .orderBy(sql`RANDOM()`); // different order on each request

    // Group by rarity and pick one per tier
    const byRarity: Record<string, FeaturedCreator[]> = {
      legendary: [],
      epic:      [],
      rare:      [],
      common:    [],
    };

    for (const row of rows) {
      const rarity = getRarity(row.subscriberCount ?? 0);
      byRarity[rarity].push({
        id:              row.creatorId,
        userId:          row.userId,
        name:            row.name,
        username:        row.username ?? row.name.toLowerCase().replace(/\s+/g, "_"),
        avatarUrl:       row.avatarUrl  ?? null,
        coverUrl:        row.coverUrl   ?? null,
        subscriberCount: row.subscriberCount ?? 0,
        bio:             row.bio        ?? null,
        rarity,
        standardPrice:   row.standardPrice != null ? Number(row.standardPrice) / 100 : null,
      });
    }

    // Pick the first (randomly ordered) creator from each rarity tier
    // Order: legendary → epic → rare → common (most impressive first)
    const featured: FeaturedCreator[] = [];
    for (const tier of ["legendary", "epic", "rare", "common"] as const) {
      if (byRarity[tier].length > 0) {
        featured.push(byRarity[tier][0]);
      }
    }

    // If we have fewer than 4 real creators fill the remaining slots
    // with extra creators from whatever tiers have more than one
    if (featured.length < 4) {
      const used = new Set(featured.map((c) => c.id));
      for (const row of rows) {
        if (featured.length >= 4) break;
        const rarity = getRarity(row.subscriberCount ?? 0);
        const creator: FeaturedCreator = {
          id:              row.creatorId,
          userId:          row.userId,
          name:            row.name,
          username:        row.username ?? row.name.toLowerCase().replace(/\s+/g, "_"),
          avatarUrl:       row.avatarUrl  ?? null,
          coverUrl:        row.coverUrl   ?? null,
          subscriberCount: row.subscriberCount ?? 0,
          bio:             row.bio        ?? null,
          rarity,
          standardPrice:   row.standardPrice != null ? Number(row.standardPrice) / 100 : null,
        };
        if (!used.has(creator.id)) {
          featured.push(creator);
          used.add(creator.id);
        }
      }
    }

    return featured;
  } catch (e: any) {
    console.error("[getFeaturedCreators]", e?.message);
    return [];
  }
}