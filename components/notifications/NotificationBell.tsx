"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useNotifications } from "@/lib/hooks/use-notifications";
import type { Notification, NotificationType } from "@/lib/types";

// ─── Theme ────────────────────────────────────────────────────────────────────
const P    = "#ef3976";
const V    = "#7c3aed";
const GRAD = `linear-gradient(135deg, ${V} 0%, ${P} 100%)`;
const CARD = "#1a1635";
const SURF = "#13112b";
const BG   = "#0d0d1a";
const BORDER = "rgba(124,58,237,0.18)";

function cn(...c: (string | boolean | undefined | null)[]) {
  return c.filter(Boolean).join(" ");
}

// ─── Type → colour ────────────────────────────────────────────────────────────
function typeColor(type: NotificationType): string {
  const map: Partial<Record<NotificationType, string>> = {
    new_subscriber:      "#4ade80",
    new_tip:             P,
    new_like:            "#f472b6",
    new_message:         "#38bdf8",
    new_comment:         "#a78bfa",
    new_post:            V,
    level_up:            "#fbbf24",
    coin_earned:         "#fbbf24",
    streak_reminder:     "#fb923c",
    streak_broken:       P,
    deposit_confirmed:   "#4ade80",
    withdrawal_approved: "#4ade80",
    withdrawal_rejected: P,
    welcome:             "#fbbf24",
    campaign_reward:     "#fbbf24",
    system:              "#94a3b8",
  };
  return map[type] ?? "#94a3b8";
}

