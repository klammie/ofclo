// components/agency/tabs/AnalyticsTab.tsx
"use client";

import { useState, useEffect } from "react";

export function AnalyticsTab({ creatorId, stats }) {
  const [chartData, setChartData] = useState(null);
  const [timeRange, setTimeRange] = useState("30d"); // 7d, 30d, 90d, all

  useEffect(() => {
    async function fetchAnalytics() {
      try {
        const response = await fetch(
          `/api/agency/creators/${creatorId}/analytics?range=${timeRange}`
        );
        if (response.ok) {
          const data = await response.json();
          setChartData(data);
        }
      } catch (error) {
        console.error("Failed to fetch analytics:", error);
      }
    }

    fetchAnalytics();
  }, [timeRange, creatorId]);

  const engagementRate =
    stats.posts.total_posts > 0
      ? (
          (stats.posts.total_likes + stats.posts.total_comments) /
          stats.posts.total_posts
        ).toFixed(2)
      : 0;

  const revenuePerSub =
    stats.subscribers.active_subscribers > 0
      ? (
          parseFloat(stats.revenue.total_revenue) /
          stats.subscribers.active_subscribers
        ).toFixed(2)
      : 0;

  return (
    <div className="space-y-6">
      {/* Time Range Selector */}
      <div className="flex gap-3">
        {[
          { value: "7d", label: "7 Days" },
          { value: "30d", label: "30 Days" },
          { value: "90d", label: "90 Days" },
          { value: "all", label: "All Time" },
        ].map((range) => (
          <button
            key={range.value}
            onClick={() => setTimeRange(range.value)}
            className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
              timeRange === range.value
                ? "bg-pink-500 text-white"
                : "bg-gray-800 text-gray-400 hover:text-white"
            }`}
          >
            {range.label}
          </button>
        ))}
      </div>

      {/* Key Metrics */}
      <div>
        <h3 className="text-white font-bold text-xl mb-4">📊 Key Metrics</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <MetricCard
            label="Engagement Rate"
            value={`${engagementRate}%`}
            icon="❤️"
            color="pink"
          />
          <MetricCard
            label="Revenue Per Sub"
            value={`$${revenuePerSub}`}
            icon="💰"
            color="green"
          />
          <MetricCard
            label="Retention Rate"
            value="94%"
            icon="🔄"
            color="blue"
          />
          <MetricCard
            label="Growth Rate"
            value="+12%"
            icon="📈"
            color="purple"
          />
        </div>
      </div>

      {/* Performance Breakdown */}
      <div>
        <h3 className="text-white font-bold text-xl mb-4">📈 Performance</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Revenue Breakdown */}
          <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl border border-white/10 p-6">
            <h4 className="text-white font-semibold mb-4">Revenue Sources</h4>
            <div className="space-y-3">
              <ProgressBar label="Subscriptions" value={85} color="blue" />
              <ProgressBar label="Tips" value={10} color="green" />
              <ProgressBar label="PPV" value={5} color="purple" />
            </div>
          </div>

          {/* Content Performance */}
          <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl border border-white/10 p-6">
            <h4 className="text-white font-semibold mb-4">Content Performance</h4>
            <div className="space-y-3">
              <ProgressBar label="Images" value={65} color="pink" />
              <ProgressBar label="Videos" value={30} color="purple" />
              <ProgressBar label="Text Posts" value={5} color="blue" />
            </div>
          </div>
        </div>
      </div>

      {/* Top Posts */}
      <div>
        <h3 className="text-white font-bold text-xl mb-4">🔥 Top Performing Posts</h3>
        <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl border border-white/10 p-6">
          <p className="text-gray-400 text-center py-8">
            Top posts analytics coming soon...
          </p>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ label, value, icon, color }) {
  const colorClasses = {
    pink: "from-pink-500 to-rose-600",
    green: "from-green-500 to-emerald-600",
    blue: "from-blue-500 to-indigo-600",
    purple: "from-purple-500 to-pink-600",
  };

  return (
    <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl border border-white/10 p-6">
      <div className="flex items-center gap-3 mb-2">
        <span className="text-2xl">{icon}</span>
        <span className="text-gray-400 text-sm">{label}</span>
      </div>
      <div
        className={`text-3xl font-black bg-linear-to-r ${colorClasses[color]} bg-clip-text text-transparent`}
      >
        {value}
      </div>
    </div>
  );
}

function ProgressBar({ label, value, color }) {
  const colorClasses = {
    blue: "bg-blue-500",
    green: "bg-green-500",
    purple: "bg-purple-500",
    pink: "bg-pink-500",
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-white text-sm">{label}</span>
        <span className="text-gray-400 text-sm">{value}%</span>
      </div>
      <div className="w-full bg-gray-800 rounded-full h-2">
        <div
          className={`h-2 rounded-full ${colorClasses[color]} transition-all duration-500`}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}