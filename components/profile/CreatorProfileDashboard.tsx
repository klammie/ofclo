// components/profile/CreatorProfileDashboard.tsx
"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ProfilePost } from "./ProfilePost";

export function CreatorProfileDashboard({
  profile,
  posts,
  isOwnProfile,
  isSubscribed,
  subscriptionTier,
  currentUserId,
}) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("posts");

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-900 via-black to-gray-900 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Compact Header for Dashboard */}
        <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl border border-white/10 overflow-hidden mb-6">
          {/* Cover Image */}
          <div className="relative h-48 w-full">
            {profile.coverUrl ? (
              <Image src={profile.coverUrl} alt="Cover" fill className="object-cover" />
            ) : (
              <div className="w-full h-full bg-linear-to-br from-pink-500/20 to-purple-500/20" />
            )}
            <div className="absolute inset-0 bg-linear-to-t from-black via-transparent to-transparent" />
          </div>

          {/* Profile Info */}
          <div className="px-6 -mt-16 relative z-10 pb-6">
            <div className="flex items-end gap-4 mb-4">
              {/* Avatar */}
              <div className="w-32 h-32 rounded-full border-4 border-gray-900 overflow-hidden shadow-2xl shrink-0">
                {profile.avatarUrl ? (
                  <Image src={profile.avatarUrl} alt={profile.name} width={128} height={128} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-linear-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-4xl font-bold">
                    {profile.name.charAt(0)}
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0 pb-2">
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="text-3xl font-black text-white truncate">{profile.name}</h2>
                  {profile.isVerified && (
                    <svg className="w-6 h-6 text-blue-400 shrink-0" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  )}
                </div>
                <p className="text-pink-400 font-semibold mb-2">@{profile.username}</p>
                <div className="flex items-center gap-4 text-sm text-gray-400">
                  <div>
                    <span className="text-white font-bold">{profile.subscriberCount.toLocaleString()}</span> Subscribers
                  </div>
                  <div>
                    <span className="text-white font-bold">{profile.postCount.toLocaleString()}</span> Posts
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pb-2">
                {isOwnProfile ? (
                  <button
                    onClick={() => router.push("/dashboard/creator/profile/edit")}
                    className="px-6 py-2 rounded-lg bg-gray-800 text-white font-semibold hover:bg-gray-700 transition-colors"
                  >
                    Edit Profile
                  </button>
                ) : isSubscribed ? (
                  <button
                    onClick={() => router.push(`/dashboard/user/message/${profile.userId}`)}
                    className="px-6 py-2 rounded-lg bg-linear-to-r from-pink-500 to-purple-600 text-white font-semibold hover:shadow-lg hover:shadow-pink-500/30 transition-all"
                  >
                    💬 Message
                  </button>
                ) : (
                  <button
                    onClick={() => alert("Subscribe to access")}
                    className="px-6 py-2 rounded-lg bg-linear-to-r from-pink-500 to-purple-600 text-white font-semibold hover:shadow-lg hover:shadow-pink-500/30 transition-all"
                  >
                    Subscribe
                  </button>
                )}
              </div>
            </div>

            {/* Bio */}
            {profile.bio && (
              <p className="text-gray-300 text-sm mb-4">{profile.bio}</p>
            )}

            {/* Tabs */}
            <div className="flex gap-6 border-t border-white/10 pt-4">
              <button
                onClick={() => setActiveTab("posts")}
                className={`pb-2 border-b-2 font-semibold text-sm ${
                  activeTab === "posts"
                    ? "border-pink-500 text-pink-500"
                    : "border-transparent text-gray-400"
                }`}
              >
                Posts
              </button>
              <button
                onClick={() => setActiveTab("media")}
                className={`pb-2 border-b-2 font-semibold text-sm ${
                  activeTab === "media"
                    ? "border-pink-500 text-pink-500"
                    : "border-transparent text-gray-400"
                }`}
              >
                Media
              </button>
            </div>
          </div>
        </div>

        {/* Posts Feed */}
        <div className="space-y-6">
          {posts.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-6xl mb-4">📭</div>
              <h3 className="text-white font-bold text-xl mb-2">No posts yet</h3>
              <p className="text-gray-400">Check back later for new content!</p>
            </div>
          ) : (
            posts.map(post => (
              <ProfilePost
                key={post.id}
                post={post}
                creator={{
                  name: profile.name,
                  username: profile.username,
                  avatarUrl: profile.avatarUrl,
                }}
                isSubscribed={isSubscribed}
                currentUserId={currentUserId}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}