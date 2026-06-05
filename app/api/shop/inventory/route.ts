// app/api/shop/inventory/route.ts
// GET — returns all items in the current user's inventory
// joined with shop_items for display metadata

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/db";
import { userInventory, shopItems } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const rows = await db
      .select({
        // inventory row
        inventoryId:  userInventory.id,
        quantity:     userInventory.quantity,
        acquiredAt:   userInventory.purchasedAt,
        isEquipped:   userInventory.isEquipped,
        source:       userInventory.source,          // "purchased" | "mystery_box" | "fan_pass" | "quest"
        // item metadata from shop_items
        itemId:       shopItems.id,
        name:         shopItems.name,
        description:  shopItems.description,
        icon:         shopItems.icon,
        rarity:       shopItems.rarity,
        type:         shopItems.type,
        coinPrice:    shopItems.coinPrice,
        boosterMultiplier:    shopItems.boosterMultiplier,
        boosterDurationHours: shopItems.boosterDurationHours,
        boosterActiveUntil:   userInventory.boosterActiveUntil,
      })
      .from(userInventory)
      .innerJoin(shopItems, eq(shopItems.id, userInventory.itemId))
      .where(eq(userInventory.userId, session.user.id))
      .orderBy(desc(userInventory.purchasedAt));

    return NextResponse.json({ items: rows });
  } catch (e: any) {
    console.error("[GET /api/shop/inventory]", e?.message ?? e);
    return NextResponse.json({ error: "Failed to load inventory" }, { status: 500 });
  }
}

// POST — equip/unequip an item (for badges, frames, titles)
export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { inventoryId, equip } = await req.json().catch(() => ({}));
  if (inventoryId === undefined) {
    return NextResponse.json({ error: "inventoryId required" }, { status: 400 });
  }

  try {
    // Verify ownership
    const item = await db.query.userInventory.findFirst({
      where: (t, { and, eq }) => and(
        eq(t.id,     inventoryId),
        eq(t.userId, session.user.id),
      ),
    });
    if (!item) return NextResponse.json({ error: "Item not found" }, { status: 404 });

    await db
      .update(userInventory)
      .set({ isEquipped: equip, updatedAt: new Date() })
      .where(eq(userInventory.id, inventoryId));

    return NextResponse.json({ success: true, isEquipped: equip });
  } catch (e: any) {
    console.error("[POST /api/shop/inventory]", e?.message ?? e);
    return NextResponse.json({ error: "Failed to update item" }, { status: 500 });
  }
}