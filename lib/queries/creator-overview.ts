// lib/queries/creator-overview.ts
import { db } from "@/db";
import { creators, subscriptions, posts, } from "@/db/schema";
import { sql  } from "drizzle-orm";

export async function getCreatorOverviewStats(creatorId: string) {
  // Get basic stats
  const basicStats = await db.execute<{
    total_subscribers: number;
    vip_subscribers: number;
    standard_subscribers: number;
    total_posts: number;
    total_revenue: string;
    avg_post_likes: string;
  }>(sql`
    SELECT 
      COUNT(DISTINCT CASE WHEN s.status = 'active' THEN s.id END)::int as total_subscribers,
      COUNT(DISTINCT CASE WHEN s.tier = 'vip' AND s.status = 'active' THEN s.id END)::int as vip_subscribers,
      COUNT(DISTINCT CASE WHEN s.tier = 'standard' AND s.status = 'active' THEN s.id END)::int as standard_subscribers,
      (SELECT COUNT(*)::int FROM posts WHERE creator_id = ${creatorId}) as total_posts,
      COALESCE(SUM(s.price_at_subscription::decimal), 0)::text as total_revenue,
      COALESCE(AVG(p.like_count), 0)::text as avg_post_likes
    FROM subscriptions s
    LEFT JOIN posts p ON p.creator_id = ${creatorId}
    WHERE s.creator_id = ${creatorId}
      AND s.status = 'active'
  `);

  // Get subscriber growth (last 30 days)
  const growthData = await db.execute<{
    date: string;
    new_subs: number;
    cancellations: number;
  }>(sql`
    SELECT 
      DATE(created_at) as date,
      COUNT(CASE WHEN status = 'active' THEN 1 END)::int as new_subs,
      0 as cancellations
    FROM subscriptions
    WHERE creator_id = ${creatorId}
      AND created_at >= NOW() - INTERVAL '30 days'
    GROUP BY DATE(created_at)
    ORDER BY date DESC
  `);

  // Get retention rate
  const retentionData = await db.execute<{
    avg_subscription_days: number;
    total_cancelled: number;
    cancellation_rate: string;
  }>(sql`
    SELECT 
      COALESCE(AVG(EXTRACT(DAY FROM (cancelled_at - created_at))), 0)::int as avg_subscription_days,
      COUNT(CASE WHEN status = 'cancelled' THEN 1 END)::int as total_cancelled,
      CASE 
        WHEN COUNT(*) > 0 THEN (COUNT(CASE WHEN status = 'cancelled' THEN 1 END)::float / COUNT(*)::float * 100)::text
        ELSE '0'
      END as cancellation_rate
    FROM subscriptions
    WHERE creator_id = ${creatorId}
  `);

  // Get goals
  const goals = await db.execute<{
    id: string;
    title: string;
    description: string | null;
    goal_type: string;
    target_value: number;
    current_value: number;
    deadline: Date | null;
    is_completed: boolean;
  }>(sql`
    SELECT 
      id,
      title,
      description,
      goal_type,
      target_value,
      current_value,
      deadline,
      is_completed
    FROM creator_goals
    WHERE creator_id = ${creatorId}
    ORDER BY is_completed ASC, created_at DESC
    LIMIT 10
  `);

  // Get upcoming scheduled posts
  const scheduledPosts = await db.execute<{
    id: string;
    title: string;
    description: string | null;
    media_type: string;
    scheduled_for: Date;
    status: string;
  }>(sql`
    SELECT 
      id,
      title,
      description,
      media_type,
      scheduled_for,
      status
    FROM scheduled_posts
    WHERE creator_id = ${creatorId}
      AND status IN ('draft', 'scheduled')
      AND scheduled_for >= NOW()
    ORDER BY scheduled_for ASC
    LIMIT 10
  `);

  return {
    basicStats: basicStats.rows[0],
    growth: growthData.rows,
    retention: retentionData.rows[0],
    goals: goals.rows,
    scheduledPosts: scheduledPosts.rows,
  };
}