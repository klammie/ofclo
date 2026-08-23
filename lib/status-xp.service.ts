// lib/status-xp.service.ts
// ─────────────────────────────────────────────────────────────────────────────
// Central service for the user's overall status XP (Explorer/Supporter/
// Fanatic/Presidential tier). The user's total status XP is ALWAYS the SUM
// of every row in statusXpLog for that user — never a column you update
// directly. This means any feature that wants to contribute to status just
// calls grantStatusXp() and the total updates automatically everywhere.
//
// Already-wired sources (from earlier steps):
//   - Fan Pass quest completion  → quest-progress.service.ts → applyQuestReward()
//   - Fan Pass level-up          → NEW: call grantStatusXp() on level-up detection
//   - Daily login bonus claim    → NEW: wire into login-bonus.service.ts
//   - Gifts sent                 → NEW: wire into gifts/send route
// ─────────────────────────────────────────────────────────────────────────────

import { db } from "@/db";
import { statusXpLog } from "@/db/schema";
import { eq, sql } from "drizzle-orm";

export type XpSource =
  | "fan_pass_quest"
  | "fan_pass_levelup"
  | "login_bonus"
  | "milestone"
  | "gift_sent"
  | "subscription"
  | "admin_grant";

// ─── Grant status XP — call this from ANY feature that should move the needle ─
export async function grantStatusXp(
  userId: string,
  amount: number,
  source: XpSource,
  sourceRef?: string,
  note?: string
): Promise<void> {
  if (amount <= 0) return;
  try {
    await db.insert(statusXpLog).values({
      userId,
      amount,
      source,
      sourceRef: sourceRef ?? null,
      note:      note ?? null,
    });
  } catch (e: any) {
    // Never let XP logging break the calling feature
    console.warn("[grantStatusXp] non-fatal error:", e?.message ?? e);
  }
}

// ─── Get a user's current total status XP ─────────────────────────────────────
export async function getUserStatusXp(userId: string): Promise<number> {
  try {
    const [result] = await db
      .select({ total: sql<number>`COALESCE(SUM(${statusXpLog.amount}), 0)` })
      .from(statusXpLog)
      .where(eq(statusXpLog.userId, userId));
    return Number(result?.total ?? 0);
  } catch (e: any) {
    console.warn("[getUserStatusXp] error, returning 0:", e?.message ?? e);
    return 0;
  }
}

// ─── Get XP breakdown by source — useful for a "where did my XP come from" view ─
export async function getUserStatusXpBreakdown(userId: string): Promise<Record<string, number>> {
  try {
    const rows = await db
      .select({
        source: statusXpLog.source,
        total:  sql<number>`COALESCE(SUM(${statusXpLog.amount}), 0)`,
      })
      .from(statusXpLog)
      .where(eq(statusXpLog.userId, userId))
      .groupBy(statusXpLog.source);

    const breakdown: Record<string, number> = {};
    for (const row of rows) breakdown[row.source] = Number(row.total);
    return breakdown;
  } catch {
    return {};
  }
}