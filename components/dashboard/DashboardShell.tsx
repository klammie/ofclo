"use client";

// components/dashboard/DashboardShell.tsx

import { useState, useEffect, useCallback } from "react";
import { Sidebar } from "./Sidebar";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
import { StatusTierUpOverlay } from "@/components/fan-pass/StatusTierUpOverlay";
import type { DbUser } from "@/lib/types";
import { Topbar2 } from "./TopBar2";
import { OnboardingModal } from "@/components/onboarding/OnboardingModal";

interface DashboardShellProps {
  user:            DbUser;
  children:        React.ReactNode;
  unreadMessages?: number;
  statusXp?:       number;
}

export function DashboardShell({ user, children, unreadMessages = 0, statusXp = 0 }: DashboardShellProps) {
  const [sidebarOpen,    setSidebarOpen]    = useState(true);
  const [isMobile,       setIsMobile]       = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);

  // Onboarding check
  useEffect(() => {
    const dismissed = localStorage.getItem("onboarding_complete") === "true";
    if (user.role === "user" && !user.onboardingCompleted && !dismissed) {
      setShowOnboarding(true);
    }
  }, [user.role, user.onboardingCompleted]);

  const handleOnboardingComplete = useCallback(() => {
    localStorage.setItem("onboarding_complete", "true");
    setShowOnboarding(false);
  }, []);

  // Detect mobile
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const handle = (e: MediaQueryListEvent | MediaQueryList) => {
      setIsMobile(e.matches);
      if (e.matches) setSidebarOpen(false);
    };
    handle(mq);
    mq.addEventListener("change", handle);
    return () => mq.removeEventListener("change", handle);
  }, []);

  // ── CSS variable for sidebar width ────────────────────────────────────────
  // Used by fixed-position elements (SuggestedCreatorsSidebar) so they can
  // shift right when the sidebar expands without needing prop drilling.
  useEffect(() => {
    const width = isMobile ? "0px" : sidebarOpen ? "256px" : "72px";
    document.documentElement.style.setProperty("--sidebar-width", width);
  }, [sidebarOpen, isMobile]);

  const userRole = (user.role ?? "user") as string;

  return (
    <div className="flex min-h-screen" style={{ background: "#0d0d1a" }}>

      <StatusTierUpOverlay statusXp={statusXp} />

      {/* ── Sidebar — hidden on mobile ── */}
      {!isMobile && (
        <Sidebar
          user={user}
          isOpen={sidebarOpen}
          onToggle={() => setSidebarOpen((prev) => !prev)}
          statusXp={statusXp}
        />
      )}

      {/* ── Main content ── */}
      <div
        className="flex flex-col flex-1 min-w-0 transition-all duration-300"
        style={{
          marginLeft:    isMobile ? 0 : sidebarOpen ? 256 : 72,
          paddingBottom: isMobile ? 80 : 0,
        }}
      >
        <Topbar2
          user={user}
          onMenuClick={() => {
            if (!isMobile) setSidebarOpen((prev) => !prev);
          }}
        />

        {/* No overflow-y-auto here — page body scrolls naturally so
            position:sticky works on sidebars */}
        <main className="flex-1 p-4 md:p-6">
          {children}
        </main>
      </div>

      {/* ── Mobile bottom nav ── */}
      {isMobile && (
        <MobileBottomNav
          unreadMessages={unreadMessages}
          userRole={userRole}
        />
      )}

      {showOnboarding && (
        <OnboardingModal onComplete={handleOnboardingComplete} />
      )}
    </div>
  );
}