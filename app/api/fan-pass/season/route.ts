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

  // ── Parse body ──────────────────────────────────────────────────────────────
  const body = await req.json().catch(() => ({}));

  // DEBUG: log full body so we can verify tasks are arriving
  console.log("[POST /api/agency/fan-pass/seasons] FULL BODY:", JSON.stringify({
    name:          body.name,
    tasksLength:   body.tasks?.length ?? 0,
    tasks:         body.tasks,
    freeRewards:   body.freeRewards?.length ?? 0,
    vipRewards:    body.vipRewards?.length ?? 0,
  }, null, 2));

  const {
    name, description, startDate, endDate,
    vipPriceCents = 999, vipPriceCoins = 5000,
    maxLevel = 100, xpPerLevel = 150,
    freeRewards = [], vipRewards = [], tasks = [],
    featuredCreator = null,
  } = body;

  if (!name?.trim())  return NextResponse.json({ error: "name is required" },      { status: 400 });
  if (!startDate)     return NextResponse.json({ error: "startDate is required" }, { status: 400 });
  if (!endDate)       return NextResponse.json({ error: "endDate is required" },   { status: 400 });

  try {
    // ── 1. Insert season ──────────────────────────────────────────────────────
    const [season] = await db
      .insert(fanPassSeasons)
      .values({
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
      })
      .returning();

    console.log(`[POST /api/agency/fan-pass/seasons] season created id=${season.id}`);

    // ── 2. Insert rewards ─────────────────────────────────────────────────────
    const allRewards = [
      ...freeRewards.map((r: any, idx: number) => ({
        seasonId:     season.id,
        level:        Number(r.level) || idx + 1,
        tier:         "free" as const,
        icon:         r.icon         ?? "⭐",
        label:        r.label        ?? "Reward",
        description:  r.description  ?? null,
        rewardType:   r.rewardType   ?? "xp",
        rewardAmount: Number(r.rewardValue) || 0,
        rewardMeta:   String(r.rewardValue  ?? ""),
        isVipOnly:    false,
        rarity:       r.rarity       ?? "common",
        sortOrder:    idx,
      })),
      ...vipRewards.map((r: any, idx: number) => ({
        seasonId:     season.id,
        level:        Number(r.level) || idx + 1,
        tier:         "vip" as const,
        icon:         r.icon         ?? "💎",
        label:        r.label        ?? "VIP Reward",
        description:  r.description  ?? null,
        rewardType:   r.rewardType   ?? "xp",
        rewardAmount: Number(r.rewardValue) || 0,
        rewardMeta:   String(r.rewardValue  ?? ""),
        isVipOnly:    true,
        rarity:       r.rarity       ?? "epic",
        sortOrder:    idx,
      })),
    ];

    if (allRewards.length > 0) {
      await db.insert(passRewardTrack).values(allRewards);
      console.log(`[POST /api/agency/fan-pass/seasons] inserted ${allRewards.length} rewards`);
    }

    // ── 3. Insert tasks ───────────────────────────────────────────────────────
    if (tasks.length > 0) {
      await db.insert(seasonTasks).values(
        tasks.map((t: any, idx: number) => ({
          seasonId:    season.id,
          icon:        t.icon        ?? "🎯",
          title:       t.label       ?? t.title ?? "Task",   // schema uses "title"
          description: t.description ?? "",
          xpReward:    Number(t.xpReward)  || 50,
          coinReward:  Number(t.coinReward) || 0,
          tier:        t.isVipOnly ? "premium" : "free",     // schema uses tier enum "free"|"premium"
          type:        "weekly",                             // schema uses type enum "weekly"|"streak"
          isActive:    true,
          sortOrder:   idx,
        }))
      );
      console.log(`[POST /api/agency/fan-pass/seasons] inserted ${tasks.length} tasks`);
    } else {
      console.warn("[POST /api/agency/fan-pass/seasons] WARNING: tasks array was empty — nothing inserted");
    }

    return NextResponse.json({ success: true, season }, { status: 201 });

  } catch (e: any) {
    console.error("[POST /api/agency/fan-pass/seasons] ERROR:", e?.message ?? e);
    return NextResponse.json({ error: "Failed to create season", detail: e?.message }, { status: 500 });
  }
}