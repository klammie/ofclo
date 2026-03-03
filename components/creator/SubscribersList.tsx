// components/creator/SubscribersList.tsx
"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import type { SubscriberWithDetails } from "@/lib/types";

interface SubscribersListProps {
  subscribers: SubscriberWithDetails[];
  total: number;
  currentPage: number;
  currentFilter: "all" | "standard" | "vip";
}

export function SubscribersList({
  subscribers,
  total,
  currentPage,
  currentFilter,
}: SubscribersListProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [searchQuery, setSearchQuery] = useState("");

  const totalPages = Math.ceil(total / 20);

  // Filter subscribers by search
  const filteredSubscribers = subscribers.filter(sub => {
  const query = searchQuery?.toLowerCase() ?? "";

  const username = sub.username?.toLowerCase() ?? "";
  const name = sub.name?.toLowerCase() ?? "";
  const email = sub.email?.toLowerCase() ?? "";

  return (
    username.includes(query) ||
    name.includes(query) ||
    email.includes(query)
  );
});

  function handleFilterChange(filter: "all" | "standard" | "vip") {
    const params = new URLSearchParams(searchParams);
    params.set("tier", filter);
    params.set("page", "1");
    startTransition(() => {
      router.push(`?${params.toString()}`);
    });
  }

  function handlePageChange(page: number) {
    const params = new URLSearchParams(searchParams);
    params.set("page", page.toString());
    startTransition(() => {
      router.push(`?${params.toString()}`);
    });
  }

  // Format date
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header with filters and search */}
      <div className="p-6 border-b border-white/10">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
          {/* Filter tabs */}
          <div className="flex gap-2">
            <button
              onClick={() => handleFilterChange("all")}
              disabled={isPending}
              className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
                currentFilter === "all"
                  ? "bg-pink-500 text-white"
                  : "bg-gray-800 text-gray-400 hover:text-white"
              }`}
            >
              All ({total})
            </button>
            <button
              onClick={() => handleFilterChange("standard")}
              disabled={isPending}
              className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
                currentFilter === "standard"
                  ? "bg-pink-500 text-white"
                  : "bg-gray-800 text-gray-400 hover:text-white"
              }`}
            >
              Standard
            </button>
            <button
              onClick={() => handleFilterChange("vip")}
              disabled={isPending}
              className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
                currentFilter === "vip"
                  ? "bg-pink-500 text-white"
                  : "bg-gray-800 text-gray-400 hover:text-white"
              }`}
            >
              VIP
            </button>
          </div>

          {/* Search */}
          <input
            type="text"
            placeholder="Search subscribers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full sm:w-64 bg-gray-800 border border-white/10 rounded-lg px-4 py-2 text-sm text-white placeholder-gray-500 outline-none focus:border-pink-500/50"
          />
        </div>
      </div>

      {/* Subscribers list */}
      <div className="flex-1 overflow-y-auto">
        {filteredSubscribers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <div className="text-6xl mb-4">👥</div>
            <h3 className="text-white font-bold text-xl mb-2">
              {searchQuery ? "No subscribers found" : "No subscribers yet"}
            </h3>
            <p className="text-sm">
              {searchQuery
                ? "Try a different search term"
                : "Start promoting your page to get subscribers"}
            </p>
          </div>
        ) : (
          <>
            {/* Desktop view */}
            <div className="hidden lg:block">
              <table className="w-full">
                <thead className="border-b border-white/10">
                  <tr className="text-left text-gray-400 text-sm">
                    <th className="p-4 font-semibold">Subscriber</th>
                    <th className="p-4 font-semibold">Tier</th>
                    <th className="p-4 font-semibold">Total Spent</th>
                    <th className="p-4 font-semibold">Joined</th>
                    <th className="p-4 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredSubscribers.map((subscriber) => (
                    <SubscriberRow key={subscriber.subscriptionId} subscriber={subscriber} />
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile view */}
            <div className="lg:hidden divide-y divide-white/5">
              {filteredSubscribers.map((subscriber) => (
                <SubscriberCard key={subscriber.subscriptionId} subscriber={subscriber} />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="p-6 border-t border-white/10 flex items-center justify-center gap-2">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1 || isPending}
            className="px-4 py-2 rounded-lg bg-gray-800 text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700 transition-colors"
          >
            ← Previous
          </button>

          <div className="flex gap-2">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => handlePageChange(page)}
                disabled={isPending}
                className={`w-10 h-10 rounded-lg font-semibold transition-all ${
                  page === currentPage
                    ? "bg-pink-500 text-white"
                    : "bg-gray-800 text-gray-400 hover:text-white"
                }`}
              >
                {page}
              </button>
            ))}
          </div>

          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages || isPending}
            className="px-4 py-2 rounded-lg bg-gray-800 text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700 transition-colors"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// SUBSCRIBER ROW (Desktop)
// ══════════════════════════════════════════════════════════════════════════════

function SubscriberRow({ subscriber }: { subscriber: SubscriberWithDetails }) {
  return (
    <tr className="hover:bg-white/5 transition-colors">
      {/* Subscriber info */}
      <td className="p-4">
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div className="relative w-10 h-10 rounded-full overflow-hidden bg-linear-to-br from-indigo-500 to-purple-600 shrink-0">
            {subscriber.avatarUrl ? (
              <Image
                src={subscriber.avatarUrl}
                alt={subscriber.name}
                fill
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-white font-bold">
                {subscriber.name.charAt(0)}
              </div>
            )}
          </div>

          {/* Name and email */}
          <div className="min-w-0">
            <div className="text-white font-semibold truncate">
              {subscriber.name}
            </div>
            <div className="text-gray-400 text-sm truncate">
              @{subscriber.username}
            </div>
          </div>
        </div>
      </td>

      {/* Tier */}
      <td className="p-4">
        <span
          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${
            subscriber.tier === "vip"
              ? "bg-linear-to-r from-yellow-500/20 to-orange-500/20 text-yellow-400"
              : "bg-blue-500/20 text-blue-400"
          }`}
        >
          {subscriber.tier === "vip" ? "⭐ VIP" : "📘 Standard"}
        </span>
      </td>

      {/* Total spent */}
      <td className="p-4">
        <div className="text-white font-semibold">
          ${subscriber.totalSpent.toFixed(2)}
        </div>
        <div className="text-gray-400 text-xs">
          {subscriber.tipCount} tips
        </div>
      </td>

      {/* Joined date */}
      <td className="p-4">
        <div className="text-white text-sm">
          {new Date(subscriber.subscribedAt).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          })}
        </div>
      </td>

      {/* Actions */}
      <td className="p-4">
        <div className="flex items-center gap-2">
          {/* Message button */}
          <a
            href={`/dashboard/user/message/${subscriber.userId}`}
            className="p-2 rounded-lg bg-pink-500/20 hover:bg-pink-500/30 text-pink-400 transition-colors"
            title="Send message"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
          </a>

          {/* View profile button */}
          <a
            href={`/profile/${subscriber.username}`}
            className="p-2 rounded-lg bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-400 transition-colors"
            title="View profile"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </a>
        </div>
      </td>
    </tr>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// SUBSCRIBER CARD (Mobile)
