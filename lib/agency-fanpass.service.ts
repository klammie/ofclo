import { db } from "@/db";
import {
  fanPassSeasons,
  passRewardTrack,
  userLoginStreak,
  loginBonusDayConfig,
  loginStreakMilestone,
} from "@/db/schema";
import { and, eq, desc, asc, sql } from "drizzle-orm";
import type {
  FanPassSeason,
  SeasonFormData,
  PassRewardItem,
  RewardFormData,
  DayConfigItem,
  MilestoneItem,
  SeasonAnalytics,
} from "@/lib/types";

// ─── Guard: verify agency owns the season ────────────────────────────────────

async function assertAgencyOwnsSeason(seasonId: number, agencyId: string) {
  const season = await db.query.fanPassSeasons.findFirst({
    where: and(
      eq(fanPassSeasons.id, seasonId),
      eq(fanPassSeasons.agencyId, agencyId)
    ),
  });
  if (!season) throw new Error("FORBIDDEN");
  return season;
}

// ═══════════════════════════════════════════════════════════════════════════════
// SEASONS
// ═══════════════════════════════════════════════════════════════════════════════

export async function getAgencySeasons(agencyId: string): Promise<FanPassSeason[]> {
  const rows = await db.query.fanPassSeasons.findMany({
    where: eq(fanPassSeasons.agencyId, agencyId),
    orderBy: [desc(fanPassSeasons.createdAt)],
  });

  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    description: r.description,
    status: r.status,
    startDate: r.startDate.toISOString(),
    endDate: r.endDate.toISOString(),
    vipPriceCents: r.vipPriceCents,
    vipPriceCoins: r.vipPriceCoins,
    maxLevel: r.maxLevel,
    xpPerLevel: r.xpPerLevel,
    creatorId: r.creatorId,
    agencyId: r.agencyId,
    totalParticipants: r.totalParticipants,
    totalVipSubscribers: r.totalVipSubscribers,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  }));
}

