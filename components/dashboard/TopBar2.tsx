"use client";

import { useState, useRef, useEffect } from "react";
import type { SessionUser } from "@/lib/types";
import { useRouter } from "next/navigation";
import { signOut } from "@/lib/auth/client";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import StatusModal from "../status/StatusModal";
import { AgencyNotificationBell } from "../agency/AgencyNotificationBell";

// ─── Theme ────────────────────────────────────────────────────────────────────
const V    = "#7c3aed";
const P    = "#ef3976";
const GRAD = `linear-gradient(135deg, ${V} 0%, ${P} 100%)`;

interface TopbarProps {
  user: SessionUser;
}

export function Topbar2({ user }: TopbarProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [showStatus, setShowStatus] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    if (dropdownOpen) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [dropdownOpen]);

  async function handleSignOut() {
    setIsSigningOut(true);
    setDropdownOpen(false);
    try {
      // Clear any active impersonation session before signing out
      // so the cookies don't persist and affect the next login
      await fetch("/api/agency/stop-impersonate", { method: "POST" }).catch(() => {});

      await signOut({
        fetchOptions: {
          onSuccess: () => router.push("/login"),
          onError: () => setIsSigningOut(false),
        },
      });
    } catch {
      setIsSigningOut(false);
    }
  }

  const initials = user.name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const userStatus = {
    tier: "Loyal",
    emoji: "⭐",
    progress: 65,
    currentRewards: ["Exclusive badge", "Discount in shop"],
    nextRewards: ["Creator shoutout", "VIP access"],
  };

  return (
    <>
      <header
        className="sticky top-0 z-30 flex items-center justify-between px-5 h-14"
        style={{
          background: "rgba(13,13,26,0.85)",
          backdropFilter: "blur(16px)",
          borderBottom: "1px solid rgba(124,58,237,0.12)",
        }}
      >
        {/* ── Left: Fanz Luv logo on mobile only (sidebar already shows it on desktop) ── */}
        <div className="flex items-center gap-2 lg:hidden">
          <div
            className="size-7 rounded-lg flex items-center justify-center font-black text-white text-[13px] flex-shrink-0"
            style={{ background: GRAD }}
          >
            F
          </div>
          <span className="text-[15px] font-black" style={{ color: "#f0eaff" }}>
            Fanz Luv
          </span>
        </div>
        {/* Empty spacer on desktop so right-side items stay right-aligned */}
        <div className="hidden lg:block" />

        {/* ── Right: notifications + avatar menu ── */}
        {/* ── Right: notifications + avatar menu ── */}
      <div className="flex items-center gap-2">
        {user.role === "agency" || user.role === "creator"
          ? <AgencyNotificationBell />
          : <NotificationBell />
        }

          {/* Avatar + dropdown */}
          <div ref={dropdownRef} className="relative">
            <button
              onClick={() => setDropdownOpen((o) => !o)}
              className="flex items-center gap-2 rounded-xl px-2 py-1.5 transition-all hover:bg-white/5"
              style={{ border: "1px solid rgba(124,58,237,0.15)" }}
            >
              {/* Avatar */}
              {(user as any).image ? (
                <img
                  src={(user as any).image}
                  alt={user.name}
                  className="size-7 rounded-full object-cover flex-shrink-0"
                  style={{ border: `1.5px solid ${V}` }}
                />
              ) : (
                <div
                  className="size-7 rounded-full flex items-center justify-center text-[10px] font-black text-white flex-shrink-0"
                  style={{ background: GRAD }}
                >
                  {initials}
                </div>
              )}

              {/* Name — hidden on small screens */}
              <span
                className="hidden sm:block text-[12px] font-bold max-w-[96px] truncate"
                style={{ color: "rgba(240,234,255,0.8)" }}
              >
                {user.name}
              </span>

              {/* Chevron */}
              <svg
                width="11"
                height="11"
                viewBox="0 0 11 11"
                fill="none"
                className="hidden sm:block flex-shrink-0 transition-transform duration-200"
                style={{
                  color: "rgba(240,234,255,0.4)",
                  transform: dropdownOpen ? "rotate(180deg)" : "rotate(0deg)",
                }}
              >
                <path
                  d="M2 4l3.5 3.5L9 4"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>

            {/* Dropdown */}
            {dropdownOpen && (
              <div
                className="absolute right-0 top-full mt-2 w-52 rounded-[16px] border overflow-hidden z-50"
                style={{
                  background: "#1a1635",
                  borderColor: "rgba(124,58,237,0.22)",
                  boxShadow:
                    "0 16px 48px rgba(0,0,0,0.5), 0 0 0 1px rgba(124,58,237,0.08)",
                  animation: "dropIn 0.15s ease forwards",
                }}
              >
                <style>{`@keyframes dropIn{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:translateY(0)}}`}</style>

                {/* User info header */}
                <div
                  className="px-4 py-3.5 border-b"
                  style={{ borderColor: "rgba(124,58,237,0.1)" }}
                >
                  <p className="text-[13px] font-black text-[#f0eaff] truncate">
                    {user.name}
                  </p>
                  <p
                    className="text-[11px] mt-0.5 truncate"
                    style={{ color: "rgba(240,234,255,0.4)" }}
                  >
                    {user.email}
                  </p>
                </div>

                {/* Menu items */}
                <div className="py-1.5">
                  {[
                    {
                      icon: "👤",
                      label: "Profile",
                      href: "/dashboard/user/settings?tab=profile",
                    },
                    { icon: "👑", label: "Status" },
                    {
                      icon: "⚙️",
                      label: "Settings",
                      href: "/dashboard/user/settings",
                    },
                    {
                      icon: "💳",
                      label: "Wallet",
                      href: "/dashboard/user/wallet",
                    },
                  ].map((item) => (
                    <button
                      key={item.label}
                      onClick={() => {
                        if (item.label === "Status") {
                          setShowStatus(true); // open modal
                          setDropdownOpen(false); // close dropdown
                        } else if (item.href) {
                          router.push(item.href); // normal navigation
                          setDropdownOpen(false);
                        }
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-[12px] font-bold transition-all text-left hover:bg-white/5"
                      style={{ color: "rgba(240,234,255,0.7)" }}
                    >
                      <span className="text-[14px]">{item.icon}</span>
                      {item.label}
                    </button>
                  ))}
                </div>

                {/* Sign out */}
                <div
                  className="px-3 py-2 border-t"
                  style={{ borderColor: "rgba(124,58,237,0.1)" }}
                >
                  <button
                    onClick={handleSignOut}
                    disabled={isSigningOut}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-[12px] font-bold transition-all"
                    style={{
                      background: "rgba(239,57,118,0.06)",
                      color: isSigningOut
                        ? "rgba(239,57,118,0.4)"
                        : "#ef3976",
                      cursor: isSigningOut ? "not-allowed" : "pointer",
                    }}
                  >
                    <span className="text-[14px]">🚪</span>
                    {isSigningOut ? "Signing out…" : "Sign Out"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Status Modal */}
      {showStatus && (
        <StatusModal status={userStatus} onClose={() => setShowStatus(false)} />
      )}
    </>
  );
}