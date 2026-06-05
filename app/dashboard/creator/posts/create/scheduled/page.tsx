// app/dashboard/creator/posts/scheduled/page.tsx
import { requireRole } from "@/lib/auth/guard";
import { db } from "@/db";
import { creators, posts } from "@/db/schema";
import { eq, and, gte } from "drizzle-orm";
import { redirect } from "next/navigation";
import { ScheduledPostsList } from "@/components/creator/ScheduledPostsList";

export default async function ScheduledPostsPage() {
  const { user } = await requireRole("creator");

  // Get creator
  const [creator] = await db
    .select()
    .from(creators)
    .where(eq(creators.userId, user.id))
    .limit(1);

  if (!creator) {
    redirect("/onboarding/creator");
  }

  // Get scheduled posts
  const scheduledPosts = await db
    .select()
    .from(posts)
    .where(
      and(
        eq(posts.creatorId, creator.id),
        eq(posts.status, "scheduled"),
        gte(posts.scheduledFor, new Date())
      )
    )
    .orderBy(posts.scheduledFor);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-black text-white mb-2">
            📅 Scheduled Posts
          </h1>
          <p className="text-gray-400">
            Posts waiting to be published ({scheduledPosts.length})
          </p>
        </div>

        <ScheduledPostsList posts={scheduledPosts} />
      </div>
    </div>
  );
}

export const metadata = {
  title: "Scheduled Posts - FanVault Creator",
  description: "Manage your scheduled posts",
};