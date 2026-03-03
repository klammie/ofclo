// app/dashboard/user/discover/page.tsx
// Creator discovery with direct subscription (no payment)

import { requireRole } from "@/lib/auth/guard";
import { getDiscoverCreators } from "@/lib/queries/user";
import { CreatorDiscoveryGrid } from "@/components/user/CreatorDisoveryGrid";

export default async function UserDiscoverPage({
  searchParams,
}: {
  searchParams?: { page?: string };
}) {
  const { user } = await requireRole("user", "creator", "agency");

  // Safely parse page param
  const page = parseInt(searchParams?.page ?? "1", 10);

  // Get featured creators and user's existing subscriptions
  const { creators, total } = await getDiscoverCreators(user.id, page, 24);

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-900 via-black to-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-black text-white mb-2">
            🔍 Discover Creators
          </h1>
          <p className="text-gray-400">
            Find and subscribe to your favorite content creators
          </p>
        </div>

        {/* Creators Grid */}
        <CreatorDiscoveryGrid
          creators={creators}
          currentUserId={user.id}
          total={total}
          currentPage={page}
        />
      </div>
    </div>
  );
}

export const metadata = {
  title: "Discover Creators - FanVault",
  description: "Find and subscribe to content creators",
};