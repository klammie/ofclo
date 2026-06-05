import { db } from "@/db";
import {
  seasonTasks,
  userWeeklyTasks,
  userSeasonProgress,
  rewardClaims,
  seasonXpResetLog,
  fanPassSeasons,
  passRewardTrack,
  userCoinBalance,
} from "@/db/schema";
import { eq, and, gte, lte, sql, inArray, desc } from "drizzle-orm";
import type {
  WeeklyTaskBundle,
  AssignedTask,
  RewardWindow,
  WindowedReward,
  UserSeasonProgress as UserSeasonProgressType,
} from "@/lib/types";

// ─── Week boundaries (Mon 00:00 UTC → Sun 23:59 UTC) ─────────────────────────

function getWeekBounds(date = new Date()): { start: Date; end: Date } {
  const d = new Date(date);
  const day = d.getUTCDay(); // 0=Sun, 1=Mon…
  const diff = day === 0 ? -6 : 1 - day; // Monday offset
  const start = new Date(d);
  start.setUTCDate(d.getUTCDate() + diff);
  start.setUTCHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setUTCDate(start.getUTCDate() + 6);
  end.setUTCHours(23, 59, 59, 999);
  return { start, end };
}

// ─── Get or create user season progress ──────────────────────────────────────

export async function getOrCreateSeasonProgress(userId: string, seasonId: number) {
  const existing = await db.query.userSeasonProgress.findFirst({
    where: and(eq(userSeasonProgress.userId, userId), eq(userSeasonProgress.seasonId, seasonId)),
  });
  if (existing) return existing;

  const [created] = await db.insert(userSeasonProgress)
    .values({ userId, seasonId })
    .returning();
  return created;
}

// ─── Get active season ────────────────────────────────────────────────────────

export async function getActiveSeason() {
  return db.query.fanPassSeasons.findFirst({
    where: eq(fanPassSeasons.status, "active"),
  });
}

// ─── Get weekly task bundle for a user ───────────────────────────────────────
//
// Logic:
// 1. Check if user already has tasks assigned for this week → return them
// 2. Otherwise: pick 1 random free task + 1 random premium task, add the streak default
// 3. Premium users see all 3; free users see the free task + streak (premium task greyed out)

