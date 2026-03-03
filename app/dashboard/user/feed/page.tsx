// app/dashboard/user/feed/page.tsx
import { requireRole } from "@/lib/auth/guard";
import { getFeedPosts } from "@/lib/queries/feed";
import { FeedGrid } from "@/components/feed/FeedGrid";

export default async function UserFeedPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { user } = await requireRole("user", "creator", "agency");

  const params = await searchParams;
  const page = parseInt(params.page || "1");

  const posts = await getFeedPosts(user.id, page, 20);

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-900 via-black to-gray-900 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-black text-white mb-2">🏠 Feed</h1>
          <p className="text-gray-400">Latest posts from creators you follow</p>
        </div>

        <FeedGrid posts={posts} currentUserId={user.id} />
      </div>
    </div>
  );
}

export const metadata = {
  title: "Feed - FanVault",
  description: "Your personalized feed",
};