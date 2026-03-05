// lib/queries/messages.ts
// Message queries - SERVER ONLY

import { db } from "@/db";
import { messages, conversations, user, profiles } from "@/db/schema";
import { eq, and, or, desc, sql } from "drizzle-orm";
import { ppvPurchases } from "@/db/schema";

export type ConversationWithUser = {
  conversationId: string;
  otherUser: {
    id: string;
    name: string;
    username: string;
    avatarUrl: string | null;
  };
  lastMessage: {
    content: string;
    timestamp: Date;
  };
  unreadCount: number;
  updatedAt: Date;
};

export type MessageWithSender = {
  id: string;
  fromUserId: string;
  toUserId: string;
  content: string;
  isRead: boolean;
  createdAt: Date;
  sender: {
    name: string;
    username: string;
    avatarUrl: string | null;
  };
};

/**
 * Get all conversations for a user
 */
export async function getUserConversations(
  userId: string
): Promise<ConversationWithUser[]> {
  const rows = await db.execute<{
    conversation_id: string;
    other_user_id: string;
    other_user_name: string;
    other_user_username: string | null;
    other_user_avatar: string | null;
    last_message_content: string;
    last_message_at: Date;
    unread_count: number;
    updated_at: Date;
  }>(sql`
    SELECT 
      c.id as conversation_id,
      CASE 
        WHEN c.participant1_id = ${userId} THEN c.participant2_id
        ELSE c.participant1_id
      END as other_user_id,
      u.name as other_user_name,
      p.username as other_user_username,
      p.avatar_url as other_user_avatar,
      c.last_message_content,
      c.last_message_at,
      CASE 
        WHEN c.participant1_id = ${userId} THEN c.unread_count_user1
        ELSE c.unread_count_user2
      END as unread_count,
      c.updated_at
    FROM ${conversations} c
    JOIN ${user} u ON (
      CASE 
        WHEN c.participant1_id = ${userId} THEN c.participant2_id
        ELSE c.participant1_id
      END = u.id
    )
    LEFT JOIN ${profiles} p ON u.id = p.id
    WHERE c.participant1_id = ${userId} OR c.participant2_id = ${userId}
    ORDER BY c.last_message_at DESC
  `);

  return rows.rows.map(row => ({
    conversationId: row.conversation_id,
    otherUser: {
      id: row.other_user_id,
      name: row.other_user_name,
      username: row.other_user_username || row.other_user_name.toLowerCase().replace(/\s+/g, ''),
      avatarUrl: row.other_user_avatar,
    },
    lastMessage: {
      content: row.last_message_content,
      timestamp: row.last_message_at,
    },
    unreadCount: row.unread_count,
    updatedAt: row.updated_at,
  }));
}

/**
 * Get message history between two users
 */
// lib/queries/messages.ts (or wherever you have this)
export async function getMessageHistory(userId1: string, userId2: string, limit: number = 50) {
  const messageHistory = await db.execute<{
    id: string;
    from_user_id: string;
    to_user_id: string;
    content: string | null;
    media_type: string | null;
    media_url: string | null;
    thumbnail_url: string | null;
    is_ppv: boolean;
    ppv_price: string | null;
    is_read: boolean;
    created_at: Date;
  }>(sql`
    SELECT 
      id,
      from_user_id,
      to_user_id,
      content,
      media_type,
      media_url,
      thumbnail_url,
      is_ppv,
      ppv_price,
      is_read,
      created_at
    FROM ${messages}
    WHERE (from_user_id = ${userId1} AND to_user_id = ${userId2})
       OR (from_user_id = ${userId2} AND to_user_id = ${userId1})
    ORDER BY created_at ASC
    LIMIT ${limit}
  `);

  return messageHistory.rows.map(row => ({
    id: row.id,
    fromUserId: row.from_user_id,
    toUserId: row.to_user_id,
    content: row.content,
    mediaType: row.media_type,
    mediaUrl: row.media_url,
    thumbnailUrl: row.thumbnail_url,
    isPpv: row.is_ppv,
    ppvPrice: row.ppv_price,
    isRead: row.is_read,
    createdAt: row.created_at,
    isUnlocked: false, // Check if user has unlocked this
  }));
}

// lib/queries/messages.ts


export async function getMessageHistoryWithUnlocks(
  currentUserId: string,
  otherUserId: string,
  limit: number = 50
) {
  const messageHistory = await db.execute<{
    id: string;
    from_user_id: string;
    to_user_id: string;
    content: string | null;
    media_type: string | null;
    media_url: string | null;
    thumbnail_url: string | null;
    is_ppv: boolean;
    ppv_price: string | null;
    is_read: boolean;
    created_at: Date;
    is_unlocked: boolean;
  }>(sql`
    SELECT 
      m.id,
      m.from_user_id,
      m.to_user_id,
      m.content,
      m.media_type,
      m.media_url,
      m.thumbnail_url,
      m.is_ppv,
      m.ppv_price,
      m.is_read,
      m.created_at,
      EXISTS(
        SELECT 1 FROM ${ppvPurchases} p
        WHERE p.message_id = m.id AND p.user_id = ${currentUserId}
      ) as is_unlocked
    FROM ${messages} m
    WHERE (m.from_user_id = ${currentUserId} AND m.to_user_id = ${otherUserId})
       OR (m.from_user_id = ${otherUserId} AND m.to_user_id = ${currentUserId})
    ORDER BY m.created_at ASC
    LIMIT ${limit}
  `);

  return messageHistory.rows.map(row => ({
    id: row.id,
    fromUserId: row.from_user_id,
    toUserId: row.to_user_id,
    content: row.content,
    mediaType: row.media_type,
    mediaUrl: row.media_url,
    thumbnailUrl: row.thumbnail_url,
    isPpv: row.is_ppv,
    ppvPrice: row.ppv_price,
    isRead: row.is_read,
    createdAt: row.created_at,
    isUnlocked: row.is_unlocked,
    isOwn: row.from_user_id === currentUserId, // ✅ Add this
  }));
}

/**
 * Get total unread message count for a user
 */
export async function getTotalUnreadCount(userId: string): Promise<number> {
  const result = await db.execute<{ total: number }>(sql`
    SELECT 
      COALESCE(
        SUM(
          CASE 
            WHEN participant1_id = ${userId} THEN unread_count_user1
            ELSE unread_count_user2
          END
        ), 0
      )::int as total
    FROM ${conversations}
    WHERE participant1_id = ${userId} OR participant2_id = ${userId}
  `);

  return result.rows[0]?.total ?? 0;
}

/**
 * Check if user can message another user
 * (e.g., must be subscribed to creator)
 */
export async function canUserMessage(
  fromUserId: string,
  toUserId: string
): Promise<boolean> {
  // For now, allow anyone to message anyone
  // You can add subscription checks here later
  return true;

  /* Example with subscription check:
  const [subscription] = await db
    .select()
    .from(subscriptions)
    .where(
      and(
        eq(subscriptions.userId, fromUserId),
        eq(subscriptions.creatorId, toUserId), // If toUser is creator
        eq(subscriptions.status, 'active')
      )
    )
    .limit(1);

  return !!subscription;
  */
}