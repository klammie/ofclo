"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "@/lib/auth/client";
import type { SessionUser } from "@/lib/auth";
import Image from "next/image";
import StatusModal, { getTierFromXp, getNextTier } from "@/components/status/StatusModal";

// ─── Theme ────────────────────────────────────────────────────────────────────
const V      = "#7c3aed";
const P      = "#ef3976";
const GRAD   = `linear-gradient(135deg, ${V}, ${P})`;
const BG     = "#0d0d1a";
const CARD   = "#1a1635";
const SURF   = "#13112b";
const BORDER = "rgba(124,58,237,0.18)";
const TEXT   = "#f0eaff";
const MUTED  = "rgba(240,234,255,0.45)";

interface SidebarProps {
  user?:       SessionUser;
  isOpen?:     boolean;
  onToggle?:   () => void;
  statusXp?:   number; // user's total status XP
}

type NavItem = {
  label:  string;
  href:   string;
  icon:   string;
  badge?: string | number;
  roles:  Array<"admin" | "agency" | "creator" | "user">;
};

const NAV_ITEMS: NavItem[] = [
  // Admin
  { label: "Overview",     href: "/dashboard/admin",              icon: "📊", roles: ["admin"] },
  { label: "Creators",     href: "/dashboard/admin/creators",     icon: "⭐", roles: ["admin"] },
  { label: "Agencies",     href: "/dashboard/admin/agencies",     icon: "🏢", roles: ["admin"] },
  { label: "Users",        href: "/dashboard/admin/users",        icon: "👥", roles: ["admin"] },
  { label: "Reports",      href: "/dashboard/admin/reports",      icon: "🚩", badge: "new", roles: ["admin"] },
  { label: "Payouts",      href: "/dashboard/admin/payouts",      icon: "💸", roles: ["admin"] },
  { label: "Settings",     href: "/dashboard/admin/settings",     icon: "⚙️", roles: ["admin"] },

  // Agency
  { label: "Overview",     href: "/dashboard/agency",             icon: "📊", roles: ["agency"] },
  { label: "My Creators",  href: "/dashboard/agency/creators",    icon: "⭐", roles: ["agency"] },
  { label: "Analytics",    href: "/dashboard/agency/analytics",   icon: "📈", roles: ["agency"] },
  { label: "Fan Pass",     href: "/dashboard/agency/fan-pass",    icon: "🏆", roles: ["agency"] },
  { label: "Commissions",  href: "/dashboard/agency/payouts",     icon: "💰", roles: ["agency"] },
  { label: "Applications", href: "/dashboard/agency/applications",icon: "📋", roles: ["agency"] },
  { label: "Messages",     href: "/dashboard/agency/messages",    icon: "💬", roles: ["agency"] },
  { label: "Settings",     href: "/dashboard/agency/settings",    icon: "⚙️", roles: ["agency"] },

  // Creator
  { label: "Overview",     href: "/dashboard/creator/overview",   icon: "🏠", roles: ["creator"] },
  { label: "Content",      href: "/dashboard/creator/content",    icon: "📸", roles: ["creator"] },
  { label: "Upload Media", href: "/dashboard/creator/upload",     icon: "⬆️", roles: ["creator"] },
  { label: "Subscribers",  href: "/dashboard/creator/subscribers",icon: "👥", roles: ["creator"] },
  { label: "Messages",     href: "/dashboard/creator/message",    icon: "💬", badge: 3, roles: ["creator"] },
  { label: "Earnings",     href: "/dashboard/creator/earnings",   icon: "💵", roles: ["creator"] },
  { label: "Settings",     href: "/dashboard/creator/settings",   icon: "⚙️", roles: ["creator"] },

  // User
  { label: "Feed",             href: "/dashboard/user/feed",           icon: "🏠", roles: ["user"] },
  { label: "Discover",         href: "/dashboard/user/discover",       icon: "🔍", roles: ["user"] },
  { label: "Subscriptions",    href: "/dashboard/user/subscriptions",  icon: "⭐", roles: ["user"] },
  { label: "Fan Pass",         href: "/dashboard/user/fan-pass",       icon: "🎟️", roles: ["user"] },
  { label: "Messages",         href: "/dashboard/user/message",        icon: "💬", roles: ["user"] },
  { label: "Become a Creator", href: "/dashboard/user/apply-creator",  icon: "✨", roles: ["user"] },
  { label: "Wallet",           href: "/dashboard/user/wallet",         icon: "💳", roles: ["user"] },
  { label: "Shop",             href: "/dashboard/user/shop",           icon: "🛍️", roles: ["user"] },
  { label: "Bookmarks",        href: "/dashboard/user/bookmarks",      icon: "🔖", roles: ["user"] },
  { label: "Settings",         href: "/dashboard/user/settings",       icon: "⚙️", roles: ["user"] },
];

