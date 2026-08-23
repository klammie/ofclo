// app/dashboard/user/feed/page.tsx
import { requireRole } from "@/lib/auth/guard";
import { getFeedPosts } from "@/lib/queries/feed";
import { FeedGrid } from "@/components/feed/FeedGrid";
import { SuggestedCreatorsSidebar } from "@/components/feed/SuggestedCreatorFeed";
import { db } from "@/db";
import { creators, user, profiles, subscriptions } from "@/db/schema";
import { eq, and, ne, notInArray, sql } from "drizzle-orm";
import { getSuggestedCreators } from "@/lib/queries/suggested-creators";

// ─── Fetch suggested creators server-side ─────────────────────────────────────



// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function UserFeedPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { user: sessionUser } = await requireRole("user", "creator", "agency");

  const params = await searchParams;
  const page   = parseInt(params.page ?? "1");

  const [posts, suggestedCreators] = await Promise.all([
    getFeedPosts(sessionUser.id, page, 20),
    getSuggestedCreators(sessionUser.id),
  ]);

  return (
  <div className="w-full" style={{ fontFamily: "'Be Vietnam Pro', sans-serif" }}>
    <div
      className="flex gap-6 max-w-6xl mx-auto"
      style={{ alignItems: "flex-start" }} 
    >

      {/* ── Centre: feed — scrolls independently ── */}
      <main className="flex-1 min-w-0">
        
        <FeedGrid posts={posts} currentUserId={sessionUser.id} />
      </main>

      {/* ── Right: sticky sidebar ── */}
      <aside className="hidden lg:block w-72 flex-shrink-0">
  <div
    style={{
      position:       "fixed",
      top:            "5rem",
      right:          "calc((100vw - 72rem - var(--sidebar-width, 256px)) / 2)",
      width:          "18rem",
      maxHeight:      "calc(100vh - 5.5rem)",
      overflowY:      "auto",
      scrollbarWidth: "none",
      transition:     "right 0.3s ease",  // matches sidebar animation
}}
  >
    <SuggestedCreatorsSidebar
      initialCreators={suggestedCreators}
      currentUserId={sessionUser.id}
    />
  </div>
</aside>

    </div>
  </div>
);
}

export const metadata = {
  title: "Feed · Fanzluv",
  description: "Your personalized feed",
};