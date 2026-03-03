// components/user/CreatorDiscoveryGrid.tsx
"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

type CreatorCardData = {
  id: string;
  userId: string;
  name: string;
  username: string;
  avatarUrl: string | null;
  coverImageUrl: string | null;
  bio: string | null;
  isVerified: boolean;
  subscriberCount: number;
  postCount: number;
  standardPrice: number;
  vipPrice: number;
  previewImage: string | null;
  isSubscribed: boolean;
};

interface CreatorDiscoveryGridProps {
  creators: CreatorCardData[];
  currentUserId: string;
  total: number;
  currentPage: number;
}

export function CreatorDiscoveryGrid({ 
  creators, 
  currentUserId,
  total,
  currentPage 
}: CreatorDiscoveryGridProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();

  const filteredCreators = creators.filter(creator =>
    creator.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    creator.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div>
      {/* Search Bar */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="🔍 Search creators..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="w-full max-w-md px-4 py-3 rounded-xl bg-gray-800 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-pink-500/50"
        />
      </div>

      {/* Grid */}
      {filteredCreators.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">😔</div>
          <h3 className="text-white font-bold text-xl mb-2">No creators found</h3>
          <p className="text-gray-400">Try a different search term</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredCreators.map((creator) => (
            <CreatorCard 
              key={creator.id} 
              creator={creator}
              currentUserId={currentUserId}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// CREATOR CARD WITH SUBSCRIBE BUTTON
// ══════════════════════════════════════════════════════════════════════════════

function CreatorCard({ 
  creator,
  currentUserId 
}: { 
  creator: CreatorCardData;
  currentUserId: string;
}) {
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(creator.isSubscribed);
  const router = useRouter();

  async function handleSubscribe(tier: "standard" | "vip") {
    setIsSubscribing(true);
    try {
      const response = await fetch("/api/subscriptions/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          creatorId: creator.id,
          tier,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to subscribe");
      }

      const result = await response.json();
      
      setIsSubscribed(true);
      
      // Show success message
      alert(`✅ Successfully subscribed to ${creator.name}!`);
      
      // Refresh the page to update subscription status
      router.refresh();
      
    } catch (error) {
      console.error("Subscribe error:", error);
      alert(error instanceof Error ? error.message : "Failed to subscribe");
    } finally {
      setIsSubscribing(false);
    }
  }

  function handleMessage() {
    router.push(`/dashboard/user/message/${creator.userId}`);
  }

  function handleViewProfile() {
    router.push(`/${creator.username}`);
  }

  return (
    <div className="group relative bg-gray-900/50 backdrop-blur-sm rounded-2xl overflow-hidden border border-white/10 hover:border-pink-500/50 transition-all duration-300">
      {/* Cover Image */}
      <div className="relative w-full h-32 bg-linear-to-br from-pink-500/20 to-purple-500/20">
        {creator.coverImageUrl ? (
          <Image
            src={creator.coverImageUrl}
            alt={`${creator.name} cover`}
            fill
            className="object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-4xl">
            🎨
          </div>
        )}
      </div>

      {/* Avatar */}
      <div className="relative px-4">
        <div className="w-20 h-20 -mt-10 rounded-full border-4 border-gray-900 bg-linear-to-br from-indigo-500 to-purple-600 overflow-hidden">
          {creator.avatarUrl ? (
            <Image
              src={creator.avatarUrl}
              alt={creator.name}
              width={80}
              height={80}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-white font-bold text-2xl">
              {creator.name.charAt(0)}
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-4 pt-2">
        {/* Name & Verified Badge */}
        <div className="flex items-center gap-2 mb-1">
          <h3 className="text-white font-bold text-lg truncate">
            {creator.name}
          </h3>
          {creator.isVerified && (
            <span className="text-blue-500" title="Verified">✓</span>
          )}
        </div>

        {/* Username */}
        <div className="text-gray-400 text-sm mb-2">@{creator.username}</div>

        {/* Bio */}
        {creator.bio && (
          <p className="text-gray-300 text-sm mb-3 line-clamp-2">
            {creator.bio}
          </p>
        )}

        {/* Stats */}
        <div className="flex items-center gap-4 mb-4 text-xs text-gray-400">
          <div className="flex items-center gap-1">
            <span>👥</span>
            <span>{creator.subscriberCount.toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-1">
            <span>📸</span>
            <span>{creator.postCount}</span>
          </div>
        </div>

        {/* Pricing */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-gray-400 text-xs">Standard</div>
            <div className="text-white font-bold text-lg">
              ${creator.standardPrice.toFixed(2)}/mo
            </div>
          </div>
          {creator.vipPrice > creator.standardPrice && (
            <div className="text-right">
              <div className="text-gray-400 text-xs">VIP</div>
              <div className="text-pink-400 font-bold text-lg">
                ${creator.vipPrice.toFixed(2)}/mo
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        {isSubscribed ? (
          <div className="space-y-2">
            <button
              onClick={handleMessage}
              className="w-full py-2.5 rounded-lg font-bold text-white transition-all duration-200 bg-linear-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700"
            >
              💬 Send Message
            </button>
            <button
              onClick={handleViewProfile}
              className="w-full py-2.5 rounded-lg font-bold text-gray-300 transition-all duration-200 bg-gray-800 hover:bg-gray-700"
            >
              👤 View Profile
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            <button
              onClick={() => handleSubscribe("standard")}
              disabled={isSubscribing}
              className="w-full py-2.5 rounded-lg font-bold text-white transition-all duration-200 bg-linear-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubscribing ? "Subscribing..." : `Subscribe - $${creator.standardPrice.toFixed(2)}/mo`}
            </button>
            
            {creator.vipPrice > creator.standardPrice && (
              <button
                onClick={() => handleSubscribe("vip")}
                disabled={isSubscribing}
                className="w-full py-2.5 rounded-lg font-bold text-white transition-all duration-200 bg-linear-to-r from-yellow-500 to-orange-600 hover:from-yellow-600 hover:to-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubscribing ? "Subscribing..." : `⭐ VIP - $${creator.vipPrice.toFixed(2)}/mo`}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}