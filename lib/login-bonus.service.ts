import { db } from "@/db";
import {
  userLoginStreak,
  loginClaimLog,
  milestoneClaimLog,
  loginBonusDayConfig,
  loginStreakMilestone,
  userInventory,
  shopItems,
} from "@/db/schema";
import { and, eq, inArray, sql } from "drizzle-orm";
import { randomUUID } from "crypto";
import type {
  LoginBonusData,
  ClaimResponse,
  DayReward,
  DayState,
  StreakMilestone,
} from "@/lib/types";

// ─── Constants ────────────────────────────────────────────────────────────────

const VIP_MULTIPLIER = 2;
const CLAIM_WINDOW_MS = 24 * 60 * 60 * 1000;       // 24 hours
const STREAK_GRACE_MS = 36 * 60 * 60 * 1000;        // 36 hours before reset

// ─── Helpers ──────────────────────────────────────────────────────────────────

function msSince(date: Date): number {
  return Date.now() - date.getTime();
}

// ─── Get or create user streak row ───────────────────────────────────────────

async function getOrCreateStreak(userId: string, seasonId: number) {
  const existing = await db.query.userLoginStreak.findFirst({
    where: and(
      eq(userLoginStreak.userId, userId),
      eq(userLoginStreak.seasonId, seasonId)
    ),
  });
  if (existing) return existing;

  const [created] = await db
    .insert(userLoginStreak)
    .values({ userId, seasonId })
    .returning();
  return created;
}

// ─── Build the 7-day reward grid with per-slot state ─────────────────────────

async function buildWeekRewards(
  seasonId: number,
  currentDaySlot: number,
  canClaimToday: boolean
): Promise<DayReward[]> {
  const configs = await db.query.loginBonusDayConfig.findMany({
    where: eq(loginBonusDayConfig.seasonId, seasonId),
    orderBy: (t, { asc }) => [asc(t.daySlot)],
  });

  return configs.map((c) => {
    let state: DayState;
    if (c.daySlot < currentDaySlot) {
      state = "claimed";
    } else if (c.daySlot === currentDaySlot) {
      state = canClaimToday ? "today" : "claimed";
    } else {
      state = "locked";
    }
    return {
      daySlot: c.daySlot,
      label: c.label,
      icon: c.icon,
      rewardType: c.rewardType,
      rewardAmount: c.rewardAmount,
      rewardLabel: c.rewardLabel,
      isSpecialDay: c.isSpecialDay,
      state,
    };
  });
}

// ─── Build milestone list with claimed state ──────────────────────────────────

async function buildMilestones(
  userId: string,
  seasonId: number,
  currentStreak: number
): Promise<StreakMilestone[]> {
  const milestones = await db.query.loginStreakMilestone.findMany({
    where: eq(loginStreakMilestone.seasonId, seasonId),
    orderBy: (t, { asc }) => [asc(t.streakDays)],
  });
  if (!milestones.length) return [];

  const ids = milestones.map((m) => m.id);
  const claimed = await db.query.milestoneClaimLog.findMany({
    where: and(
      eq(milestoneClaimLog.userId, userId),
      inArray(milestoneClaimLog.milestoneId, ids)
    ),
  });
  const claimedSet = new Set(claimed.map((c) => c.milestoneId));

  return milestones.map((m) => ({
    id: m.id,
    streakDays: m.streakDays,
    title: m.title,
    icon: m.icon,
    rewardLabel: m.rewardLabel,
    claimed: claimedSet.has(m.id),
    daysAway: Math.max(0, m.streakDays - currentStreak),
  }));
}

// ─── PUBLIC: Get full bonus state for the UI ──────────────────────────────────

export async function getLoginBonusData(
  userId: string,
  seasonId: number,
  isVip: boolean
): Promise<LoginBonusData> {
  const streak = await getOrCreateStreak(userId, seasonId);

  const lastClaimed = streak.lastClaimedAt;
  const msSinceClaim = lastClaimed ? msSince(lastClaimed) : Infinity;
  const streakBroken = lastClaimed
    ? msSince(lastClaimed) > STREAK_GRACE_MS
    : false;
  const canClaimToday = msSinceClaim >= CLAIM_WINDOW_MS;

  // If streak is broken and no freezes, treat slot as reset
  const effectiveDaySlot =
    streakBroken && streak.streakFreezes === 0 ? 1 : streak.currentDaySlot;
  const effectiveStreak = streakBroken && streak.streakFreezes === 0
    ? 0
    : streak.currentStreak;

  const [weekRewards, milestones, todayConfig] = await Promise.all([
    buildWeekRewards(seasonId, effectiveDaySlot, canClaimToday),
    buildMilestones(userId, seasonId, effectiveStreak),
    db.query.loginBonusDayConfig.findFirst({
      where: and(
        eq(loginBonusDayConfig.seasonId, seasonId),
        eq(loginBonusDayConfig.daySlot, effectiveDaySlot)
      ),
    }),
  ]);

  const todayReward: DayReward = todayConfig
    ? {
        daySlot: todayConfig.daySlot,
        label: todayConfig.label,
        icon: todayConfig.icon,
        rewardType: todayConfig.rewardType,
        rewardAmount: todayConfig.rewardAmount,
        rewardLabel: todayConfig.rewardLabel,
        isSpecialDay: todayConfig.isSpecialDay,
        state: canClaimToday ? "today" : "claimed",
      }
    : {
        daySlot: 1,
        label: "Day 1",
        icon: "⚡",
        rewardType: "xp",
        rewardAmount: 25,
        rewardLabel: "+25 XP",
        isSpecialDay: false,
        state: "today",
      };

  const nextClaimAt = lastClaimed
    ? new Date(lastClaimed.getTime() + CLAIM_WINDOW_MS).toISOString()
    : null;

  return {
    currentStreak: effectiveStreak,
    longestStreak: streak.longestStreak,
    currentDaySlot: effectiveDaySlot,
    lastClaimedAt: lastClaimed?.toISOString() ?? null,
    canClaimToday,
    nextClaimAt,
    streakFreezes: streak.streakFreezes,
    totalXpEarned: streak.totalXpEarned,
    totalCoinsEarned: streak.totalCoinsEarned,
    isVip,
    vipMultiplier: isVip ? VIP_MULTIPLIER : 1,
    todayReward,
    weekRewards,
    milestones,
  };
}

