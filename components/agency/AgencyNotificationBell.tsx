// components/agency/AgencyNotificationBell.tsx
"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

const V      = "#7c3aed";
const P      = "#ef3976";
const GRAD   = `linear-gradient(135deg, ${V}, ${P})`;
const CARD   = "#1a1635";
const SURF   = "#13112b";
const BORDER = "rgba(124,58,237,0.18)";
const TEXT   = "#f0eaff";
const MUTED  = "rgba(240,234,255,0.45)";

const TYPE_COLOR: Record<string, string> = {
  new_subscriber: "#4ade80",
  new_tip:        P,
  new_like:       "#f472b6",
  new_message:    "#38bdf8",
  new_comment:    "#a78bfa",
  gift_received:  "#fbbf24",
  new_post:       V,
  system:         "#94a3b8",
};

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  const h = Math.floor(diff / 3600000);
  const d = Math.floor(diff / 86400000);
  if (m < 1)  return "just now";
  if (m < 60) return `${m}m ago`;
  if (h < 24) return `${h}h ago`;
  if (d < 7)  return `${d}d ago`;
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

interface AgencyNotif {
  id:              string;
  creatorName:     string;
  creatorAvatar:   string | null;
  creatorUsername: string;
  type:            string;
  title:           string;
  body:            string;
  icon:            string;
  isRead:          boolean;
  actionUrl:       string | null;
  createdAt:       string;
}

function NotifRow({ notif, onRead, onNavigate }: {
  notif: AgencyNotif;
  onRead: (id: string) => void;
  onNavigate: (url?: string | null) => void;
}) {
  const color = TYPE_COLOR[notif.type] ?? "#94a3b8";
  return (
    <div
      onClick={() => { if (!notif.isRead) onRead(notif.id); onNavigate(notif.actionUrl); }}
      className="flex items-start gap-3 px-4 py-3.5 cursor-pointer border-b group transition-all"
      style={{
        background:  notif.isRead ? "transparent" : "rgba(124,58,237,0.05)",
        borderColor: "rgba(124,58,237,0.08)",
      }}
    >
      {/* Creator avatar */}
      <div className="relative flex-shrink-0 mt-0.5">
        {!notif.isRead && (
          <span className="absolute -top-0.5 -left-0.5 size-2 rounded-full z-10" style={{ background: color }} />
        )}
        <div className="size-9 rounded-full overflow-hidden flex items-center justify-center font-black text-white text-[13px]"
          style={{ background: notif.creatorAvatar ? "transparent" : GRAD, border: `1.5px solid ${color}40` }}>
          {notif.creatorAvatar
            ? <img src={notif.creatorAvatar} className="size-full object-cover" alt="" />
            : notif.creatorName.charAt(0).toUpperCase()
          }
        </div>
        {/* Type icon overlay */}
        <div className="absolute -bottom-1 -right-1 size-4 rounded-full flex items-center justify-center text-[8px]"
          style={{ background: color + "25", border: `1px solid ${color}50` }}>
          {notif.icon}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {/* Creator label */}
        <p className="text-[9px] font-black uppercase tracking-widest mb-0.5" style={{ color: color }}>
          @{notif.creatorUsername}
        </p>
        <p className="text-[12px] leading-snug"
          style={{ color: notif.isRead ? "rgba(240,234,255,0.6)" : TEXT, fontWeight: notif.isRead ? 400 : 700 }}>
          {notif.title}
        </p>
        <p className="text-[11px] mt-0.5 line-clamp-2" style={{ color: MUTED }}>{notif.body}</p>
        <p className="text-[10px] mt-1 font-bold" style={{ color: color + "cc" }}>
          {relativeTime(notif.createdAt)}
        </p>
      </div>

      {/* Mark read */}
      {!notif.isRead && (
        <button
          onClick={(e) => { e.stopPropagation(); onRead(notif.id); }}
          className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg p-1"
          style={{ color: MUTED }}
          title="Mark as read"
        >✓</button>
      )}
    </div>
  );
}

