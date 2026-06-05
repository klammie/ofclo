// app/dashboard/user/bookmarks/page.tsx
import { requireRole } from "@/lib/auth/guard";
import { getBookmarkedPosts } from "@/lib/queries/bookmarks";
import { BookmarksGrid } from "@/components/bookmarks/BookmarksGrid";

export default async function BookmarksPage() {
  const { user } = await requireRole("user", "creator", "agency");

  const bookmarkedPosts = await getBookmarkedPosts(user.id);

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-900 via-black to-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-black text-white mb-2">
            🔖 Bookmarks
          </h1>
          <p className="text-gray-400">
            Your saved posts ({bookmarkedPosts.length})
          </p>
        </div>

        <BookmarksGrid posts={bookmarkedPosts} currentUserId={user.id} />
      </div>
    </div>
  );
}

export const metadata = {
  title: "Bookmarks - FanVault",
  description: "Your saved posts",
};