export async function getWeeklyTasks(userId: string, seasonId: number, isVip: boolean): Promise<WeeklyTaskBundle> {
  const { start: weekStart, end: weekEnd } = getWeekBounds();

  // Check existing assignment for this week
  let assignment = await db.query.userWeeklyTasks.findFirst({
    where: and(
      eq(userWeeklyTasks.userId, userId),
      eq(userWeeklyTasks.seasonId, seasonId),
      eq(userWeeklyTasks.weekStartDate, weekStart),
    ),
  });

  // If no assignment yet, create one
  if (!assignment) {
    // Fetch all active weekly tasks for this season
    const allTasks = await db.query.seasonTasks.findMany({
      where: and(
        eq(seasonTasks.seasonId, seasonId),
        eq(seasonTasks.type, "weekly"),
        eq(seasonTasks.isActive, true),
      ),
    });

    const freeTasks    = allTasks.filter((t) => t.tier === "free");
    const premiumTasks = allTasks.filter((t) => t.tier === "premium");

    // Fisher-Yates pick 1 from each pool
    const pickRandom = <T>(arr: T[]): T | null =>
      arr.length ? arr[Math.floor(Math.random() * arr.length)] : null;

    const pickedFree    = pickRandom(freeTasks);
    const pickedPremium = pickRandom(premiumTasks) ?? pickRandom(freeTasks); // fallback if no premium tasks

    const assignedIds = [pickedFree?.id, pickedPremium?.id].filter(Boolean) as number[];

    const [created] = await db.insert(userWeeklyTasks).values({
      userId,
      seasonId,
      weekStartDate:   weekStart,
      weekEndDate:     weekEnd,
      assignedTaskIds: JSON.stringify(assignedIds),
      completionState: JSON.stringify({}),
    }).returning();
    assignment = created;
  }

  // Fetch the assigned tasks
  const assignedIds: number[] = JSON.parse(assignment.assignedTaskIds);
  const completionState: Record<string, string | null> = JSON.parse(assignment.completionState);

  const taskRows = assignedIds.length > 0
    ? await db.query.seasonTasks.findMany({ where: inArray(seasonTasks.id, assignedIds) })
    : [];

  // Fetch the streak task (always task 3 — type="streak")
  const streakTask = await db.query.seasonTasks.findFirst({
    where: and(eq(seasonTasks.seasonId, seasonId), eq(seasonTasks.type, "streak"), eq(seasonTasks.isActive, true)),
  });

  const tasks: AssignedTask[] = [];

  // Task 1: free weekly task
  const freeTask = taskRows.find((t) => t.tier === "free");
  if (freeTask) {
    tasks.push({
      id:            freeTask.id,
      taskId:        freeTask.id,
      title:         freeTask.title,
      description:   freeTask.description,
      icon:          freeTask.icon,
      xpReward:      freeTask.xpReward,
      coinReward:    freeTask.coinReward,
      tier:          "free",
      type:          "weekly",
      isCompleted:   !!completionState[String(freeTask.id)],
      completedAt:   completionState[String(freeTask.id)] ?? null,
      isDefault:     false,
      progress:      completionState[String(freeTask.id)] ? 100 : 0,
      progressLabel: completionState[String(freeTask.id)] ? "Done!" : "0%",
    });
  }

  // Task 2: premium weekly task (visible to all, completable only by VIP)
  const premiumTask = taskRows.find((t) => t.tier === "premium");
  if (premiumTask) {
    tasks.push({
      id:            premiumTask.id,
      taskId:        premiumTask.id,
      title:         premiumTask.title,
      description:   premiumTask.description,
      icon:          premiumTask.icon,
      xpReward:      premiumTask.xpReward,
      coinReward:    premiumTask.coinReward,
      tier:          "premium",
      type:          "weekly",
      isCompleted:   isVip ? !!completionState[String(premiumTask.id)] : false,
      completedAt:   isVip ? (completionState[String(premiumTask.id)] ?? null) : null,
      isDefault:     false,
      progress:      isVip && completionState[String(premiumTask.id)] ? 100 : 0,
      progressLabel: isVip ? (completionState[String(premiumTask.id)] ? "Done!" : "0%") : "VIP Only",
    });
  }

  // Task 3: 7-day login streak (always shown, free + premium)
  const streakProgress = assignment.streakProgress ?? 0;
  tasks.push({
    id:            streakTask?.id ?? -1,
    taskId:        streakTask?.id ?? -1,
    title:         "7-Day Login Streak",
    description:   "Log in every day for 7 days straight to earn bonus XP",
    icon:          "🔥",
    xpReward:      streakTask?.xpReward ?? 200,
    coinReward:    streakTask?.coinReward ?? 100,
    tier:          "free",
    type:          "streak",
    isCompleted:   assignment.streakCompleted,
    completedAt:   assignment.streakCompleted ? assignment.updatedAt.toISOString() : null,
    isDefault:     true,
    progress:      Math.round((streakProgress / 7) * 100),
    progressLabel: `${streakProgress}/7 days`,
  });

  return {
    tasks,
    weekStartDate: weekStart.toISOString(),
    weekEndDate:   weekEnd.toISOString(),
  };
}

// ─── Complete a task ──────────────────────────────────────────────────────────