export async function createSeason(
  agencyId: string,
  data: SeasonFormData
): Promise<FanPassSeason> {
  const [row] = await db
    .insert(fanPassSeasons)
    .values({
      name: data.name,
      description: data.description,
      status: "draft",
      startDate: new Date(data.startDate),
      endDate: new Date(data.endDate),
      vipPriceCents: data.vipPriceCents,
      vipPriceCoins: data.vipPriceCoins,
      maxLevel: data.maxLevel,
      agencyId,
    })
    .returning();

  // Auto-seed default 7-day login bonus config for this season
  await seedDefaultDayConfig(row.id);

  return {
    ...row,
    startDate: row.startDate.toISOString(),
    endDate: row.endDate.toISOString(),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function updateSeason(
  seasonId: number,
  agencyId: string,
  data: Partial<SeasonFormData>
): Promise<FanPassSeason> {
  await assertAgencyOwnsSeason(seasonId, agencyId);

  const [row] = await db
    .update(fanPassSeasons)
    .set({
      ...(data.name         && { name: data.name }),
      ...(data.description  && { description: data.description }),
      ...(data.startDate    && { startDate: new Date(data.startDate) }),
      ...(data.endDate      && { endDate: new Date(data.endDate) }),
      ...(data.vipPriceCents !== undefined && { vipPriceCents: data.vipPriceCents }),
      ...(data.vipPriceCoins !== undefined && { vipPriceCoins: data.vipPriceCoins }),
      ...(data.maxLevel     && { maxLevel: data.maxLevel }),
      updatedAt: new Date(),
    })
    .where(eq(fanPassSeasons.id, seasonId))
    .returning();

  return {
    ...row,
    startDate: row.startDate.toISOString(),
    endDate: row.endDate.toISOString(),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function updateSeasonStatus(
  seasonId: number,
  agencyId: string,
  status: "draft" | "active" | "ended"
): Promise<void> {
  await assertAgencyOwnsSeason(seasonId, agencyId);

  // Only one season can be active at a time per agency
  if (status === "active") {
    await db
      .update(fanPassSeasons)
      .set({ status: "ended", updatedAt: new Date() })
      .where(
        and(
          eq(fanPassSeasons.agencyId, agencyId),
          eq(fanPassSeasons.status, "active")
        )
      );
  }

  await db
    .update(fanPassSeasons)
    .set({ status, updatedAt: new Date() })
    .where(eq(fanPassSeasons.id, seasonId));
}

export async function deleteSeason(seasonId: number, agencyId: string): Promise<void> {
  const season = await assertAgencyOwnsSeason(seasonId, agencyId);
  if (season.status === "active") throw new Error("CANNOT_DELETE_ACTIVE_SEASON");
  await db.delete(fanPassSeasons).where(eq(fanPassSeasons.id, seasonId));
}

// ═══════════════════════════════════════════════════════════════════════════════
// REWARD TRACK
// ═══════════════════════════════════════════════════════════════════════════════

export async function getSeasonRewards(
  seasonId: number,
  agencyId: string
): Promise<PassRewardItem[]> {
  await assertAgencyOwnsSeason(seasonId, agencyId);

  const rows = await db.query.passRewardTrack.findMany({
    where: eq(passRewardTrack.seasonId, seasonId),
    orderBy: [asc(passRewardTrack.level), asc(passRewardTrack.tier)],
  });

  return rows.map((r) => ({
    id: r.id,
    seasonId: r.seasonId,
    level: r.level,
    tier: r.tier as any,
    icon: r.icon,
    label: r.label,
    description: r.description,
    rewardType: r.rewardType,
    rewardAmount: r.rewardAmount,
    isVipOnly: r.isVipOnly,
    rarity: r.rarity as any,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  }));
}

export async function addReward(
  seasonId: number,
  agencyId: string,
  data: RewardFormData
): Promise<PassRewardItem> {
  await assertAgencyOwnsSeason(seasonId, agencyId);

  const [row] = await db
    .insert(passRewardTrack)
    .values({ seasonId, ...data, rewardType: data.rewardType as any })
    .returning();

  return {
    ...row,
    tier: row.tier as any,
    rarity: row.rarity as any,
    rewardType: row.rewardType,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function updateReward(
  rewardId: number,
  agencyId: string,
  data: Partial<RewardFormData>
): Promise<PassRewardItem> {
  // Verify agency owns the season this reward belongs to
  const existing = await db.query.passRewardTrack.findFirst({
    where: eq(passRewardTrack.id, rewardId),
  });
  if (!existing) throw new Error("REWARD_NOT_FOUND");
  await assertAgencyOwnsSeason(existing.seasonId, agencyId);

  const [row] = await db
    .update(passRewardTrack)
    .set({ ...data, rewardType: data.rewardType as any, updatedAt: new Date() })
    .where(eq(passRewardTrack.id, rewardId))
    .returning();

  return {
    ...row,
    tier: row.tier as any,
    rarity: row.rarity as any,
    rewardType: row.rewardType,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function deleteReward(rewardId: number, agencyId: string): Promise<void> {
  const existing = await db.query.passRewardTrack.findFirst({
    where: eq(passRewardTrack.id, rewardId),
  });
  if (!existing) throw new Error("REWARD_NOT_FOUND");
  await assertAgencyOwnsSeason(existing.seasonId, agencyId);
  await db.delete(passRewardTrack).where(eq(passRewardTrack.id, rewardId));
}

export async function bulkUpsertRewards(
  seasonId: number,
  agencyId: string,
  rewards: RewardFormData[]
): Promise<void> {
  await assertAgencyOwnsSeason(seasonId, agencyId);
  // Delete existing and re-insert — simplest approach for bulk edits
  await db.delete(passRewardTrack).where(eq(passRewardTrack.seasonId, seasonId));
  if (rewards.length > 0) {
    await db.insert(passRewardTrack).values(
      rewards.map((r, i) => ({ ...r, seasonId, rewardType: r.rewardType as any, sortOrder: i }))
    );
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// DAY CONFIG (login bonus slots)
// ═══════════════════════════════════════════════════════════════════════════════

export async function getSeasonDayConfig(
  seasonId: number,
  agencyId: string
): Promise<DayConfigItem[]> {
  await assertAgencyOwnsSeason(seasonId, agencyId);

  const rows = await db.query.loginBonusDayConfig.findMany({
    where: eq(loginBonusDayConfig.seasonId, seasonId),
    orderBy: [asc(loginBonusDayConfig.daySlot)],
  });

  return rows.map((r) => ({
    id: r.id,
    seasonId: r.seasonId,
    daySlot: r.daySlot,
    label: r.label,
    icon: r.icon,
    rewardType: r.rewardType,
    rewardAmount: r.rewardAmount,
    rewardLabel: r.rewardLabel,
    isSpecialDay: r.isSpecialDay,
  }));
}

export async function updateDayConfig(
  seasonId: number,
  agencyId: string,
  daySlot: number,
  data: Partial<{ icon: string; rewardType: string; rewardAmount: number; rewardLabel: string; isSpecialDay: boolean }>
): Promise<void> {
  await assertAgencyOwnsSeason(seasonId, agencyId);
  await db
    .update(loginBonusDayConfig)
    .set({ ...data, rewardType: data.rewardType as any })
    .where(
      and(
        eq(loginBonusDayConfig.seasonId, seasonId),
        eq(loginBonusDayConfig.daySlot, daySlot)
      )
    );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MILESTONES
// ═══════════════════════════════════════════════════════════════════════════════

export async function getSeasonMilestones(
  seasonId: number,
  agencyId: string
): Promise<MilestoneItem[]> {
  await assertAgencyOwnsSeason(seasonId, agencyId);

  const rows = await db.query.loginStreakMilestone.findMany({
    where: eq(loginStreakMilestone.seasonId, seasonId),
    orderBy: [asc(loginStreakMilestone.streakDays)],
  });

  return rows.map((r) => ({
    id: r.id,
    seasonId: r.seasonId,
    streakDays: r.streakDays,
    title: r.title,
    icon: r.icon,
    rewardType: r.rewardType,
    rewardAmount: r.rewardAmount,
    rewardLabel: r.rewardLabel,
  }));
}

export async function upsertMilestone(
  seasonId: number,
  agencyId: string,
  data: Omit<MilestoneItem, "id" | "seasonId">
): Promise<void> {
  await assertAgencyOwnsSeason(seasonId, agencyId);

  const existing = await db.query.loginStreakMilestone.findFirst({
    where: and(
      eq(loginStreakMilestone.seasonId, seasonId),
      eq(loginStreakMilestone.streakDays, data.streakDays)
    ),
  });

  if (existing) {
    await db
      .update(loginStreakMilestone)
      .set({ ...data, rewardType: data.rewardType as any })
      .where(eq(loginStreakMilestone.id, existing.id));
  } else {
    await db
      .insert(loginStreakMilestone)
      .values({ seasonId, ...data, rewardType: data.rewardType as any });
  }
}

export async function deleteMilestone(
  milestoneId: number,
  agencyId: string
): Promise<void> {
  const existing = await db.query.loginStreakMilestone.findFirst({
    where: eq(loginStreakMilestone.id, milestoneId),
  });
  if (!existing) throw new Error("MILESTONE_NOT_FOUND");
  await assertAgencyOwnsSeason(existing.seasonId, agencyId);
  await db
    .delete(loginStreakMilestone)
    .where(eq(loginStreakMilestone.id, milestoneId));
}

// ═══════════════════════════════════════════════════════════════════════════════
// ANALYTICS
// ═══════════════════════════════════════════════════════════════════════════════

export async function getSeasonAnalytics(
  seasonId: number,
  agencyId: string
): Promise<SeasonAnalytics> {
  await assertAgencyOwnsSeason(seasonId, agencyId);

  const [season, streaks] = await Promise.all([
    db.query.fanPassSeasons.findFirst({ where: eq(fanPassSeasons.id, seasonId) }),
    db.query.userLoginStreak.findMany({ where: eq(userLoginStreak.seasonId, seasonId) }),
  ]);

  if (!season) throw new Error("SEASON_NOT_FOUND");

  const total = streaks.length;
  const avgStreak = total > 0 ? streaks.reduce((s, r) => s + r.currentStreak, 0) / total : 0;
  const totalXp = streaks.reduce((s, r) => s + r.totalXpEarned, 0);
  const totalCoins = streaks.reduce((s, r) => s + r.totalCoinsEarned, 0);

  // Simple level calc from XP
  const xpPerLevel = season.xpPerLevel ?? 200;
  const levels = streaks.map((r) => Math.floor(r.totalXpEarned / xpPerLevel) + 1);
  const avgLevel = total > 0 ? levels.reduce((a, b) => a + b, 0) / total : 0;
  const topLevel = levels.length > 0 ? Math.max(...levels) : 0;

  // Level distribution buckets
  const levelBuckets: Record<number, number> = {};
  levels.forEach((l) => {
    const bucket = Math.ceil(l / 5) * 5;
    levelBuckets[bucket] = (levelBuckets[bucket] ?? 0) + 1;
  });
  const levelDistribution = Object.entries(levelBuckets)
    .map(([level, count]) => ({ level: Number(level), count }))
    .sort((a, b) => a.level - b.level);

  // Streak distribution
  const streakBuckets: Record<number, number> = { 1: 0, 3: 0, 7: 0, 14: 0, 30: 0 };
  streaks.forEach((r) => {
    if (r.currentStreak >= 30)     streakBuckets[30]!++;
    else if (r.currentStreak >= 14) streakBuckets[14]!++;
    else if (r.currentStreak >= 7)  streakBuckets[7]!++;
    else if (r.currentStreak >= 3)  streakBuckets[3]!++;
    else                            streakBuckets[1]!++;
  });
  const streakDistribution = Object.entries(streakBuckets).map(([streakDays, count]) => ({
    streakDays: Number(streakDays),
    count,
  }));

  return {
    seasonId,
    totalParticipants: total,
    totalVip: season.totalVipSubscribers,
    vipConversionRate: total > 0 ? (season.totalVipSubscribers / total) * 100 : 0,
    avgLevel: Math.round(avgLevel * 10) / 10,
    avgStreak: Math.round(avgStreak * 10) / 10,
    totalXpDistributed: totalXp,
    totalCoinsDistributed: totalCoins,
    dailyClaimRate: total > 0 ? (streaks.filter((r) => r.currentStreak > 0).length / total) * 100 : 0,
    topLevel,
    levelDistribution,
    streakDistribution,
    revenueEstimateCents: season.totalVipSubscribers * season.vipPriceCents,
  };
}

// ─── Internal: seed default day config for a new season ──────────────────────

async function seedDefaultDayConfig(seasonId: number) {
  await db.insert(loginBonusDayConfig).values([
    { seasonId, daySlot:1, label:"Mon", icon:"⚡", rewardType:"xp"    as any, rewardAmount:25,  rewardLabel:"+25 XP",     isSpecialDay:false },
    { seasonId, daySlot:2, label:"Tue", icon:"⚡", rewardType:"xp"    as any, rewardAmount:25,  rewardLabel:"+25 XP",     isSpecialDay:false },
    { seasonId, daySlot:3, label:"Wed", icon:"🎯", rewardType:"xp"    as any, rewardAmount:50,  rewardLabel:"+50 XP",     isSpecialDay:false },
    { seasonId, daySlot:4, label:"Thu", icon:"⚡", rewardType:"xp"    as any, rewardAmount:25,  rewardLabel:"+25 XP",     isSpecialDay:false },
    { seasonId, daySlot:5, label:"Fri", icon:"🔥", rewardType:"xp"    as any, rewardAmount:75,  rewardLabel:"+75 XP",     isSpecialDay:false },
    { seasonId, daySlot:6, label:"Sat", icon:"💰", rewardType:"coins" as any, rewardAmount:100, rewardLabel:"+100 Coins", isSpecialDay:false },
    { seasonId, daySlot:7, label:"Sun", icon:"💎", rewardType:"xp"    as any, rewardAmount:150, rewardLabel:"+150 XP",    isSpecialDay:true  },
  ]).onConflictDoNothing();

  await db.insert(loginStreakMilestone).values([
    { seasonId, streakDays:3,  title:"3-Day Streak",  icon:"🎁", rewardType:"coins"      as any, rewardAmount:200, rewardLabel:"+200 Coins"    },
    { seasonId, streakDays:7,  title:"7-Day Streak",  icon:"💎", rewardType:"xp"         as any, rewardAmount:500, rewardLabel:"+500 XP"       },
    { seasonId, streakDays:14, title:"14-Day Streak", icon:"👑", rewardType:"badge"       as any, rewardAmount:1,   rewardLabel:"Exclusive Badge"},
    { seasonId, streakDays:30, title:"30-Day Streak", icon:"🌟", rewardType:"mystery_box" as any, rewardAmount:1,   rewardLabel:"Mystery Box"   },
  ]).onConflictDoNothing();
}