export function AgencyNotificationBell() {
  const router     = useRouter();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [open,         setOpen]         = useState(false);
  const [notifs,       setNotifs]       = useState<AgencyNotif[]>([]);
  const [unreadCount,  setUnreadCount]  = useState(0);
  const [loading,      setLoading]      = useState(false);
  const [filter,       setFilter]       = useState<"all" | "unread">("all");

  const fetchNotifs = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await fetch("/api/agency/notifications?limit=50");
      const data = await res.json();
      setNotifs(data.notifications ?? []);
      setUnreadCount(data.unreadCount ?? 0);
    } catch {}
    finally { setLoading(false); }
  }, []);

  // Fetch on open, then poll every 30s while open
  useEffect(() => {
    if (!open) return;
    fetchNotifs();
    const interval = setInterval(fetchNotifs, 30_000);
    return () => clearInterval(interval);
  }, [open, fetchNotifs]);

  // Poll unread count every 60s even when closed
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res  = await fetch("/api/agency/notifications?limit=1");
        const data = await res.json();
        setUnreadCount(data.unreadCount ?? 0);
      } catch {}
    }, 60_000);
    return () => clearInterval(interval);
  }, []);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const markRead = useCallback(async (id: string) => {
    setNotifs((prev) => prev.map((n) => n.id === id ? { ...n, isRead: true } : n));
    setUnreadCount((c) => Math.max(0, c - 1));
    await fetch("/api/agency/notifications", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ notificationId: id }),
    }).catch(() => {});
  }, []);

  const markAllRead = useCallback(async () => {
    setNotifs((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
    await Promise.all(
      notifs.filter((n) => !n.isRead).map((n) =>
        fetch("/api/agency/notifications", {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify({ notificationId: n.id }),
        })
      )
    ).catch(() => {});
  }, [notifs]);

  const handleNavigate = useCallback((url?: string | null) => {
    if (url) { router.push(url); setOpen(false); }
  }, [router]);

  const filtered = filter === "unread" ? notifs.filter((n) => !n.isRead) : notifs;

  return (
    <div ref={wrapperRef} className="relative" style={{ fontFamily: "'Be Vietnam Pro', sans-serif" }}>
      {/* Bell button */}
      <button
        onClick={() => setOpen((p) => !p)}
        className="relative size-9 rounded-lg flex items-center justify-center transition-all"
        style={{
          background: open ? "rgba(124,58,237,0.15)" : "rgba(255,255,255,0.05)",
          border:     `1px solid ${open ? "rgba(124,58,237,0.4)" : "rgba(255,255,255,0.1)"}`,
        }}
        aria-label="Agency notifications"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
          stroke={open ? V : "rgba(240,234,255,0.6)"}
          strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
        </svg>
        {unreadCount > 0 && (
          <span
            className="absolute -top-1 -right-1 min-w-[16px] h-4 rounded-full flex items-center justify-center text-[9px] font-black text-white px-1"
            style={{ background: GRAD, boxShadow: "0 0 0 2px #0d0d1a" }}
          >
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* Panel */}
      {open && (
        <div
          className="absolute right-0 top-full mt-2 w-[400px] rounded-[20px] border overflow-hidden z-50 flex flex-col"
          style={{
            background: CARD,
            borderColor: BORDER,
            boxShadow:  "0 20px 60px rgba(0,0,0,0.5)",
            maxHeight:  "540px",
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3.5 border-b flex-shrink-0"
            style={{ background: SURF, borderColor: BORDER }}>
            <div className="flex items-center gap-2">
              <h3 className="text-[14px] font-black" style={{ color: TEXT }}>Creator Activity</h3>
              {unreadCount > 0 && (
                <span className="text-[10px] font-black px-1.5 py-0.5 rounded-full text-white" style={{ background: GRAD }}>
                  {unreadCount}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button onClick={markAllRead}
                  className="text-[10px] font-bold px-2.5 py-1 rounded-lg border transition-all"
                  style={{ background: "rgba(124,58,237,0.08)", borderColor: BORDER, color: V }}>
                  Mark all read
                </button>
              )}
              <button onClick={() => setOpen(false)}
                className="size-6 rounded-lg flex items-center justify-center text-[12px] hover:bg-white/10 transition-all"
                style={{ color: MUTED }}>✕</button>
            </div>
          </div>

          {/* Filter pills */}
          <div className="flex gap-1.5 px-4 py-2.5 border-b flex-shrink-0"
            style={{ borderColor: BORDER, background: SURF }}>
            {(["all", "unread"] as const).map((f) => (
              <button key={f} onClick={() => setFilter(f)}
                className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border transition-all"
                style={filter === f
                  ? { background: "rgba(124,58,237,0.15)", borderColor: V, color: TEXT }
                  : { background: "transparent", borderColor: "transparent", color: MUTED }}>
                {f === "all" ? "All" : `Unread${unreadCount > 0 ? ` (${unreadCount})` : ""}`}
              </button>
            ))}
          </div>

          {/* List */}
          <div className="overflow-y-auto flex-1" style={{ scrollbarWidth: "none" }}>
            {loading ? (
              <div className="flex flex-col">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="flex items-start gap-3 px-4 py-3.5 border-b animate-pulse"
                    style={{ borderColor: "rgba(124,58,237,0.08)" }}>
                    <div className="size-9 rounded-full flex-shrink-0" style={{ background: "rgba(124,58,237,0.1)" }} />
                    <div className="flex-1 flex flex-col gap-2">
                      <div className="h-3 rounded-full w-3/4" style={{ background: "rgba(124,58,237,0.1)" }} />
                      <div className="h-2.5 rounded-full w-full" style={{ background: "rgba(124,58,237,0.07)" }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-12 px-6">
                <div className="size-14 rounded-2xl flex items-center justify-center text-2xl"
                  style={{ background: "rgba(124,58,237,0.1)" }}>🏢</div>
                <div className="text-center">
                  <p className="text-[13px] font-bold" style={{ color: TEXT }}>All caught up!</p>
                  <p className="text-[11px] mt-1" style={{ color: MUTED }}>No creator activity yet</p>
                </div>
              </div>
            ) : (
              filtered.map((n) => (
                <NotifRow key={n.id} notif={n} onRead={markRead} onNavigate={handleNavigate} />
              ))
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-2.5 border-t flex-shrink-0 text-center"
            style={{ borderColor: BORDER, background: SURF }}>
            <p className="text-[9px] font-bold uppercase tracking-widest" style={{ color: "rgba(240,234,255,0.25)" }}>
              Showing activity from all managed creators
            </p>
          </div>
        </div>
      )}
    </div>
  );
}