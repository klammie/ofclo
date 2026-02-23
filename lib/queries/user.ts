// lib/queries/user.ts
// User/Fan queries — SERVER ONLY
// Queries for regular users to browse content, manage subscriptions, and wallet

import { db } from "@/db";
import {
  user, creators, posts, subscriptions, ppvUnlocks, transactions,
  tips, profiles, messages,
} from "@/db/schema";
import { eq, desc, and, inArray, sql, or, gte, SQL, lte } from "drizzle-orm";
import type {
  PostWithAccess, SubscriptionWithCreator, Transaction, StatItem,
  CreatorCardData, MessageWithSender,
} from "@/lib/types";

// ═══════════════════════════════════════════════════════════════════════════════
// USER STATS
// ═══════════════════════════════════════════════════════════════════════════════

/** Get user dashboard stats */
export async function getUserStats(userId: string): Promise<StatItem[]> {
  const [
    [{ subCount }],
    [{ totalSpent }],
    [{ unlockedCount }],
    [{ tipsSent }],
  ] = await Promise.all([
    // Active subscriptions
    db.select({ subCount: sql<number>`COUNT(*)`.as("sub_count") })
      .from(subscriptions)
      .where(and(
        eq(subscriptions.userId, userId),
        eq(subscriptions.status, "active")
      )),

    // Total amount spent
    db.select({ totalSpent: sql<string>`COALESCE(SUM(amount), 0)`.as("total_spent") })
      .from(transactions)
      .where(eq(transactions.userId, userId)),

    // PPV content unlocked
    db.select({ unlockedCount: sql<number>`COUNT(*)`.as("unlocked_count") })
      .from(ppvUnlocks)
      .where(and(
        eq(ppvUnlocks.userId, userId),
        eq(ppvUnlocks.paymentStatus, "completed")
      )),

    // Tips sent
    db.select({ tipsSent: sql<string>`COALESCE(SUM(amount), 0)`.as("tips_sent") })
      .from(tips)
      .where(and(
        eq(tips.fromUserId, userId),
        eq(tips.paymentStatus, "completed")
      )),
  ]);

  return [
    {
      label: "Active Subs",
      value: (subCount ?? 0).toString(),
      change: "+1",
      up: true,
    },
    {
      label: "Amount Spent",
      value: `$${Number(totalSpent ?? 0).toFixed(2)}`,
      change: "+$45",
      up: false, // spending is red
    },
    {
      label: "Content Unlocked",
      value: (unlockedCount ?? 0).toString(),
      change: "+4",
      up: true,
    },
    {
      label: "Tips Sent",
      value: `$${Number(tipsSent ?? 0).toFixed(2)}`,
      change: "+$25",
      up: false,
    },
  ];
}

// ═══════════════════════════════════════════════════════════════════════════════
// CONTENT FEED
// ═══════════════════════════════════════════════════════════════════════════════

/** Get personalized content feed from subscribed creators */
export async function getUserFeed(
  userId: string,
  page = 1,
  pageSize = 20
): Promise<{ posts: PostWithAccess[]; total: number }> {
  const offset = (page - 1) * pageSize;

  // 1. Get active subscription creator IDs
  const activeSubs = await db
    .select({ creatorId: subscriptions.creatorId })
    .from(subscriptions)
    .where(and(
      eq(subscriptions.userId, userId),
      eq(subscriptions.status, "active")
    ));

  const creatorIds = activeSubs.map(s => s.creatorId);
  
  if (creatorIds.length === 0) {
    return { posts: [], total: 0 };
  }

  // 2. Get PPV-unlocked post IDs
  const unlocked = await db
    .select({ postId: ppvUnlocks.postId })
    .from(ppvUnlocks)
    .where(and(
      eq(ppvUnlocks.userId, userId),
      eq(ppvUnlocks.paymentStatus, "completed")
    ));

  const unlockedPostIds = new Set(unlocked.map(u => u.postId));

  // 3. Fetch posts from subscribed creators
  const rows = await db
    .select({
      post: posts,
      creator: creators,
      creatorUser: user,
      creatorProfile: profiles,
      // Check if user has liked this post
      hasLiked: sql<boolean>`
        EXISTS(
          SELECT 1 FROM post_likes
          WHERE post_id = ${posts.id}
            AND user_id = ${userId}
        )
      `.as("has_liked"),
    })
    .from(posts)
    .innerJoin(creators, eq(posts.creatorId, creators.id))
    .innerJoin(user, eq(creators.userId, user.id))
    .leftJoin(profiles, eq(user.id, profiles.id))
    .where(and(
      inArray(posts.creatorId, creatorIds),
      eq(posts.isPublished, true)
    ))
    .orderBy(desc(posts.createdAt))
    .limit(pageSize)
    .offset(offset);

  // 4. Get total count
  const [{ count: total }] = await db
    .select({ count: sql<number>`COUNT(*)`.as("count") })
    .from(posts)
    .where(and(
      inArray(posts.creatorId, creatorIds),
      eq(posts.isPublished, true)
    ));

  // 5. Annotate with access flag
  const mapped: PostWithAccess[] = rows.map(r => ({
    ...r.post,
    isUnlocked: !r.post.isLocked || unlockedPostIds.has(r.post.id),
    hasLiked: r.hasLiked ?? false,
    creator: {
      id: r.creator.id,
      user: {
        displayName: r.creatorUser.name,
        username: r.creatorProfile?.username ?? r.creatorUser.email.split("@")[0],
        avatarUrl: r.creatorProfile?.avatarUrl ?? r.creatorUser.image ?? null,
      },
    },
  }));

  return { posts: mapped, total: total ?? 0 };
}

