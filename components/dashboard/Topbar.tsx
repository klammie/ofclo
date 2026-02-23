// components/dashboard/Topbar.tsx
"use client";

import { useState } from "react";
import type { SessionUser } from "@/lib/types";

interface TopbarProps {
  user:        SessionUser;
  onMenuClick: () => void;
}

export function Topbar({ user, onMenuClick }: TopbarProps) {
  const [query, setQuery] = useState("");

  return (
    <header
      className="flex items-center justify-between px-6 py-3 sticky top-0 z-10"
      style={{ background: "#101024", borderBottom: "1px solid #2a2a4a" }}
    >
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuClick}
          className="text-gray-400 hover:text-white transition-colors p-1"
        >
          ☰
        </button>
        <div>
          <h1 className="text-white font-black text-lg leading-none">Dashboard</h1>
          <p className="text-gray-500 text-xs mt-0.5">
            {new Date().toLocaleDateString("en-US", {
              weekday: "long", year: "numeric", month: "long", day: "numeric"
            })}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Search */}
        <div className="relative">
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search…"
            className="bg-[#0d0d1f] border border-white/10 rounded-lg pl-8 pr-3 py-2 text-sm text-gray-300 placeholder:text-gray-600 outline-none focus:border-white/20 w-44"
          />
          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-600 text-xs">🔍</span>
        </div>

        {/* Notification bell */}
        <button className="relative w-9 h-9 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors">
          <span className="text-gray-400">🔔</span>
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500 border border-[#101024]" />
        </button>

        {/* Avatar */}
        <div className="w-9 h-9 rounded-full bg-indigo-500/25 flex items-center justify-center text-xs font-black text-indigo-400 cursor-pointer">
          {user.name.slice(0, 2).toUpperCase()}
        </div>
      </div>
    </header>
  );
}