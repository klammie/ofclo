// components/agency/tabs/OverviewTab.tsx
"use client";

export function OverviewTab({ creator, stats }) {
  return (
    <div className="space-y-6">
      {/* Revenue Stats */}
      <div>
        <h3 className="text-white font-bold text-xl mb-4">💰 Revenue</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard
            label="Total Revenue"
            value={`$${parseFloat(stats.revenue.total_revenue).toLocaleString()}`}
            color="green"
          />
          <StatCard
            label="This Month"
            value={`$${parseFloat(stats.revenue.monthly_revenue).toLocaleString()}`}
            color="blue"
          />
          <StatCard
            label="This Week"
            value={`$${parseFloat(stats.revenue.weekly_revenue).toLocaleString()}`}
            color="purple"
          />
        </div>
      </div>

      {/* Subscriber Stats */}
      <div>
        <h3 className="text-white font-bold text-xl mb-4">👥 Subscribers</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <StatCard
            label="Total Subscribers"
            value={stats.subscribers.total_subscribers}
            color="blue"
          />
          <StatCard
            label="Active"
            value={stats.subscribers.active_subscribers}
            color="green"
          />
          <StatCard
            label="New This Month"
            value={stats.subscribers.new_this_month}
            color="purple"
          />
          <StatCard
            label="Churn This Month"
            value={stats.subscribers.churn_this_month}
            color="red"
          />
        </div>
      </div>

      {/* Content Stats */}
      <div>
        <h3 className="text-white font-bold text-xl mb-4">📸 Content</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <StatCard
            label="Total Posts"
            value={stats.posts.total_posts}
            color="pink"
          />
          <StatCard
            label="This Month"
            value={stats.posts.this_month}
            color="purple"
          />
          <StatCard
            label="Total Likes"
            value={stats.posts.total_likes}
            color="red"
          />
          <StatCard
            label="Avg Engagement"
            value={parseFloat(stats.posts.avg_engagement).toFixed(1)}
            color="orange"
          />
        </div>
      </div>

      {/* Messages Stats */}
      <div>
        <h3 className="text-white font-bold text-xl mb-4">💬 Messages</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard
            label="Total Messages"
            value={stats.messages.total_messages}
            color="blue"
          />
          <StatCard
            label="This Week"
            value={stats.messages.this_week}
            color="purple"
          />
          <StatCard
            label="Unread"
            value={stats.messages.unread_count}
            color="red"
          />
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, color }) {
  const colorClasses = {
    blue: "from-blue-500 to-indigo-600",
    purple: "from-purple-500 to-pink-600",
    green: "from-green-500 to-emerald-600",
    pink: "from-pink-500 to-rose-600",
    red: "from-red-500 to-rose-600",
    orange: "from-orange-500 to-amber-600",
  };

  return (
    <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl border border-white/10 p-6">
      <div className="text-gray-400 text-sm mb-2">{label}</div>
      <div className={`text-3xl font-black bg-linear-to-r ${colorClasses[color]} bg-clip-text text-transparent`}>
        {value}
      </div>
    </div>
  );
}