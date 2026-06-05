import { db } from "@/db";
import {
  userInventory,
  shopPurchaseLog,
  userCoinBalance,
  shopItems,
} from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { randomUUID } from "crypto";
import {
  MYSTERY_BOXES,
  REWARD_POOLS,
  RARITY_RATES,
  type MysteryBoxType,
  type RewardItem,
  type Rarity,
} from "@/lib/types";

// ─── Roll a rarity tier ───────────────────────────────────────────────────────
// Uses the configured drop rates: 60% common, 26% rare, 12% epic, 2% legendary

export function rollRarity(): Rarity {
  const roll = Math.random(); // 0.0 – 1.0
  if (roll < RARITY_RATES.legendary)                           return "legendary"; // 0–0.02
  if (roll < RARITY_RATES.legendary + RARITY_RATES.epic)      return "epic";       // 0.02–0.14
  if (roll < RARITY_RATES.legendary + RARITY_RATES.epic + RARITY_RATES.rare) return "rare"; // 0.14–0.40
  return "common";                                                                  // 0.40–1.0
}

// ─── Roll a reward from a pool ────────────────────────────────────────────────

export function rollReward(boxType: MysteryBoxType): RewardItem {
  const rarity = rollRarity();
  const pool   = REWARD_POOLS[boxType][rarity];

  if (!pool || pool.length === 0) {
    // Safety fallback: if a pool is empty, drop to common
    const fallback = REWARD_POOLS[boxType].common;
    return fallback[Math.floor(Math.random() * fallback.length)];
  }

  return pool[Math.floor(Math.random() * pool.length)];
}

// ─── Open a mystery box ───────────────────────────────────────────────────────
// 1. Deduct coins
// 2. Roll the reward
// 3. Apply the reward (add to inventory / add coins / add to streak freezes)
// 4. Log the purchase

export async function openMysteryBox(userId: string, boxType: MysteryBoxType): Promise<{
  success:  boolean;
  reward:   RewardItem;
  newCoinBalance: number;
}> {
  const boxDef = MYSTERY_BOXES.find((b) => b.id === boxType);
  if (!boxDef) throw new Error("INVALID_BOX");

  // ── Check coin balance ─────────────────────────────────────────────────────
  const balanceRow = await db.query.userCoinBalance.findFirst({
    where: eq(userCoinBalance.userId, userId),
  });
  const currentBalance = balanceRow?.balance ?? 0;

  if (currentBalance < boxDef.coinPrice) {
    throw new Error("INSUFFICIENT_COINS");
  }

  // ── Roll the reward ────────────────────────────────────────────────────────
  const reward = rollReward(boxType);

  // ── Deduct coins atomically ────────────────────────────────────────────────
  await db
    .insert(userCoinBalance)
    .values({
      userId,
      balance:         currentBalance - boxDef.coinPrice,
      lifetimeEarned:  0,
      lifetimeSpent:   boxDef.coinPrice,
    })
    .onConflictDoUpdate({
      target: userCoinBalance.userId,
      set: {
        balance:       sql`${userCoinBalance.balance} - ${boxDef.coinPrice}`,
        lifetimeSpent: sql`${userCoinBalance.lifetimeSpent} + ${boxDef.coinPrice}`,
        updatedAt:     new Date(),
      },
    });

  const newBalance = currentBalance - boxDef.coinPrice;

  // ── Apply reward ───────────────────────────────────────────────────────────

  if (reward.rewardType === "coins" && reward.rewardAmount) {
    // Credit coins back
    await db
      .update(userCoinBalance)
      .set({
        balance:       sql`${userCoinBalance.balance} + ${reward.rewardAmount}`,
        lifetimeEarned: sql`${userCoinBalance.lifetimeEarned} + ${reward.rewardAmount}`,
        updatedAt:     new Date(),
      })
      .where(eq(userCoinBalance.userId, userId));
  } else {
    // Add item to inventory (badges, emotes, titles, frames, boosters, freezes, gifts)
    const existingItem = await db.query.userInventory.findFirst({
      where: (t, { and }) => and(
        eq(t.userId, userId),
        eq(t.itemId, reward.id),
      ),
    });

    if (existingItem) {
      // Stack quantity for consumables (freezes, boosters)
      const stackable = ["streak_freeze", "booster_xp", "booster_coin", "gift", "mystery_box"].includes(reward.rewardType);
      if (stackable) {
        await db
          .update(userInventory)
          .set({ quantity: sql`${userInventory.quantity} + 1` })
          .where(eq(userInventory.id, existingItem.id));
      }
      // Non-stackable items (badges, frames, titles, emotes) — user already has it, nothing to do
    } else {
      await db.insert(userInventory).values({
        userId,
        itemId:   reward.id,
        quantity: reward.rewardAmount ?? 1,
        purchasedAt: new Date(),
        // For boosters, set active-until if you want immediate activation:
        // boosterActiveUntil: reward.rewardType === "booster_xp"
        //   ? new Date(Date.now() + (reward.boosterDurationHours ?? 1) * 3600000)
        //   : undefined,
      });
    }
  }

  // ── Log purchase ───────────────────────────────────────────────────────────
  await db.insert(shopPurchaseLog).values({
    userId,
    itemId:             `mystery_box_${boxType}`,
    currency:           "coins",
    coinAmount:         boxDef.coinPrice,
    coinsAfterPurchase: newBalance,
    purchasedAt:        new Date(),
  });

  return {
    success:        true,
    reward,
    newCoinBalance: newBalance + (reward.rewardType === "coins" ? (reward.rewardAmount ?? 0) : 0),
  };
}