export async function completeTask(userId: string, seasonId: number, taskId: number): Promise<{ xpGained: number; coinGained: number }> {
  const { start: weekStart } = getWeekBounds();
  const assignment = await db.query.userWeeklyTasks.findFirst({
    where: and(
      eq(userWeeklyTasks.userId, userId),
      eq(userWeeklyTasks.seasonId, seasonId),
      eq(userWeeklyTasks.weekStartDate, weekStart),
    ),
  });
  if (!assignment) throw new Error("NO_ASSIGNMENT");

  const completionState: Record<string, string | null> = JSON.parse(assignment.completionState);
  if (completionState[String(taskId)]) throw new Error("ALREADY_COMPLETED");

  completionState[String(taskId)] = new Date().toISOString();

  await db.update(userWeeklyTasks)
    .set({ completionState: JSON.stringify(completionState), updatedAt: new Date() })
    .where(eq(userWeeklyTasks.id, assignment.id));

  // Get task details for XP/coin reward
  const task = await db.query.seasonTasks.findFirst({ where: eq(seasonTasks.id, taskId) });
  const xp   = task?.xpReward  ?? 50;
  const coin = task?.coinReward ?? 0;

  // Award XP
  await awardXp(userId, seasonId, xp);

  // Award coins
  if (coin > 0) {
    await db.update(userCoinBalance)
      .set({
        balance:       sql`${userCoinBalance.balance} + ${coin}`,
        lifetimeEarned: sql`${userCoinBalance.lifetimeEarned} + ${coin}`,
        updatedAt:     new Date(),
      })
      .where(eq(userCoinBalance.userId, userId));
  }

  return { xpGained: xp, coinGained: coin };
}

// ─── Award XP + level up ──────────────────────────────────────────────────────

export async function awardXp(userId: string, seasonId: number, xp: number): Promise<{ newLevel: number; leveledUp: boolean }> {
  const progress = await getOrCreateSeasonProgress(userId, seasonId);
  const season   = await db.query.fanPassSeasons.findFirst({ where: eq(fanPassSeasons.id, seasonId) });
  const xpPerLevel = season?.xpPerLevel ?? 200;
  const maxLevel   = season?.maxLevel   ?? 100;

  const newTotalXp = progress.totalXp + xp;
  const newLevel   = Math.min(Math.floor(newTotalXp / xpPerLevel) + 1, maxLevel);
  const leveledUp  = newLevel > progress.level;

  await db.update(userSeasonProgress)
    .set({ totalXp: newTotalXp, level: newLevel, updatedAt: new Date() })
    .where(and(eq(userSeasonProgress.userId, userId), eq(userSeasonProgress.seasonId, seasonId)));

  return { newLevel, leveledUp };
}

// ─── Get windowed reward track ────────────────────────────────────────────────
// Only returns the 2 past, 1 current, 2 upcoming milestones (5 total)

export async function getRewardWindow(userId: string, seasonId: number): Promise<RewardWindow> {
  const progress = await getOrCreateSeasonProgress(userId, seasonId);
  const season   = await db.query.fanPassSeasons.findFirst({ where: eq(fanPassSeasons.id, seasonId) });
  const xpPerLevel = season?.xpPerLevel ?? 200;
  const currentLevel = progress.level;

  // Fetch levels: [currentLevel-2 … currentLevel+2]
  const minLevel = Math.max(1, currentLevel - 2);
  const maxLevel = currentLevel + 2;

  const allRewards = await db.query.passRewardTrack.findMany({
    where: and(
      eq(passRewardTrack.seasonId, seasonId),
    ),
    orderBy: (t, { asc }) => [asc(t.level)],
  });

  // Filter to window
  const windowRewards = allRewards.filter((r) => r.level >= minLevel && r.level <= maxLevel);

  // Get claimed reward IDs
  const claimed = await db.query.rewardClaims.findMany({
    where: and(eq(rewardClaims.userId, userId), eq(rewardClaims.seasonId, seasonId)),
  });
  const claimedIds = new Set(claimed.map((c) => c.rewardId));

  // XP within current level
  const xpIntoCurrentLevel = progress.totalXp - ((currentLevel - 1) * xpPerLevel);
  const progressPercent    = Math.min(Math.round((xpIntoCurrentLevel / xpPerLevel) * 100), 100);

  const rewards: WindowedReward[] = windowRewards.map((r) => ({
    reward: {
      id:           r.id,
      seasonId:     r.seasonId,
      level:        r.level,
      tier:         r.tier as "free" | "vip",
      icon:         r.icon,
      label:        r.label,
      description:  r.description,
      rewardType:   r.rewardType as any,
      rewardAmount: r.rewardAmount,
      isVipOnly:    r.isVipOnly,
      rarity:       r.rarity as any,
      sortOrder:    r.sortOrder,
    },
    state:     r.level < currentLevel ? "past" : r.level === currentLevel ? "current" : "upcoming",
    isClaimed: claimedIds.has(r.id),
  }));

  return {
    rewards,
    userLevel:       currentLevel,
    userXp:          progress.totalXp,
    xpToNextLevel:   xpPerLevel - xpIntoCurrentLevel,
    progressPercent,
  };
}

