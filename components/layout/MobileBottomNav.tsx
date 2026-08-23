"use client";

// components/layout/MobileBottomNav.tsx
// Fixed bottom nav for mobile — 4 primary tabs + "More" slide-up drawer.

import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAppCounts } from "@/lib/hooks/useAppCounts";

const V      = "#7c3aed";
const P      = "#ef3976";
const GRAD   = `linear-gradient(135deg, ${V}, ${P})`;
const CARD   = "#1a1635";
const BORDER = "rgba(124,58,237,0.18)";
const TEXT   = "#f0eaff";
const MUTED  = "rgba(240,234,255,0.4)";

// ─── Icons ────────────────────────────────────────────────────────────────────
function FeedIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
      stroke={active ? "url(#ig1)" : MUTED} strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round">
      <defs><linearGradient id="ig1" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor={V}/><stop offset="100%" stopColor={P}/>
      </linearGradient></defs>
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
      <polyline points="9 22 9 12 15 12 15 22"/>
    </svg>
  );
}

function MsgIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
      stroke={active ? "url(#ig2)" : MUTED} strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round">
      <defs><linearGradient id="ig2" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor={V}/><stop offset="100%" stopColor={P}/>
      </linearGradient></defs>
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
    </svg>
  );
}

function PassIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
      stroke={active ? "url(#ig3)" : MUTED} strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round">
      <defs><linearGradient id="ig3" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor={V}/><stop offset="100%" stopColor={P}/>
      </linearGradient></defs>
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
    </svg>
  );
}

function GridIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
      stroke={active ? "url(#ig4)" : MUTED} strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round">
      <defs><linearGradient id="ig4" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor={V}/><stop offset="100%" stopColor={P}/>
      </linearGradient></defs>
      <rect x="3" y="3" width="7" height="7"/>
      <rect x="14" y="3" width="7" height="7"/>
      <rect x="3" y="14" width="7" height="7"/>
      <rect x="14" y="14" width="7" height="7"/>
    </svg>
  );
}

// ─── More drawer items — keyed by role ────────────────────────────────────────
const MORE_ITEMS: Record<string, { href: string; label: string; icon: string }[]> = {
  user: [
    { href: "/dashboard/user/discover",       label: "Discover",        icon: "🔍" },
    { href: "/dashboard/user/subscriptions",  label: "Subscriptions",   icon: "⭐" },
    { href: "/dashboard/user/bookmarks",      label: "Bookmarks",       icon: "🔖" },
    { href: "/dashboard/user/wallet",         label: "Wallet",          icon: "💳" },
    { href: "/dashboard/user/shop",           label: "Shop",            icon: "🛍️" },
    { href: "/dashboard/user/apply-creator",  label: "Become Creator",  icon: "✨" },
    { href: "/dashboard/user/settings",       label: "Settings",        icon: "⚙️" },
  ],
  creator: [
    { href: "/dashboard/creator/overview",    label: "Overview",        icon: "🏠" },
    { href: "/dashboard/creator/content",     label: "Content",         icon: "📸" },
    { href: "/dashboard/creator/upload",      label: "Upload",          icon: "⬆️" },
    { href: "/dashboard/creator/subscribers", label: "Subscribers",     icon: "👥" },
    { href: "/dashboard/creator/earnings",    label: "Earnings",        icon: "💵" },
    { href: "/dashboard/creator/settings",    label: "Settings",        icon: "⚙️" },
  ],
  agency: [
    { href: "/dashboard/agency",              label: "Overview",        icon: "📊" },
    { href: "/dashboard/agency/creators",     label: "My Creators",     icon: "⭐" },
    { href: "/dashboard/agency/analytics",    label: "Analytics",       icon: "📈" },
    { href: "/dashboard/agency/applications", label: "Applications",    icon: "📋" },
    { href: "/dashboard/agency/payouts",      label: "Commissions",     icon: "💰" },
    { href: "/dashboard/agency/settings",     label: "Settings",        icon: "⚙️" },
  ],
  admin: [
    { href: "/dashboard/admin",               label: "Overview",        icon: "📊" },
    { href: "/dashboard/admin/creators",      label: "Creators",        icon: "⭐" },
    { href: "/dashboard/admin/agencies",      label: "Agencies",        icon: "🏢" },
    { href: "/dashboard/admin/users",         label: "Users",           icon: "👥" },
    { href: "/dashboard/admin/reports",       label: "Reports",         icon: "🚩" },
    { href: "/dashboard/admin/payouts",       label: "Payouts",         icon: "💸" },
    { href: "/dashboard/admin/settings",      label: "Settings",        icon: "⚙️" },
  ],
};

// Primary tab hrefs per role
const PRIMARY_TABS_BY_ROLE: Record<string, {
  feed:     string;
  messages: string;
  fanpass:  string;
}> = {
  user:    { feed: "/dashboard/user/feed",         messages: "/dashboard/user/message",    fanpass: "/dashboard/user/fan-pass" },
  creator: { feed: "/dashboard/creator/overview",  messages: "/dashboard/creator/message", fanpass: "/dashboard/user/fan-pass" },
  agency:  { feed: "/dashboard/agency",            messages: "/dashboard/agency/messages", fanpass: "/dashboard/agency/fan-pass" },
  admin:   { feed: "/dashboard/admin",             messages: "/dashboard/admin",           fanpass: "/dashboard/admin" },
};

