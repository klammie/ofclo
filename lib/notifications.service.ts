import { db } from "@/db";
import { notifications, subscriptions, profiles, creators } from "@/db/schema";
import { and, eq, desc, lt, sql } from "drizzle-orm";
import { randomUUID } from "crypto";
import type {
  Notification,
  NotificationSummary,
  NotificationType,
  NotificationPriority,
} from "@/types/notifications";

// ─── Map DB row → Notification ────────────────────────────────────────────────

function toNotification(r: typeof notifications.$inferSelect): Notification {
  return {
    id:           r.id,
    userId:       r.userId,
    type:         r.type as NotificationType,
    priority:     r.priority as NotificationPriority,
    title:        r.title,
    body:         r.body,
    icon:         r.icon,
    imageUrl:     r.imageUrl ?? undefined,
    actionUrl:    r.actionUrl ?? undefined,
    isRead:       r.isRead,
    createdAt:    r.createdAt.toISOString(),
    actorName:    r.actorName ?? undefined,
    actorAvatar:  r.actorAvatar ?? undefined,
    entityId:     r.entityId ?? undefined,
  };
}

// ─── Fetch notifications ──────────────────────────────────────────────────────

export async function getUserNotifications(
  userId: string,
  limit = 30,
  cursor?: string   // createdAt of last item for pagination
): Promise<NotificationSummary> {
  const [rows, unreadResult] = await Promise.all([
    db.query.notifications.findMany({
      where: cursor
        ? and(eq(notifications.userId, userId), lt(notifications.createdAt, new Date(cursor)))
        : eq(notifications.userId, userId),
      orderBy: [desc(notifications.createdAt)],
      limit,
    }),

    db
      .select({ count: sql<number>`count(*)::int` })
      .from(notifications)
      .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false))),
  ]);

  return {
    total:       rows.length,
    unreadCount: unreadResult[0]?.count ?? 0,
    notifications: rows.map(toNotification),
  };
}

// ─── Mark single notification as read ────────────────────────────────────────

export async function markNotificationRead(
  notificationId: string,
  userId: string
): Promise<void> {
  await db
    .update(notifications)
    .set({ isRead: true, readAt: new Date() })
    .where(
      and(
        eq(notifications.id, notificationId),
        eq(notifications.userId, userId)
      )
    );
}

// ─── Mark all as read ─────────────────────────────────────────────────────────

export async function markAllRead(userId: string): Promise<number> {
  const result = await db
    .update(notifications)
    .set({ isRead: true, readAt: new Date() })
    .where(
      and(eq(notifications.userId, userId), eq(notifications.isRead, false))
    )
    .returning({ id: notifications.id });

  return result.length;
}

// ─── Create notification (call this from anywhere in your app) ────────────────

export async function createNotification(params: {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  icon?: string;
  priority?: NotificationPriority;
  actionUrl?: string;
  imageUrl?: string;
  actorId?: string;
  actorName?: string;
  actorAvatar?: string;
  entityId?: string;
}): Promise<void> {
  await db.insert(notifications).values({
    id:          randomUUID(),
    userId:      params.userId,
    type:        params.type,
    priority:    params.priority ?? "medium",
    title:       params.title,
    body:        params.body,
    icon:        params.icon ?? NOTIFICATION_ICONS[params.type] ?? "🔔",
    imageUrl:    params.imageUrl,
    actionUrl:   params.actionUrl,
    actorId:     params.actorId,
    actorName:   params.actorName,
    actorAvatar: params.actorAvatar,
    entityId:    params.entityId,
    isRead:      false,
  });
}

// ─── Convenience helpers (call from your existing routes) ─────────────────────

export async function notifyNewSubscriber(creatorId: string, subscriberName: string, subscriberAvatar?: string) {
  await createNotification({
    userId: creatorId, type: "new_subscriber",
    title: "New Subscriber! 🎉",
    body: `${subscriberName} just subscribed to your page.`,
    actorName: subscriberName, actorAvatar: subscriberAvatar,
    actionUrl: "/dashboard/creator/subscribers", priority: "high",
  });
}

export async function notifyNewTip(creatorId: string, tipperName: string, amountCents: number, actorAvatar?: string) {
  await createNotification({
    userId: creatorId, type: "new_tip",
    title: "You received a tip! 💝",
    body: `${tipperName} tipped you $${(amountCents / 100).toFixed(2)}.`,
    actorName: tipperName, actorAvatar: actorAvatar,
    actionUrl: "/dashboard/creator/earnings", priority: "high",
  });
}

export async function notifyNewMessage(userId: string, senderName: string, preview: string, actorAvatar?: string) {
  await createNotification({
    userId, type: "new_message",
    title: `New message from ${senderName}`,
    body: preview.slice(0, 80) + (preview.length > 80 ? "…" : ""),
    actorName: senderName, actorAvatar: actorAvatar,
    actionUrl: "/dashboard/user/message", priority: "high",
  });
}

export async function notifyNewLike(userId: string, likerName: string, postPreview: string) {
  await createNotification({
    userId, type: "new_like",
    title: `${likerName} liked your post`,
    body: postPreview.slice(0, 80),
    actorName: likerName,
    actionUrl: "/dashboard/creator/content",
  });
}

