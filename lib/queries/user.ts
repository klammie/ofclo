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
/**
 * Get user stats
 */
export async function getUserStats(userId: string) {
  // Count active subscriptions
  const subsCountResult = await db.execute<{ count: number }>(sql`
    SELECT COUNT(*)::int as count
    FROM ${subscriptions}
    WHERE user_id = ${userId}
      AND status = 'active'
  `);

  const activeSubsCount = subsCountResult.rows[0]?.count || 0;

  // Calculate total spent (sum of prices)
  const totalSpentResult = await db.execute<{ total: string }>(sql`
    SELECT COALESCE(SUM(price_at_subscription::decimal), 0)::text as total
    FROM ${subscriptions}
    WHERE user_id = ${userId}
      AND payment_status = 'completed'
  `);

  const totalSpent = parseFloat(totalSpentResult.rows[0]?.total || "0");

  return [
    { label: "Active Subscriptions", value: String(activeSubsCount) },
    { label: "Total Spent", value: `$${totalSpent.toFixed(2)}` },
    { label: "Content Unlocked", value: "0" }, // Placeholder
    { label: "Tips Sent", value: "0" }, // Placeholder
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
  // Use raw SQL for better control and type safety
  const results = await db.execute<{
  subscription_id: string;
  tier: "standard" | "vip";
  status: string;
  price_at_subscription: string;
  current_period_end: Date;
  created_at: Date;
  creator_user_id: string;
  creator_name: string;
  creator_username: string | null;
  creator_avatar_url: string | null;
}>(sql`
  SELECT
    s.id as subscription_id,
    s.tier,
    s.status,
    s.price_at_subscription,
    s.current_period_end,
    s.created_at,
    u.id as creator_user_id,
    u.name as creator_name,
    p.username as creator_username,
    p.avatar_url as creator_avatar_url
  FROM ${subscriptions} s
  JOIN ${creators} c ON s.creator_id = c.id
  JOIN ${user} u ON c.user_id = u.id
  LEFT JOIN ${profiles} p ON p.id = u.id
  WHERE s.user_id = ${userId}
  ORDER BY s.created_at DESC
`);

  // Get unread message counts (optional - remove if conversations table doesn't exist)
  let unreadMap = new Map<string, number>();
  
  try {
    const unreadCounts = await db.execute<{
      creator_user_id: string;
      unread_count: number;
    }>(sql`
      SELECT 
        c.user_id as creator_user_id,
        COALESCE(
          CASE 
            WHEN conv.participant1_id = ${userId} THEN conv.unread_count_user1
            ELSE conv.unread_count_user2
          END, 0
        )::int as unread_count
      FROM ${subscriptions} s
      JOIN ${creators} c ON s.creator_id = c.id
      LEFT JOIN conversations conv ON (
        (conv.participant1_id = ${userId} AND conv.participant2_id = c.user_id)
        OR
        (conv.participant1_id = c.user_id AND conv.participant2_id = ${userId})
      )
      WHERE s.user_id = ${userId}
        AND s.status = 'active'
    `);

    unreadMap = new Map(
      unreadCounts.rows.map(row => [row.creator_user_id, row.unread_count])
    );
  } catch (error) {
    console.log('[getUserSubscriptions] No unread counts available (conversations table may not exist)');
  }

  // Map results to SubscriptionWithCreator type
  return results.rows.map(row => ({
    subscriptionId: row.subscription_id,
    tier: row.tier,
    status: row.status,
    price: parseFloat(row.price_at_subscription),
    nextBillingDate: row.current_period_end,
    subscribedAt: row.created_at,
    creatorUserId: row.creator_user_id,
    creatorName: row.creator_name,
    creatorUsername: row.creator_username || row.creator_name.toLowerCase().replace(/\s+/g, ''),
    creatorAvatarUrl: row.creator_avatar_url,
    creatorCoverUrl: row.creator_cover_url,
    unreadMessageCount: unreadMap.get(row.creator_user_id) || 0,
  }));
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
/**
 * Get discover creators with subscription status
 */
export async function getDiscoverCreators(
  userId: string,
  page: number = 1,
  limit: number = 24
) {
  const offset = (page - 1) * limit;

  // Get creators with subscription status
  const results = await db.execute<{
    creator_id: string;
    user_id: string;
    name: string;
    username: string;
    avatar_url: string | null;
    cover_url: string | null;
    bio: string | null;
    is_verified: boolean;
    subscriber_count: number;
    post_count: number;
    standard_price: string;
    vip_price: string;
    is_subscribed: boolean;
  }>(sql`
    SELECT 
      c.id as creator_id,
      c.user_id,
      u.name,
      COALESCE(p.username, SPLIT_PART(u.email, '@', 1)) as username,
      p.avatar_url,
      p.cover_url,
      p.bio,
      c.is_verified,
      c.subscriber_count,
      c.post_count,
      c.standard_price,
      c.vip_price,
      EXISTS(
        SELECT 1 FROM ${subscriptions} s
        WHERE s.user_id = ${userId}
          AND s.creator_id = c.id
          AND s.status = 'active'
      ) as is_subscribed
    FROM ${creators} c
    JOIN ${user} u ON c.user_id = u.id
    LEFT JOIN ${profiles} p ON u.id = p.id
    WHERE u.role = 'creator'
    ORDER BY c.subscriber_count DESC, c.created_at DESC
    LIMIT ${limit}
    OFFSET ${offset}
  `);

  // Get total count
  const countResult = await db.execute<{ count: number }>(sql`
    SELECT COUNT(*)::int as count
    FROM ${creators} c
    JOIN ${user} u ON c.user_id = u.id
    WHERE u.role = 'creator'
  `);

  const creatorsData = results.rows.map(row => ({
    id: row.creator_id,
    userId: row.user_id,
    name: row.name,
    username: row.username,
    avatarUrl: row.avatar_url,
    coverImageUrl: row.cover_url,
    bio: row.bio,
    isVerified: row.is_verified,
    subscriberCount: row.subscriber_count,
    postCount: row.post_count,
    standardPrice: parseFloat(row.standard_price),
    vipPrice: parseFloat(row.vip_price),
    previewImage: null,
    isSubscribed: row.is_subscribed,
  }));

  return {
    creators: creatorsData,
    total: countResult.rows[0]?.count || 0,
  };
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


export async function isUserSubscribed(
  userId: string,
  creatorId: string
): Promise<boolean> {
  const [subscription] = await db
    .select()
    .from(subscriptions)
    .where(
      and(
        eq(subscriptions.userId, userId),
        eq(subscriptions.creatorId, creatorId),
        eq(subscriptions.status, "active")
      )
    )
    .limit(1);

  return !!subscription;
}