// app/dashboard/user/subscriptions/page.tsx
// User subscriptions - view all creators user is subscribed to

import { requireRole } from "@/lib/auth/guard";
import { getUserSubscriptions, getUserStats } from "@/lib/queries/user";
import { SubscriptionsList } from "@/components/user/SubscriptionList";

export default async function UserSubscriptionsPage() {
  const { user } = await requireRole("user", "creator", "agency");

  // Get subscriptions
  const subscriptions = await getUserSubscriptions(user.id);

  // Get stats
  const stats = await getUserStats(user.id);

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-900 via-black to-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-black text-white mb-2">
            ⭐ My Subscriptions
          </h1>
          <p className="text-gray-400">
            Manage your active subscriptions and view creator content
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl p-4 border border-white/10">
            <div className="text-gray-400 text-sm mb-1">Active Subscriptions</div>
            <div className="text-white font-bold text-2xl">
              {stats.find(s => s.label === "Active Subscriptions")?.value || "0"}
            </div>
          </div>

          <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl p-4 border border-white/10">
            <div className="text-gray-400 text-sm mb-1">Total Spent</div>
            <div className="text-white font-bold text-2xl">
              {stats.find(s => s.label === "Total Spent")?.value || "0"}
            </div>
          </div>

          <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl p-4 border border-white/10">
            <div className="text-gray-400 text-sm mb-1">Content Unlocked</div>
            <div className="text-white font-bold text-2xl">
              {stats.find(s => s.label === "Content Unlocked")?.value || "0"}
            </div>
          </div>

          <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl p-4 border border-white/10">
            <div className="text-gray-400 text-sm mb-1">Tips Sent</div>
            <div className="text-white font-bold text-2xl">
              {stats.find(s => s.label === "Tips Sent")?.value || "0"}
            </div>
          </div>
        </div>

        {/* Subscriptions List */}
        <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl border border-white/10 overflow-hidden">
          <SubscriptionsList subscriptions={subscriptions} />
        </div>
      </div>
    </div>
  );
}

export const metadata = {
  title: "My Subscriptions - FanVault",
  description: "Manage your subscriptions",
};