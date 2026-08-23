// app/api/cron/expire-subscriptions/route.ts
//
// Runs daily — two jobs in one:
//
// JOB 1 — Auto-expire: finds subscriptions whose currentPeriodEnd has passed
//          and flips them from "active" → "expired".
//
// JOB 2 — Countdown notifications: finds active subscriptions expiring in
//          1, 2, or 3 days and creates a notification for each user if one
//          hasn't already been sent for that day-bucket.
//
// Add to vercel.json:
//   { "path": "/api/cron/expire-subscriptions", "schedule": "0 0 * * *" }

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { subscriptions, notifications, creators, profiles, user } from "@/db/schema";
import { eq, and, lte, gte, lt, ne } from "drizzle-orm";
import { randomUUID } from "crypto";

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now    = new Date();
  const in1d   = new Date(now.getTime() + 1  * 24 * 60 * 60 * 1000);
  const in3d   = new Date(now.getTime() + 3  * 24 * 60 * 60 * 1000);

  let expired      = 0;
  let notifsSent   = 0;
  let errors       = 0;

  // ── JOB 1: Auto-expire past-due active subscriptions ──────────────────────
  try {
    const pastDue = await db
      .select({ id: subscriptions.id, userId: subscriptions.userId })
      .from(subscriptions)
      .where(
        and(
          eq(subscriptions.status, "active"),
          lte(subscriptions.currentPeriodEnd, now),
        )
      );

    for (const sub of pastDue) {
      try {
        await db
          .update(subscriptions)
          .set({ status: "expired", updatedAt: now })
          .where(eq(subscriptions.id, sub.id));

        // Notify the user their sub expired
        await db.insert(notifications).values({
          id:        randomUUID(),
          userId:    sub.userId,
          type:      "subscription_expired" as any,
          priority:  "high" as any,
          title:     "Subscription expired",
          body:      "Your subscription has ended. Renew to keep access.",
          icon:      "⏰",
          actionUrl: "/dashboard/user/subscriptions",
          entityId:  sub.id,
          isRead:    false,
          createdAt: now,
        });

        expired++;
      } catch (e) {
        console.error(`[cron/expire] Failed to expire sub ${sub.id}:`, e);
        errors++;
      }
    }
  } catch (e) {
    console.error("[cron/expire] JOB 1 failed:", e);
    errors++;
  }

  // ── JOB 2: 3-day countdown notifications ──────────────────────────────────
  // Find active subs expiring within the next 3 days
  try {
    const expiringSoon = await db
      .select({
        subId:           subscriptions.id,
        userId:          subscriptions.userId,
        currentPeriodEnd: subscriptions.currentPeriodEnd,
        creatorId:       subscriptions.creatorId,
        creatorName:     user.name,
        creatorAvatar:   profiles.avatarUrl,
      })
      .from(subscriptions)
      .innerJoin(creators, eq(creators.id,     subscriptions.creatorId))
      .innerJoin(user,     eq(user.id,          creators.userId))
      .leftJoin(profiles,  eq(profiles.id,      creators.userId))
      .where(
        and(
          eq(subscriptions.status,  "active"),
          gte(subscriptions.currentPeriodEnd, now),
          lte(subscriptions.currentPeriodEnd, in3d),
        )
      );

    for (const sub of expiringSoon) {
      try {
        const msLeft   = sub.currentPeriodEnd!.getTime() - now.getTime();
        const daysLeft = Math.ceil(msLeft / (24 * 60 * 60 * 1000)); // 1, 2, or 3

        // De-duplicate: only one notification per (subId × daysLeft) bucket.
        // We use entityId = `${subId}:expiry:${daysLeft}` as a natural key check.
        const dedupeKey = `${sub.subId}:expiry:${daysLeft}`;

        const existingNotif = await db.query.notifications.findFirst({
          where: (t, { and, eq }) => and(
            eq(t.userId,   sub.userId),
            eq(t.entityId, dedupeKey),
          ),
        });
        if (existingNotif) continue; // already sent for this day-bucket

        const dayWord  = daysLeft === 1 ? "tomorrow" : `in ${daysLeft} days`;
        const urgency  = daysLeft === 1 ? "high" : "medium";
        const icon     = daysLeft === 1 ? "🚨" : daysLeft === 2 ? "⚠️" : "🔔";

        await db.insert(notifications).values({
          id:          randomUUID(),
          userId:      sub.userId,
          type:        "subscription_expiring" as any,
          priority:    urgency as any,
          title:       `Your subscription expires ${dayWord}`,
          body:        `Your subscription to ${sub.creatorName} ends ${dayWord}. Renew now to keep access.`,
          icon,
          actionUrl:   "/dashboard/user/subscriptions",
          actorId:     sub.creatorId,
          actorName:   sub.creatorName,
          actorAvatar: sub.creatorAvatar ?? undefined,
          entityId:    dedupeKey,
          isRead:      false,
          createdAt:   now,
        });

        notifsSent++;
      } catch (e) {
        console.error(`[cron/expire] Notification failed for sub ${sub.subId}:`, e);
        errors++;
      }
    }
  } catch (e) {
    console.error("[cron/expire] JOB 2 failed:", e);
    errors++;
  }

  console.log(`[cron/expire-subscriptions] expired=${expired} notifsSent=${notifsSent} errors=${errors}`);

  return NextResponse.json({
    success: true,
    expired,
    notifsSent,
    errors,
    timestamp: now.toISOString(),
  });
}