export async function notifyNewComment(userId: string, commenterName: string, comment: string, postId: string) {
  await createNotification({
    userId, type: "new_comment",
    title: `${commenterName} commented on your post`,
    body: comment.slice(0, 80),
    actorName: commenterName,
    actionUrl: `/post/${postId}`,
  });
}

export async function notifyNewPost(subscriberId: string, creatorName: string, postPreview: string, postId: string, creatorAvatar?: string) {
  await createNotification({
    userId: subscriberId, type: "new_post",
    title: `${creatorName} posted new content`,
    body: postPreview.slice(0, 80),
    actorName: creatorName, actorAvatar: creatorAvatar,
    actionUrl: `/post/${postId}`, priority: "low",
  });
}

export async function notifyLevelUp(userId: string, newLevel: number) {
  await createNotification({
    userId, type: "level_up",
    title: `Level ${newLevel} unlocked! 🎉`,
    body: "You've reached a new level in the Fan Pass. Check your new rewards!",
    actionUrl: "/dashboard/user/fan-pass", priority: "high",
  });
}

export async function notifyStreakReminder(userId: string, currentStreak: number) {
  await createNotification({
    userId, type: "streak_reminder",
    title: "Don't break your streak! 🔥",
    body: `You have a ${currentStreak}-day streak. Claim your daily bonus before midnight!`,
    actionUrl: "/dashboard/user/fan-pass", priority: "high",
  });
}

export async function notifyDepositConfirmed(userId: string, amountCents: number) {
  await createNotification({
    userId, type: "deposit_confirmed",
    title: "Deposit confirmed ✅",
    body: `$${(amountCents / 100).toFixed(2)} has been added to your wallet.`,
    actionUrl: "/dashboard/user/wallet", priority: "high",
  });
}

export async function notifyWithdrawalStatus(userId: string, amountCents: number, approved: boolean) {
  await createNotification({
    userId,
    type: approved ? "withdrawal_approved" : "withdrawal_rejected",
    title: approved ? "Withdrawal approved ✅" : "Withdrawal rejected ❌",
    body: approved
      ? `Your withdrawal of $${(amountCents / 100).toFixed(2)} is on its way.`
      : `Your withdrawal of $${(amountCents / 100).toFixed(2)} was rejected. Please contact support.`,
    actionUrl: "/dashboard/user/wallet",
    priority: "high",
  });
}

export async function notifyCoinEarned(userId: string, coins: number, reason: string) {
  await createNotification({
    userId, type: "coin_earned",
    title: `+${coins.toLocaleString()} coins earned! 💰`,
    body: reason,
    actionUrl: "/dashboard/user/fan-pass", priority: "low",
  });
}

export async function notifyWelcome(userId: string, name: string) {
  await createNotification({
    userId, type: "welcome",
    title: `Welcome to Fanzluv, ${name}! 🎉`,
    body: "Start by exploring creators, subscribing to your favourites, and earning Fan Pass rewards.",
    actionUrl: "/dashboard/user/discover", priority: "high",
  });
}

// ─── Notify all subscribers of a new post ─────────────────────────────────────
// Called from /api/creator/posts after a post is published.
// Fans out one notification per active subscriber — batched in groups of 50.

export async function notifySubscribersOfNewPost(params: {
  creatorId:     string;
  creatorName:   string;
  creatorAvatar: string | null;
  postId:        string;
  postPreview:   string;
}): Promise<void> {
  const { creatorId, creatorName, creatorAvatar, postId, postPreview } = params;

  // Fetch all active subscribers
  const subs = await db
    .select({ userId: subscriptions.userId })
    .from(subscriptions)
    .where(
      and(
        eq(subscriptions.creatorId, creatorId),
        eq(subscriptions.status,    "active"),
      )
    );

  if (subs.length === 0) return;

  const preview   = postPreview?.slice(0, 80) || "New content just dropped!";
  const actionUrl = `/dashboard/user/feed?post=${postId}`;

  const rows = subs.map((sub) => ({
    id:          randomUUID(),
    userId:      sub.userId,
    type:        "new_post" as const,
    priority:    "low" as const,
    title:       `${creatorName} posted new content`,
    body:        preview,
    icon:        "📸",
    imageUrl:    creatorAvatar ?? null,
    actionUrl,
    actorName:   creatorName,
    actorAvatar: creatorAvatar ?? null,
    entityId:    postId,
    isRead:      false,
    createdAt:   new Date(),
  }));

  // Batch inserts of 50 to avoid statement size limits
  const BATCH = 50;
  for (let i = 0; i < rows.length; i += BATCH) {
    await db.insert(notifications).values(rows.slice(i, i + BATCH));
  }
}

// ─── Icon map ─────────────────────────────────────────────────────────────────

export const NOTIFICATION_ICONS: Partial<Record<NotificationType, string>> = {
  new_subscriber:       "👥",
  new_message:          "💬",
  new_tip:              "💝",
  new_like:             "❤️",
  new_comment:          "💬",
  subscription_expiring:"⚠️",
  new_post:             "📸",
  ppv_purchased:        "🎬",
  campaign_milestone:   "🎯",
  campaign_reward:      "🎁",
  coin_earned:          "💰",
  level_up:             "⭐",
  streak_reminder:      "🔥",
  streak_broken:        "💔",
  shop_purchase:        "🛍️",
  withdrawal_approved:  "✅",
  withdrawal_rejected:  "❌",
  deposit_confirmed:    "💳",
  system:               "📢",
  welcome:              "🎉",
};