// ─── More drawer ──────────────────────────────────────────────────────────────
function MoreDrawer({ open, onClose, userRole }: {
  open: boolean; onClose: () => void; userRole: string;
}) {
  const router = useRouter();
  const items  = MORE_ITEMS[userRole] ?? MORE_ITEMS.user;

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40 transition-opacity duration-300"
        style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)", opacity: open ? 1 : 0, pointerEvents: open ? "auto" : "none" }}
        onClick={onClose} />

      {/* Drawer */}
      <div className="fixed left-0 right-0 bottom-0 z-50 rounded-t-[28px] border-t border-x overflow-hidden"
        style={{
          background:  CARD,
          borderColor: BORDER,
          boxShadow:   "0 -8px 40px rgba(0,0,0,0.5)",
          transform:   open ? "translateY(0)" : "translateY(100%)",
          transition:  "transform 0.35s cubic-bezier(0.32,0.72,0,1)",
          maxHeight:   "78vh",
          overflowY:   "auto",
          paddingBottom: "env(safe-area-inset-bottom, 0px)",
        }}>

        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
          <div className="w-10 h-1 rounded-full" style={{ background: "rgba(255,255,255,0.15)" }} />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b flex-shrink-0"
          style={{ borderColor: BORDER }}>
          <p className="text-[14px] font-black" style={{ color: TEXT }}>More</p>
          <button onClick={onClose}
            className="size-8 rounded-xl flex items-center justify-center"
            style={{ background: "rgba(255,255,255,0.05)", color: MUTED }}>✕</button>
        </div>

        {/* Item grid */}
        <div className="grid grid-cols-3 gap-2 p-4">
          {items.map((item) => (
            <button key={item.href}
              onClick={() => { onClose(); router.push(item.href); }}
              className="flex flex-col items-center gap-2 rounded-[16px] border p-3.5 transition-all active:scale-95"
              style={{ background: "rgba(255,255,255,0.02)", borderColor: BORDER }}>
              <span className="text-[22px]">{item.icon}</span>
              <span className="text-[10px] font-black text-center leading-tight" style={{ color: MUTED }}>
                {item.label}
              </span>
            </button>
          ))}
        </div>

        {/* Sign out */}
        <div className="px-4 pb-4">
          <button onClick={() => { onClose(); router.push("/api/auth/signout"); }}
            className="w-full py-3 rounded-[16px] border text-[13px] font-black transition-all"
            style={{ background: "rgba(239,57,118,0.07)", borderColor: "rgba(239,57,118,0.25)", color: P }}>
            Sign Out
          </button>
        </div>
      </div>
    </>
  );
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
interface MobileBottomNavProps {
  unreadMessages?: number;
  userRole?:       string;
}

export function MobileBottomNav({ unreadMessages = 0, userRole = "user" }: MobileBottomNavProps) {
  const pathname = usePathname();
  const router   = useRouter();
  const [moreOpen, setMoreOpen] = useState(false);

  // Use live counts from useAppCounts — falls back to prop if hook returns 0
  const { messages: liveMessages } = useAppCounts();
  const msgCount = liveMessages > 0 ? liveMessages : unreadMessages;

  const tabs   = PRIMARY_TABS_BY_ROLE[userRole] ?? PRIMARY_TABS_BY_ROLE.user;
  const isMore = !pathname.startsWith(tabs.feed) &&
                 !pathname.startsWith(tabs.messages) &&
                 !pathname.startsWith(tabs.fanpass);

  const PRIMARY = [
    { id: "feed",     label: "Feed",     href: tabs.feed,     icon: (a: boolean) => <FeedIcon active={a} />, match: (p: string) => p.startsWith(tabs.feed),     badge: false },
    { id: "messages", label: "Messages", href: tabs.messages, icon: (a: boolean) => <MsgIcon  active={a} />, match: (p: string) => p.startsWith(tabs.messages),  badge: msgCount > 0 },
    { id: "fanpass",  label: "Fan Pass", href: tabs.fanpass,  icon: (a: boolean) => <PassIcon active={a} />, match: (p: string) => p.startsWith(tabs.fanpass),   badge: false },
    { id: "more",     label: "More",     href: "#",           icon: (a: boolean) => <GridIcon active={a} />, match: () => false,                                  badge: false },
  ];

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t"
        style={{
          background:    "rgba(13,13,26,0.97)",
          backdropFilter: "blur(20px)",
          borderColor:   BORDER,
          paddingBottom: "env(safe-area-inset-bottom, 4px)",
        }}>
        <div className="flex items-stretch">
          {PRIMARY.map((tab) => {
            const active = tab.id === "more" ? isMore && moreOpen : tab.match(pathname);
            return (
              <button key={tab.id}
                onClick={() => {
                  if (tab.id === "more") { setMoreOpen((o) => !o); }
                  else { setMoreOpen(false); router.push(tab.href); }
                }}
                className="flex-1 flex flex-col items-center justify-center gap-1 py-2.5 relative transition-all active:scale-95">

                {/* Active top indicator */}
                {active && (
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 h-0.5 w-8 rounded-full"
                    style={{ background: GRAD }} />
                )}

                {/* Icon + small dot badge — dot instead of pill keeps icon spacing consistent */}
                <div className="relative">
                  {tab.icon(active)}
                  {tab.badge && (
                    <span
                      className="absolute -top-0.5 -right-0.5 size-2 rounded-full border"
                      style={{ background: P, borderColor: "#0d0d1a", boxShadow: `0 0 5px ${P}` }}
                    />
                  )}
                </div>

                <span className="text-[9px] font-black uppercase tracking-wider"
                  style={{ color: active ? TEXT : MUTED }}>
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>

      <MoreDrawer open={moreOpen} onClose={() => setMoreOpen(false)} userRole={userRole} />
    </>
  );
}