/** Check if user has access to a specific post */
export async function hasPostAccess(userId: string, postId: string): Promise<boolean> {
  const [post] = await db
    .select()
    .from(posts)
    .where(eq(posts.id, postId))
    .limit(1);

  if (!post) return false;
  if (!post.isLocked) return true;

  // Check if subscribed to creator
  const [subscription] = await db
    .select()
    .from(subscriptions)
    .where(and(
      eq(subscriptions.userId, userId),
      eq(subscriptions.creatorId, post.creatorId),
      eq(subscriptions.status, "active")
    ))
    .limit(1);

  if (subscription) {
    // If locked but subscriber-only (no PPV price), subscriber has access
    if (!post.ppvPrice) return true;
  }

  // Check PPV unlock
  const [unlock] = await db
    .select()
    .from(ppvUnlocks)
    .where(and(
      eq(ppvUnlocks.userId, userId),
      eq(ppvUnlocks.postId, postId),
      eq(ppvUnlocks.paymentStatus, "completed")
    ))
    .limit(1);

  return !!unlock;
}

// ═══════════════════════════════════════════════════════════════════════════════
// SUBSCRIPTIONS
// ═══════════════════════════════════════════════════════════════════════════════

/** Get user's active subscriptions with creator info + unread messages */
export async function getUserSubscriptions(
  userId: string
): Promise<SubscriptionWithCreator[]> {
  const rows = await db
    .select({
      subscription: subscriptions,
      creator: creators,
      creatorUser: user,
      creatorProfile: profiles,
      unreadMessages: sql<number>`
        (SELECT COUNT(*) FROM ${messages}
         WHERE ${messages.toUserId} = ${userId}
           AND ${messages.fromUserId} = ${user.id}
           AND ${messages.isRead} = false)
      `.as("unread_messages"),
    })
    .from(subscriptions)
    .innerJoin(creators, eq(subscriptions.creatorId, creators.id))
    .innerJoin(user, eq(creators.userId, user.id))
    .leftJoin(profiles, eq(user.id, profiles.id))
    .where(eq(subscriptions.userId, userId))
    .orderBy(desc(subscriptions.currentPeriodEnd));

  return rows.map(r => ({
    ...r.subscription,
    unreadMessages: r.unreadMessages ?? 0,
    creator: {
      id: r.creator.id,
      user: {
        displayName: r.creatorUser.name,
        username: r.creatorProfile?.username ?? r.creatorUser.email.split("@")[0],
        avatarUrl: r.creatorProfile?.avatarUrl ?? r.creatorUser.image ?? null,
      },
    },
  })) as SubscriptionWithCreator[];
}

/** Check if user is subscribed to a creator */
export async function isSubscribedToCreator(
  userId: string,
  creatorId: string
): Promise<boolean> {
  const [subscription] = await db
    .select()
    .from(subscriptions)
    .where(and(
      eq(subscriptions.userId, userId),
      eq(subscriptions.creatorId, creatorId),
      eq(subscriptions.status, "active")
    ))
    .limit(1);

  return !!subscription;
}

// ═══════════════════════════════════════════════════════════════════════════════
// WALLET & TRANSACTIONS
// ═══════════════════════════════════════════════════════════════════════════════

/** Get user's transaction history */
export async function getUserTransactions(
  userId: string,
  page = 1,
  pageSize = 50
): Promise<{ transactions: Transaction[]; total: number }> {
  const offset = (page - 1) * pageSize;

  const rows = await db
    .select()
    .from(transactions)
    .where(eq(transactions.userId, userId))
    .orderBy(desc(transactions.createdAt))
    .limit(pageSize)
    .offset(offset);

  const [{ count: total }] = await db
    .select({ count: sql<number>`COUNT(*)`.as("count") })
    .from(transactions)
    .where(eq(transactions.userId, userId));

  return { transactions: rows, total: total ?? 0 };
}

