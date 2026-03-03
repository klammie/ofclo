// lib/queries/messages.ts
// Message queries - SERVER ONLY

import { db } from "@/db";
import { messages, conversations, user, profiles } from "@/db/schema";
import { eq, and, or, desc, sql } from "drizzle-orm";

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
export async function getMessageHistory(
  userId: string,
  otherUserId: string,
  limit: number = 50
): Promise<MessageWithSender[]> {
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
    .limit(limit);

  return rows.map(row => ({
    id: row.message.id,
    fromUserId: row.message.fromUserId,
    toUserId: row.message.toUserId,
    content: row.message.content,
    isRead: row.message.isRead,
    createdAt: row.message.createdAt,
    sender: {
      name: row.sender.name,
      username: row.senderProfile?.username || row.sender.email.split('@')[0],
      avatarUrl: row.senderProfile?.avatarUrl || row.sender.image || null,
    },
  })).reverse(); // Reverse to show oldest first
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