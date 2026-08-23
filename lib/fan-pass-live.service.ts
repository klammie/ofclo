/**
 * lib/fan-pass-live.service.ts
 *
 * Replaces fans-pass-mock.ts with real DB queries.
 * All data comes from tables the agency writes to via AgencyFanPassDashboard.
 *
 * Tables used (all exist in your schema):
 *   fanPassSeasons       ← agency creates / activates seasons
 *   passRewardTrack      ← agency configures reward cards
 *   loginBonusDayConfig  ← agency configures daily bonus slots
 *   loginStreakMilestone  ← agency configures streak milestones
 *   userLoginStreak      ← per-user login streak state
 *   userPassRewardClaims ← which reward cards the user has claimed
 *   userSeasonProgress   ← per-user XP + level for the season (if exists)
 */

import { db } from "@/db";
import {
  fanPassSeasons,
  passRewardTrack,
  loginBonusDayConfig,
  loginStreakMilestone,
  userLoginStreak,
  userPassRewardClaims,
  creators,
  user,
  profiles,
} from "@/db/schema";
import { eq, and, asc, desc, sql } from "drizzle-orm";
import { getUserIsFanPassVip } from "@/lib/fanpass-vip-status.service";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface LiveSeason {
  id: number;
  name: string;
  description: string;
  status: string;
  startDate: Date;
  endDate: Date;
  xpPerLevel: number;
  maxLevel: number;
  vipPriceCents: number;
  vipPriceCoins: number;
  totalParticipants: number;
  // Computed
  daysLeft: number;
  totalDays: number;
  progressPct: number;
  // Featured creator — for Overview tab spotlight + VIP discount promo
  featuredCreator: {
    userId:          string;
    name:            string;
    username:        string;
    avatarUrl:       string | null;
    coverUrl:        string | null;
    standardPrice:   number | null; // dollars
    vipDiscountPct:  number;
  } | null;
}

export interface LiveReward {
  id: number;
  level: number;
  tier: "free" | "vip";
  icon: string;
  label: string;
  description: string;
  rewardType: string;
  rewardAmount: number;
  isVipOnly: boolean;
  rarity: string;
  claimed: boolean;
  isAvailable: boolean;
}

export interface LiveDayConfig {
  id: number;
  daySlot: number;
  label: string;
  icon: string;
  rewardType: string;
  rewardAmount: number;
  rewardLabel: string;
  isSpecialDay: boolean;
}

export interface LiveMilestone {
  id: number;
  streakDays: number;
  title: string;
  icon: string;
  rewardType: string;
  rewardAmount: number;
  rewardLabel: string;
  achieved: boolean;      // true if user's streak >= streakDays
}

export interface LiveLeaderboardEntry {
  rank: number;
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  level: number;
  totalXp: number;
  currentStreak: number;
  isVip: boolean;
  isCurrentUser: boolean;
}

// ─── Get active season ────────────────────────────────────────────────────────

export async function getActiveSeason(): Promise<LiveSeason | null> {
  const row = await db.query.fanPassSeasons.findFirst({
    where: eq(fanPassSeasons.status, "active"),
    orderBy: [desc(fanPassSeasons.updatedAt)],
  });

  if (!row) return null;

  const now      = Date.now();
  const start    = row.startDate.getTime();
  const end      = row.endDate.getTime();
  const total    = Math.max(1, Math.round((end - start) / 86_400_000));
  const elapsed  = Math.max(0, Math.round((now - start) / 86_400_000));
  const daysLeft = Math.max(0, Math.round((end - now) / 86_400_000));
  const pct      = Math.min(100, Math.round((elapsed / total) * 100));

  // ── Fetch featured creator profile, if one is set on this season ──────────
  let featuredCreator: LiveSeason["featuredCreator"] = null;
  if (row.featuredCreatorId) {
    const featuredRow = await db
      .select({
        userId:        creators.userId,
        name:          user.name,
        username:      profiles.username,
        avatarUrl:     profiles.avatarUrl,
        coverUrl:      profiles.coverUrl,
        standardPrice: creators.standardPrice, // assumed cents — adjust if your column is decimal dollars
      })
      .from(creators)
      .innerJoin(user, eq(user.id, creators.userId))
      .leftJoin(profiles, eq(profiles.id, creators.userId))
      .where(eq(creators.userId, row.featuredCreatorId))
      .limit(1)
      .then((rows) => rows[0]);

    if (featuredRow) {
      featuredCreator = {
        userId:         featuredRow.userId,
        name:           featuredRow.name,
        username:       featuredRow.username ?? featuredRow.name.toLowerCase().replace(/\s+/g, "_"),
        avatarUrl:      featuredRow.avatarUrl,
        coverUrl:       featuredRow.coverUrl,
        standardPrice:  featuredRow.standardPrice != null ? Number(featuredRow.standardPrice) / 100 : null,
        vipDiscountPct: 20, // TODO: make this configurable per-season if needed
      };
    }
  }

  return {
    id:                row.id,
    name:              row.name,
    description:       row.description,
    status:            row.status,
    startDate:         row.startDate,
    endDate:           row.endDate,
    xpPerLevel:        row.xpPerLevel,
    maxLevel:          row.maxLevel,
    vipPriceCents:     row.vipPriceCents,
    vipPriceCoins:     row.vipPriceCoins,
    totalParticipants: row.totalParticipants,
    daysLeft,
    totalDays:         total,
    progressPct:       pct,
    featuredCreator,
  };
}

