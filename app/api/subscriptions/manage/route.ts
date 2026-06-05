// app/api/subscriptions/manage/route.ts
// GET — returns full subscription detail including live unread count and renewal date.
// Called by the manage modal when it opens.

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/db";
import { subscriptions, messages, creators, profiles, user } from "@/db/schema";
import { and, eq, count, sql } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const subscriptionId   = searchParams.get("subscriptionId");
  if (!subscriptionId)   return NextResponse.json({ error: "subscriptionId required" }, { status: 400 });

  try {
    // Fetch sub with creator info
    const [row] = await db
      .select({
        subId:           subscriptions.id,
        status:          subscriptions.status,
        tier:            subscriptions.tier,
        nextBillingDate: subscriptions.nextBillingDate,
        cancelledAt:     subscriptions.cancelledAt,
        createdAt:       subscriptions.createdAt,
        creatorId:       subscriptions.creatorId,
        // Creator info
        creatorUserId:   creators.userId,
        creatorName:     user.name,
        username:        profiles.username,
        avatarUrl:       profiles.avatarUrl,
        standardPrice:   creators.standardPrice,
        vipPrice:        creators.vipPrice,
      })
      .from(subscriptions)
      .innerJoin(creators,  eq(creators.id,      subscriptions.creatorId))
      .innerJoin(user,      eq(user.id,           creators.userId))
      .leftJoin(profiles,   eq(profiles.id,       creators.userId))
      .where(
        and(
          eq(subscriptions.id,     subscriptionId),
          eq(subscriptions.userId, session.user.id),
        )
      )
      .limit(1);

    if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });

    // Live unread message count — messages from creator to user, unread
    const [unreadResult] = await db
      .select({ count: count() })
      .from(messages)
      .where(
        and(
          eq(messages.fromUserId, row.creatorUserId),
          eq(messages.toUserId,   session.user.id),
          eq(messages.isRead,     false),
        )
      );

    const price = row.tier === "vip"
      ? (row.vipPrice ? Number(row.vipPrice) / 100 : null)
      : (row.standardPrice ? Number(row.standardPrice) / 100 : null);

    return NextResponse.json({
      subscriptionId:   row.subId,
      status:           row.status,
      tier:             row.tier,
      nextBillingDate:  row.nextBillingDate?.toISOString() ?? null,
      cancelledAt:      row.cancelledAt?.toISOString()     ?? null,
      createdAt:        row.createdAt?.toISOString()        ?? null,
      creatorId:        row.creatorId,
      creatorUserId:    row.creatorUserId,
      creatorName:      row.creatorName,
      creatorUsername:  row.username ?? row.creatorName.toLowerCase().replace(/\s+/g, "_"),
      creatorAvatarUrl: row.avatarUrl ?? null,
      price:            price ?? 0,
      unreadCount:      unreadResult?.count ?? 0,
    });

  } catch (e: any) {
    console.error("[GET /api/subscriptions/manage]", e?.message);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}