// ─── PUBLIC: Claim today's reward ─────────────────────────────────────────────

export async function claimDailyReward(
  userId: string,
  seasonId: number,
  isVip: boolean
): Promise<ClaimResponse> {
  const streak = await getOrCreateStreak(userId, seasonId);

  const lastClaimed = streak.lastClaimedAt;
  const msSinceClaim = lastClaimed ? msSince(lastClaimed) : Infinity;

  if (msSinceClaim < CLAIM_WINDOW_MS) {
    throw new Error("ALREADY_CLAIMED");
  }

  const streakBroken = lastClaimed
    ? msSince(lastClaimed) > STREAK_GRACE_MS
    : false;

  let newStreak: number;
  let newDaySlot: number;
  let usedFreeze = false;

  if (streakBroken) {
    if (streak.streakFreezes > 0) {
      // Burn a freeze, keep streak alive
      newStreak = streak.currentStreak + 1;
      newDaySlot = streak.currentDaySlot >= 7 ? 1 : streak.currentDaySlot + 1;
      usedFreeze = true;
    } else {
      // Hard reset
      newStreak = 1;
      newDaySlot = 1;
    }
  } else {
    newStreak = streak.currentStreak + 1;
    newDaySlot = streak.currentDaySlot >= 7 ? 1 : streak.currentDaySlot + 1;
  }

  const slotToClaim = streakBroken && !usedFreeze ? 1 : streak.currentDaySlot;

  const dayConfig = await db.query.loginBonusDayConfig.findFirst({
    where: and(
      eq(loginBonusDayConfig.seasonId, seasonId),
      eq(loginBonusDayConfig.daySlot, slotToClaim)
    ),
  });

  const baseAmount = dayConfig?.rewardAmount ?? 25;
  const rewardType = dayConfig?.rewardType ?? "xp";
  const multiplier = isVip ? VIP_MULTIPLIER : 1;
  const finalAmount = baseAmount * multiplier;
  const bonusAmount = finalAmount - baseAmount;

  // Update streak
  await db
    .update(userLoginStreak)
    .set({
      currentStreak: newStreak,
      longestStreak: Math.max(streak.longestStreak, newStreak),
      lastClaimedAt: new Date(),
      currentDaySlot: newDaySlot,
      streakFreezes: usedFreeze ? streak.streakFreezes - 1 : streak.streakFreezes,
      totalXpEarned:
        rewardType === "xp"
          ? streak.totalXpEarned + finalAmount
          : streak.totalXpEarned,
      totalCoinsEarned:
        rewardType === "coins"
          ? streak.totalCoinsEarned + finalAmount
          : streak.totalCoinsEarned,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(userLoginStreak.userId, userId),
        eq(userLoginStreak.seasonId, seasonId)
      )
    );

  // Insert claim log
  await db.insert(loginClaimLog).values({
    userId,
    seasonId,
    daySlot: slotToClaim,
    rewardType: rewardType as any,
    rewardAmount: finalAmount,
    streakAtClaim: newStreak,
    isVip,
    bonusMultiplier: multiplier,
  });

  // ── Add item to inventory for non-currency rewards ──────────────────────────
  // badge, mystery_box, gift, frame, title — all go to userInventory
  const ITEM_REWARD_TYPES = ["badge", "mystery_box", "mystery_box_low", "mystery_box_high",
                              "gift", "frame", "title", "emote", "item"];
  if (ITEM_REWARD_TYPES.includes(rewardType)) {
    try {
      // Look up the shop item by type to get its id
      const shopItem = await db.query.shopItems.findFirst({
        where: (t, { eq }) => eq(t.type, rewardType === "mystery_box" ? "mystery_box" : rewardType),
      });

      if (shopItem) {
        // Check if user already has this item in inventory
        const existing = await db.query.userInventory.findFirst({
          where: (t, { and, eq }) => and(
            eq(t.userId, userId),
            eq(t.itemId, shopItem.id),
          ),
        });

        if (existing) {
          await db.update(userInventory)
            .set({ quantity: sql`${userInventory.quantity} + 1`, updatedAt: new Date() })
            .where(eq(userInventory.id, existing.id));
        } else {
          await db.insert(userInventory).values({
            id:          randomUUID(),
            userId,
            itemId:      shopItem.id,
            quantity:    finalAmount,
            isEquipped:  false,
            source:      "fan_pass",
            purchasedAt: new Date(),
          });
        }
      }
    } catch (e) {
      // Non-fatal — log but don't block the claim response
      console.warn("[login-bonus] Could not add item to inventory:", e);
    }
  }

  // Detect newly unlocked milestones
  const allMilestones = await db.query.loginStreakMilestone.findMany({
    where: eq(loginStreakMilestone.seasonId, seasonId),
  });

  const alreadyClaimedMs = await db.query.milestoneClaimLog.findMany({
    where: and(
      eq(milestoneClaimLog.userId, userId),
      inArray(
        milestoneClaimLog.milestoneId,
        allMilestones.map((m) => m.id)
      )
    ),
  });
  const claimedIds = new Set(alreadyClaimedMs.map((c) => c.milestoneId));

  const newlyUnlocked = allMilestones.filter(
    (m) => m.streakDays <= newStreak && !claimedIds.has(m.id)
  );

  if (newlyUnlocked.length > 0) {
    await db.insert(milestoneClaimLog).values(
      newlyUnlocked.map((m) => ({
        userId,
        milestoneId: m.id,
        seasonId,
      }))
    );
  }

  const updatedStreak = await db.query.userLoginStreak.findFirst({
    where: and(
      eq(userLoginStreak.userId, userId),
      eq(userLoginStreak.seasonId, seasonId)
    ),
  });

  return {
    success: true,
    rewardType,
    rewardAmount: finalAmount,
    bonusAmount,
    newStreak,
    newDaySlot,
    milestonesUnlocked: newlyUnlocked.map((m) => ({
      id: m.id,
      streakDays: m.streakDays,
      title: m.title,
      icon: m.icon,
      rewardLabel: m.rewardLabel,
      claimed: true,
      daysAway: 0,
    })),
    totalXpEarned: updatedStreak?.totalXpEarned ?? 0,
    message: usedFreeze
      ? `Streak freeze used! Your ${newStreak}-day streak is safe 🛡️`
      : `Day ${slotToClaim} claimed! ${newStreak}-day streak! 🔥`,
  };
}

