// app/dashboard/creator/content/page.tsx
import { requireRole } from "@/lib/auth/guard";
import { getCreatorPosts, getCreatorStats } from "@/lib/queries/creator";
import { db } from "@/db";
import { creators } from "@/db/schema";
import { eq } from "drizzle-orm";
import { ContentGrid } from "@/components/creator/ContentGrid";
import { redirect } from "next/navigation";

export default async function CreatorContentPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; filter?: string }>;
}) {
  const { user } = await requireRole("creator");

  // Get creator record
  const [creator] = await db
    .select()
    .from(creators)
    .where(eq(creators.userId, user.id))
    .limit(1);

  if (!creator) {
    redirect("/onboarding/creator");
  }

  // ✅ Await searchParams before using
  const params = await searchParams;
  const page = parseInt(params.page || "1");
  const filter = params.filter as "all" | "published" | "locked" | undefined;

  // Build filters
  const filters: any = {};
  if (filter === "published") {
    filters.isPublished = true;
  }
  if (filter === "locked") {
    filters.isLocked = true;
  }

  // Get posts
  const { posts, total } = await getCreatorPosts(creator.id, page, 12, filters);

  // Get stats
  const stats = await getCreatorStats(creator.id);

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-900 via-black to-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-black text-white mb-2">📸 My Content</h1>
          <p className="text-gray-400">
            Manage your posts, view analytics, and create new content
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="bg-gray-900/50 backdrop-blur-sm rounded-xl p-4 border border-white/10"
            >
              <div className="text-gray-400 text-sm mb-1">{stat.label}</div>
              <div className="text-white font-bold text-2xl mb-1">
                {stat.value}
              </div>
              <div
                className={`text-sm ${
                  stat.up ? "text-green-400" : "text-red-400"
                }`}
              >
                {stat.change}
              </div>
            </div>
          ))}
        </div>

        {/* Content Grid */}
        <ContentGrid
          posts={posts}
          total={total}
          currentPage={page}
          currentFilter={filter || "all"}
          creatorId={creator.id}
        />
      </div>
    </div>
  );
}

export const metadata = {
  title: "My Content - FanVault",
  description: "Manage your content",
};