/** Get user's wallet balance */
export async function getUserWalletBalance(userId: string): Promise<number> {
  const [profile] = await db
    .select({ walletBalance: profiles.walletBalance })
    .from(profiles)
    .where(eq(profiles.id, userId))
    .limit(1);

  return Number(profile?.walletBalance ?? 0);
}

// ═══════════════════════════════════════════════════════════════════════════════
// CREATOR DISCOVERY
// ═══════════════════════════════════════════════════════════════════════════════

/** Get featured creators for discovery page */
export async function getDiscoverCreators(
  page = 1,
  pageSize = 24,
  filters?: {
    minPrice?: number;
    maxPrice?: number;
    verified?: boolean;
  }
): Promise<{ creators: CreatorCardData[]; total: number }> {
  const offset = (page - 1) * pageSize;

  const conditions: SQL[] = [eq(creators.status, "active")];
  if (filters?.minPrice !== undefined) {
  conditions.push(gte(creators.standardPrice, filters.minPrice));
}
if (filters?.maxPrice !== undefined) {
  conditions.push(lte(creators.standardPrice, filters.maxPrice));
}

  const rows = await db
    .select({
      creator: creators,
      user: user,
      profile: profiles,
      postCount: sql<number>`
        (SELECT COUNT(*) FROM ${posts}
         WHERE ${posts.creatorId} = ${creators.id}
           AND ${posts.isPublished} = true)
      `.as("post_count"),
      recentPostPreview: sql<string>`
        (SELECT ${posts.thumbnailUrl} FROM ${posts}
         WHERE ${posts.creatorId} = ${creators.id}
           AND ${posts.isPublished} = true
         ORDER BY ${posts.createdAt} DESC
         LIMIT 1)
      `.as("recent_post_preview"),
    })
    .from(creators)
    .innerJoin(user, eq(creators.userId, user.id))
    .leftJoin(profiles, eq(user.id, profiles.id))
    .where(and(...conditions))
    .orderBy(desc(creators.subscriberCount))
    .limit(pageSize)
    .offset(offset);

  const [{ count: total }] = await db
    .select({ count: sql<number>`COUNT(*)`.as("count") })
    .from(creators)
    .where(and(...conditions));

  const mapped: CreatorCardData[] = rows.map(r => ({
    id: r.creator.id,
    name: r.user.name,
    username: r.profile?.username ?? r.user.email.split("@")[0],
    avatarUrl: r.profile?.avatarUrl ?? r.user.image ?? null,
    coverImageUrl: r.creator.coverImageUrl,
    bio: r.creator.bio,
    isVerified: r.creator.isVerified,
    subscriberCount: r.creator.subscriberCount,
    postCount: r.postCount ?? 0,
    standardPrice: Number(r.creator.standardPrice),
    vipPrice: Number(r.creator.vipPrice),
    previewImage: r.recentPostPreview,
  }));

  return { creators: mapped, total: total ?? 0 };
}

/** Search creators by name/username */
export async function searchCreators(
  query: string,
  limit = 10
): Promise<CreatorCardData[]> {
  const searchTerm = `%${query.toLowerCase()}%`;

  const rows = await db
    .select({
      creator: creators,
      user: user,
      profile: profiles,
    })
    .from(creators)
    .innerJoin(user, eq(creators.userId, user.id))
    .leftJoin(profiles, eq(user.id, profiles.id))
    .where(and(
      eq(creators.status, "active"),
      or(
        sql`LOWER(${user.name}) LIKE ${searchTerm}`,
        sql`LOWER(${profiles.username}) LIKE ${searchTerm}`
      )
    ))
    .orderBy(desc(creators.subscriberCount))
    .limit(limit);

  return rows.map(r => ({
    id: r.creator.id,
    name: r.user.name,
    username: r.profile?.username ?? r.user.email.split("@")[0],
    avatarUrl: r.profile?.avatarUrl ?? r.user.image ?? null,
    coverImageUrl: r.creator.coverImageUrl,
    bio: r.creator.bio,
    isVerified: r.creator.isVerified,
    subscriberCount: r.creator.subscriberCount,
    postCount: 0,
    standardPrice: Number(r.creator.standardPrice),
    vipPrice: Number(r.creator.vipPrice),
    previewImage: null,
  }));
}

