import { db } from "@/db";
import {
  shopItems,
  userInventory,
  shopPurchaseLog,
  userCoinBalance,
} from "@/db/schema";
import { and, eq, sql } from "drizzle-orm";
import type { ShopItem, PurchaseResponse } from "@/types/shop";

// ─── Get or create coin balance ───────────────────────────────────────────────

export async function getUserCoinBalance(userId: string): Promise<number> {
  const row = await db.query.userCoinBalance.findFirst({
    where: eq(userCoinBalance.userId, userId),
  });
  if (row) return row.balance;

  // Seed from userLoginStreak coins if exists
  const streak = await db.query.userLoginStreak?.findFirst({
    where: eq((await import("@/db/schema")).userLoginStreak.userId, userId),
  });
  const initial = streak?.totalCoinsEarned ?? 0;

  await db.insert(userCoinBalance).values({
    userId,
    balance: initial,
    lifetimeEarned: initial,
    lifetimeSpent: 0,
  }).onConflictDoNothing();

  return initial;
}

// ─── Get user inventory map { itemId → quantity } ─────────────────────────────

export async function getUserInventory(userId: string): Promise<Map<string, number>> {
  const rows = await db.query.userInventory.findMany({
    where: eq(userInventory.userId, userId),
  });
  return new Map(rows.map((r) => [r.itemId, r.quantity]));
}

// ─── Get all active shop items ────────────────────────────────────────────────

export async function getShopItems(userId: string): Promise<ShopItem[]> {
  const [items, inventory, balance] = await Promise.all([
    db.query.shopItems.findMany({
      where: eq(shopItems.isActive, true),
      orderBy: (t, { asc, desc }) => [desc(t.isFeatured), asc(t.sortOrder)],
    }),
    getUserInventory(userId),
    getUserCoinBalance(userId),
  ]);

  return items.map((item) => ({
    id: item.id,
    name: item.name,
    description: item.description,
    icon: item.icon,
    type: item.type as any,
    category: item.category as any,
    rarity: item.rarity as any,
    coinPrice: item.coinPrice,
    realPrice: item.realPriceCents ?? undefined,
    isCoinsOnly: item.isCoinsOnly,
    isRealMoneyOnly: item.isRealMoneyOnly,
    isFeatured: item.isFeatured,
    isLimitedTime: item.isLimitedTime,
    expiresAt: item.expiresAt?.toISOString(),
    stock: item.stock ?? undefined,
    boosterMultiplier: item.boosterMultiplier ?? undefined,
    boosterDurationHours: item.boosterDurationHours ?? undefined,
    owned: inventory.has(item.id),
    quantity: inventory.get(item.id) ?? 0,
  }));
}

// ─── Purchase with coins ──────────────────────────────────────────────────────