// ─── Seed mystery box shop items ──────────────────────────────────────────────
// Run once: npx tsx --env-file=.env.local scripts/seed-mystery-boxes.ts

export async function seedMysteryBoxShopItems() {
  const items = MYSTERY_BOXES.map((box) => ({
    id:               `mystery_box_${box.id}`,
    name:             box.name,
    description:      box.description,
    icon:             box.icon,
    type:             "mystery_box" as const,
    category:         "mystery_boxes",
    rarity:           "epic" as const,
    coinPrice:        box.coinPrice,
    realPriceCents:   null,
    isCoinsOnly:      true,
    isRealMoneyOnly:  false,
    isFeatured:       true,
    isLimitedTime:    false,
    isActive:         true,
    sortOrder:        MYSTERY_BOXES.indexOf(box),
  }));

  await db.insert(shopItems).values(items).onConflictDoNothing();
  console.log(`Seeded ${items.length} mystery box shop items ✓`);
}

// ─── Seed all reward items into shop_items (for inventory display) ─────────────

export async function seedAllRewardItems() {
  const { REWARD_POOLS } = await import("@/lib/types");

  const allItems: any[] = [];
  for (const boxType of Object.keys(REWARD_POOLS)) {
    const pool = REWARD_POOLS[boxType as MysteryBoxType];
    for (const rarity of Object.keys(pool) as Rarity[]) {
      for (const item of pool[rarity]) {
        allItems.push({
          id:             item.id,
          name:           item.name,
          description:    item.description,
          icon:           item.icon,
          type:           item.type,
          category:       item.rewardType,
          rarity:         item.rarity,
          coinPrice:      0,           // not purchasable directly
          isCoinsOnly:    true,
          isRealMoneyOnly: false,
          isFeatured:     false,
          isLimitedTime:  false,
          isActive:       false,       // not listed in shop, only awarded via boxes
          sortOrder:      0,
        });
      }
    }
  }

  // Deduplicate by id
  const unique = Array.from(new Map(allItems.map((i) => [i.id, i])).values());
  await db.insert(shopItems).values(unique).onConflictDoNothing();
  console.log(`Seeded ${unique.length} reward items ✓`);
}