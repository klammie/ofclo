"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ProfilePost } from "./ProfilePost";

export function CreatorProfilePublic({
  profile,
  posts,
  isOwnProfile,
  isSubscribed,
  subscriptionTier,
  currentUserId,
}) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("posts");
  const [isSubscribing, setIsSubscribing] = useState(false);

  async function handleSubscribe(tier: "standard" | "vip") {
    if (!currentUserId) {
      router.push("/login");
      return;
    }

    setIsSubscribing(true);
    try {
      const response = await fetch("/api/subscriptions/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          creatorId: profile.creatorId,
          tier,
        }),
      });

      if (!response.ok) throw new Error("Failed to subscribe");

      router.refresh();
      alert(`✅ Successfully subscribed!`);
    } catch (error) {
      console.error("Subscribe error:", error);
      alert("Failed to subscribe");
    } finally {
      setIsSubscribing(false);
    }
  }

  function handleMessage() {
    if (!currentUserId) {
      router.push("/login");
      return;
    }
    router.push(`/dashboard/user/message/${profile.userId}`);
  }

  const joinedDate = new Date(profile.joinedAt).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-900 via-black to-gray-900">
      {/* Cover Image */}
      <div className="relative h-72 w-full">
        {profile.coverUrl ? (
          <Image
            src={profile.coverUrl}
            alt="Cover"
            fill
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full bg-linear-to-br from-pink-500/20 to-purple-500/20" />
        )}
        <div className="absolute inset-0 bg-linear-to-t from-black via-transparent to-transparent" />
      </div>

      {/* Profile Header */}
      <div className="max-w-7xl mx-auto px-8 -mt-20 relative z-10">
        <div className="flex justify-between items-end mb-6">
          {/* Avatar */}
          <div className="relative">
            <div className="w-40 h-40 rounded-full border-[6px] border-black overflow-hidden shadow-2xl">
              {profile.avatarUrl ? (
                <Image
                  src={profile.avatarUrl}
                  alt={profile.name}
                  width={160}
                  height={160}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-linear-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-5xl font-bold">
                  {profile.name.charAt(0)}
                </div>
              )}
            </div>
            {/* Online indicator */}
            <div className="absolute bottom-2 right-2 w-8 h-8 bg-green-500 border-4 border-black rounded-full" />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 mb-4">
            {isOwnProfile ? (
              <button
                onClick={() => router.push("/dashboard/creator/profile/edit")}
                className="px-8 py-3 rounded-full bg-linear-to-r from-pink-500 to-purple-600 text-white font-bold hover:shadow-lg hover:shadow-pink-500/30 transition-all flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Edit Profile
              </button>
            ) : isSubscribed ? (
              <>
                <button
                  onClick={handleMessage}
                  className="px-8 py-3 rounded-full bg-linear-to-r from-pink-500 to-purple-600 text-white font-bold hover:shadow-lg hover:shadow-pink-500/30 transition-all flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  Message
                </button>
                <span className="px-6 py-3 rounded-full bg-green-500/20 text-green-400 font-bold border border-green-500/30">
                  ✓ Subscribed ({subscriptionTier})
                </span>
              </>
            ) : null}

            <button className="p-3 rounded-full bg-gray-800/50 backdrop-blur border border-white/10 text-white hover:bg-white/10 transition-colors">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
            </button>
          </div>
        </div>

        {/* Name & Bio */}
        <div className="mt-6 pb-6 border-b border-white/10">
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-4xl font-black text-white">{profile.name}</h2>
            {profile.isVerified && (
              <svg className="w-8 h-8 text-blue-400" fill="currentColor" viewBox="0 0 24 24">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
          </div>
          <p className="text-pink-400 font-bold text-lg mb-4">@{profile.username}</p>
          {profile.bio && (
            <p className="text-gray-400 max-w-2xl text-base leading-relaxed">{profile.bio}</p>
          )}
        </div>

        {/* Stats & Info */}
        <div className="mt-8 p-6 rounded-3xl bg-white/5 backdrop-blur-sm border border-white/10">
          <h3 className="text-xs font-black text-pink-500 uppercase tracking-[0.2em] mb-4">
            About the Creator
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            {profile.location && (
              <div className="flex items-center gap-3 text-gray-400">
                <svg className="w-5 h-5 text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="text-sm font-medium">{profile.location}</span>
              </div>
            )}
            {profile.website && (
              <div className="flex items-center gap-3 text-gray-400">
                <svg className="w-5 h-5 text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
                <a href={profile.website} target="_blank" rel="noopener" className="text-sm font-medium text-pink-400 hover:underline">
                  {profile.website}
                </a>
              </div>
            )}
            <div className="flex items-center gap-3 text-gray-400">
              <svg className="w-5 h-5 text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="text-sm font-medium">Joined {joinedDate}</span>
            </div>
          </div>

          {/* Subscriber Count */}
          <div className="flex gap-6">
            <div>
              <span className="text-white font-bold text-xl">{profile.subscriberCount.toLocaleString()}</span>
              <span className="text-gray-400 text-sm ml-2">Subscribers</span>
            </div>
            <div>
              <span className="text-white font-bold text-xl">{profile.postCount.toLocaleString()}</span>
              <span className="text-gray-400 text-sm ml-2">Posts</span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-white/10 mt-10 gap-10">
          <button
            onClick={() => setActiveTab("posts")}
            className={`pb-4 border-b-2 font-bold ${
              activeTab === "posts"
                ? "border-pink-500 text-pink-500"
                : "border-transparent text-gray-500"
            }`}
          >
            Posts
          </button>
          <button
            onClick={() => setActiveTab("media")}
            className={`pb-4 border-b-2 font-bold ${
              activeTab === "media"
                ? "border-pink-500 text-pink-500"
                : "border-transparent text-gray-500"
            }`}
          >
            Media
          </button>
        </div>
      </div>

      {/* Content Area with Subscription Sidebar */}
      <div className="max-w-7xl mx-auto px-8 py-8 flex gap-8">
        {/* Posts */}
        <div className="flex-1 space-y-8">
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

        {/* Subscription Sidebar */}
        {profile.isCreator && !isOwnProfile && !isSubscribed && (
          <div className="w-400 space-y-5">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-sm font-black text-pink-500 uppercase tracking-[0.2em]">
                Premium Access
              </h3>
              <span className="text-pink-500">✨</span>
            </div>

            {/* Standard Tier */}
            {profile.standardPrice && (
              <div className="relative group cursor-pointer">
                <div className="absolute inset-0 bg-linear-to-br from-blue-500 to-purple-600 blur-xl opacity-20 group-hover:opacity-40 transition-opacity rounded-3xl" />
                <div className="relative p-6 rounded-3xl bg-white/5 backdrop-blur-sm border border-white/20 hover:border-white/40 transition-all overflow-hidden">
                  <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/10 rounded-full blur-2xl" />
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-pink-400 mb-1">
                        Standard Tier
                      </p>
                      <h4 className="text-2xl font-black text-white">
                        ${profile.standardPrice.toFixed(2)}
                        <span className="text-sm font-normal text-white/50 ml-1">/month</span>
                      </h4>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/20">
                      ⭐
                    </div>
                  </div>
                  <ul className="space-y-3 mb-6">
                    <li className="flex items-center gap-3 text-sm text-white/80">
                      <span className="text-pink-400">✓</span>
                      All image posts & stories
                    </li>
                    <li className="flex items-center gap-3 text-sm text-white/80">
                      <span className="text-pink-400">✓</span>
                      Direct Messaging access
                    </li>
                  </ul>
                  <button
                    onClick={() => handleSubscribe("standard")}
                    disabled={isSubscribing}
                    className="w-full py-3 rounded-2xl bg-white text-pink-500 font-black hover:bg-opacity-90 transition-all disabled:opacity-50"
                  >
                    {isSubscribing ? "Processing..." : "Select Tier"}
                  </button>
                </div>
              </div>
            )}

            {/* VIP Tier */}
            {profile.vipPrice && (
              <div className="relative group cursor-pointer">
                <div className="absolute inset-0 bg-linear-to-br from-pink-500 to-orange-500 blur-xl opacity-30 group-hover:opacity-50 transition-opacity rounded-3xl" />
                <div className="relative p-6 rounded-3xl bg-linear-to-br from-pink-500 to-purple-600 border border-white/30 shadow-2xl hover:scale-[1.02] transition-all overflow-hidden">
                  <div className="absolute -left-4 -bottom-4 w-32 h-32 bg-white/20 rounded-full blur-3xl" />
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-[10px] font-black uppercase tracking-widest text-white">
                          VIP Tier
                        </p>
                        <span className="px-2 py-0.5 bg-white text-pink-500 text-[8px] font-black rounded-full uppercase">
                          Popular
                        </span>
                      </div>
                      <h4 className="text-2xl font-black text-white">
                        ${profile.vipPrice.toFixed(2)}
                        <span className="text-sm font-normal text-white/70 ml-1">/month</span>
                      </h4>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center border border-white/30">
                      💎
                    </div>
                  </div>
                  <ul className="space-y-3 mb-6">
                    <li className="flex items-center gap-3 text-sm text-white">
                      <span className="bg-white text-pink-500 rounded-full w-5 h-5 flex items-center justify-center text-xs">✓</span>
                      Full 4K Video Archive
                    </li>
                    <li className="flex items-center gap-3 text-sm text-white">
                      <span className="bg-white text-pink-500 rounded-full w-5 h-5 flex items-center justify-center text-xs">✓</span>
                      Priority Private DM
                    </li>
                    <li className="flex items-center gap-3 text-sm text-white">
                      <span className="bg-white text-pink-500 rounded-full w-5 h-5 flex items-center justify-center text-xs">✓</span>
                      Custom content requests
                    </li>
                  </ul>
                  <button
                    onClick={() => handleSubscribe("vip")}
                    disabled={isSubscribing}
                    className="w-full py-4 rounded-2xl bg-white text-pink-500 font-black shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
                  >
                    {isSubscribing ? "Processing..." : "Subscribe Now"}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}