// app/api/agency/fan-pass/seasons/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/db";
import { fanPassSeasons, passRewardTrack, seasonTasks } from "@/db/schema";
import { eq } from "drizzle-orm";

async function getAgencyId(userId: string): Promise<string> {
  return userId;
}

// ── Map CreateSeasonForm reward types → your DB enum values ──────────────────
// Your rewardItemTypeEnum only allows:
// "xp" | "coins" | "badge" | "exclusive_content" | "streak_freeze" | "mystery_box"
function mapRewardType(raw: string): "xp" | "coins" | "badge" | "exclusive_content" | "streak_freeze" | "mystery_box" {
  const map: Record<string, "xp" | "coins" | "badge" | "exclusive_content" | "streak_freeze" | "mystery_box"> = {
    xp:               "xp",
    coins:            "coins",
    badge:            "badge",
    exclusive_pic:    "exclusive_content",
    short_vid:        "exclusive_content",
    long_vid:         "exclusive_content",
    exclusive_content:"exclusive_content",
    mystery_box:      "mystery_box",
    mystery_box_low:  "mystery_box",
    mystery_box_high: "mystery_box",
    gift:             "badge",            // closest valid enum
    frame:            "badge",
    title:            "badge",
    featured_access:  "exclusive_content",
    creator_sub:      "exclusive_content",
    streak_freeze:    "streak_freeze",
  };
  return map[raw] ?? "xp";
}

// ── Map rarity to your enum ──────────────────────────────────────────────────
// Check your itemRarityEnum — adjust if values differ
function mapRarity(raw: string): "common" | "rare" | "epic" | "legendary" {
  if (["common","rare","epic","legendary"].includes(raw)) return raw as any;
  return "common";
}

// ── Map tier to your rewardTrackTierEnum ─────────────────────────────────────
function mapTier(raw: string): "free" | "vip" {
  return raw === "vip" ? "vip" : "free";
}

export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const agencyId = await getAgencyId(session.user.id);
  try {
    const seasons = await db.query.fanPassSeasons.findMany({
      where: eq(fanPassSeasons.agencyId, agencyId),
      orderBy: (t, { desc }) => [desc(t.createdAt)],
    });
    return NextResponse.json({ seasons });
  } catch (e: any) {
    console.error("[GET /api/agency/fan-pass/seasons]", e?.message);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const agencyId = await getAgencyId(session.user.id);
  const body = await req.json().catch(() => ({}));

  const {
    name, description, startDate, endDate,
    vipPriceCents = 999, vipPriceCoins = 5000,
    maxLevel = 100, xpPerLevel = 150,
    freeRewards = [], vipRewards = [], tasks = [],
    featuredCreator = null,
  } = body;

  console.log(`[POST /api/agency/fan-pass/seasons] "${name}" tasks=${tasks.length} freeRewards=${freeRewards.length} vipRewards=${vipRewards.length}`);

  if (!name?.trim())  return NextResponse.json({ error: "name is required" },      { status: 400 });
  if (!startDate)     return NextResponse.json({ error: "startDate is required" }, { status: 400 });
  if (!endDate)       return NextResponse.json({ error: "endDate is required" },   { status: 400 });

  // 1. Insert season first
  const [season] = await db.insert(fanPassSeasons).values({
    agencyId,
    name:                name.trim(),
    description:         description?.trim() ?? null,
    startDate:           new Date(startDate),
    endDate:             new Date(endDate),
    vipPriceCents:       Number(vipPriceCents),
    vipPriceCoins:       Number(vipPriceCoins),
    maxLevel:            Number(maxLevel),
    xpPerLevel:          Number(xpPerLevel),
    status:              "draft",
    totalParticipants:   0,
    featuredCreatorId:   featuredCreator?.userId  ?? null,
    featuredCreatorName: featuredCreator?.name    ?? null,
  }).returning();
  console.log(`[POST /api/agency/fan-pass/seasons] season id=${season.id}`);

  // 2. Insert rewards — in a try/catch so tasks still save if rewards fail
  try {
    const allRewards = [
      ...freeRewards.map((r: any, idx: number) => ({
        seasonId:     season.id,
        level:        Number(r.level) || idx + 1,
        tier:         mapTier("free"),
        icon:         r.icon  ?? "⭐",
        label:        r.label ?? "Reward",
        description:  r.description ?? "",
        rewardType:   mapRewardType(r.rewardType ?? "xp"),   // ← map to valid enum
        rewardAmount: Number(r.rewardValue) || 0,
        rewardMeta:   String(r.rewardValue  ?? ""),
        isVipOnly:    false,
        rarity:       mapRarity(r.rarity ?? "common"),       // ← map to valid enum
        sortOrder:    idx,
      })),
      ...vipRewards.map((r: any, idx: number) => ({
        seasonId:     season.id,
        level:        Number(r.level) || idx + 1,
        tier:         mapTier("vip"),
        icon:         r.icon  ?? "💎",
        label:        r.label ?? "VIP Reward",
        description:  r.description ?? "",
        rewardType:   mapRewardType(r.rewardType ?? "xp"),   // ← map to valid enum
        rewardAmount: Number(r.rewardValue) || 0,
        rewardMeta:   String(r.rewardValue  ?? ""),
        isVipOnly:    true,
        rarity:       mapRarity(r.rarity ?? "epic"),         // ← map to valid enum
        sortOrder:    idx,
      })),
    ];

    if (allRewards.length > 0) {
      await db.insert(passRewardTrack).values(allRewards);
      console.log(`[POST /api/agency/fan-pass/seasons] inserted ${allRewards.length} rewards`);
    }
  } catch (e: any) {
    // Log but don't block — tasks can still save
    console.error("[POST /api/agency/fan-pass/seasons] rewards insert failed:", e?.message);
  }

  // 3. Insert tasks — separate try/catch
  try {
    if (tasks.length > 0) {
      const taskRows = tasks.map((t: any, idx: number) => ({
        seasonId:    season.id,
        title:       (t.label ?? t.title ?? "Task").trim(),
        description: (t.description ?? "").trim(),
        icon:        t.icon      ?? "🎯",
        xpReward:    Number(t.xpReward)  || 50,
        coinReward:  Number(t.coinReward) || 0,
        tier:        (t.isVipOnly ? "premium" : "free") as "free" | "premium",
        type:        "weekly" as const,
        isActive:    true,
        sortOrder:   idx,
      }));

      console.log(`[POST /api/agency/fan-pass/seasons] inserting ${taskRows.length} tasks`);
      await db.insert(seasonTasks).values(taskRows);
      console.log(`[POST /api/agency/fan-pass/seasons] tasks inserted ✓`);
    }
  } catch (e: any) {
    console.error("[POST /api/agency/fan-pass/seasons] tasks insert failed:", e?.message);
  }

  return NextResponse.json({ success: true, season }, { status: 201 });
}