// ─── Relative time ────────────────────────────────────────────────────────────
function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  const h = Math.floor(diff / 3600000);
  const d = Math.floor(diff / 86400000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  if (h < 24) return `${h}h ago`;
  if (d < 7) return `${d}d ago`;
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// ─── Single notification row ──────────────────────────────────────────────────
function NotificationRow({
  notif,
  onRead,
  onNavigate,
}: {
  notif: Notification;
  onRead: (id: string) => void;
  onNavigate: (url?: string) => void;
}) {
  const color = typeColor(notif.type);

  const handleClick = () => {
    if (!notif.isRead) onRead(notif.id);
    if (notif.actionUrl) onNavigate(notif.actionUrl);
  };

  return (
    <div
      onClick={handleClick}
      className="flex items-start gap-3 px-4 py-3.5 cursor-pointer transition-all duration-150 group border-b"
      style={{
        background: notif.isRead ? "transparent" : "rgba(124,58,237,0.05)",
        borderColor: "rgba(124,58,237,0.08)",
      }}
    >
      {/* Left: unread dot + icon */}
      <div className="relative flex-shrink-0 mt-0.5">
        {/* Unread indicator */}
        {!notif.isRead && (
          <span
            className="absolute -top-0.5 -left-0.5 size-2 rounded-full z-10"
            style={{ background: color }}
          />
        )}

        {/* Avatar or icon */}
        {notif.actorAvatar ? (
          <div
            className="size-9 rounded-full border-2 overflow-hidden"
            style={{ borderColor: color + "40" }}
          >
            <img src={notif.actorAvatar} className="size-full object-cover" alt="" />
          </div>
        ) : (
          <div
            className="size-9 rounded-xl flex items-center justify-center text-[16px]"
            style={{ background: color + "18" }}
          >
            {notif.icon}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p
          className="text-[12px] leading-snug"
          style={{ color: notif.isRead ? "rgba(240,234,255,0.6)" : "#f0eaff", fontWeight: notif.isRead ? 400 : 700 }}
        >
          {notif.title}
        </p>
        <p
          className="text-[11px] mt-0.5 leading-snug line-clamp-2"
          style={{ color: "rgba(240,234,255,0.45)" }}
        >
          {notif.body}
        </p>
        <p className="text-[10px] mt-1 font-bold" style={{ color: color + "cc" }}>
          {relativeTime(notif.createdAt)}
        </p>
      </div>

      {/* Mark read button (appears on hover) */}
      {!notif.isRead && (
        <button
          onClick={(e) => { e.stopPropagation(); onRead(notif.id); }}
          className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg p-1"
          style={{ color: "rgba(240,234,255,0.4)" }}
          title="Mark as read"
        >
          ✓
        </button>
      )}
    </div>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────
function EmptyState() {
  return (
    <div className="flex flex-col items-center gap-3 py-12 px-6">
      <div
        className="size-14 rounded-2xl flex items-center justify-center text-2xl"
        style={{ background: "rgba(124,58,237,0.1)" }}
      >
        🔔
      </div>
      <div className="text-center">
        <p className="text-[13px] font-bold text-[#f0eaff]">All caught up!</p>
        <p className="text-[11px] mt-1" style={{ color: "rgba(240,234,255,0.4)" }}>
          No notifications yet
        </p>
      </div>
    </div>
  );
}

// ─── Notification Panel (dropdown) ───────────────────────────────────────────
function NotificationPanel({
  onClose,
}: {
  onClose: () => void;
}) {
  const router = useRouter();
  const { notifications, unreadCount, isLoading, hasMore, markRead, markAllRead, loadMore } =
    useNotifications();

  const [activeFilter, setActiveFilter] = useState<"all" | "unread">("all");

  const filtered =
    activeFilter === "unread"
      ? notifications.filter((n) => !n.isRead)
      : notifications;

  const handleNavigate = useCallback(
    (url?: string) => {
      if (url) {
        router.push(url);
        onClose();
      }
    },
    [router, onClose]
  );

  return (
    <div
      className="absolute right-0 top-full mt-2 w-[380px] rounded-[20px] border overflow-hidden z-50 flex flex-col"
      style={{
        background: CARD,
        borderColor: BORDER,
        boxShadow: "0 20px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(124,58,237,0.1)",
        maxHeight: "520px",
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3.5 border-b flex-shrink-0"
        style={{ background: SURF, borderColor: BORDER }}
      >
        <div className="flex items-center gap-2">
          <h3 className="text-[14px] font-black text-[#f0eaff]">Notifications</h3>
          {unreadCount > 0 && (
            <span
              className="text-[10px] font-black px-1.5 py-0.5 rounded-full text-white"
              style={{ background: GRAD }}
            >
              {unreadCount}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              className="text-[10px] font-bold px-2.5 py-1 rounded-lg border transition-all"
              style={{
                background: "rgba(124,58,237,0.08)",
                borderColor: BORDER,
                color: V,
              }}
            >
              Mark all read
            </button>
          )}
          <button
            onClick={onClose}
            className="size-6 rounded-lg flex items-center justify-center text-[12px] transition-all hover:bg-white/10"
            style={{ color: "rgba(240,234,255,0.4)" }}
          >
            ✕
          </button>
        </div>
      </div>

      {/* Filter pills */}
      <div
        className="flex gap-1.5 px-4 py-2.5 border-b flex-shrink-0"
        style={{ borderColor: BORDER, background: SURF }}
      >
        {(["all", "unread"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setActiveFilter(f)}
            className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border transition-all"
            style={
              activeFilter === f
                ? { background: "rgba(124,58,237,0.15)", borderColor: V, color: "#f0eaff" }
                : { background: "transparent", borderColor: "transparent", color: "rgba(240,234,255,0.4)" }
            }
          >
            {f === "all" ? "All" : `Unread ${unreadCount > 0 ? `(${unreadCount})` : ""}`}
          </button>
        ))}
      </div>

      {/* Notification list */}
      <div className="overflow-y-auto flex-1 scrollbar-hide">
        {isLoading ? (
          <div className="flex flex-col gap-0">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="flex items-start gap-3 px-4 py-3.5 border-b animate-pulse"
                style={{ borderColor: "rgba(124,58,237,0.08)" }}
              >
                <div className="size-9 rounded-xl flex-shrink-0" style={{ background: "rgba(124,58,237,0.1)" }} />
                <div className="flex-1 flex flex-col gap-2">
                  <div className="h-3 rounded-full w-3/4" style={{ background: "rgba(124,58,237,0.1)" }} />
                  <div className="h-2.5 rounded-full w-full" style={{ background: "rgba(124,58,237,0.07)" }} />
                  <div className="h-2 rounded-full w-1/4" style={{ background: "rgba(124,58,237,0.07)" }} />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            {filtered.map((notif) => (
              <NotificationRow
                key={notif.id}
                notif={notif}
                onRead={markRead}
                onNavigate={handleNavigate}
              />
            ))}

            {hasMore && activeFilter === "all" && (
              <div className="flex justify-center py-3">
                <button
                  onClick={loadMore}
                  className="text-[11px] font-bold px-4 py-1.5 rounded-full border transition-all"
                  style={{
                    background: "rgba(124,58,237,0.08)",
                    borderColor: BORDER,
                    color: V,
                  }}
                >
                  Load more
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Footer */}
      <div
        className="px-4 py-2.5 border-t flex-shrink-0 text-center"
        style={{ borderColor: BORDER, background: SURF }}
      >
        <p className="text-[9px] font-bold uppercase tracking-widest" style={{ color: "rgba(240,234,255,0.25)" }}>
          Notifications auto-refresh every 30s
        </p>
      </div>
    </div>
  );
}

// ─── Bell button (drop this into your Topbar) ─────────────────────────────────
export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const { unreadCount } = useNotifications();

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  // Close on Escape
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, []);

  return (
    <div ref={wrapperRef} className="relative">
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="relative w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-150"
        style={{
          background: open ? "rgba(124,58,237,0.15)" : "rgba(255,255,255,0.05)",
          border: `1px solid ${open ? "rgba(124,58,237,0.4)" : "rgba(255,255,255,0.1)"}`,
        }}
        aria-label="Notifications"
      >
        {/* Bell icon */}
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke={open ? V : "rgba(240,234,255,0.6)"}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>

        {/* Unread badge */}
        {unreadCount > 0 && (
          <span
            className="absolute -top-1 -right-1 min-w-[16px] h-4 rounded-full flex items-center justify-center text-[9px] font-black text-white px-1"
            style={{ background: GRAD, boxShadow: "0 0 0 2px #101024" }}
          >
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* Panel */}
      {open && (
        <NotificationPanel onClose={() => setOpen(false)} />
      )}
    </div>
  );
}

export default NotificationBell;