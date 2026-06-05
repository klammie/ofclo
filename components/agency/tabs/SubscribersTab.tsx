// components/agency/tabs/SubscribersTab.tsx
"use client";

import { useState, useEffect } from "react";

export function SubscribersTab({ creatorId }) {
  const [subscribers, setSubscribers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState("all"); // all, active, cancelled

  useEffect(() => {
    fetchSubscribers();
  }, [filter]);

  async function fetchSubscribers() {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/agency/creators/${creatorId}/subscribers?filter=${filter}`);
      if (response.ok) {
        const data = await response.json();
        setSubscribers(data.subscribers);
      }
    } catch (error) {
      console.error("Failed to fetch subscribers:", error);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex gap-3">
        {["all", "active", "cancelled"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg font-semibold capitalize transition-colors ${
              filter === f
                ? "bg-pink-500 text-white"
                : "bg-gray-800 text-gray-400 hover:text-white"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Subscribers List */}
      {isLoading ? (
        <div className="text-center py-12 text-gray-400">Loading subscribers...</div>
      ) : subscribers.length === 0 ? (
        <div className="text-center py-12 bg-gray-900/50 rounded-2xl border border-white/10">
          <div className="text-4xl mb-2">👥</div>
          <p className="text-gray-400">No subscribers found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {subscribers.map((sub: any) => (
            <SubscriberCard key={sub.id} subscriber={sub} />
          ))}
        </div>
      )}
    </div>
  );
}

function SubscriberCard({ subscriber }) {
  const statusColors = {
    active: "bg-green-500/20 text-green-400 border-green-500/30",
    cancelled: "bg-red-500/20 text-red-400 border-red-500/30",
    expired: "bg-gray-500/20 text-gray-400 border-gray-500/30",
  };

  return (
    <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl border border-white/10 p-6">
      <div className="flex items-start gap-4 mb-4">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold flex-shrink-0">
          {subscriber.user_name?.charAt(0) || "U"}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-white font-semibold truncate">{subscriber.user_name || "User"}</h4>
          <p className="text-gray-400 text-sm truncate">{subscriber.user_email}</p>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-400">Tier</span>
          <span className="text-white font-semibold capitalize">{subscriber.tier}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-400">Price</span>
          <span className="text-white font-semibold">${subscriber.price_at_subscription}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-400">Since</span>
          <span className="text-white font-semibold">
            {new Date(subscriber.created_at).toLocaleDateString()}
          </span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-400">Status</span>
          <span className={`px-2 py-1 rounded border text-xs font-bold ${statusColors[subscriber.status]}`}>
            {subscriber.status}
          </span>
        </div>
      </div>
    </div>
  );
}