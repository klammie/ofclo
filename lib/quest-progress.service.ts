// lib/quest-progress.service.ts
// ─────────────────────────────────────────────────────────────────────────────
// Central quest-progress tracker. Call recordQuestAction() from any route where
// a user performs an action that might count toward an active daily quest
// (like, comment, gift, subscribe, bookmark, share, login, view).
//
// Usage in your existing routes — add ONE line after the action succeeds:
//
//   import { recordQuestAction } from "@/lib/quest-progress.service";
//   await recordQuestAction(session.user.id, "like_post").catch(() => {});
//
// It's intentionally fire-and-forget safe (wrap in .catch in the caller, or
// it already no-ops internally on any error) so it NEVER blocks or breaks
// the primary action (the like/comment/gift itself) if anything goes wrong.
// ─────────────────────────────────────────────────────────────────────────────

import { db } from "@/db";
import {
  seasonTasks,
  userQuestProgress,
  passRewardTrack,
  userInventory,
  shopItems,
  userCoinBalance,
  fanPassSeasons,
} from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { randomUUID } from "crypto";
import { grantStatusXp } from "@/lib/status-xp.service";

// Maps a quest's free-text title/description to an action type.
// Since your seasonTasks schema doesn't have a dedicated actionType column yet,
// we infer it from keywords in the title. This is intentionally simple and
// can be swapped for a real actionType column later without changing callers.
function inferActionType(title: string): string | null {
  const t = title.toLowerCase();
  if (t.includes("like"))       return "like_post";
  if (t.includes("comment"))    return "comment_post";
  if (t.includes("gift"))       return "send_gift";
  if (t.includes("subscribe"))  return "subscribe";
  if (t.includes("bookmark"))   return "bookmark_post";
  if (t.includes("share"))      return "share_post";
  if (t.includes("login") || t.includes("log in")) return "login";
  if (t.includes("view") || t.includes("watch"))   return "view_post";
  if (t.includes("message"))    return "send_message";   // ← add
  if (t.includes("mystery box") || t.includes("open"))  return "open_mystery_box"; // ← add
  if (t.includes("purchase"))   return "shop_purchase";  // ← add
  if (t.includes("visit") || t.includes("profile"))     return "view_profile";     // ← add
  if (t.includes("streak"))     return "login";           // ← add
  return null;
}

// Extracts a numeric target from the task title, e.g. "Like 3 posts" → 3.
// Defaults to 1 if no number is found ("Send a gift" → 1).
function inferTarget(title: string): number {
  const match = title.match(/\d+/);
  return match ? parseInt(match[0], 10) : 1;
}

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

// ─── Apply a reward once a quest is completed ──────────────────────────────────
async function applyQuestReward(userId: string, task: { id: number; xpReward: number; coinReward: number; seasonId: number }) {
  // 1. Credit coins directly
  if (task.coinReward > 0) {
    const existing = await db.query.userCoinBalance.findFirst({
      where: eq(userCoinBalance.userId, userId),
    });
    if (existing) {
      await db.update(userCoinBalance)
        .set({ balance: sql`${userCoinBalance.balance} + ${task.coinReward}`, updatedAt: new Date() })
        .where(eq(userCoinBalance.userId, userId));
    } else {
      await db.insert(userCoinBalance).values({
        userId, balance: task.coinReward, updatedAt: new Date(),
      });
    }
  }

  // 2. Credit XP to the status XP log — this is what feeds the user's
  //    overall Explorer/Supporter/Fanatic/Presidential tier
  if (task.xpReward > 0) {
    await grantStatusXp(userId, task.xpReward, "fan_pass_quest", String(task.id), "Daily quest completed");
  }
}

// ─── Main entry point — call this after any trackable user action ────────────
export async function recordQuestAction(userId: string, actionType: string): Promise<{ completed: string[] }> {
  const completed: string[] = [];

  try {
    // Find the user's active season (adjust this query if you support
    // multiple concurrent seasons per agency/creator)
    const activeSeason = await db.query.fanPassSeasons.findFirst({
      where: eq(fanPassSeasons.status, "active"),
    });
    if (!activeSeason) return { completed };

    // Get today's rotated task pool for this season — reuse the same
    // deterministic logic as the tasks route so progress matches what's shown
    const allTasks = await db
      .select()
      .from(seasonTasks)
      .where(eq(seasonTasks.seasonId, activeSeason.id));

    // Filter to tasks matching this action type
    const matchingTasks = allTasks.filter((t) => inferActionType(t.title) === actionType);
    if (matchingTasks.length === 0) return { completed };

    const reset = todayKey();

    for (const task of matchingTasks) {
      const target = inferTarget(task.title);

      // Find or create progress row for (user, task, today)
      let progress = await db.query.userQuestProgress.findFirst({
        where: and(
          eq(userQuestProgress.userId, userId),
          eq(userQuestProgress.taskId, task.id),
          eq(userQuestProgress.resetKey, reset),
        ),
      });

      if (!progress) {
        const [inserted] = await db.insert(userQuestProgress).values({
          userId,
          seasonId:   activeSeason.id,
          taskId:     task.id,
          actionType: actionType as any,
          current:    0,
          target,
          isCompleted: false,
          resetKey:    reset,
        }).returning();
        progress = inserted;
      }

      if (progress.isCompleted) continue; // already done today

      const newCurrent = progress.current + 1;
      const isNowComplete = newCurrent >= progress.target;

      await db.update(userQuestProgress)
        .set({
          current:     newCurrent,
          isCompleted: isNowComplete,
          completedAt: isNowComplete ? new Date() : null,
          updatedAt:   new Date(),
        })
        .where(eq(userQuestProgress.id, progress.id));

      if (isNowComplete) {
        await applyQuestReward(userId, {
          id:         task.id,
          xpReward:   task.xpReward,
          coinReward: task.coinReward,
          seasonId:   activeSeason.id,
        });
        completed.push(task.title);
      }
    }
  } catch (e: any) {
    // Never let quest tracking break the primary action
    console.warn("[recordQuestAction] non-fatal error:", e?.message ?? e);
  }

  return { completed };
}