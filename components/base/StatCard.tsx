// components/ui/StatCard.tsx
"use client";

import type { StatItem } from "@/lib/types";

interface StatCardProps extends StatItem {
  accentColor: string;
}

export function StatCard({ label, value, change, up, accentColor }: StatCardProps) {
  return (
    <div
      className="rounded-2xl p-5 flex flex-col gap-2"
      style={{
        background:  "#14142b",
        border:      "1px solid #2a2a4a",
        boxShadow:   `0 4px 24px ${accentColor}10`,
      }}
    >
      <span className="text-[11px] font-semibold uppercase tracking-widest text-gray-500">
        {label}
      </span>
      <span className="text-3xl font-black text-white tracking-tight">{value}</span>
      <span
        className="text-sm font-semibold"
        style={{ color: up ? "#10b981" : "#ef4444" }}
      >
        {up ? "↑" : "↓"} {change}{" "}
        <span className="text-gray-600 font-normal">vs last month</span>
      </span>
    </div>
  );
}