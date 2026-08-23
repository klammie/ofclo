// components/agency/CreatorManagementTabs.tsx
"use client";

import { useState } from "react";
import  OverviewTab  from "./tabs/OverviewTab";
import { PostsTab } from "./tabs/PostsTab";
import { MessagesTab } from "./tabs/MessagesTab";
import { SubscribersTab } from "./tabs/SubscribersTab";
import { AnalyticsTab } from "./tabs/AnalyticsTab";
import { SettingsTab } from "./tabs/SettingsTab";

type TabType = "overview" | "posts" | "messages" | "subscribers" | "analytics" | "settings";

export function CreatorManagementTabs({ creator, stats, agencyId }) {
  const [activeTab, setActiveTab] = useState<TabType>("overview");

  const tabs = [
    { id: "overview", label: "Overview", icon: "📊" },
    { id: "posts", label: "Posts", icon: "📸" },
    { id: "messages", label: "Messages", icon: "💬" },
    { id: "subscribers", label: "Subscribers", icon: "👥" },
    { id: "analytics", label: "Analytics", icon: "📈" },
    { id: "settings", label: "Settings", icon: "⚙️" },
  ];

  return (
    <div>
      {/* Tabs Navigation */}
      <div className="flex gap-2 mb-6 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as TabType)}
            className={`px-6 py-3 rounded-lg font-semibold transition-all whitespace-nowrap ${
              activeTab === tab.id
                ? "bg-linear-to-r from-pink-500 to-purple-600 text-white"
                : "bg-gray-900/50 text-gray-400 hover:text-white hover:bg-gray-800"
            }`}
          >
            <span className="mr-2">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === "overview" && <OverviewTab creator={creator} stats={stats} />}
        {activeTab === "posts" && (
  <PostsTab
    creatorId={creator.id}
    creatorUserId={creator.userId}
    creatorName={creator.userName}
  />
)}
        {activeTab === "messages" && <MessagesTab creatorUserId={creator.userId} />}
        {activeTab === "subscribers" && <SubscribersTab creatorId={creator.id} />}
        {activeTab === "analytics" && <AnalyticsTab creatorId={creator.id} stats={stats} />}
        {activeTab === "settings" && <SettingsTab creator={creator} agencyId={agencyId} />}
      </div>
    </div>
  );
}