export async function purchaseWithCoins(
  userId: string,
  itemId: string
): Promise<PurchaseResponse> {
  // Fetch item
  const item = await db.query.shopItems.findFirst({
    where: and(eq(shopItems.id, itemId), eq(shopItems.isActive, true)),
  });
  if (!item) throw new Error("ITEM_NOT_FOUND");
  if (item.isRealMoneyOnly) throw new Error("ITEM_NOT_FOUND");

  // Check stock
  if (item.stock !== null && item.stock <= 0) throw new Error("OUT_OF_STOCK");

  // Check balance
  const balance = await getUserCoinBalance(userId);
  if (balance < item.coinPrice) throw new Error("INSUFFICIENT_COINS");

  // Check already owned (for non-stackable items)
  const nonStackable: string[] = ["badge", "vip_pass", "emote"];
  if (nonStackable.includes(item.type)) {
    const existing = await db.query.userInventory.findFirst({
      where: and(eq(userInventory.userId, userId), eq(userInventory.itemId, itemId)),
    });
    if (existing) throw new Error("ALREADY_OWNED");
  }

  const newBalance = balance - item.coinPrice;

  // ── All checks passed — perform writes ────────────────────────────────────

  // 1. Deduct coins
  await db
    .insert(userCoinBalance)
    .values({ userId, balance: newBalance, lifetimeEarned: 0, lifetimeSpent: item.coinPrice })
    .onConflictDoUpdate({
      target: userCoinBalance.userId,
      set: {
        balance: sql`${userCoinBalance.balance} - ${item.coinPrice}`,
        lifetimeSpent: sql`${userCoinBalance.lifetimeSpent} + ${item.coinPrice}`,
        updatedAt: new Date(),
      },
    });

  // 2. Add to inventory (upsert quantity for stackable items)
  const existingInv = await db.query.userInventory.findFirst({
    where: and(eq(userInventory.userId, userId), eq(userInventory.itemId, itemId)),
  });

  if (existingInv) {
    await db
      .update(userInventory)
      .set({ quantity: existingInv.quantity + 1 })
      .where(and(eq(userInventory.userId, userId), eq(userInventory.itemId, itemId)));
  } else {
    // For boosters, set active until time
    const boosterActiveUntil =
      item.type === "booster_xp" || item.type === "booster_coin"
        ? new Date(Date.now() + (item.boosterDurationHours ?? 24) * 60 * 60 * 1000)
        : undefined;

    await db.insert(userInventory).values({
      userId,
      itemId,
      quantity: 1,
      boosterActiveUntil,
    });
  }

  // 3. Decrement stock if limited
  if (item.stock !== null) {
    await db
      .update(shopItems)
      .set({ stock: item.stock - 1 })
      .where(eq(shopItems.id, itemId));
  }

  // 4. Log purchase
  await db.insert(shopPurchaseLog).values({
    userId,
    itemId,
    currency: "coins",
    coinAmount: item.coinPrice,
    coinsAfterPurchase: newBalance,
  });

  return {
    success: true,
    item: {
      id: item.id,
      name: item.name,
      description: item.description,
      icon: item.icon,
      type: item.type as any,
      category: item.category as any,
      rarity: item.rarity as any,
      coinPrice: item.coinPrice,
      isCoinsOnly: item.isCoinsOnly,
      isRealMoneyOnly: item.isRealMoneyOnly,
      isFeatured: item.isFeatured,
      isLimitedTime: item.isLimitedTime,
      owned: true,
      quantity: (existingInv?.quantity ?? 0) + 1,
    },
    newCoinBalance: newBalance,
    message: `${item.name} purchased! ${item.coinPrice} coins spent.`,
  };
}

// ─── Seed default shop catalog ────────────────────────────────────────────────

