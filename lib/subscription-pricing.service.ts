// lib/subscription-pricing.service.ts
// ─────────────────────────────────────────────────────────────────────────────
// Computes the actual price a user pays to subscribe to a creator, applying
// the Fan Pass VIP discount when the target creator is the active season's
// featured creator AND the subscribing user has Fan Pass VIP status.
// ─────────────────────────────────────────────────────────────────────────────

import { db } from "@/db";
import { creators, fanPassSeasons, fanPassVipMembers } from "@/db/schema";
import { eq, and } from "drizzle-orm";

interface PricingResult {
  basePrice:       number;       // dollars, before any discount
  finalPrice:       number;      // dollars, after discount (same as basePrice if none applied)
  discountApplied:  boolean;
  discountPct:      number;
  discountReason:   string | null;
}

// Replace with your real Fan Pass VIP membership check.
// This assumes a fanPassVipMembers table (userId, seasonId) — adjust to match
// however you actually track VIP Fan Pass purchases.
async function getUserIsFanPassVip(userId: string, seasonId: number): Promise<boolean> {
  try {
    const row = await db.query.fanPassVipMembers.findFirst({
      where: and(
        eq(fanPassVipMembers.userId,   userId),
        eq(fanPassVipMembers.seasonId, seasonId),
      ),
    });
    return !!row;
  } catch {
    return false;
  }
}

export async function getSubscriptionPrice(
  userId: string,
  creatorId: string,
  tier: "standard" | "vip"
): Promise<PricingResult> {

  // 1. Get the creator's base price for the requested tier
  const creator = await db.query.creators.findFirst({
    where: eq(creators.id, creatorId),
  });
  if (!creator) throw new Error("Creator not found");

  const basePriceCents = tier === "vip" ? creator.vipPrice : creator.standardPrice;
  const basePrice = basePriceCents != null ? Number(basePriceCents) / 100 : 0;

  // 2. Check if this creator is the active season's featured creator
  const activeSeason = await db.query.fanPassSeasons.findFirst({
    where: eq(fanPassSeasons.status, "active"),
  });

  const isFeaturedCreator = activeSeason?.featuredCreatorId === creator.userId;

  if (!isFeaturedCreator || !activeSeason) {
    return {
      basePrice,
      finalPrice: basePrice,
      discountApplied: false,
      discountPct: 0,
      discountReason: null,
    };
  }

  // 3. Check if the subscribing user has Fan Pass VIP
  const isFanPassVip = await getUserIsFanPassVip(userId, activeSeason.id);
  if (!isFanPassVip) {
    return {
      basePrice,
      finalPrice: basePrice,
      discountApplied: false,
      discountPct: 0,
      discountReason: null,
    };
  }

  // 4. Apply the VIP discount — same 20% used in the Overview tab preview
  const DISCOUNT_PCT = 20;
  const finalPrice = Math.round(basePrice * (1 - DISCOUNT_PCT / 100) * 100) / 100;

  return {
    basePrice,
    finalPrice,
    discountApplied: true,
    discountPct: DISCOUNT_PCT,
    discountReason: `Fan Pass VIP discount on ${activeSeason.featuredCreatorName ?? "featured creator"}`,
  };
}