/** Get creator profile for public view */
export async function getCreatorProfile(creatorId: string) {
  const [creator] = await db
    .select({
      creator: creators,
      user: user,
      profile: profiles,
      postCount: sql<number>`
        (SELECT COUNT(*) FROM ${posts}
         WHERE ${posts.creatorId} = ${creators.id}
           AND ${posts.isPublished} = true)
      `.as("post_count"),
    })
    .from(creators)
    .innerJoin(user, eq(creators.userId, user.id))
    .leftJoin(profiles, eq(user.id, profiles.id))
    .where(eq(creators.id, creatorId))
    .limit(1);

  if (!creator) return null;

  return {
    ...creator.creator,
    user: {
      name: creator.user.name,
      username: creator.profile?.username ?? creator.user.email.split("@")[0],
      avatarUrl: creator.profile?.avatarUrl ?? creator.user.image,
    },
    postCount: creator.postCount ?? 0,
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// MESSAGES
// ═══════════════════════════════════════════════════════════════════════════════

/** Get user's DM conversations */
export async function getUserConversations(userId: string) {
  // Get unique user IDs the user has messaged with
  const conversationUsers = await db.execute<{ userId: string }>(sql`
    SELECT DISTINCT
      CASE 
        WHEN ${messages.fromUserId} = ${userId} THEN ${messages.toUserId}
        ELSE ${messages.fromUserId}
      END as user_id
    FROM ${messages}
    WHERE ${messages.fromUserId} = ${userId}
       OR ${messages.toUserId} = ${userId}
  `);

  const userIds = conversationUsers.rows.map(r => r.userId);
  if (userIds.length === 0) return [];

  // Get user details + last message
  const rows = await db
    .select({
      user: user,
      profile: profiles,
      lastMessage: sql<string>`
        (SELECT content FROM ${messages}
         WHERE (${messages.fromUserId} = ${userId} AND ${messages.toUserId} = ${user.id})
            OR (${messages.fromUserId} = ${user.id} AND ${messages.toUserId} = ${userId})
         ORDER BY ${messages.createdAt} DESC
         LIMIT 1)
      `.as("last_message"),
      lastMessageTime: sql<Date>`
        (SELECT created_at FROM ${messages}
         WHERE (${messages.fromUserId} = ${userId} AND ${messages.toUserId} = ${user.id})
            OR (${messages.fromUserId} = ${user.id} AND ${messages.toUserId} = ${userId})
         ORDER BY ${messages.createdAt} DESC
         LIMIT 1)
      `.as("last_message_time"),
      unreadCount: sql<number>`
        (SELECT COUNT(*) FROM ${messages}
         WHERE ${messages.fromUserId} = ${user.id}
           AND ${messages.toUserId} = ${userId}
           AND ${messages.isRead} = false)
      `.as("unread_count"),
    })
    .from(user)
    .leftJoin(profiles, eq(user.id, profiles.id))
    .where(inArray(user.id, userIds));

  return rows.map(r => ({
    userId: r.user.id,
    displayName: r.user.name,
    username: r.profile?.username ?? r.user.email.split("@")[0],
    avatarUrl: r.profile?.avatarUrl ?? r.user.image,
    lastMessage: r.lastMessage,
    lastMessageTime: r.lastMessageTime,
    unreadCount: r.unreadCount ?? 0,
  }));
}

/** Get messages between user and another user */
export async function getMessageThread(
  userId: string,
  otherUserId: string,
  page = 1,
  pageSize = 50
): Promise<{ messages: MessageWithSender[]; total: number }> {
  const offset = (page - 1) * pageSize;

  const rows = await db
    .select({
      message: messages,
      sender: user,
      senderProfile: profiles,
    })
    .from(messages)
    .innerJoin(user, eq(messages.fromUserId, user.id))
    .leftJoin(profiles, eq(user.id, profiles.id))
    .where(
      or(
        and(
          eq(messages.fromUserId, userId),
          eq(messages.toUserId, otherUserId)
        ),
        and(
          eq(messages.fromUserId, otherUserId),
          eq(messages.toUserId, userId)
        )
      )
    )
    .orderBy(desc(messages.createdAt))
    .limit(pageSize)
    .offset(offset);

  const [{ count: total }] = await db
    .select({ count: sql<number>`COUNT(*)`.as("count") })
    .from(messages)
    .where(
      or(
        and(eq(messages.fromUserId, userId), eq(messages.toUserId, otherUserId)),
        and(eq(messages.fromUserId, otherUserId), eq(messages.toUserId, userId))
      )
    );

  const mapped: MessageWithSender[] = rows.map(r => ({
    ...r.message,
    sender: {
      id: r.sender.id,
      displayName: r.sender.name,
      username: r.senderProfile?.username ?? r.sender.email.split("@")[0],
      avatarUrl: r.senderProfile?.avatarUrl ?? r.sender.image ?? null,
    },
  }));

  return { messages: mapped, total: total ?? 0 };
}