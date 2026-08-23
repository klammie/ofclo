// app/api/subscriptions/manage/route.ts
// GET — returns full subscription detail including live unread count and renewal date.
// Called by the manage modal when it opens.

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/db";
import { subscriptions, conversations, creators, profiles, user } from "@/db/schema";
import { and, eq, or, sql } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const subscriptionId   = searchParams.get("subscriptionId");
  if (!subscriptionId)   return NextResponse.json({ error: "subscriptionId required" }, { status: 400 });

  try {
    // Fetch sub with creator info — using YOUR actual schema column names
    const [row] = await db
      .select({
        subId:               subscriptions.id,
        status:              subscriptions.status,
        tier:                subscriptions.tier,
        priceAtSubscription: subscriptions.priceAtSubscription,
        currentPeriodStart:  subscriptions.currentPeriodStart,
        currentPeriodEnd:    subscriptions.currentPeriodEnd,
        cancelledAt:         subscriptions.cancelledAt,
        createdAt:           subscriptions.createdAt,
        creatorId:           subscriptions.creatorId,
        // Creator info
        creatorUserId:       creators.userId,
        creatorName:         user.name,
        username:            profiles.username,
        avatarUrl:           profiles.avatarUrl,
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

    // Use the same conversation counter as the subscription card.
    const [unreadResult] = await db
      .select({
        count: sql<number>`CASE
          WHEN ${conversations.participant1Id} = ${session.user.id}
            THEN ${conversations.unreadCountUser1}
          ELSE ${conversations.unreadCountUser2}
        END`,
      })
      .from(conversations)
      .where(
        or(
          and(
            eq(conversations.participant1Id, session.user.id),
            eq(conversations.participant2Id, row.creatorUserId),
          ),
          and(
            eq(conversations.participant1Id, row.creatorUserId),
            eq(conversations.participant2Id, session.user.id),
          ),
        )
      );

    // priceAtSubscription is already stored as a dollar decimal — no /100 needed
    const price = row.priceAtSubscription != null ? Number(row.priceAtSubscription) : 0;

    return NextResponse.json({
      subscriptionId:     row.subId,
      status:             row.status,
      tier:               row.tier,
      // Map currentPeriodEnd → nextBillingDate for the frontend's existing field name
      nextBillingDate:    row.currentPeriodEnd?.toISOString()   ?? null,
      currentPeriodStart: row.currentPeriodStart?.toISOString() ?? null,
      cancelledAt:        row.cancelledAt?.toISOString()        ?? null,
      createdAt:          row.createdAt?.toISOString()          ?? null,
      creatorId:          row.creatorId,
      creatorUserId:      row.creatorUserId,
      creatorName:        row.creatorName,
      creatorUsername:    row.username ?? row.creatorName.toLowerCase().replace(/\s+/g, "_"),
      creatorAvatarUrl:   row.avatarUrl ?? null,
      price,
      unreadCount:        unreadResult?.count ?? 0,
    });

  } catch (e: any) {
    console.error("[GET /api/subscriptions/manage]", e?.message);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}