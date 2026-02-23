// lib/queries/creator.ts
// Creator-level queries — SERVER ONLY
// Queries for content creators to manage posts, subscribers, and earnings

import { db } from "@/db";
import {
  user, creators, posts, subscriptions, tips, ppvUnlocks,
  transactions, creatorWallets, profiles,
} from "@/db/schema";
import { eq, desc, count, sum, and, gte, sql, SQL } from "drizzle-orm";
import type {
  Post, Subscription, TipWithSender, StatItem, CreatorEarningsBreakdown,
  SubscriberWithDetails, PostWithStats,
} from "@/lib/types";

// ═══════════════════════════════════════════════════════════════════════════════
// CREATOR STATS
// ═══════════════════════════════════════════════════════════════════════════════

/** Get creator dashboard stats */
export async function getCreatorStats(creatorId: string): Promise<StatItem[]> {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    [{ monthlyRevenue }],
    [{ totalRevenue }],
    [{ subscriberCount }],
    [{ postCount }],
    [{ viewCount }],
  ] = await Promise.all([
    // This month's revenue from all sources
    db.select({
      monthlyRevenue: sql<string>`
        COALESCE(
          (SELECT SUM(amount) FROM ${tips}
           WHERE ${tips.toCreatorId} = ${creatorId}
             AND ${tips.paymentStatus} = 'completed'
             AND ${tips.createdAt} >= ${monthStart}),
          0
        ) +
        COALESCE(
          (SELECT SUM(amount_paid) FROM ${ppvUnlocks}
           WHERE ${ppvUnlocks.postId} IN (
             SELECT id FROM ${posts} WHERE creator_id = ${creatorId}
           )
           AND ${ppvUnlocks.paymentStatus} = 'completed'
           AND ${ppvUnlocks.createdAt} >= ${monthStart}),
          0
        ) +
        COALESCE(
          (SELECT SUM(price_at_subscription) FROM ${subscriptions}
           WHERE ${subscriptions.creatorId} = ${creatorId}
             AND ${subscriptions.status} = 'active'
             AND ${subscriptions.currentPeriodStart} >= ${monthStart}),
          0
        )
      `.as("monthly_revenue")
    }).from(sql`(SELECT 1) as dummy`),

    // Total all-time revenue
    db.select({ totalRevenue: creators.totalEarnings })
      .from(creators)
      .where(eq(creators.id, creatorId))
      .limit(1),

    // Active subscribers
    db.select({ subscriberCount: count() })
      .from(subscriptions)
      .where(and(
        eq(subscriptions.creatorId, creatorId),
        eq(subscriptions.status, "active")
      )),

    // Published posts
    db.select({ postCount: count() })
      .from(posts)
      .where(and(
        eq(posts.creatorId, creatorId),
        eq(posts.isPublished, true)
      )),

    // Total profile views (sum of all post views)
    db.select({ viewCount: sum(posts.viewCount) })
      .from(posts)
      .where(eq(posts.creatorId, creatorId)),
  ]);

  return [
    {
      label: "Monthly Revenue",
      value: `$${Number(monthlyRevenue ?? 0).toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`,
      change: "+14.3%",
      up: true,
    },
    {
      label: "Subscribers",
      value: (subscriberCount ?? 0).toLocaleString(),
      change: "+124",
      up: true,
    },
    {
      label: "Total Posts",
      value: (postCount ?? 0).toString(),
      change: "+12",
      up: true,
    },
    {
      label: "Profile Views",
      value: (Number(viewCount ?? 0)).toLocaleString(),
      change: "+28.4%",
      up: true,
    },
  ];
}

// ═══════════════════════════════════════════════════════════════════════════════
// POST MANAGEMENT
// ═══════════════════════════════════════════════════════════════════════════════

/** Get creator's posts with engagement stats */
export async function getCreatorPosts(
  creatorId: string,
  page = 1,
  pageSize = 12,
  filters?: {
    isPublished?: boolean;
    isLocked?: boolean;
  }
): Promise<{ posts: PostWithStats[]; total: number }> {
  const offset = (page - 1) * pageSize;

  const conditions: SQL[] = [eq(posts.creatorId, creatorId)];
  if (filters?.isPublished !== undefined) {
    conditions.push(eq(posts.isPublished, filters.isPublished));
  }
  if (filters?.isLocked !== undefined) {
    conditions.push(eq(posts.isLocked, filters.isLocked));
  }

  const rows = await db
    .select({
      post: posts,
      unlockCount: sql<number>`
        (SELECT COUNT(*) FROM ${ppvUnlocks}
         WHERE ${ppvUnlocks.postId} = ${posts.id}
           AND ${ppvUnlocks.paymentStatus} = 'completed')
      `.as("unlock_count"),
      revenue: sql<string>`
        COALESCE(
          (SELECT SUM(amount_paid) FROM ${ppvUnlocks}
           WHERE ${ppvUnlocks.postId} = ${posts.id}
             AND ${ppvUnlocks.paymentStatus} = 'completed'),
          0
        )
      `.as("revenue"),
    })
    .from(posts)
    .where(and(...conditions))
    .orderBy(desc(posts.createdAt))
    .limit(pageSize)
    .offset(offset);

  const [{ count: total }] = await db
    .select({ count: count() })
    .from(posts)
    .where(and(...conditions));

  const mapped: PostWithStats[] = rows.map(r => ({
    ...r.post,
    unlockCount: r.unlockCount ?? 0,
    revenue: Number(r.revenue ?? 0),
  }));

  return { posts: mapped, total: total ?? 0 };
}

