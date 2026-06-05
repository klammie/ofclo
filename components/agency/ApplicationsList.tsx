// components/agency/ApplicationsList.tsx
"use client";

import { useState } from "react";
import { ApplicationCard } from "./ApplicationCard";

export function ApplicationsList({ applications }) {
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">("pending");

  const filteredApps = applications.filter(app => 
    filter === "all" ? true : app.status === filter
  );

  const counts = {
    pending: applications.filter(a => a.status === "pending").length,
    approved: applications.filter(a => a.status === "approved").length,
    rejected: applications.filter(a => a.status === "rejected").length,
  };

  return (
    <div className="space-y-6">
      {/* Filter Tabs */}
      <div className="flex gap-2 bg-gray-900/50 backdrop-blur-sm rounded-2xl border border-white/10 p-2">
        {[
          { value: "all", label: "All" },
          { value: "pending", label: `Pending (${counts.pending})` },
          { value: "approved", label: `Approved (${counts.approved})` },
          { value: "rejected", label: `Rejected (${counts.rejected})` },
        ].map((tab) => (
          <button
            key={tab.value}
            onClick={() => setFilter(tab.value as any)}
            className={`flex-1 py-2 px-4 rounded-lg font-semibold transition-colors ${
              filter === tab.value
                ? "bg-pink-500 text-white"
                : "text-gray-400 hover:text-white"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Applications */}
      {filteredApps.length === 0 ? (
        <div className="text-center py-12 bg-gray-900/50 backdrop-blur-sm rounded-2xl border border-white/10">
          <div className="text-4xl mb-2">📭</div>
          <p className="text-gray-400">No applications found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredApps.map((app) => (
            <ApplicationCard key={app.id} application={app} />
          ))}
        </div>
      )}
    </div>
  );
}