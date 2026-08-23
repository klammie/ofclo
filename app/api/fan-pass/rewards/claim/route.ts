// app/api/fan-pass/rewards/claim/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/db";
import {
  passRewardTrack,
  userPassRewardClaims,
  userInventory,
  shopItems,
  userCoinBalance,
} from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { randomUUID } from "crypto";
import { getFeaturedRewardMedia } from "@/lib/feature-creator-rewards.service";
import { getUserIsFanPassVip } from "@/lib/fanpass-vip-status.service";

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = session.user.id;
  const body = await req.json().catch(() => ({}));
  const { seasonId, rewardId } = body;

  if (!seasonId || !rewardId) {
    return NextResponse.json({ error: "seasonId and rewardId required" }, { status: 400 });
  }

  try {
    // 1. Look up the reward
    const reward = await db.query.passRewardTrack.findFirst({
      where: eq(passRewardTrack.id, Number(rewardId)),
    });
    if (!reward || reward.seasonId !== Number(seasonId)) {
      return NextResponse.json({ error: "Reward not found" }, { status: 404 });
    }

    // 2. Check not already claimed
    const existingClaim = await db.query.userPassRewardClaims.findFirst({
      where: and(
        eq(userPassRewardClaims.userId,   userId),
        eq(userPassRewardClaims.rewardId, reward.id),
      ),
    });
    if (existingClaim) {
      return NextResponse.json({ error: "Reward already claimed" }, { status: 409 });
    }

    // 3. VIP check
    const isVip = await getUserIsFanPassVip(userId, Number(seasonId));
    if (reward.isVipOnly && !isVip) {
      return NextResponse.json({ error: "This reward is exclusive to VIP Pass members" }, { status: 403 });
    }

    // 4. Record the claim
    await db.insert(userPassRewardClaims).values({
      userId,
      seasonId:  Number(seasonId),
      rewardId:  reward.id,
      claimedAt: new Date(),
    });

    // 5. Apply the reward
    let inventoryAdded = false;
    let featuredMedia: {
      postId: string;
      mediaUrl: string | null;
      mediaType: string | null;
      thumbnailUrl: string | null;
      caption: string | null;
    } | null = null;

    if (reward.rewardType === "exclusive_content") {
      // Handled via featured creator media pool — not an inventory item
      featuredMedia = await getFeaturedRewardMedia(userId, Number(seasonId), reward.id, isVip);

    } else if (reward.rewardType === "badge" || reward.rewardType === "mystery_box") {
      // badge rewards in the seed have reward_amount=0, default to 1
      const quantity = reward.rewardAmount > 0 ? reward.rewardAmount : 1;

      let shopItem = null;

      if (reward.rewardType === "badge") {
        const label = (reward.label ?? "").toLowerCase();
        const badgeId =
          label.includes("epic")      ? "badge_crown"   :
          label.includes("rare")      ? "badge_flame"   :
          label.includes("legendary") ? "badge_diamond" :
          label.includes("diamond")   ? "badge_diamond" :
          label.includes("crown")     ? "badge_crown"   :
          "badge_star";

        shopItem = await db.query.shopItems.findFirst({
          where: (t, { eq }) => eq(t.id, badgeId),
        });
      } else {
        // mystery_box — pick by label
        const label = (reward.label ?? "").toLowerCase();
        const boxId =
          label.includes("premium") ? "mystery_box_premium"      :
          label.includes("creator") ? "mystery_box_creator"      :
          label.includes("high")    ? "mystery_box_premium"      :
          label.includes("gift")    ? "mystery_box_gifts_badges" :
          label.includes("power")   ? "mystery_box_boosters"     :
          "mystery_box_std";

        shopItem = await db.query.shopItems.findFirst({
          where: (t, { eq }) => eq(t.id, boxId),
        });
      }

      // Final fallback — first item of this type
      if (!shopItem) {
        shopItem = await db.query.shopItems.findFirst({
          where: (t, { eq }) => eq(t.type, reward.rewardType),
        });
      }

      if (shopItem) {
        const existingInv = await db.query.userInventory.findFirst({
          where: (t, { and, eq }) => and(
            eq(t.userId, userId),
            eq(t.itemId, shopItem!.id),
          ),
        });

        if (existingInv) {
          await db.update(userInventory)
            .set({ quantity: sql`${userInventory.quantity} + ${quantity}`, updatedAt: new Date() })
            .where(eq(userInventory.id, existingInv.id));
        } else {
          await db.insert(userInventory).values({
            id:          randomUUID(),
            userId,
            itemId:      shopItem.id,
            quantity,
            isEquipped:  false,
            source:      "fan_pass",
            purchasedAt: new Date(),
          });
        }
        inventoryAdded = true;
        console.log(`[claim] ✅ Added ${quantity}x ${shopItem.id} to inventory for user ${userId}`);
      } else {
        console.error(`[claim] ❌ No shop item found for type="${reward.rewardType}" label="${reward.label}"`);
      }

    } else if (reward.rewardType === "coins") {
      const existing = await db.query.userCoinBalance.findFirst({
        where: eq(userCoinBalance.userId, userId),
      });
      if (existing) {
        await db.update(userCoinBalance)
          .set({ balance: sql`${userCoinBalance.balance} + ${reward.rewardAmount}`, updatedAt: new Date() })
          .where(eq(userCoinBalance.userId, userId));
      } else {
        await db.insert(userCoinBalance).values({
          userId,
          balance:   reward.rewardAmount,
          updatedAt: new Date(),
        });
      }

    } else if (reward.rewardType === "streak_freeze") {
      const quantity = reward.rewardAmount > 0 ? reward.rewardAmount : 1;
      const shopItem = await db.query.shopItems.findFirst({
        where: (t, { eq }) => eq(t.id, "streak_freeze_x1"),
      });

      if (shopItem) {
        const existingInv = await db.query.userInventory.findFirst({
          where: (t, { and, eq }) => and(
            eq(t.userId, userId),
            eq(t.itemId, shopItem.id),
          ),
        });

        if (existingInv) {
          await db.update(userInventory)
            .set({ quantity: sql`${userInventory.quantity} + ${quantity}`, updatedAt: new Date() })
            .where(eq(userInventory.id, existingInv.id));
        } else {
          await db.insert(userInventory).values({
            id:          randomUUID(),
            userId,
            itemId:      shopItem.id,
            quantity,
            isEquipped:  false,
            source:      "fan_pass",
            purchasedAt: new Date(),
          });
        }
        inventoryAdded = true;
      }

    } else if (reward.rewardType === "xp") {
      // Wire to your XP/status system — left as no-op until schema is confirmed
      console.log(`[claim] XP reward: +${reward.rewardAmount} XP for user ${userId}`);
    }

    console.log(`[claim] user=${userId} reward=${reward.id} type=${reward.rewardType} amount=${reward.rewardAmount}`);

    return NextResponse.json({
      success: true,
      reward: {
        id:           reward.id,
        label:        reward.label,
        icon:         reward.icon,
        rewardType:   reward.rewardType,
        rewardAmount: reward.rewardAmount,
      },
      addedToInventory: inventoryAdded,
      featuredMedia,
    });

  } catch (e: any) {
    console.error("[fan-pass/rewards/claim] ERROR:", e?.message ?? e);
    return NextResponse.json({ error: "Failed to claim reward", detail: e?.message }, { status: 500 });
  }
}