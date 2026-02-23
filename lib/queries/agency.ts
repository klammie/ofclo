// lib/queries/agency.ts
// Agency-level queries — SERVER ONLY
// Queries for agency managers to view their roster, commissions, and analytics

import { db } from "@/db";
import {
  user, creators, agencies, subscriptions, posts, tips,
  transactions, profiles,
} from "@/db/schema";
import { eq, desc, count, sum, and, gte, sql } from "drizzle-orm";
import type {
  AgencyCreatorRow, StatItem, AgencyCommissionRow,
} from "@/lib/types";

// ═══════════════════════════════════════════════════════════════════════════════
// AGENCY STATS
// ═══════════════════════════════════════════════════════════════════════════════

/** Get agency-level dashboard stats */
export async function getAgencyStats(agencyId: string): Promise<StatItem[]> {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  // Get agency commission rate
  const [agency] = await db
    .select({ commissionRate: agencies.commissionRate })
    .from(agencies)
    .where(eq(agencies.id, agencyId))
    .limit(1);

  const commissionRate = Number(agency?.commissionRate ?? 20) / 100;

  const [
    [{ totalRevenue }],
    [{ prevRevenue }],
    [{ creatorCount }],
    [{ subscriberCount }],
  ] = await Promise.all([
    // Total revenue from managed creators
    db.select({ totalRevenue: sum(creators.totalEarnings) })
      .from(creators)
      .where(eq(creators.agencyId, agencyId)),

    // Revenue 30 days ago
    db.select({ prevRevenue: sum(creators.totalEarnings) })
      .from(creators)
      .where(and(
        eq(creators.agencyId, agencyId),
        gte(creators.updatedAt, thirtyDaysAgo)
      )),

    // Number of managed creators
    db.select({ creatorCount: count() })
      .from(creators)
      .where(and(
        eq(creators.agencyId, agencyId),
        eq(creators.status, "active")
      )),

    // Total subscribers across all creators
    db.select({ subscriberCount: count() })
      .from(subscriptions)
      .innerJoin(creators, eq(subscriptions.creatorId, creators.id))
      .where(and(
        eq(creators.agencyId, agencyId),
        eq(subscriptions.status, "active")
      )),
  ]);

  const revenue = Number(totalRevenue ?? 0);
  const prev = Number(prevRevenue ?? 0);
  const growthPercent = prev > 0 ? (((revenue - prev) / prev) * 100).toFixed(1) : "0.0";
  const commission = revenue * commissionRate;

  return [
    {
      label: "Agency Revenue",
      value: `$${revenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
      change: `+${growthPercent}%`,
      up: Number(growthPercent) > 0,
    },
    {
      label: "Managed Creators",
      value: (creatorCount ?? 0).toString(),
      change: "+2",
      up: true,
    },
    {
      label: "Total Subscribers",
      value: (subscriberCount ?? 0).toLocaleString(),
      change: "+8.7%",
      up: true,
    },
    {
      label: "Commission Earned",
      value: `$${commission.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
      change: `+${growthPercent}%`,
      up: Number(growthPercent) > 0,
    },
  ];
}

// ═══════════════════════════════════════════════════════════════════════════════
// CREATOR ROSTER
// ═══════════════════════════════════════════════════════════════════════════════

/** Get agency's managed creators with performance metrics */
export async function getAgencyCreators(
  agencyId: string,
  page = 1,
  pageSize = 20
): Promise<{ creators: AgencyCreatorRow[]; total: number }> {
  const offset = (page - 1) * pageSize;

  // Get agency commission rate
  const [agency] = await db
    .select({ commissionRate: agencies.commissionRate })
    .from(agencies)
    .where(eq(agencies.id, agencyId))
    .limit(1);

  const commissionRate = Number(agency?.commissionRate ?? 20) / 100;

  // Get creators with aggregated stats
  const rows = await db
    .select({
      creator: creators,
      user: user,
      profile: profiles,
      // Aggregate subscriber count
      activeSubscribers: sql<number>`
        (SELECT COUNT(*) FROM ${subscriptions}
         WHERE ${subscriptions.creatorId} = ${creators.id}
           AND ${subscriptions.status} = 'active')
      `.as("active_subscribers"),
      // Aggregate this month's revenue
      monthlyRevenue: sql<string>`
        (SELECT COALESCE(SUM(${tips.amount}), 0)
         FROM ${tips}
         WHERE ${tips.toCreatorId} = ${creators.id}
           AND ${tips.paymentStatus} = 'completed'
           AND ${tips.createdAt} >= NOW() - INTERVAL '30 days')
      `.as("monthly_revenue"),
    })
    .from(creators)
    .innerJoin(user, eq(creators.userId, user.id))
    .leftJoin(profiles, eq(user.id, profiles.id))
    .where(and(
      eq(creators.agencyId, agencyId),
      eq(creators.status, "active")
    ))
    .orderBy(desc(creators.totalEarnings))
    .limit(pageSize)
    .offset(offset);

  const [{ count: total }] = await db
    .select({ count: count() })
    .from(creators)
    .where(and(
      eq(creators.agencyId, agencyId),
      eq(creators.status, "active")
    ));

  const mapped: AgencyCreatorRow[] = rows.map(r => {
    const totalEarnings = Number(r.creator.totalEarnings);
    const monthlyRev = Number(r.monthlyRevenue ?? 0);
    const commission = totalEarnings * commissionRate;

    return {
      id: r.creator.id,
      userId: r.creator.userId,
      status: r.creator.status,
      subscriberCount: r.activeSubscribers ?? 0,
      totalEarnings: totalEarnings.toFixed(2),
      monthlyRevenue: monthlyRev.toFixed(2),
      growthPercent: 12, // TODO: Calculate actual growth
      commissionEarned: commission.toFixed(2),
      user: {
        name: r.user.name,
        email: r.user.email,
        username: r.profile?.username ?? r.user.email.split("@")[0],
        avatarUrl: r.profile?.avatarUrl ?? r.user.image ?? null,
      },
    };
  });

  return { creators: mapped, total: total ?? 0 };
}

/** Get single creator details (if managed by this agency) */
export async function getAgencyCreatorDetails(
  agencyId: string,
  creatorId: string
) {
  const [creator] = await db
    .select({
      creator: creators,
      user: user,
      profile: profiles,
    })
    .from(creators)
    .innerJoin(user, eq(creators.userId, user.id))
    .leftJoin(profiles, eq(user.id, profiles.id))
    .where(and(
      eq(creators.id, creatorId),
      eq(creators.agencyId, agencyId)
    ))
    .limit(1);

  if (!creator) return null;

  // Get detailed stats
  const [
    [{ count: postCount }],
    [{ count: subCount }],
    [{ total: tipTotal }],
    [{ total: monthlyRevenue }],
  ] = await Promise.all([
    db.select({ count: count() })
      .from(posts)
      .where(eq(posts.creatorId, creatorId)),

    db.select({ count: count() })
      .from(subscriptions)
      .where(and(
        eq(subscriptions.creatorId, creatorId),
        eq(subscriptions.status, "active")
      )),

    db.select({ total: sum(tips.amount) })
      .from(tips)
      .where(and(
        eq(tips.toCreatorId, creatorId),
        eq(tips.paymentStatus, "completed")
      )),

    db.select({ total: sum(tips.amount) })
      .from(tips)
      .where(and(
        eq(tips.toCreatorId, creatorId),
        eq(tips.paymentStatus, "completed"),
        gte(tips.createdAt, new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))
      )),
  ]);

  return {
    ...creator.creator,
    user: {
      ...creator.user,
      username: creator.profile?.username ?? creator.user.email.split("@")[0],
      avatarUrl: creator.profile?.avatarUrl ?? creator.user.image,
    },
    stats: {
      postCount: postCount ?? 0,
      activeSubscribers: subCount ?? 0,
      totalTips: Number(tipTotal ?? 0),
      monthlyRevenue: Number(monthlyRevenue ?? 0),
    },
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// COMMISSION TRACKING
// ═══════════════════════════════════════════════════════════════════════════════

/** Get commission breakdown by creator */
export async function getCommissionBreakdown(
  agencyId: string
): Promise<AgencyCommissionRow[]> {
  const [agency] = await db
    .select({ commissionRate: agencies.commissionRate })
    .from(agencies)
    .where(eq(agencies.id, agencyId))
    .limit(1);

  const commissionRate = Number(agency?.commissionRate ?? 20) / 100;

  const rows = await db
    .select({
      creator: creators,
      user: user,
      profile: profiles,
      monthlyRevenue: sql<string>`
        (SELECT COALESCE(SUM(amount), 0) FROM ${transactions}
         WHERE user_id IN (
           SELECT user_id FROM ${subscriptions}
           WHERE creator_id = ${creators.id}
             AND status = 'active'
         )
         AND created_at >= NOW() - INTERVAL '30 days')
      `.as("monthly_revenue"),
    })
    .from(creators)
    .innerJoin(user, eq(creators.userId, user.id))
    .leftJoin(profiles, eq(user.id, profiles.id))
    .where(eq(creators.agencyId, agencyId));

  return rows.map(r => {
    const revenue = Number(r.monthlyRevenue ?? 0);
    const commission = revenue * commissionRate;

    return {
      creatorId: r.creator.id,
      creatorName: r.user.name,
      creatorUsername: r.profile?.username ?? r.user.email.split("@")[0],
      monthlyRevenue: revenue.toFixed(2),
      commissionRate: (commissionRate * 100).toFixed(0),
      commissionEarned: commission.toFixed(2),
    };
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// ANALYTICS
// ═══════════════════════════════════════════════════════════════════════════════

/** Get revenue trend over time for agency's creators */
export async function getAgencyRevenueChart(
  agencyId: string,
  period: "week" | "month" | "year" = "month"
) {
  let interval: string;
  let dateFormat: string;

  switch (period) {
    case "week":
      interval = "1 day";
      dateFormat = "YYYY-MM-DD";
      break;
    case "month":
      interval = "1 day";
      dateFormat = "YYYY-MM-DD";
      break;
    case "year":
      interval = "1 month";
      dateFormat = "YYYY-MM";
      break;
  }

  const rows = await db.execute<{ date: string; total: string }>(sql`
    SELECT 
      TO_CHAR(created_at, ${dateFormat}) as date,
      SUM(amount)::text as total
    FROM ${transactions}
    WHERE user_id IN (
      SELECT user_id FROM ${subscriptions}
      WHERE creator_id IN (
        SELECT id FROM ${creators}
        WHERE agency_id = ${agencyId}
      )
    )
    AND created_at >= NOW() - INTERVAL '${sql.raw(
      period === "week" ? "7 days" : period === "month" ? "30 days" : "1 year"
    )}'
    GROUP BY 1
    ORDER BY 1 ASC
  `);

  return rows.rows.map(r => ({
    date: r.date,
    revenue: Number(r.total),
  }));
}

/** Get top performing creators this month */
export async function getTopPerformers(agencyId: string, limit = 5) {
  const rows = await db
    .select({
      creator: creators,
      user: user,
      profile: profiles,
      monthlyRevenue: sql<string>`
        (SELECT COALESCE(SUM(${tips.amount}), 0)
         FROM ${tips}
         WHERE ${tips.toCreatorId} = ${creators.id}
           AND ${tips.paymentStatus} = 'completed'
           AND ${tips.createdAt} >= NOW() - INTERVAL '30 days')
      `.as("monthly_revenue"),
      subscriberGrowth: sql<number>`
        (SELECT COUNT(*) FROM ${subscriptions}
         WHERE ${subscriptions.creatorId} = ${creators.id}
           AND ${subscriptions.status} = 'active'
           AND ${subscriptions.createdAt} >= NOW() - INTERVAL '30 days')
      `.as("subscriber_growth"),
    })
    .from(creators)
    .innerJoin(user, eq(creators.userId, user.id))
    .leftJoin(profiles, eq(user.id, profiles.id))
    .where(eq(creators.agencyId, agencyId))
    .orderBy(desc(sql`monthly_revenue`))
    .limit(limit);

  return rows.map(r => ({
    creatorId: r.creator.id,
    name: r.user.name,
    username: r.profile?.username ?? r.user.email.split("@")[0],
    avatarUrl: r.profile?.avatarUrl ?? r.user.image,
    monthlyRevenue: Number(r.monthlyRevenue ?? 0),
    subscriberGrowth: r.subscriberGrowth ?? 0,
  }));
}