// ─── Seed default config for a new season ────────────────────────────────────

export async function seedDefaultDayConfig(seasonId: number) {
  await db.insert(loginBonusDayConfig).values([
    { seasonId, daySlot: 1, label: "Day 1", icon: "⚡", rewardType: "xp",          rewardAmount: 25,  rewardLabel: "+25 XP",         isSpecialDay: false },
    { seasonId, daySlot: 2, label: "Day 2", icon: "💰", rewardType: "coins",        rewardAmount: 50,  rewardLabel: "+50 Coins",       isSpecialDay: false },
    { seasonId, daySlot: 3, label: "Day 3", icon: "⚡", rewardType: "xp",          rewardAmount: 50,  rewardLabel: "+50 XP",         isSpecialDay: false },
    { seasonId, daySlot: 4, label: "Day 4", icon: "🎁", rewardType: "gift",         rewardAmount: 1,   rewardLabel: "Gift Item",       isSpecialDay: false },
    { seasonId, daySlot: 5, label: "Day 5", icon: "⚡", rewardType: "xp",          rewardAmount: 75,  rewardLabel: "+75 XP",         isSpecialDay: false },
    { seasonId, daySlot: 6, label: "Day 6", icon: "📦", rewardType: "mystery_box",  rewardAmount: 1,   rewardLabel: "Mystery Box",     isSpecialDay: false },
    { seasonId, daySlot: 7, label: "Day 7", icon: "🏅", rewardType: "badge",        rewardAmount: 1,   rewardLabel: "Exclusive Badge", isSpecialDay: true  },
  ]);

  await db.insert(loginStreakMilestone).values([
    { seasonId, streakDays: 3,  title: "3-Day Streak",  icon: "🎁", rewardType: "coins",      rewardAmount: 200, rewardLabel: "+200 Coins"    },
    { seasonId, streakDays: 7,  title: "7-Day Streak",  icon: "💎", rewardType: "xp",         rewardAmount: 500, rewardLabel: "+500 XP"       },
    { seasonId, streakDays: 14, title: "14-Day Streak", icon: "👑", rewardType: "badge",       rewardAmount: 1,   rewardLabel: "Exclusive Badge"},
    { seasonId, streakDays: 30, title: "30-Day Streak", icon: "🌟", rewardType: "mystery_box", rewardAmount: 1,   rewardLabel: "Mystery Box"   },
  ]);
}