// ─── Claim a reward ───────────────────────────────────────────────────────────

export async function claimReward(userId: string, seasonId: number, rewardId: number): Promise<void> {
  // Check not already claimed
  const existing = await db.query.rewardClaims.findFirst({
    where: and(eq(rewardClaims.userId, userId), eq(rewardClaims.rewardId, rewardId)),
  });
  if (existing) throw new Error("ALREADY_CLAIMED");

  // Check user has reached the level
  const reward   = await db.query.passRewardTrack.findFirst({ where: eq(passRewardTrack.id, rewardId) });
  const progress = await getOrCreateSeasonProgress(userId, seasonId);
  if (!reward || progress.level < reward.level) throw new Error("NOT_REACHED");

  await db.insert(rewardClaims).values({ userId, seasonId, rewardId });

  // Grant the reward (coins only for now — extend for other types)
  if (reward.rewardType === "coins") {
    await db.update(userCoinBalance)
      .set({
        balance:       sql`${userCoinBalance.balance} + ${reward.rewardAmount}`,
        lifetimeEarned: sql`${userCoinBalance.lifetimeEarned} + ${reward.rewardAmount}`,
        updatedAt:     new Date(),
      })
      .where(eq(userCoinBalance.userId, userId));
  }
}

// ─── XP Reset (call when a season ends) ──────────────────────────────────────
// Snapshots final XP/level into finalXp/finalLevel then zeroes out totalXp + level

export async function resetSeasonXp(seasonId: number): Promise<number> {
  // Snapshot all users' final XP before reset
  await db.execute(sql`
    UPDATE user_season_progress
    SET
      final_xp    = total_xp,
      final_level = level,
      total_xp    = 0,
      level       = 1,
      reset_at    = NOW(),
      updated_at  = NOW()
    WHERE season_id = ${seasonId}
      AND reset_at IS NULL
  `);

  // Count affected rows
  const [{ count }] = await db.execute(sql`
    SELECT COUNT(*)::int AS count
    FROM user_season_progress
    WHERE season_id = ${seasonId}
      AND reset_at IS NOT NULL
  `);

  const affected = count as number;

  // Log the reset
  await db.insert(seasonXpResetLog).values({
    seasonId,
    affectedUsers: affected,
  });

  return affected;
}

// ─── Update streak progress (call on daily login claim) ──────────────────────

export async function updateStreakTask(userId: string, seasonId: number, newStreak: number): Promise<void> {
  const { start: weekStart } = getWeekBounds();

  const assignment = await db.query.userWeeklyTasks.findFirst({
    where: and(
      eq(userWeeklyTasks.userId, userId),
      eq(userWeeklyTasks.seasonId, seasonId),
      eq(userWeeklyTasks.weekStartDate, weekStart),
    ),
  });
  if (!assignment) return;

  const clampedStreak = Math.min(newStreak, 7);
  const completed     = clampedStreak >= 7 && !assignment.streakCompleted;

  await db.update(userWeeklyTasks)
    .set({
      streakProgress:  clampedStreak,
      streakCompleted: clampedStreak >= 7,
      updatedAt:       new Date(),
    })
    .where(eq(userWeeklyTasks.id, assignment.id));

  if (completed) {
    // Award streak task XP + coins
    const streakTask = await db.query.seasonTasks.findFirst({
      where: and(eq(seasonTasks.seasonId, seasonId), eq(seasonTasks.type, "streak")),
    });
    await awardXp(userId, seasonId, streakTask?.xpReward ?? 200);
    if ((streakTask?.coinReward ?? 0) > 0) {
      await db.update(userCoinBalance)
        .set({
          balance:       sql`${userCoinBalance.balance} + ${streakTask!.coinReward}`,
          lifetimeEarned: sql`${userCoinBalance.lifetimeEarned} + ${streakTask!.coinReward}`,
          updatedAt:     new Date(),
        })
        .where(eq(userCoinBalance.userId, userId));
    }
  }
}