// components/user/SubscriptionsList.tsx
"use client";

import { useState } from "react";
import Image from "next/image";
import type { SubscriptionWithCreator } from "@/lib/types";
import Link from "next/link";

interface SubscriptionsListProps {
  subscriptions: SubscriptionWithCreator[];
}

export function SubscriptionsList({ subscriptions }: SubscriptionsListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "expired">("all");

  // Filter subscriptions
  const filteredSubscriptions = subscriptions.filter(sub => {
  const query = searchQuery?.toLowerCase() ?? "";

  const matchesSearch =
    (sub.creatorName?.toLowerCase().includes(query)) ||
    (sub.creatorUsername?.toLowerCase().includes(query));

  const matchesStatus =
    statusFilter === "all" ||
    (statusFilter === "active" && sub.status === "active") ||
    (statusFilter === "expired" && sub.status !== "active");

  return matchesSearch && matchesStatus;
});

  // Group by status
  const activeSubscriptions = filteredSubscriptions.filter(s => s.status === "active");
  const expiredSubscriptions = filteredSubscriptions.filter(s => s.status !== "active");

  return (
    <div className="flex flex-col h-full">
      {/* Header with search and filters */}
      <div className="p-6 border-b border-white/10">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          {/* Status filters */}
          <div className="flex gap-2">
            <button
              onClick={() => setStatusFilter("all")}
              className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
                statusFilter === "all"
                  ? "bg-pink-500 text-white"
                  : "bg-gray-800 text-gray-400 hover:text-white"
              }`}
            >
              All ({subscriptions.length})
            </button>
            <button
              onClick={() => setStatusFilter("active")}
              className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
                statusFilter === "active"
                  ? "bg-pink-500 text-white"
                  : "bg-gray-800 text-gray-400 hover:text-white"
              }`}
            >
              Active ({activeSubscriptions.length})
            </button>
            <button
              onClick={() => setStatusFilter("expired")}
              className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
                statusFilter === "expired"
                  ? "bg-pink-500 text-white"
                  : "bg-gray-800 text-gray-400 hover:text-white"
              }`}
            >
              Expired ({expiredSubscriptions.length})
            </button>
          </div>

          {/* Search */}
          <input
            type="text"
            placeholder="Search creators..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full sm:w-64 bg-gray-800 border border-white/10 rounded-lg px-4 py-2 text-sm text-white placeholder-gray-500 outline-none focus:border-pink-500/50"
          />
        </div>
      </div>

      {/* Subscriptions list */}
      <div className="flex-1 overflow-y-auto p-6">
        {filteredSubscriptions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <div className="text-6xl mb-4">⭐</div>
            <h3 className="text-white font-bold text-xl mb-2">
              {searchQuery
                ? "No subscriptions found"
                : statusFilter === "active"
                ? "No active subscriptions"
                : "No subscriptions yet"}
            </h3>
            <p className="text-sm mb-6">
              {searchQuery
                ? "Try a different search term"
                : "Discover creators to subscribe to"}
            </p>
            <Link
              href="/dashboard/user/discover"
              className="px-6 py-3 rounded-lg font-bold text-white bg-linear-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 transition-all"
            >
              Discover Creators
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredSubscriptions.map((subscription) => (
              <SubscriptionCard
                key={subscription.subscriptionId}
                subscription={subscription}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// SUBSCRIPTION CARD
// ══════════════════════════════════════════════════════════════════════════════

function SubscriptionCard({ subscription }: { subscription: SubscriptionWithCreator }) {
  const isActive = subscription.status === "active";
  const daysUntilExpiry = subscription.nextBillingDate
    ? Math.ceil(
        (new Date(subscription.nextBillingDate).getTime() - Date.now()) /
          (1000 * 60 * 60 * 24)
      )
    : 0;

  return (
    <div className="bg-gray-800/50 rounded-xl border border-white/10 overflow-hidden hover:border-pink-500/50 transition-all">
      {/* Cover Image */}
      <div className="relative w-full h-32 bg-linear-to-br from-pink-500/20 to-purple-500/20">
        {subscription.creatorCoverUrl ? (
          <Image
            src={subscription.creatorCoverUrl}
            alt={`${subscription.creatorName} cover`}
            fill
            className="object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-4xl">
            ⭐
          </div>
        )}

        {/* Status badge */}
        <div className="absolute top-2 right-2">
          <span
            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${
              isActive
                ? "bg-green-500/90 text-white"
                : "bg-gray-500/90 text-white"
            }`}
          >
            {isActive ? "✓ Active" : "Expired"}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Avatar */}
        <div className="flex items-start gap-3 mb-4">
          <div className="relative w-12 h-12 -mt-8 rounded-full border-4 border-gray-800 bg-linear-to-br from-indigo-500 to-purple-600 overflow-hidden shrink-0">
            {subscription.creatorAvatarUrl ? (
              <Image
                src={subscription.creatorAvatarUrl}
                alt={subscription.creatorName}
                fill
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-white font-bold">
                {subscription.creatorName.charAt(0)}
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="text-white font-bold truncate">
              {subscription.creatorName}
            </div>
            <div className="text-gray-400 text-sm truncate">
              @{subscription.creatorUsername}
            </div>
          </div>
        </div>

        {/* Tier badge */}
        <div className="mb-4">
          <span
            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${
              subscription.tier === "vip"
                ? "bg-linear-to-r from-yellow-500/20 to-orange-500/20 text-yellow-400"
                : "bg-blue-500/20 text-blue-400"
            }`}
          >
            {subscription.tier === "vip" ? "⭐ VIP Tier" : "📘 Standard Tier"}
          </span>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
          <div>
            <div className="text-gray-400 text-xs mb-1">Price</div>
            <div className="text-white font-semibold">
              ${subscription.price.toFixed(2)}/mo
            </div>
          </div>
          <div>
            <div className="text-gray-400 text-xs mb-1">
              {isActive ? "Renews" : "Expired"}
            </div>
            <div className="text-white font-semibold">
              {subscription.nextBillingDate
                ? new Date(subscription.nextBillingDate).toLocaleDateString(
                    "en-US",
                    { month: "short", day: "numeric" }
                  )
                : "N/A"}
            </div>
          </div>
        </div>

        {/* Expiry warning */}
        {isActive && daysUntilExpiry > 0 && daysUntilExpiry <= 7 && (
          <div className="mb-4 p-2 rounded-lg bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 text-xs">
            ⚠️ Renews in {daysUntilExpiry} day{daysUntilExpiry === 1 ? "" : "s"}
          </div>
        )}

        {/* Unread messages */}
        {subscription.unreadMessageCount > 0 && (
          <div className="mb-4 p-2 rounded-lg bg-pink-500/10 border border-pink-500/30 text-pink-400 text-xs font-semibold">
            💬 {subscription.unreadMessageCount} unread message
            {subscription.unreadMessageCount === 1 ? "" : "s"}
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-2">
          {/* View profile */}
          <a
            href={`/profile/${subscription.creatorUsername}`}
            className="flex-1 px-4 py-2 rounded-lg bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-400 text-center font-semibold text-sm transition-colors"
          >
            👤 Profile
          </a>

          {/* Send message */}
          <a
            href={`/dashboard/user/message/${subscription.creatorUserId}`}
            className="flex-1 px-4 py-2 rounded-lg bg-pink-500/20 hover:bg-pink-500/30 text-pink-400 text-center font-semibold text-sm transition-colors"
          >
            💬 Message
          </a>
        </div>

        {/* Manage subscription link */}
        <button
          onClick={() => alert("Subscription management coming soon")}
          className="w-full mt-3 text-gray-400 hover:text-white text-xs transition-colors"
        >
          Manage Subscription →
        </button>
      </div>
    </div>
  );
}