// ─── Status mini badge ────────────────────────────────────────────────────────
function StatusBadge({ tier, isOpen }: { tier: ReturnType<typeof getTierFromXp>; isOpen: boolean }) {
  const isPresidential = tier.id === "presidential";
  const isFanatic      = tier.id === "fanatic";

  return (
    <div className="flex items-center gap-1.5 rounded-full px-2 py-0.5 flex-shrink-0"
      style={{
        background:  tier.bg,
        border:      `1px solid ${tier.border}`,
        boxShadow:   `0 0 8px ${tier.glow}`,
        animation:   isPresidential ? "statusGlow 2s ease-in-out infinite" : isFanatic ? "statusPulse 1.8s ease-in-out infinite" : "none",
      }}>
      <span style={{ fontSize: 11 }}>{tier.emoji}</span>
      {isOpen && (
        <span className="text-[9px] font-black uppercase tracking-wider whitespace-nowrap"
          style={{ color: tier.color }}>
          {tier.label}
        </span>
      )}
      <style>{`
        @keyframes statusGlow   { 0%,100%{box-shadow:0 0 8px ${tier.glow}}  50%{box-shadow:0 0 18px ${tier.glow}} }
        @keyframes statusPulse  { 0%,100%{opacity:1} 50%{opacity:0.7} }
      `}</style>
    </div>
  );
}

