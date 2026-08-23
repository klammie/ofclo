"use client";

import { useState, useEffect } from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { CreateCampaignButton } from "@/components/campaigns/CreateCampaignButton";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

// ─── Theme ────────────────────────────────────────────────────────────────────
const V      = "#7c3aed";
const P      = "#ef3976";
const GRAD   = `linear-gradient(135deg, ${V}, ${P})`;
const BORDER = "rgba(124,58,237,0.18)";
const TEXT   = "#f0eaff";
const MUTED  = "rgba(240,234,255,0.45)";

// ─── Helpers ──────────────────────────────────────────────────────────────────
function daysLeft(deadline: string | Date): number {
  return Math.max(0, Math.ceil((new Date(deadline).getTime() - Date.now()) / 86_400_000));
}

function fmtMoney(n: number | string): string {
  return `$${Number(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// ─── Campaign card ────────────────────────────────────────────────────────────
function CampaignCard({ campaign }: { campaign: any }) {
  const goal     = Number(campaign.goalAmount ?? campaign.goal_amount ?? 0);
  const raised   = Number(campaign.raisedAmount ?? campaign.raised_amount ?? 0);
  const pct      = goal > 0 ? Math.min(100, Math.round((raised / goal) * 100)) : 0;
  const dl       = daysLeft(campaign.deadline);
  const isFunded = campaign.status === "funded" || pct >= 100;
  const isExpired = campaign.status === "expired" || (dl === 0 && !isFunded);

  return (
    <div className="rounded-xl border p-4"
      style={{ background: "rgba(255,255,255,0.03)", borderColor: isFunded ? "rgba(74,222,128,0.3)" : BORDER }}>
      <div className="flex items-start justify-between gap-2 mb-2">
        <h4 className="text-[13px] font-black truncate" style={{ color: TEXT }}>{campaign.title}</h4>
        <span className="text-[9px] font-black uppercase tracking-wider rounded-full px-2 py-0.5 flex-shrink-0"
          style={
            isFunded  ? { background: "rgba(74,222,128,0.15)", color: "#4ade80" }
            : isExpired ? { background: "rgba(239,57,118,0.1)", color: P }
            : { background: "rgba(124,58,237,0.12)", color: "#a78bfa" }
          }>
          {isFunded ? "✓ Funded" : isExpired ? "Expired" : "Active"}
        </span>
      </div>

      <div className="flex items-baseline justify-between mb-1.5">
        <span className="text-[14px] font-black" style={{ color: TEXT }}>{fmtMoney(raised)}</span>
        <span className="text-[11px] font-bold" style={{ color: MUTED }}>of {fmtMoney(goal)} · {pct}%</span>
      </div>

      <div className="w-full h-2 rounded-full overflow-hidden mb-2"
        style={{ background: "rgba(255,255,255,0.08)" }}>
        <div className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, background: isFunded ? "#4ade80" : GRAD }} />
      </div>

      <div className="flex items-center justify-between text-[10px]" style={{ color: MUTED }}>
        <span>👥 {campaign.pledgerCount ?? campaign.pledger_count ?? 0} pledgers</span>
        {!isExpired && !isFunded && <span>⏱ {dl}d left</span>}
        {isExpired && !isFunded && <span style={{ color: P }}>Ended</span>}
      </div>
    </div>
  );
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
export function CreatorOverviewDashboard({ creatorId, stats }) {
  const [campaigns, setCampaigns]  = useState<any[]>([]);
  const [campsLoading, setCampsLoading] = useState(true);

  // Fetch creator's campaigns on mount
  useEffect(() => {
    fetch(`/api/campaigns?creatorId=${creatorId}`)
      .then((r) => r.json())
      .then((d) => setCampaigns(d.campaigns ?? []))
      .catch(() => {})
      .finally(() => setCampsLoading(false));
  }, [creatorId]);

  const growthChartData = {
    labels: stats.growth.map((d: any) =>
      new Date(d.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })
    ),
    datasets: [
      {
        label: "New Subscribers",
        data: stats.growth.map((d: any) => d.new_subs),
        borderColor: "#ec4899",
        backgroundColor: "rgba(236,72,153,0.1)",
        tension: 0.4,
      },
      {
        label: "Cancellations",
        data: stats.growth.map((d: any) => d.cancellations),
        borderColor: "#ef4444",
        backgroundColor: "rgba(239,68,68,0.1)",
        tension: 0.4,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: { legend: { labels: { color: "rgb(156,163,175)" } } },
    scales: {
      x: { ticks: { color: "rgb(156,163,175)" }, grid: { color: "rgba(255,255,255,0.1)" } },
      y: { ticks: { color: "rgb(156,163,175)" }, grid: { color: "rgba(255,255,255,0.1)" } },
    },
  };

  const activeCampaigns = campaigns.filter((c) => c.status === "active");
  const totalRaised = campaigns.reduce((s, c) => s + Number(c.raisedAmount ?? c.raised_amount ?? 0), 0);

  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard icon="👥" label="Total Subscribers" value={stats.basicStats.total_subscribers} change="+12%" changePositive />
        <StatCard icon="⭐" label="VIP Subscribers"   value={stats.basicStats.vip_subscribers}   change="+8%"  changePositive />
        <StatCard icon="💰" label="Total Revenue"     value={`$${parseFloat(stats.basicStats.total_revenue).toFixed(2)}`} change="+24%" changePositive />
        <StatCard icon="📸" label="Total Posts"       value={stats.basicStats.total_posts}        change="+5"   changePositive />
      </div>

      {/* Subscriber Growth Chart */}
      <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl border border-white/10 p-6">
        <h3 className="text-white font-bold text-xl mb-4">📈 Subscriber Growth (Last 30 Days)</h3>
        <Line data={growthChartData} options={chartOptions} />
      </div>

      {/* Campaigns + Scheduled Posts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* ── CAMPAIGNS — replaces Goals ── */}
        <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl border border-white/10 p-6 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-white font-bold text-xl">🎯 Campaigns</h3>
              {campaigns.length > 0 && (
                <p className="text-[11px] mt-0.5" style={{ color: MUTED }}>
                  {activeCampaigns.length} active · {fmtMoney(totalRaised)} raised total
                </p>
              )}
            </div>
            <CreateCampaignButton
              onCreated={(campaign) => setCampaigns((prev) => [campaign, ...prev])}
            />
          </div>

          {campsLoading ? (
            <div className="flex flex-col gap-3 animate-pulse">
              {[...Array(2)].map((_, i) => (
                <div key={i} className="h-24 rounded-xl" style={{ background: "rgba(124,58,237,0.07)" }} />
              ))}
            </div>
          ) : campaigns.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-10 text-center">
              <span className="text-4xl">🎯</span>
              <p className="font-bold text-white">No campaigns yet</p>
              <p className="text-[12px]" style={{ color: MUTED }}>
                Start a crowdfunding campaign to raise funds from your subscribers
              </p>
              <CreateCampaignButton
                onCreated={(campaign) => setCampaigns((prev) => [campaign, ...prev])}
              />
            </div>
          ) : (
            <div className="flex flex-col gap-3 overflow-y-auto" style={{ maxHeight: 320 }}>
              {campaigns.map((c) => (
                <CampaignCard key={c.id} campaign={c} />
              ))}
            </div>
          )}
        </div>

        {/* Scheduled Posts — unchanged */}
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
              {stats.scheduledPosts.map((post: any) => (
                <ScheduledPostCard key={post.id} post={post} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Retention Stats — unchanged */}
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

// ─── Unchanged sub-components ─────────────────────────────────────────────────
function StatCard({ icon, label, value, change, changePositive }) {
  return (
    <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl border border-white/10 p-6">
      <div className="flex items-center justify-between mb-2">
        <span className="text-3xl">{icon}</span>
        <span className={`text-sm font-semibold ${changePositive ? "text-green-400" : "text-red-400"}`}>{change}</span>
      </div>
      <div className="text-gray-400 text-sm mb-1">{label}</div>
      <div className="text-white font-bold text-2xl">{value}</div>
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
            {isToday ? "Today" : scheduledDate.toLocaleDateString()} at{" "}
            {scheduledDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
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