/** Get single post with full details */
export async function getPostDetails(creatorId: string, postId: string) {
  const [post] = await db
    .select({
      post: posts,
      unlockCount: sql<number>`
        (SELECT COUNT(*) FROM ${ppvUnlocks}
         WHERE ${ppvUnlocks.postId} = ${posts.id}
           AND ${ppvUnlocks.paymentStatus} = 'completed')
      `.as("unlock_count"),
      revenue: sql<string>`
        (SELECT COALESCE(SUM(amount_paid), 0) FROM ${ppvUnlocks}
         WHERE ${ppvUnlocks.postId} = ${posts.id}
           AND ${ppvUnlocks.paymentStatus} = 'completed')
      `.as("revenue"),
    })
    .from(posts)
    .where(and(
      eq(posts.id, postId),
      eq(posts.creatorId, creatorId)
    ))
    .limit(1);

  if (!post) return null;

  return {
    ...post.post,
    unlockCount: post.unlockCount ?? 0,
    revenue: Number(post.revenue ?? 0),
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// SUBSCRIBER MANAGEMENT
// ═══════════════════════════════════════════════════════════════════════════════

/** Get creator's subscribers with spending details */
export async function getCreatorSubscribers(
  creatorId: string,
  page = 1,
  pageSize = 20
): Promise<{ subscribers: SubscriberWithDetails[]; total: number }> {
  const offset = (page - 1) * pageSize;

  const rows = await db
    .select({
      subscription: subscriptions,
      user: user,
      profile: profiles,
      totalSpent: sql<string>`
        COALESCE(
          (SELECT SUM(amount) FROM ${transactions}
           WHERE ${transactions.userId} = ${user.id}
             AND ${transactions.type} IN ('subscription', 'ppv', 'tip')),
          0
        )
      `.as("total_spent"),
      tipCount: sql<number>`
        (SELECT COUNT(*) FROM ${tips}
         WHERE ${tips.fromUserId} = ${user.id}
           AND ${tips.toCreatorId} = ${creatorId}
           AND ${tips.paymentStatus} = 'completed')
      `.as("tip_count"),
    })
    .from(subscriptions)
    .innerJoin(user, eq(subscriptions.userId, user.id))
    .leftJoin(profiles, eq(user.id, profiles.id))
    .where(eq(subscriptions.creatorId, creatorId))
    .orderBy(desc(subscriptions.createdAt))
    .limit(pageSize)
    .offset(offset);

  const [{ count: total }] = await db
    .select({ count: count() })
    .from(subscriptions)
    .where(eq(subscriptions.creatorId, creatorId));

  const mapped: SubscriberWithDetails[] = rows.map(r => ({
    ...r.subscription,
    user: {
      id: r.user.id,
      name: r.user.name,
      email: r.user.email,
      username: r.profile?.username ?? r.user.email.split("@")[0],
      avatarUrl: r.profile?.avatarUrl ?? r.user.image ?? null,
    },
    totalSpent: Number(r.totalSpent ?? 0),
    tipCount: r.tipCount ?? 0,
  }));

  return { subscribers: mapped, total: total ?? 0 };
}

// ═══════════════════════════════════════════════════════════════════════════════
// EARNINGS & TIPS
// ═══════════════════════════════════════════════════════════════════════════════

/** Get recent tips with sender info */
export async function getRecentTips(
  creatorId: string,
  limit = 10
): Promise<TipWithSender[]> {
  const rows = await db
    .select({
      tip: tips,
      sender: user,
      senderProfile: profiles,
    })
    .from(tips)
    .leftJoin(user, eq(tips.fromUserId, user.id))
    .leftJoin(profiles, eq(user.id, profiles.id))
    .where(and(
      eq(tips.toCreatorId, creatorId),
      eq(tips.paymentStatus, "completed")
    ))
    .orderBy(desc(tips.createdAt))
    .limit(limit);

  return rows.map(r => ({
    ...r.tip,
    sender: r.tip.isAnonymous ? null : (r.sender ? {
      displayName: r.sender.name,
      avatarUrl: r.senderProfile?.avatarUrl ?? r.sender.image ?? null,
    } : null),
  })) as TipWithSender[];
}

/** Get earnings breakdown by source */
export async function getCreatorEarningsBreakdown(
  creatorId: string
): Promise<CreatorEarningsBreakdown> {
  const [
    [{ subscriptionRevenue }],
    [{ ppvRevenue }],
    [{ tipRevenue }],
  ] = await Promise.all([
    // Subscription revenue (all time)
    db.select({
      subscriptionRevenue: sql<string>`
        COALESCE(
          SUM(${subscriptions.priceAtSubscription}),
          0
        )
      `.as("subscription_revenue")
    })
      .from(subscriptions)
      .where(and(
        eq(subscriptions.creatorId, creatorId),
        eq(subscriptions.paymentStatus, "completed")
      )),

    // PPV unlock revenue
    db.select({ ppvRevenue: sum(ppvUnlocks.amountPaid) })
      .from(ppvUnlocks)
      .innerJoin(posts, eq(ppvUnlocks.postId, posts.id))
      .where(and(
        eq(posts.creatorId, creatorId),
        eq(ppvUnlocks.paymentStatus, "completed")
      )),

    // Tip revenue
    db.select({ tipRevenue: sum(tips.amount) })
      .from(tips)
      .where(and(
        eq(tips.toCreatorId, creatorId),
        eq(tips.paymentStatus, "completed")
      )),
  ]);

  const subRev = Number(subscriptionRevenue ?? 0);
  const ppvRev = Number(ppvRevenue ?? 0);
  const tipRev = Number(tipRevenue ?? 0);
  const totalRev = subRev + ppvRev + tipRev;

  return {
    subscriptions: {
      amount: subRev,
      percentage: totalRev > 0 ? (subRev / totalRev) * 100 : 0,
    },
    ppv: {
      amount: ppvRev,
      percentage: totalRev > 0 ? (ppvRev / totalRev) * 100 : 0,
    },
    tips: {
      amount: tipRev,
      percentage: totalRev > 0 ? (tipRev / totalRev) * 100 : 0,
    },
    total: totalRev,
  };
}

/** Get monthly earnings chart data (last 12 months) */
export async function getCreatorEarningsChart(creatorId: string) {
  const rows = await db.execute<{ month: string; total: string }>(sql`
    WITH months AS (
      SELECT TO_CHAR(date_trunc('month', NOW() - INTERVAL '${sql.raw(
        "n"
      )} month'), 'YYYY-MM') as month
      FROM generate_series(0, 11) as n
    ),
    earnings AS (
      SELECT 
        TO_CHAR(date_trunc('month', created_at), 'YYYY-MM') as month,
        SUM(amount)::text as total
      FROM ${tips}
      WHERE ${tips.toCreatorId} = ${creatorId}
        AND ${tips.paymentStatus} = 'completed'
        AND ${tips.createdAt} >= NOW() - INTERVAL '12 months'
      GROUP BY 1
      
      UNION ALL
      
      SELECT 
        TO_CHAR(date_trunc('month', created_at), 'YYYY-MM') as month,
        SUM(amount_paid)::text as total
      FROM ${ppvUnlocks}
      WHERE ${ppvUnlocks.postId} IN (
        SELECT id FROM ${posts} WHERE creator_id = ${creatorId}
      )
      AND ${ppvUnlocks.paymentStatus} = 'completed'
      AND ${ppvUnlocks.createdAt} >= NOW() - INTERVAL '12 months'
      GROUP BY 1
      
      UNION ALL
      
      SELECT 
        TO_CHAR(date_trunc('month', created_at), 'YYYY-MM') as month,
        SUM(price_at_subscription)::text as total
      FROM ${subscriptions}
      WHERE ${subscriptions.creatorId} = ${creatorId}
        AND ${subscriptions.paymentStatus} = 'completed'
        AND ${subscriptions.createdAt} >= NOW() - INTERVAL '12 months'
      GROUP BY 1
    )
    SELECT 
      m.month,
      COALESCE(SUM(e.total::numeric), 0)::text as total
    FROM months m
    LEFT JOIN earnings e ON m.month = e.month
    GROUP BY m.month
    ORDER BY m.month ASC
  `);

  return rows.rows.map(r => ({
    month: r.month,
    revenue: Number(r.total),
  }));
}

// ═══════════════════════════════════════════════════════════════════════════════
// WALLET & PAYOUTS
// ═══════════════════════════════════════════════════════════════════════════════

/** Get creator's configured payout wallets */
export async function getCreatorWallets(creatorId: string) {
  return await db
    .select()
    .from(creatorWallets)
    .where(eq(creatorWallets.creatorId, creatorId))
    .orderBy(desc(creatorWallets.isDefault));
}

/** Get creator's pending payout balance */
export async function getCreatorPendingPayout(creatorId: string) {
  const [creator] = await db
    .select({ pendingPayout: creators.pendingPayout })
    .from(creators)
    .where(eq(creators.id, creatorId))
    .limit(1);

  return Number(creator?.pendingPayout ?? 0);
}