// app/api/gifts/post/[postId]/route.ts
// GET — returns all gifts sent to a specific post, grouped by item
// so the overlay shows "3× 💛 Golden Heart" instead of 3 separate entries.

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { postGifts } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  const { postId } = await params;
  if (!postId) return NextResponse.json({ error: "postId required" }, { status: 400 });

  try {
    const rows = await db
      .select()
      .from(postGifts)
      .where(eq(postGifts.postId, postId))
      .orderBy(desc(postGifts.sentAt));

    // Group by itemId so we can show count per gift type
    const grouped: Record<string, {
      itemId:  string;
      icon:    string;
      name:    string;
      rarity:  string;
      count:   number;
      senders: string[];
    }> = {};

    for (const row of rows) {
      if (!grouped[row.itemId]) {
        grouped[row.itemId] = {
          itemId:  row.itemId,
          icon:    row.icon,
          name:    row.name,
          rarity:  row.rarity,
          count:   0,
          senders: [],
        };
      }
      grouped[row.itemId].count++;
      if (!grouped[row.itemId].senders.includes(row.senderId)) {
        grouped[row.itemId].senders.push(row.senderId);
      }
    }

    return NextResponse.json({
      postId,
      totalGifts: rows.length,
      gifts: Object.values(grouped).sort((a, b) => b.count - a.count),
    });

  } catch (e: any) {
    console.error("[GET /api/gifts/post]", e?.message);
    return NextResponse.json({ error: "Failed to load gifts" }, { status: 500 });
  }
}