// ══════════════════════════════════════════════════════════════════════════════

function SubscriberCard({ subscriber }: { subscriber: SubscriberWithDetails }) {
  return (
    <div className="p-4">
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div className="relative w-12 h-12 rounded-full overflow-hidden bg-linear-to-br from-indigo-500 to-purple-600 shrink-0">
          {subscriber.avatarUrl ? (
            <Image
              src={subscriber.avatarUrl}
              alt={subscriber.name}
              fill
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-white font-bold">
              {subscriber.name.charAt(0)}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <div className="text-white font-semibold truncate">
              {subscriber.name}
            </div>
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold shrink-0 ${
                subscriber.tier === "vip"
                  ? "bg-linear-to-r from-yellow-500/20 to-orange-500/20 text-yellow-400"
                  : "bg-blue-500/20 text-blue-400"
              }`}
            >
              {subscriber.tier === "vip" ? "⭐ VIP" : "📘 Standard"}
            </span>
          </div>

          <div className="text-gray-400 text-sm mb-2">
            @{subscriber.username}
          </div>

          {/* Stats */}
          <div className="flex items-center gap-4 text-xs text-gray-400 mb-3">
            <div>
              <span className="text-white font-semibold">
                ${subscriber.totalSpent.toFixed(2)}
              </span>{" "}
              spent
            </div>
            <div>
              <span className="text-white font-semibold">
                {subscriber.tipCount}
              </span>{" "}
              tips
            </div>
            <div>
              Joined{" "}
              {new Date(subscriber.subscribedAt).toLocaleDateString("en-US", {
                month: "short",
                year: "numeric",
              })}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <a
              href={`/dashboard/creator/messages/${subscriber.userId}`}
              className="flex-1 px-4 py-2 rounded-lg bg-pink-500/20 hover:bg-pink-500/30 text-pink-400 text-center font-semibold text-sm transition-colors"
            >
              💬 Message
            </a>
            <a
              href={`/profile/${subscriber.username}`}
              className="flex-1 px-4 py-2 rounded-lg bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-400 text-center font-semibold text-sm transition-colors"
            >
              👤 Profile
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}