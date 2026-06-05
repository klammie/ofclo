// app/dashboard/creator/page.tsx
import { requireRole } from "@/lib/auth/guard";
import { db } from "@/db";
import { creators, user } from "@/db/schema";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ImpersonationBanner } from "@/components/agency/ImpersonationBanner";

export default async function CreatorDashboardPage() {
  const { user: currentUser, isImpersonating, originalUserId } = await requireRole("creator");

  // Get creator profile
  const [creator] = await db
    .select()
    .from(creators)
    .where(eq(creators.userId, currentUser.id))
    .limit(1);

  if (!creator) {
    redirect("/onboarding/creator");
  }

  // Get original user info if impersonating
  let originalUserInfo = null;
  if (isImpersonating && originalUserId) {
    const [origUser] = await db
      .select()
      .from(user)
      .where(eq(user.id, originalUserId))
      .limit(1);
    originalUserInfo = origUser;
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-900 via-black to-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Impersonation Banner */}
        {isImpersonating && originalUserInfo && (
          <div className="mb-4">
            <ImpersonationBanner
              currentUserName={currentUser.name}
              originalUserName={originalUserInfo.name}
            />
          </div>
        )}

        <h1 className="text-4xl font-black text-white mb-8">
          Creator Dashboard
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link
            href="/dashboard/creator/posts/create"
            className="bg-gray-900/50 backdrop-blur-sm rounded-2xl border border-white/10 p-6 hover:border-pink-500/50 transition-all"
          >
            <div className="text-4xl mb-3">➕</div>
            <h3 className="text-white font-bold text-lg mb-2">Create Post</h3>
            <p className="text-gray-400 text-sm">Share new content</p>
          </Link>

          <Link
            href="/dashboard/creator/messages"
            className="bg-gray-900/50 backdrop-blur-sm rounded-2xl border border-white/10 p-6 hover:border-pink-500/50 transition-all"
          >
            <div className="text-4xl mb-3">💬</div>
            <h3 className="text-white font-bold text-lg mb-2">Messages</h3>
            <p className="text-gray-400 text-sm">Chat with subscribers</p>
          </Link>

          <Link
            href="/dashboard/creator/subscribers"
            className="bg-gray-900/50 backdrop-blur-sm rounded-2xl border border-white/10 p-6 hover:border-pink-500/50 transition-all"
          >
            <div className="text-4xl mb-3">👥</div>
            <h3 className="text-white font-bold text-lg mb-2">Subscribers</h3>
            <p className="text-gray-400 text-sm">{creator.subscriberCount} subscribers</p>
          </Link>

          <Link
            href="/dashboard/creator/auto-messages"
            className="bg-gray-900/50 backdrop-blur-sm rounded-2xl border border-white/10 p-6 hover:border-pink-500/50 transition-all"
          >
            <div className="text-4xl mb-3">🤖</div>
            <h3 className="text-white font-bold text-lg mb-2">Auto Messages</h3>
            <p className="text-gray-400 text-sm">Automated messaging</p>
          </Link>

          <Link
            href="/dashboard/creator/campaigns"
            className="bg-gray-900/50 backdrop-blur-sm rounded-2xl border border-white/10 p-6 hover:border-pink-500/50 transition-all"
          >
            <div className="text-4xl mb-3">🎯</div>
            <h3 className="text-white font-bold text-lg mb-2">Campaigns</h3>
            <p className="text-gray-400 text-sm">Fundraising goals</p>
          </Link>

          <Link
            href="/dashboard/creator/posts/scheduled"
            className="bg-gray-900/50 backdrop-blur-sm rounded-2xl border border-white/10 p-6 hover:border-pink-500/50 transition-all"
          >
            <div className="text-4xl mb-3">📅</div>
            <h3 className="text-white font-bold text-lg mb-2">Scheduled Posts</h3>
            <p className="text-gray-400 text-sm">Upcoming content</p>
          </Link>
        </div>
      </div>
    </div>
  );
}

export const metadata = {
  title: "Creator Dashboard - FanVault",
  description: "Manage your creator account",
};