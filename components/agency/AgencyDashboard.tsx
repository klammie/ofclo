// components/agency/AgencyDashboard.tsx
"use client"; // ✅ Add this at the very top

import { useState } from "react";
import { CreatorCard } from "./CreatorCard";

export function AgencyDashboard({ data }) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredCreators = data.creators.filter(creator =>
    creator.creator_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    creator.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-black text-white mb-2">
          🏢 Agency Dashboard
        </h1>
        <p className="text-gray-400">
          Manage and monitor all creators
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          icon="👥"
          label="Total Creators"
          value={data.stats.total_creators}
          color="blue"
        />
        <StatCard
          icon="⭐"
          label="Active Subscribers"
          value={data.stats.total_subscribers}
          color="purple"
        />
        <StatCard
          icon="💰"
          label="Total Revenue"
          value={`$${parseFloat(data.stats.total_revenue).toLocaleString()}`}
          color="green"
        />
        <StatCard
          icon="📸"
          label="Total Posts"
          value={data.stats.total_posts}
          color="pink"
        />
      </div>

      {/* Search & Filter */}
      <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl border border-white/10 p-6">
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search creators..."
              className="w-full bg-gray-800 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-pink-500/50"
            />
          </div>
        </div>
      </div>

      {/* Creators Grid */}
      <div>
        <h2 className="text-2xl font-bold text-white mb-4">
          Managed Creators ({filteredCreators.length})
        </h2>
        
        {filteredCreators.length === 0 ? (
          <div className="text-center py-12 bg-gray-900/50 backdrop-blur-sm rounded-2xl border border-white/10">
            <div className="text-4xl mb-2">🔍</div>
            <p className="text-gray-400">No creators found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCreators.map((creator) => (
              <CreatorCard
                key={creator.creator_id}
                creator={creator}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, color }) {
  const colorClasses = {
    blue: "from-blue-500 to-indigo-600",
    purple: "from-purple-500 to-pink-600",
    green: "from-green-500 to-emerald-600",
    pink: "from-pink-500 to-rose-600",
  };

  return (
    <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl border border-white/10 p-6">
      <div className="flex items-center justify-between mb-2">
        <span className="text-3xl">{icon}</span>
      </div>
      <div className="text-gray-400 text-sm mb-1">{label}</div>
      <div className={`text-3xl font-black bg-gradient-to-r ${colorClasses[color]} bg-clip-text text-transparent`}>
        {value}
      </div>
    </div>
  );
}