// ─── Get live reward track ────────────────────────────────────────────────────
// Returns all rewards the agency configured for the active season,
// with claimed + isAvailable flags set per-user.

export async function getLiveRewardTrack(
  seasonId: number,
  userLevel: number,
  userId: string,
  isVip: boolean
): Promise<LiveReward[]> {
  const [rows, claimedRows] = await Promise.all([
    db.query.passRewardTrack.findMany({
      where: eq(passRewardTrack.seasonId, seasonId),
      orderBy: [asc(passRewardTrack.level), asc(passRewardTrack.tier)],
    }),
    db.query.userPassRewardClaims.findMany({
      where: and(
        eq(userPassRewardClaims.userId, userId),
        eq(userPassRewardClaims.seasonId, seasonId),
      ),
    }),
  ]);

  const claimedIds = new Set(claimedRows.map((c) => c.rewardId));

  return rows.map((r) => ({
    id:           r.id,
    level:        r.level,
    tier:         r.tier as "free" | "vip",
    icon:         r.icon,
    label:        r.label,
    description:  r.description,
    rewardType:   r.rewardType,
    rewardAmount: r.rewardAmount,
    isVipOnly:    r.isVipOnly,
    rarity:       r.rarity,
    claimed:      claimedIds.has(r.id),
    isAvailable:  r.level <= userLevel && (!r.isVipOnly || isVip),
  }));
}

// ─── Get live day config ──────────────────────────────────────────────────────

export async function getLiveDayConfig(seasonId: number): Promise<LiveDayConfig[]> {
  const rows = await db.query.loginBonusDayConfig.findMany({
    where: eq(loginBonusDayConfig.seasonId, seasonId),
    orderBy: [asc(loginBonusDayConfig.daySlot)],
  });

  return rows.map((r) => ({
    id:           r.id,
    daySlot:      r.daySlot,
    label:        r.label,
    icon:         r.icon,
    rewardType:   r.rewardType,
    rewardAmount: r.rewardAmount,
    rewardLabel:  r.rewardLabel,
    isSpecialDay: r.isSpecialDay,
  }));
}

// ─── Get live milestones ──────────────────────────────────────────────────────

export async function getLiveMilestones(
  seasonId: number,
  currentStreak: number
): Promise<LiveMilestone[]> {
  const rows = await db.query.loginStreakMilestone.findMany({
    where: eq(loginStreakMilestone.seasonId, seasonId),
    orderBy: [asc(loginStreakMilestone.streakDays)],
  });

  return rows.map((r) => ({
    id:           r.id,
    streakDays:   r.streakDays,
    title:        r.title,
    icon:         r.icon,
    rewardType:   r.rewardType,
    rewardAmount: r.rewardAmount,
    rewardLabel:  r.rewardLabel,
    achieved:     currentStreak >= r.streakDays,
  }));
}

// ─── Get live leaderboard ─────────────────────────────────────────────────────
// Ranks users by totalXpEarned for the season from userLoginStreak

export async function getLiveLeaderboard(
  seasonId: number,
  currentUserId: string,
  xpPerLevel: number,
  limit = 10
): Promise<LiveLeaderboardEntry[]> {
  const rows = await db
    .select({
      userId:        userLoginStreak.userId,
      totalXp:       userLoginStreak.totalXpEarned,
      currentStreak: userLoginStreak.currentStreak,
    })
    .from(userLoginStreak)
    .where(eq(userLoginStreak.seasonId, seasonId))
    .orderBy(desc(userLoginStreak.totalXpEarned))
    .limit(limit);

  return rows.map((r, i) => ({
    rank:          i + 1,
    userId:        r.userId,
    displayName:   r.userId === currentUserId ? "You" : `User ${r.userId.slice(0, 6)}`,
    avatarUrl:     null,
    level:         Math.floor(r.totalXp / xpPerLevel) + 1,
    totalXp:       r.totalXp,
    currentStreak: r.currentStreak,
    isVip:         false,
    isCurrentUser: r.userId === currentUserId,
  }));
}

// ─── Get full fan pass page data in one call ──────────────────────────────────
// Server-side: call this from the page.tsx to pass everything as props.

export async function getFanPassPageData(userId: string) {
  const season = await getActiveSeason();
  if (!season) return { season: null };

  const streak = await db.query.userLoginStreak.findFirst({
    where: and(
      eq(userLoginStreak.userId, userId),
      eq(userLoginStreak.seasonId, season.id),
    ),
  });

  const passData = {
    currentStreak:   streak?.currentStreak    ?? 0,
    totalXpEarned:   streak?.totalXpEarned    ?? 0,
    totalCoinsEarned:streak?.totalCoinsEarned ?? 0,
    longestStreak:   streak?.longestStreak    ?? 0,
    streakFreezes:   streak?.streakFreezes    ?? 0,
    currentDaySlot:  streak?.currentDaySlot   ?? 1,
  };

  const userLevel = Math.floor(passData.totalXpEarned / season.xpPerLevel) + 1;
  const isVip = await getUserIsFanPassVip(userId, season.id);

  const [rewards, dayConfig, milestones, leaderboard] = await Promise.all([
    getLiveRewardTrack(season.id, userLevel, userId, isVip),
    getLiveDayConfig(season.id),
    getLiveMilestones(season.id, passData.currentStreak),
    getLiveLeaderboard(season.id, userId, season.xpPerLevel),
  ]);

  return {
    season,
    isVip,
    passData,
    rewards,
    dayConfig,
    milestones,
    leaderboard,
  };
}