export async function seedShopItems() {
  const items = [
    // ── Featured ──────────────────────────────────────────────────────────────
    {
      id: "vip_pass_monthly", name: "VIP Fan Pass", category: "vip",
      description: "Unlock the full VIP reward track, 2× XP on all tasks and exclusive perks for 30 days.",
      icon: "💎", type: "vip_pass", rarity: "legendary",
      coinPrice: 5000, isCoinsOnly: false, isRealMoneyOnly: false,
      realPriceCents: 999, isFeatured: true, isLimitedTime: false, sortOrder: 0,
    },
    // ── Boosters ──────────────────────────────────────────────────────────────
    {
      id: "booster_xp_2x_24h", name: "2× XP Booster", category: "boosters",
      description: "Double all XP earned from tasks and logins for 24 hours.",
      icon: "⚡", type: "booster_xp", rarity: "rare",
      coinPrice: 300, isCoinsOnly: true, isRealMoneyOnly: false,
      isFeatured: true, isLimitedTime: false,
      boosterMultiplier: 2, boosterDurationHours: 24, sortOrder: 1,
    },
    {
      id: "booster_xp_3x_12h", name: "3× XP Booster", category: "boosters",
      description: "Triple your XP gains for a 12-hour power session.",
      icon: "🚀", type: "booster_xp", rarity: "epic",
      coinPrice: 600, isCoinsOnly: true, isRealMoneyOnly: false,
      isFeatured: false, isLimitedTime: false,
      boosterMultiplier: 3, boosterDurationHours: 12, sortOrder: 2,
    },
    {
      id: "booster_coin_2x_24h", name: "2× Coin Booster", category: "boosters",
      description: "Earn double coins from every action for 24 hours.",
      icon: "💰", type: "booster_coin", rarity: "rare",
      coinPrice: 250, isCoinsOnly: true, isRealMoneyOnly: false,
      isFeatured: false, isLimitedTime: false,
      boosterMultiplier: 2, boosterDurationHours: 24, sortOrder: 3,
    },
    // ── Streak Freezes ────────────────────────────────────────────────────────
    {
      id: "streak_freeze_x1", name: "Streak Freeze", category: "freezes",
      description: "Protect your login streak for one missed day.",
      icon: "🛡️", type: "streak_freeze", rarity: "common",
      coinPrice: 150, isCoinsOnly: true, isRealMoneyOnly: false,
      isFeatured: false, isLimitedTime: false, sortOrder: 4,
    },
    {
      id: "streak_freeze_x3", name: "Streak Freeze × 3", category: "freezes",
      description: "Bundle of 3 streak freezes — stock up and never lose your streak.",
      icon: "🧊", type: "streak_freeze", rarity: "rare",
      coinPrice: 400, isCoinsOnly: true, isRealMoneyOnly: false,
      isFeatured: false, isLimitedTime: false, sortOrder: 5,
    },
    // ── Badges ────────────────────────────────────────────────────────────────
    {
      id: "badge_flame", name: "Flame Badge", category: "badges",
      description: "Show off your fire — a permanent flame badge on your profile.",
      icon: "🔥", type: "badge", rarity: "rare",
      coinPrice: 500, isCoinsOnly: true, isRealMoneyOnly: false,
      isFeatured: false, isLimitedTime: false, sortOrder: 6,
    },
    {
      id: "badge_crown", name: "Crown Badge", category: "badges",
      description: "The royalty badge. Reserved for true top fans.",
      icon: "👑", type: "badge", rarity: "epic",
      coinPrice: 1200, isCoinsOnly: true, isRealMoneyOnly: false,
      isFeatured: false, isLimitedTime: false, sortOrder: 7,
    },
    {
      id: "badge_diamond", name: "Diamond Badge", category: "badges",
      description: "Ultra rare. Only the most dedicated fans can afford this.",
      icon: "💎", type: "badge", rarity: "legendary",
      coinPrice: 3000, isCoinsOnly: true, isRealMoneyOnly: false,
      isFeatured: false, isLimitedTime: false, sortOrder: 8,
    },
    {
      id: "badge_star", name: "Star Badge", category: "badges",
      description: "A shining star badge for your profile.",
      icon: "⭐", type: "badge", rarity: "common",
      coinPrice: 200, isCoinsOnly: true, isRealMoneyOnly: false,
      isFeatured: false, isLimitedTime: false, sortOrder: 9,
    },
    // ── Gifts ─────────────────────────────────────────────────────────────────
    {
      id: "gift_rose", name: "Rose Gift", category: "gifts",
      description: "Send a rose to your favourite creator.",
      icon: "🌹", type: "gift", rarity: "common",
      coinPrice: 50, isCoinsOnly: true, isRealMoneyOnly: false,
      isFeatured: false, isLimitedTime: false, sortOrder: 10,
    },
    {
      id: "gift_heart", name: "Golden Heart Gift", category: "gifts",
      description: "Send a glowing golden heart. They'll know you care.",
      icon: "💛", type: "gift", rarity: "rare",
      coinPrice: 200, isCoinsOnly: true, isRealMoneyOnly: false,
      isFeatured: false, isLimitedTime: false, sortOrder: 11,
    },
    {
      id: "gift_trophy", name: "Trophy Gift", category: "gifts",
      description: "Gift a creator the ultimate fan trophy.",
      icon: "🏆", type: "gift", rarity: "epic",
      coinPrice: 800, isCoinsOnly: true, isRealMoneyOnly: false,
      isFeatured: false, isLimitedTime: false, sortOrder: 12,
    },
    // ── Mystery Box ───────────────────────────────────────────────────────────
    {
      id: "mystery_box_std", name: "Mystery Box", category: "all",
      description: "A surprise reward — could be coins, a badge, booster or something rare.",
      icon: "🎁", type: "mystery_box", rarity: "rare",
      coinPrice: 350, isCoinsOnly: true, isRealMoneyOnly: false,
      isFeatured: true, isLimitedTime: false, sortOrder: 13,
    },
    {
      id: "mystery_box_premium", name: "Premium Mystery Box", category: "all",
      description: "Guaranteed rare or above. Could contain VIP pass or legendary badge.",
      icon: "✨", type: "mystery_box", rarity: "legendary",
      coinPrice: 1500, isCoinsOnly: true, isRealMoneyOnly: false,
      isFeatured: false, isLimitedTime: true, sortOrder: 14,
    },
  ];

  await db.insert(shopItems).values(items as any).onConflictDoNothing();
  console.log(`Seeded ${items.length} shop items ✓`);
}