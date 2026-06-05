"use client";

// components/dashboard/DashboardShell.tsx

import { useState, useEffect } from "react";
import { Sidebar } from "./Sidebar";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
import type { DbUser } from "@/lib/types";
import { Topbar2 } from "./TopBar2";

interface DashboardShellProps {
  user:     DbUser;
  children: React.ReactNode;
  unreadMessages?: number; // passed from layout
}

export function DashboardShell({ user, children, unreadMessages = 0 }: DashboardShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile,    setIsMobile]    = useState(false);

  // Detect mobile — hide sidebar by default, show bottom nav
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const handle = (e: MediaQueryListEvent | MediaQueryList) => {
      setIsMobile(e.matches);
      // On mobile, always keep sidebar closed
      if (e.matches) setSidebarOpen(false);
    };
    handle(mq);
    mq.addEventListener("change", handle);
    return () => mq.removeEventListener("change", handle);
  }, []);

  const userRole = (user.role ?? "user") as string;

  return (
    <div className="flex min-h-screen" style={{ background: "#0d0d1a" }}>

      {/* ── Sidebar — hidden on mobile ── */}
      {!isMobile && (
        <Sidebar
          user={user}
          isOpen={sidebarOpen}
          onToggle={() => setSidebarOpen((prev) => !prev)}
          statusXp={(user as any).statusXp ?? 0}
        />
      )}

      {/* ── Main content ── */}
      <div
        className="flex flex-col flex-1 min-w-0 transition-all duration-300"
        style={{
          // Desktop: offset by sidebar width. Mobile: full width
          marginLeft: isMobile ? 0 : sidebarOpen ? 256 : 72,
          // Mobile: pad bottom for fixed bottom nav (80px = nav height + safe area)
          paddingBottom: isMobile ? 80 : 0,
        }}
      >
        <Topbar2
          user={user}
          onMenuClick={() => {
            if (!isMobile) setSidebarOpen((prev) => !prev);
          }}
        />

        <main className="flex-1 p-4 md:p-6 overflow-y-auto">
          {children}
        </main>
      </div>

      {/* ── Mobile bottom nav — only on mobile ── */}
      {isMobile && (
        <MobileBottomNav
          unreadMessages={unreadMessages}
          userRole={userRole}
        />
      )}
    </div>
  );
}