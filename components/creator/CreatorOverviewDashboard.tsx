"use client";

import { useState } from "react";
import { Line, Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

export function CreatorOverviewDashboard({ creatorId, stats }) {
  const [showGoalModal, setShowGoalModal] = useState(false);

  // Chart data for subscriber growth
  const growthChartData = {
    labels: stats.growth.map(d => new Date(d.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })),
    datasets: [
      {
        label: "New Subscribers",
        data: stats.growth.map(d => d.new_subs),
        borderColor: "rgb(236, 72, 153)",
        backgroundColor: "rgba(236, 72, 153, 0.1)",
        tension: 0.4,
      },
      {
        label: "Cancellations",
        data: stats.growth.map(d => d.cancellations),
        borderColor: "rgb(239, 68, 68)",
        backgroundColor: "rgba(239, 68, 68, 0.1)",
        tension: 0.4,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        labels: {
          color: "rgb(156, 163, 175)",
        },
      },
    },
    scales: {
      x: {
        ticks: { color: "rgb(156, 163, 175)" },
        grid: { color: "rgba(255, 255, 255, 0.1)" },
      },
      y: {
        ticks: { color: "rgb(156, 163, 175)" },
        grid: { color: "rgba(255, 255, 255, 0.1)" },
      },
    },
  };

  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          icon="👥"
          label="Total Subscribers"
          value={stats.basicStats.total_subscribers}
          change="+12%"
          changePositive={true}
        />
        <StatCard
          icon="⭐"
          label="VIP Subscribers"
          value={stats.basicStats.vip_subscribers}
          change="+8%"
          changePositive={true}
        />
        <StatCard
          icon="💰"
          label="Total Revenue"
          value={`$${parseFloat(stats.basicStats.total_revenue).toFixed(2)}`}
          change="+24%"
          changePositive={true}
        />
        <StatCard
          icon="📸"
          label="Total Posts"
          value={stats.basicStats.total_posts}
          change="+5"
          changePositive={true}
        />
      </div>

      {/* Subscriber Growth Chart */}
      <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl border border-white/10 p-6">
        <h3 className="text-white font-bold text-xl mb-4">📈 Subscriber Growth (Last 30 Days)</h3>
        <Line data={growthChartData} options={chartOptions} />
      </div>

      {/* Goals & Scheduled Posts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Goals */}
        <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl border border-white/10 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-bold text-xl">🎯 Goals</h3>
            <button
              onClick={() => setShowGoalModal(true)}
              className="px-4 py-2 rounded-lg bg-pink-500 text-white font-semibold text-sm hover:bg-pink-600 transition-colors"
            >
              + New Goal
            </button>
          </div>

          {stats.goals.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <div className="text-4xl mb-2">🎯</div>
              <p>No goals set yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {stats.goals.map((goal) => (
                <GoalCard key={goal.id} goal={goal} />
              ))}
            </div>
          )}
        </div>

        {/* Scheduled Posts */}
        <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl border border-white/10 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-bold text-xl">📅 Upcoming Posts</h3>
            <button className="px-4 py-2 rounded-lg bg-indigo-500 text-white font-semibold text-sm hover:bg-indigo-600 transition-colors">
              + Schedule Post
            </button>
          </div>

          {stats.scheduledPosts.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <div className="text-4xl mb-2">📅</div>
              <p>No scheduled posts</p>
            </div>
          ) : (
            <div className="space-y-3">
              {stats.scheduledPosts.map((post) => (
                <ScheduledPostCard key={post.id} post={post} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Retention Stats */}
      <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl border border-white/10 p-6">
        <h3 className="text-white font-bold text-xl mb-4">📊 Retention Metrics</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <div className="text-gray-400 text-sm mb-1">Avg. Subscription Length</div>
            <div className="text-white font-bold text-3xl">{stats.retention.avg_subscription_days} days</div>
          </div>
          <div>
            <div className="text-gray-400 text-sm mb-1">Total Cancellations</div>
            <div className="text-white font-bold text-3xl">{stats.retention.total_cancelled}</div>
          </div>
          <div>
            <div className="text-gray-400 text-sm mb-1">Cancellation Rate</div>
            <div className="text-white font-bold text-3xl">{parseFloat(stats.retention.cancellation_rate).toFixed(1)}%</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, change, changePositive }) {
  return (
    <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl border border-white/10 p-6">
      <div className="flex items-center justify-between mb-2">
        <span className="text-3xl">{icon}</span>
        <span className={`text-sm font-semibold ${changePositive ? "text-green-400" : "text-red-400"}`}>
          {change}
        </span>
      </div>
      <div className="text-gray-400 text-sm mb-1">{label}</div>
      <div className="text-white font-bold text-2xl">{value}</div>
    </div>
  );
}

function GoalCard({ goal }) {
  const progress = (goal.current_value / goal.target_value) * 100;
  const isCompleted = goal.is_completed;

  return (
    <div className="bg-gray-800/50 rounded-xl p-4 border border-white/10">
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          <h4 className="text-white font-semibold">{goal.title}</h4>
          {goal.description && (
            <p className="text-gray-400 text-sm mt-1">{goal.description}</p>
          )}
        </div>
        {isCompleted && (
          <span className="text-green-400 text-xl">✓</span>
        )}
      </div>

      <div className="flex items-center justify-between text-sm mb-2">
        <span className="text-gray-400">
          {goal.current_value} / {goal.target_value}
        </span>
        <span className={`font-semibold ${isCompleted ? "text-green-400" : "text-pink-400"}`}>
          {progress.toFixed(0)}%
        </span>
      </div>

      <div className="w-full bg-gray-700 rounded-full h-2">
        <div
          className={`h-2 rounded-full ${isCompleted ? "bg-green-500" : "bg-pink-500"}`}
          style={{ width: `${Math.min(progress, 100)}%` }}
        />
      </div>

      {goal.deadline && (
        <div className="text-gray-500 text-xs mt-2">
          Deadline: {new Date(goal.deadline).toLocaleDateString()}
        </div>
      )}
    </div>
  );
}

function ScheduledPostCard({ post }) {
  const scheduledDate = new Date(post.scheduled_for);
  const isToday = scheduledDate.toDateString() === new Date().toDateString();

  return (
    <div className="bg-gray-800/50 rounded-lg p-3 border border-white/10 hover:border-pink-500/50 transition-colors">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-lg bg-gray-700 flex items-center justify-center text-2xl">
          {post.media_type === "video" ? "🎥" : "📸"}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-white font-semibold truncate">{post.title}</h4>
          <p className="text-gray-400 text-sm">
            {isToday ? "Today" : scheduledDate.toLocaleDateString()} at {scheduledDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </p>
        </div>
        <span className={`px-2 py-1 rounded text-xs font-semibold ${
          post.status === "scheduled" ? "bg-blue-500/20 text-blue-400" : "bg-gray-700 text-gray-400"
        }`}>
          {post.status}
        </span>
      </div>
    </div>
  );
}