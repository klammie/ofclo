// lib/fanpass-vip-status.service.ts
// ─────────────────────────────────────────────────────────────────────────────
// Single source of truth for "is this user a Fan Pass VIP member for this
// season?" Every placeholder built in Steps 3, 5, and 9 calls this instead
// of returning a hardcoded false.
// ─────────────────────────────────────────────────────────────────────────────

import { db } from "@/db";
import { fanPassVipMembers } from "@/db/schema";
import { eq, and, gt, isNull, or } from "drizzle-orm";

export async function getUserIsFanPassVip(userId: string, seasonId: number): Promise<boolean> {
  try {
    const row = await db.query.fanPassVipMembers.findFirst({
      where: and(
        eq(fanPassVipMembers.userId,   userId),
        eq(fanPassVipMembers.seasonId, seasonId),
        // Valid if expiresAt is null (lasts until season ends) OR still in the future
        or(
          isNull(fanPassVipMembers.expiresAt),
          gt(fanPassVipMembers.expiresAt, new Date()),
        ),
      ),
    });
    return !!row;
  } catch (e: any) {
    console.warn("[getUserIsFanPassVip] error, defaulting to false:", e?.message ?? e);
    return false;
  }
}

// ─── Grant VIP status — call this from your payment success webhook/handler ──
export async function grantFanPassVip(
  userId: string,
  seasonId: number,
  paymentRef?: string,
  expiresAt?: Date | null
): Promise<void> {
  try {
    const existing = await db.query.fanPassVipMembers.findFirst({
      where: and(
        eq(fanPassVipMembers.userId,   userId),
        eq(fanPassVipMembers.seasonId, seasonId),
      ),
    });
    if (existing) return; // already VIP, idempotent

    await db.insert(fanPassVipMembers).values({
      userId,
      seasonId,
      paymentRef: paymentRef ?? null,
      expiresAt:  expiresAt ?? null,
    });
  } catch (e: any) {
    console.error("[grantFanPassVip] error:", e?.message ?? e);
    throw e; // this one should NOT fail silently — it's a paid purchase
  }
}