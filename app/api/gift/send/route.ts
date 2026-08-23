// app/api/gift/send/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/db";
import { userInventory, shopItems, postGifts, notifications } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { randomUUID } from "crypto";
import { recordQuestAction } from "@/lib/quest-progress.service";
import { grantStatusXp } from "@/lib/status-xp.service";

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const senderId = session.user.id;
  const body = await req.json().catch(() => ({}));
  console.log("[gift/send] received body:", body);
  const { inventoryId, recipientId, postId } = body;
  console.log("[gift/send] parsed:", { inventoryId, recipientId, postId, types: { inventoryId: typeof inventoryId, recipientId: typeof recipientId } });
   

  if (!inventoryId || !recipientId) {
    return NextResponse.json({ error: "inventoryId and recipientId required" }, { status: 400 });
  }
  if (recipientId === senderId) {
    return NextResponse.json({ error: "You can't gift yourself" }, { status: 400 });
  }
  if (!postId) {
    return NextResponse.json({ error: "postId is required to attach gift to a post" }, { status: 400 });
  }

  try {
    // ── 1. Look up inventory row ───────────────────────────────────────────────
    // inventoryId is always the serial integer PK from user_inventory.id
    // The frontend sends gift.inventoryId which comes from the API's inventoryId field
    const invRow = await db.query.userInventory.findFirst({
      where: and(
        eq(userInventory.id,     Number(inventoryId)),
        eq(userInventory.userId, senderId),
      ),
    });

    if (!invRow) {
      return NextResponse.json({ error: "Gift not found in your inventory" }, { status: 404 });
    }
    if (invRow.quantity < 1) {
      return NextResponse.json({ error: "You're out of this gift" }, { status: 400 });
    }

    // ── 2. Verify it's actually a gift type ────────────────────────────────────
    const shopItem = await db.query.shopItems.findFirst({
      where: eq(shopItems.id, invRow.itemId),
    });
    if (!shopItem || shopItem.type !== "gift") {
      return NextResponse.json({ error: "This item is not a gift" }, { status: 400 });
    }

    // ── 3. One-use enforcement — decrement or delete ───────────────────────────
    if (invRow.quantity <= 1) {
      await db.delete(userInventory)
        .where(eq(userInventory.id, invRow.id));
    } else {
      await db.update(userInventory)
        .set({
          quantity:  sql`${userInventory.quantity} - 1`,
          updatedAt: new Date(),
        })
        .where(eq(userInventory.id, invRow.id));
    }

    // ── 4. Record the gift on the post ─────────────────────────────────────────
    await db.insert(postGifts).values({
      postId,
      senderId,
      recipientId,
      itemId:  shopItem.id,
      icon:    shopItem.icon,
      name:    shopItem.name,
      rarity:  shopItem.rarity,
      sentAt:  new Date(),
    });

    // ── 5. Notify the creator ──────────────────────────────────────────────────
    await db.insert(notifications).values({
      id:          randomUUID(),
      userId:      recipientId,
      type:        "gift_received" as any,
      priority:    "medium" as any,
      title:       `You received a ${shopItem.name}!`,
      body:        `Someone sent you a ${shopItem.icon} ${shopItem.name} on your post.`,
      icon:        shopItem.icon,
      actionUrl:   `/posts/${postId}`,
      actorId:     senderId,
      entityId:    String(postId),
      isRead:      false,
      createdAt:   new Date(),
    }).catch(() => {}); // non-fatal — don't fail the gift if notification insert fails

    // ── 6. Quest + XP ─────────────────────────────────────────────────────────
    await recordQuestAction(senderId, "send_gift").catch(() => {});
    await grantStatusXp(senderId, 10, "gift_sent", invRow.itemId, `Sent a gift: ${shopItem.name}`).catch(() => {});

    console.log(`[gifts/send] ${senderId} sent "${shopItem.name}" to ${recipientId} on post ${postId}`);

    return NextResponse.json({
      success:          true,
      remainingQuantity: Math.max(0, invRow.quantity - 1),
      gift: {
        itemId: invRow.itemId,
        name:   shopItem.name,
        icon:   shopItem.icon,
        rarity: shopItem.rarity,
      },
    });

  } catch (e: any) {
    console.error("[POST /api/gifts/send] ERROR:", e?.message ?? e);
    return NextResponse.json({ error: "Failed to send gift", detail: e?.message }, { status: 500 });
  }
}