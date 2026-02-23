// lib/queries/admin.ts
// Admin-level queries — SERVER ONLY (never import in "use client" components)
// All queries use BetterAuth's `user` table instead of a custom users table

import { db } from "@/db";
import { 
  user, creators, agencies, payouts, reports, subscriptions,
  posts, tips, transactions, creatorWallets, profiles
} from "@/db/schema";
import { eq, desc, count, sum, and, gte, lte, sql, SQL } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";

import type {
  AdminCreatorRow, PayoutWithCreator, ReportWithDetails, StatItem,
  AdminAgencyRow, AdminUserRow,
} from "@/lib/types";

// ═══════════════════════════════════════════════════════════════════════════════
// PLATFORM STATS
// ═══════════════════════════════════════════════════════════════════════════════




/** Get platform-wide metrics for admin dashboard */
export async function getAdminStats(): Promise<StatItem[]> {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [
    [revenueRow],
    [prevRevenueRow],
    [creatorRow],
    [userRow],
    [reportRow],
  ] = await Promise.all([
    // Total revenue (all time)
    db.select({ total: sum(payouts.grossAmount) }).from(payouts),
    
    // Revenue 30 days ago for growth calc
    db.select({ total: sum(payouts.grossAmount) })
      .from(payouts)
      .where(lte(payouts.createdAt, thirtyDaysAgo)),
    
    // Active creators
    db.select({ count: count() })
      .from(creators)
      .where(eq(creators.status, "active")),
    
    // Total users (exclude admins/agencies/creators — only fans)
    db.select({ count: count() })
      .from(user)
      .where(eq(user.role, "user")),
    
    // Pending reports
    db.select({ count: count() })
      .from(reports)
      .where(eq(reports.status, "pending")),
  ]);

  const revenue = Number(revenueRow?.total ?? 0);
  const prevRevenue = Number(prevRevenueRow?.total ?? 0);
  const revenueGrowth = prevRevenue > 0 
    ? (((revenue - prevRevenue) / prevRevenue) * 100).toFixed(1)
    : "0.0";

  return [
    {
      label: "Total Revenue",
      value: `$${revenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
      change: `+${revenueGrowth}%`,
      up: true,
    },
    {
      label: "Active Creators",
      value: (creatorRow?.count ?? 0).toLocaleString(),
      change: "+6.4%",
      up: true,
    },
    {
      label: "Total Users",
      value: (userRow?.count ?? 0).toLocaleString(),
      change: "+12.1%",
      up: true,
    },
    {
      label: "Pending Reports",
      value: (reportRow?.count ?? 0).toString(),
      change: "-3.2%",
      up: false,
    },
  ];
}

// ═══════════════════════════════════════════════════════════════════════════════
// CREATOR MANAGEMENT
// ═══════════════════════════════════════════════════════════════════════════════

/** Get paginated creator list with user + agency join */
export async function getAdminCreators(
  page = 1,
  pageSize = 20,
  filters?: {
    status?: "pending" | "active" | "suspended" | "banned";
    agencyId?: string;
    search?: string;
  }
): Promise<{ creators: AdminCreatorRow[]; total: number }> {
  
  const offset = (page - 1) * pageSize;
  
  // Build where conditions
  const conditions: SQL[] = [];
  if (filters?.status) {
    conditions.push(eq(creators.status, filters.status));
  }
  if (filters?.agencyId) {
    conditions.push(eq(creators.agencyId, filters.agencyId));
  }

  // Query with joins
  const rows = await db
    .select({
      id: creators.id,
      userId: creators.userId,
      status: creators.status,
      isVerified: creators.isVerified,
      subscriberCount: creators.subscriberCount,
      totalEarnings: creators.totalEarnings,
      pendingPayout: creators.pendingPayout,
      createdAt: creators.createdAt,
      // User fields (BetterAuth)
      userName: user.name,
      userEmail: user.email,
      userImage: user.image,
      userBanned: user.banned,
      // Profile fields
      username: profiles.username,
      avatarUrl: profiles.avatarUrl,
      // Agency fields
      agencyId: creators.agencyId,
      agencyName: agencies.name,
    })
    .from(creators)
    .innerJoin(user, eq(creators.userId, user.id))
    .leftJoin(profiles, eq(user.id, profiles.id))
    .leftJoin(agencies, eq(creators.agencyId, agencies.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(creators.totalEarnings))
    .limit(pageSize)
    .offset(offset);

  // Get total count
  const [{ count: total }] = await db
    .select({ count: count() })
    .from(creators)
    .where(conditions.length > 0 ? and(...conditions) : undefined);

  const mapped: AdminCreatorRow[] = rows.map(r => ({
    id: r.id,
    userId: r.userId,
    status: r.status,
    isVerified: r.isVerified,
    subscriberCount: r.subscriberCount,
    totalEarnings: r.totalEarnings,
    pendingPayout: r.pendingPayout,
    createdAt: r.createdAt,
    user: {
      name: r.userName,
      email: r.userEmail,
      username: r.username ?? r.userEmail.split("@")[0],
      avatarUrl: r.avatarUrl ?? r.userImage ?? null,
      banned: r.userBanned ?? false,
    },
    agency: r.agencyId && r.agencyName ? { id: r.agencyId, name: r.agencyName } : null,
  }));

  return { creators: mapped, total: total ?? 0 };
}

/** Get single creator details with full relationships */
export async function getCreatorDetails(creatorId: string) {
  const [creator] = await db
    .select({
      creator: creators,
      user: user,
      profile: profiles,
      agency: agencies,
    })
    .from(creators)
    .innerJoin(user, eq(creators.userId, user.id))
    .leftJoin(profiles, eq(user.id, profiles.id))
    .leftJoin(agencies, eq(creators.agencyId, agencies.id))
    .where(eq(creators.id, creatorId))
    .limit(1);

  if (!creator) return null;

  // Get aggregate stats
  const [
    [{ count: postCount }],
    [{ count: subCount }],
    [{ total: tipTotal }],
  ] = await Promise.all([
    db.select({ count: count() }).from(posts).where(eq(posts.creatorId, creatorId)),
    db.select({ count: count() }).from(subscriptions)
      .where(and(eq(subscriptions.creatorId, creatorId), eq(subscriptions.status, "active"))),
    db.select({ total: sum(tips.amount) }).from(tips)
      .where(and(eq(tips.toCreatorId, creatorId), eq(tips.paymentStatus, "completed"))),
  ]);

  return {
    ...creator.creator,
    user: {
      ...creator.user,
      username: creator.profile?.username ?? creator.user.email.split("@")[0],
      avatarUrl: creator.profile?.avatarUrl ?? creator.user.image,
    },
    agency: creator.agency,
    stats: {
      postCount: postCount ?? 0,
      activeSubscribers: subCount ?? 0,
      totalTips: Number(tipTotal ?? 0),
    },
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// AGENCY MANAGEMENT
// ═══════════════════════════════════════════════════════════════════════════════

/** Get all agencies with creator counts */
export async function getAdminAgencies(
  page = 1,
  pageSize = 20
): Promise<{ agencies: AdminAgencyRow[]; total: number }> {
  const offset = (page - 1) * pageSize;

  const rows = await db
    .select({
      agency: agencies,
      user: user,
      profile: profiles,
      creatorCount: sql<number>`count(${creators.id})::int`.as("creator_count"),
      totalRevenue: sql<string>`coalesce(sum(${creators.totalEarnings}), 0)`.as("total_revenue"),
    })
    .from(agencies)
    .innerJoin(user, eq(agencies.userId, user.id))
    .leftJoin(profiles, eq(user.id, profiles.id))
    .leftJoin(creators, eq(agencies.id, creators.agencyId))
    .groupBy(agencies.id, user.id, profiles.id)
    .orderBy(desc(sql`total_revenue`))
    .limit(pageSize)
    .offset(offset);

  const [{ count: total }] = await db.select({ count: count() }).from(agencies);

  const mapped: AdminAgencyRow[] = rows.map(r => ({
    id: r.agency.id,
    name: r.agency.name,
    description: r.agency.description,
    commissionRate: r.agency.commissionRate,
    isVerified: r.agency.isVerified,
    createdAt: r.agency.createdAt,
    user: {
      name: r.user.name,
      email: r.user.email,
      username: r.profile?.username ?? r.user.email.split("@")[0],
    },
    stats: {
      creatorCount: r.creatorCount ?? 0,
      totalRevenue: Number(r.totalRevenue ?? 0),
      commissionEarned: Number(r.totalRevenue ?? 0) * Number(r.agency.commissionRate) / 100,
    },
  }));

  return { agencies: mapped, total: total ?? 0 };
}

// ═══════════════════════════════════════════════════════════════════════════════
// USER MANAGEMENT
// ═══════════════════════════════════════════════════════════════════════════════

/** Get all users with role filtering */
export async function getAdminUsers(
  page = 1,
  pageSize = 50,
  filters?: {
    role?: "user" | "creator" | "agency" | "admin";
    banned?: boolean;
    search?: string;
  }
): Promise<{ users: AdminUserRow[]; total: number }> {
  const offset = (page - 1) * pageSize;

  const conditions: SQL[] = [];
  if (filters?.role) {
    conditions.push(eq(user.role, filters.role));
  }
  if (filters?.banned !== undefined) {
    conditions.push(eq(user.banned, filters.banned));
  }

  const rows = await db
    .select({
      user: user,
      profile: profiles,
    })
    .from(user)
    .leftJoin(profiles, eq(user.id, profiles.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(user.createdAt))
    .limit(pageSize)
    .offset(offset);

  const [{ count: total }] = await db
    .select({ count: count() })
    .from(user)
    .where(conditions.length > 0 ? and(...conditions) : undefined);

  const mapped: AdminUserRow[] = rows.map(r => ({
    id: r.user.id,
    name: r.user.name,
    email: r.user.email,
    role: r.user.role as "user" | "creator" | "agency" | "admin",
    banned: r.user.banned ?? false,
    banReason: r.user.banReason,
    emailVerified: r.user.emailVerified,
    createdAt: r.user.createdAt,
    username: r.profile?.username ?? r.user.email.split("@")[0],
    avatarUrl: r.profile?.avatarUrl ?? r.user.image ?? null,
  }));

  return { users: mapped, total: total ?? 0 };
}

// ═══════════════════════════════════════════════════════════════════════════════
// PAYOUT MANAGEMENT
// ═══════════════════════════════════════════════════════════════════════════════

/** Get pending payouts ready for processing */
export async function getPendingPayouts(): Promise<PayoutWithCreator[]> {
  // Get explicit pending payouts from DB
  const existingPayouts = await db
    .select({
      payout: payouts,
      creator: creators,
      user: user,
      profile: profiles,
    })
    .from(payouts)
    .innerJoin(creators, eq(payouts.creatorId, creators.id))
    .innerJoin(user, eq(creators.userId, user.id))
    .leftJoin(profiles, eq(user.id, profiles.id))
    .where(eq(payouts.status, "pending"))
    .orderBy(desc(payouts.createdAt));

  // Get creators with balance >= $10 who need payouts
  const creatorsNeedingPayout = await db
    .select({
      creator: creators,
      user: user,
      profile: profiles,
      wallet: creatorWallets,
    })
    .from(creators)
    .innerJoin(user, eq(creators.userId, user.id))
    .leftJoin(profiles, eq(user.id, profiles.id))
    .leftJoin(
      creatorWallets,
      and(
        eq(creatorWallets.creatorId, creators.id),
        eq(creatorWallets.isDefault, true)
      )
    )
    .where(gte(creators.pendingPayout, "10.00"));

  // Create virtual payout records
  const virtualPayouts: PayoutWithCreator[] = creatorsNeedingPayout
    .filter(row => {
      if (!row.wallet) return false;
      const hasExisting = existingPayouts.some(p => p.payout.creatorId === row.creator.id);
      return !hasExisting;
    })
    .map(row => {
      const grossAmount = Number(row.creator.pendingPayout);
      const platformFee = grossAmount * 0.20;
      const netAmount = grossAmount - platformFee;

      return {
        id: `virtual-${row.creator.id}`,
        creatorId: row.creator.id,
        grossAmount: grossAmount.toFixed(2),
        platformFee: platformFee.toFixed(2),
        netAmount: netAmount.toFixed(2),
        status: "pending" as const,
        cryptoCurrency: row.wallet!.currency,
        destinationAddress: row.wallet!.address,
        maxelpayTransferId: null,
        processedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        creator: {
          id: row.creator.id,
          user: {
            displayName: row.user.name,
            username: row.profile?.username ?? row.user.email.split("@")[0],
          },
        },
      } as PayoutWithCreator;
    });

  // Merge and return
  const mapped = existingPayouts.map(r => ({
    ...r.payout,
    creator: {
      id: r.creator.id,
      user: {
        displayName: r.user.name,
        username: r.profile?.username ?? r.user.email.split("@")[0],
      },
    },
  })) as PayoutWithCreator[];

  return [...mapped, ...virtualPayouts];
}

/** Get payout history with filters */
export async function getPayoutHistory(
  page = 1,
  pageSize = 50,
  filters?: {
    status?: "pending" | "processing" | "sent" | "failed";
    creatorId?: string;
    startDate?: Date;
    endDate?: Date;
  }
): Promise<{ payouts: PayoutWithCreator[]; total: number }> {
  const offset = (page - 1) * pageSize;

  const conditions: SQL[] = [];
  if (filters?.status) conditions.push(eq(payouts.status, filters.status));
  if (filters?.creatorId) conditions.push(eq(payouts.creatorId, filters.creatorId));
  if (filters?.startDate) conditions.push(gte(payouts.createdAt, filters.startDate));
  if (filters?.endDate) conditions.push(lte(payouts.createdAt, filters.endDate));

  const rows = await db
    .select({
      payout: payouts,
      creator: creators,
      user: user,
      profile: profiles,
    })
    .from(payouts)
    .innerJoin(creators, eq(payouts.creatorId, creators.id))
    .innerJoin(user, eq(creators.userId, user.id))
    .leftJoin(profiles, eq(user.id, profiles.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(payouts.createdAt))
    .limit(pageSize)
    .offset(offset);

  const [{ count: total }] = await db
    .select({ count: count() })
    .from(payouts)
    .where(conditions.length > 0 ? and(...conditions) : undefined);

  const mapped: PayoutWithCreator[] = rows.map(r => ({
    ...r.payout,
    creator: {
      id: r.creator.id,
      user: {
        displayName: r.user.name,
        username: r.profile?.username ?? r.user.email.split("@")[0],
      },
    },
  }));

  return { payouts: mapped, total: total ?? 0 };
}

// ═══════════════════════════════════════════════════════════════════════════════
// CONTENT MODERATION
// ═══════════════════════════════════════════════════════════════════════════════

/** Get open moderation reports */


const creatorUser = alias(user, "creator_user");

export async function getOpenReports(limit = 20): Promise<ReportWithDetails[]> {
  const rows = await db
    .select({
      report: reports,
      reportedByUser: user,
      reportedByProfile: profiles,
      reportedCreator: creators,
      reportedCreatorUser: creatorUser, // typed alias
      reportedPost: posts,
    })
    .from(reports)
    .innerJoin(user, eq(reports.reportedByUserId, user.id))
    .leftJoin(profiles, eq(user.id, profiles.id))
    .leftJoin(creators, eq(reports.reportedCreatorId, creators.id))
    .leftJoin(creatorUser, eq(creators.userId, creatorUser.id)) // use alias here
    .leftJoin(posts, eq(reports.reportedPostId, posts.id))
    .where(eq(reports.status, "pending"))
    .orderBy(desc(reports.createdAt))
    .limit(limit);

  return rows.map(r => ({
    ...r.report,
    reportedBy: {
      displayName: r.reportedByUser.name,
      username: r.reportedByProfile?.username ?? r.reportedByUser.email.split("@")[0],
    },
    reportedCreator: r.reportedCreator && r.reportedCreatorUser ? {
      id: r.reportedCreator.id,
      user: {
        displayName: r.reportedCreatorUser.name, // now properly typed
      },
    } : null,
    reportedPost: r.reportedPost ? {
      id: r.reportedPost.id,
      title: r.reportedPost.title,
    } : null,
  }));
}

/** Get report details with full context */
export async function getReportDetails(reportId: string) {
  const [report] = await db
    .select({
      report: reports,
      reportedByUser: user,
      reportedByProfile: profiles,
      reportedCreator: creators,
      reportedPost: posts,
    })
    .from(reports)
    .innerJoin(user, eq(reports.reportedByUserId, user.id))
    .leftJoin(profiles, eq(user.id, profiles.id))
    .leftJoin(creators, eq(reports.reportedCreatorId, creators.id))
    .leftJoin(posts, eq(reports.reportedPostId, posts.id))
    .where(eq(reports.id, reportId))
    .limit(1);

  return report;
}

// ═══════════════════════════════════════════════════════════════════════════════
// PLATFORM ANALYTICS
// ═══════════════════════════════════════════════════════════════════════════════

/** Get revenue breakdown by time period */
export async function getRevenueAnalytics(period: "week" | "month" | "year") {
  const now = new Date();
  let startDate: Date;

  switch (period) {
    case "week":
      startDate = new Date(now);
      startDate.setDate(startDate.getDate() - 7);
      break;
    case "month":
      startDate = new Date(now);
      startDate.setMonth(startDate.getMonth() - 1);
      break;
    case "year":
      startDate = new Date(now);
      startDate.setFullYear(startDate.getFullYear() - 1);
      break;
  }

  const [
    [{ total: subscriptionRevenue }],
    [{ total: ppvRevenue }],
    [{ total: tipRevenue }],
  ] = await Promise.all([
    db.select({ total: sum(transactions.amount) })
      .from(transactions)
      .where(and(
        eq(transactions.type, "subscription"),
        gte(transactions.createdAt, startDate)
      )),
    db.select({ total: sum(transactions.amount) })
      .from(transactions)
      .where(and(
        eq(transactions.type, "ppv"),
        gte(transactions.createdAt, startDate)
      )),
    db.select({ total: sum(transactions.amount) })
      .from(transactions)
      .where(and(
        eq(transactions.type, "tip"),
        gte(transactions.createdAt, startDate)
      )),
  ]);

  return {
    subscriptions: Number(subscriptionRevenue ?? 0),
    ppv: Number(ppvRevenue ?? 0),
    tips: Number(tipRevenue ?? 0),
    total: Number(subscriptionRevenue ?? 0) + Number(ppvRevenue ?? 0) + Number(tipRevenue ?? 0),
  };
}