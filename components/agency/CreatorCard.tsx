// components/agency/CreatorCard.tsx
"use client";

import { useState } from "react";
import Link from "next/link";

interface CreatorCardProps {
  creator: any;
}

export function CreatorCard({ creator }: CreatorCardProps) {
  const [isImpersonating, setIsImpersonating] = useState(false);

  async function handleImpersonate() {
    setIsImpersonating(true);
    try {
      const response = await fetch("/api/agency/impersonate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ creatorUserId: creator.creator_user_id }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to impersonate");
      }

      const data = await response.json();
      
      // Redirect to creator dashboard
      window.location.href = data.redirectTo || "/dashboard/creator";
    } catch (error: any) {
      console.error("Impersonate error:", error);
      alert(error.message || "Failed to impersonate creator");
      setIsImpersonating(false);
    }
  }

  return (
    <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl border border-white/10 p-6 hover:border-pink-500/50 transition-all">
      {/* Header */}
      <div className="flex items-start gap-4 mb-4">
        {/* Avatar */}
        <div className="w-16 h-16 rounded-full overflow-hidden bg-gradient-to-br from-indigo-500 to-purple-600 flex-shrink-0">
          {creator.avatar_url ? (
            <img src={creator.avatar_url} alt={creator.creator_name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-white text-2xl font-bold">
              {creator.creator_name.charAt(0)}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-white font-bold truncate">{creator.creator_name}</h3>
            {creator.is_verified && (
              <svg className="w-5 h-5 text-blue-400 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
          </div>
          <p className="text-gray-400 text-sm">@{creator.username}</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-gray-800/50 rounded-lg p-3">
          <div className="text-gray-400 text-xs mb-1">Subscribers</div>
          <div className="text-white font-bold text-lg">{creator.active_subscribers}</div>
        </div>
        <div className="bg-gray-800/50 rounded-lg p-3">
          <div className="text-gray-400 text-xs mb-1">Posts</div>
          <div className="text-white font-bold text-lg">{creator.post_count}</div>
        </div>
        <div className="bg-gray-800/50 rounded-lg p-3">
          <div className="text-gray-400 text-xs mb-1">Revenue</div>
          <div className="text-green-400 font-bold text-lg">
            ${parseFloat(creator.total_revenue).toLocaleString()}
          </div>
        </div>
        <div className="bg-gray-800/50 rounded-lg p-3">
          <div className="text-gray-400 text-xs mb-1">Pricing</div>
          <div className="text-white font-bold text-sm">
            ${creator.standard_price} / ${creator.vip_price}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <Link
          href={`/dashboard/agency/creators/${creator.creator_id}`}
          className="flex-1 py-2 rounded-lg bg-gradient-to-r from-pink-500 to-purple-600 text-white font-semibold hover:from-pink-600 hover:to-purple-700 transition-all text-sm text-center"
        >
          ⚙️ Manage
        </Link>
        <button
          onClick={handleImpersonate}
          disabled={isImpersonating}
          className="px-4 py-2 rounded-lg bg-gray-800 text-white font-semibold hover:bg-gray-700 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isImpersonating ? "..." : "👤"}
        </button>
      </div>
    </div>
  );
}