// ─── Avatar with tier ring ────────────────────────────────────────────────────
function TieredAvatar({
  user, tier, size = 40,
}: {
  user: SessionUser;
  tier: ReturnType<typeof getTierFromXp>;
  size?: number;
}) {
  const isPresidential = tier.id === "presidential";
  const isFanatic      = tier.id === "fanatic";
  const isSupporter    = tier.id === "supporter";

  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      {/* Avatar image */}
      <div className="rounded-full overflow-hidden size-full flex items-center justify-center font-black text-white"
        style={{
          background: user.image ? "transparent" : GRAD,
          fontSize:   size * 0.38,
          border:     `2px solid ${tier.color}`,
          boxShadow:  `0 0 12px ${tier.glow}, 0 0 0 2px #13112b`,
        }}>
        {user.image ? (
          <Image src={user.image} alt={user.name} width={size} height={size}
            className="rounded-full object-cover size-full" />
        ) : (
          user.name.charAt(0).toUpperCase()
        )}
      </div>

      {/* Explorer — simple dot indicator */}
      {tier.id === "explorer" && (
        <div className="absolute -bottom-0.5 -right-0.5 size-3 rounded-full border-2"
          style={{ background: tier.color, borderColor: SURF }} />
      )}

      {/* Supporter — pulsing outer ring */}
      {isSupporter && (
        <div className="absolute inset-0 rounded-full pointer-events-none"
          style={{
            boxShadow: `0 0 0 2px ${tier.color}60`,
            animation: "supporterRing 2.5s ease-in-out infinite",
          }}>
          <style>{`@keyframes supporterRing{0%,100%{box-shadow:0 0 0 2px ${tier.color}60}50%{box-shadow:0 0 0 4px ${tier.color}30}}`}</style>
        </div>
      )}

      {/* Fanatic — rotating dashed ring */}
      {isFanatic && (
        <div className="absolute pointer-events-none rounded-full"
          style={{
            inset: -3,
            border: `2px dashed ${tier.color}`,
            animation: "fanaticSpin 4s linear infinite",
          }}>
          <style>{`@keyframes fanaticSpin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
        </div>
      )}

      {/* Presidential — double rotating rings + glow */}
      {isPresidential && (
        <>
          <div className="absolute pointer-events-none rounded-full"
            style={{
              inset: -4,
              border: `2px solid ${tier.color}`,
              animation: "presRing1 3s linear infinite",
              boxShadow: `0 0 14px ${tier.glow}`,
            }} />
          <div className="absolute pointer-events-none rounded-full"
            style={{
              inset: -7,
              border: `1.5px dashed ${tier.color}70`,
              animation: "presRing2 5s linear infinite reverse",
            }} />
          <div className="absolute inset-0 rounded-full pointer-events-none"
            style={{
              background: `radial-gradient(circle, ${tier.glow} 0%, transparent 70%)`,
              animation: "presGlow 2s ease-in-out infinite",
            }} />
          <style>{`
            @keyframes presRing1 { from{transform:rotate(0deg)}   to{transform:rotate(360deg)} }
            @keyframes presRing2 { from{transform:rotate(0deg)}   to{transform:rotate(360deg)} }
            @keyframes presGlow  { 0%,100%{opacity:0.6} 50%{opacity:1} }
          `}</style>
        </>
      )}
    </div>
  );
}

// ─── XP mini progress bar ─────────────────────────────────────────────────────
function XpBar({ xp, tier, isOpen }: {
  xp: number; tier: ReturnType<typeof getTierFromXp>; isOpen: boolean;
}) {
  if (!isOpen || tier.maxXp === Infinity) return null;
  const pct = Math.min(100, Math.round(((xp - tier.minXp) / (tier.maxXp - tier.minXp)) * 100));

  return (
    <div className="flex flex-col gap-1">
      <div className="flex justify-between items-center">
        <span className="text-[9px] font-bold" style={{ color: "rgba(240,234,255,0.35)" }}>
          {xp.toLocaleString()} XP
        </span>
        <span className="text-[9px] font-bold" style={{ color: tier.color }}>{pct}%</span>
      </div>
      <div className="h-1 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.08)" }}>
        <div className="h-full rounded-full transition-all duration-700"
          style={{
            width:      `${pct}%`,
            background: `linear-gradient(90deg, ${tier.color}, ${tier.color}cc)`,
            boxShadow:  `0 0 6px ${tier.glow}`,
          }} />
      </div>
    </div>
  );
}

// ─── MAIN SIDEBAR ─────────────────────────────────────────────────────────────
export function Sidebar({ user, isOpen = true, onToggle, statusXp = 0 }: SidebarProps) {
  const pathname      = usePathname();
  const router        = useRouter();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [showStatus,   setShowStatus]   = useState(false);

  if (!user) {
    return (
      <aside className="fixed left-0 top-0 h-screen z-40 w-64 flex flex-col p-4"
        style={{ background: SURF, borderRight: `1px solid ${BORDER}` }}>
        <div className="animate-pulse flex flex-col gap-4">
          <div className="h-12 w-12 rounded-full" style={{ background: "rgba(124,58,237,0.2)" }} />
          <div className="h-4 w-32 rounded" style={{ background: "rgba(124,58,237,0.15)" }} />
          <div className="h-4 w-24 rounded" style={{ background: "rgba(124,58,237,0.1)" }} />
        </div>
      </aside>
    );
  }

  const userRole   = user.role as "admin" | "agency" | "creator" | "user";
  const visibleNav = NAV_ITEMS.filter((item) => item.roles.includes(userRole));
  const tier       = getTierFromXp(statusXp);
  const nextTier   = getNextTier(tier);

  async function handleSignOut() {
    setIsSigningOut(true);
    try {
      await signOut({
        fetchOptions: {
          onSuccess: () => router.push("/login"),
          onError:   () => setIsSigningOut(false),
        },
      });
    } catch { setIsSigningOut(false); }
  }

  return (
    <>
      <aside
        className="fixed left-0 top-0 h-screen z-40 flex flex-col transition-all duration-300 ease-in-out"
        style={{
          width:       isOpen ? 256 : 72,
          background:  SURF,
          borderRight: `1px solid ${BORDER}`,
          fontFamily:  "'Be Vietnam Pro', sans-serif",
        }}
      >
        {/* ── Logo ── */}
        <div className="flex items-center justify-between px-4 h-16 flex-shrink-0 border-b"
          style={{ borderColor: BORDER }}>
          <div className={`flex items-center gap-2.5 ${!isOpen ? "justify-center w-full" : ""}`}>
            <div className="size-9 rounded-xl flex items-center justify-center font-black text-white text-lg flex-shrink-0"
              style={{ background: GRAD }}>F</div>
            {isOpen && (
              <span className="text-[18px] font-black" style={{ color: TEXT }}>Fanz Luv</span>
            )}
          </div>
          {onToggle && isOpen && (
            <button onClick={onToggle}
              className="size-7 rounded-lg flex items-center justify-center text-[11px] transition-all hover:opacity-80"
              style={{ background: "rgba(255,255,255,0.05)", color: MUTED }}>
              ◀
            </button>
          )}
          {onToggle && !isOpen && (
            <button onClick={onToggle}
              className="absolute -right-3 top-7 size-6 rounded-full flex items-center justify-center text-[10px] border"
              style={{ background: SURF, borderColor: BORDER, color: MUTED }}>
              ▶
            </button>
          )}
        </div>

        {/* ── Profile + Status card ── */}
        <button
          onClick={() => setShowStatus(true)}
          className="flex flex-col gap-2.5 px-3 py-3.5 border-b mx-0 text-left transition-all group cursor-pointer"
          style={{ borderColor: BORDER }}
        >
          <div className={`flex items-center gap-3 ${!isOpen ? "justify-center" : ""}`}>
            <TieredAvatar user={user} tier={tier} size={isOpen ? 44 : 36} />

            {isOpen && (
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-[13px] font-black truncate" style={{ color: TEXT }}>
                    {user.name}
                  </p>
                  <StatusBadge tier={tier} isOpen={isOpen} />
                </div>
                <p className="text-[10px] capitalize mt-0.5" style={{ color: MUTED }}>
                  {userRole}
                </p>
              </div>
            )}
          </div>

          {/* XP bar */}
          {isOpen && (
            <XpBar xp={statusXp} tier={tier} isOpen={isOpen} />
          )}

          {/* Collapsed: status badge only */}
          {!isOpen && (
            <div className="flex justify-center">
              <StatusBadge tier={tier} isOpen={false} />
            </div>
          )}

          {/* "View status" hint on hover */}
          {isOpen && (
            <p className="text-[9px] font-bold opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ color: tier.color }}>
              {tier.id === "presidential"
                ? "👑 Maximum status achieved"
                : `Tap to view status · ${(tier.maxXp - statusXp).toLocaleString()} XP to ${nextTier?.label}`}
            </p>
          )}
        </button>

        {/* ── Nav items ── */}
        <nav className="flex-1 overflow-y-auto py-3 px-2"
          style={{ scrollbarWidth: "none" }}>
          <div className="flex flex-col gap-0.5">
            {visibleNav.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <a key={item.href} href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 ${!isOpen ? "justify-center" : ""}`}
                  style={isActive
                    ? { background: "rgba(124,58,237,0.15)", color: TEXT, borderLeft: `2px solid ${V}` }
                    : { color: MUTED, borderLeft: "2px solid transparent" }}
                  onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.background = "rgba(255,255,255,0.04)"; }}
                  onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.background = "transparent"; }}>

                  <span className="text-[17px] flex-shrink-0">{item.icon}</span>

                  {isOpen && (
                    <>
                      <span className="flex-1 text-[13px] font-bold">{item.label}</span>
                      {item.badge && (
                        <span className="rounded-full px-2 py-0.5 text-[9px] font-black text-white"
                          style={{ background: typeof item.badge === "number" ? P : V }}>
                          {item.badge}
                        </span>
                      )}
                    </>
                  )}
                </a>
              );
            })}
          </div>
        </nav>

        {/* ── Sign out ── */}
        <div className="p-3 border-t flex-shrink-0" style={{ borderColor: BORDER }}>
          <button onClick={handleSignOut} disabled={isSigningOut}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${!isOpen ? "justify-center" : ""}`}
            style={{ color: MUTED, opacity: isSigningOut ? 0.5 : 1 }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(239,57,118,0.08)"; e.currentTarget.style.color = P; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = MUTED; }}>
            <span className="text-[17px] flex-shrink-0">🚪</span>
            {isOpen && (
              <span className="text-[13px] font-bold">
                {isSigningOut ? "Signing out…" : "Sign Out"}
              </span>
            )}
          </button>
        </div>
      </aside>

      {/* Status modal */}
      {showStatus && (
        <StatusModal xp={statusXp} onClose={() => setShowStatus(false)} />
      )}
    </>
  );
}