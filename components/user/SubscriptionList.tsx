"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { SubscriptionWithCreator } from "@/lib/types";

// ─── Theme ────────────────────────────────────────────────────────────────────
const V      = "#7c3aed";
const P      = "#ef3976";
const GRAD   = `linear-gradient(135deg, ${V}, ${P})`;
const CARD   = "#1a1635";
const BORDER = "rgba(124,58,237,0.18)";
const TEXT   = "#f0eaff";
const MUTED  = "rgba(240,234,255,0.45)";

// ─── Helpers ──────────────────────────────────────────────────────────────────
const PLACEHOLDER_GRADS = [
  "linear-gradient(135deg,#7c3aed,#ef3976)",
  "linear-gradient(135deg,#0ea5e9,#7c3aed)",
  "linear-gradient(135deg,#f59e0b,#ef3976)",
  "linear-gradient(135deg,#4ade80,#06b6d4)",
];
function placeholderGrad(id?: string | null) {
  if (!id) return PLACEHOLDER_GRADS[0];
  return PLACEHOLDER_GRADS[
    id.split("").reduce((a, c) => a + c.charCodeAt(0), 0) % PLACEHOLDER_GRADS.length
  ];
}

function formatDate(d: string | Date | null | undefined): string {
  if (!d) return "N/A";
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function daysUntil(d: string | Date | null | undefined): number {
  if (!d) return 0;
  return Math.ceil((new Date(d).getTime() - Date.now()) / 86400000);
}

// ─── Countdown badge — shows inside notification area ────────────────────────
function ExpiryCountdown({ daysLeft, onRenew, working }: {
  daysLeft: number;
  onRenew: () => void;
  working: boolean;
}) {
  const isUrgent = daysLeft <= 1;
  const color    = isUrgent ? P : "#fbbf24";
  const icon     = isUrgent ? "🚨" : daysLeft === 2 ? "⚠️" : "🔔";
  const label    = daysLeft <= 0 ? "Expires today" : daysLeft === 1 ? "Expires tomorrow" : `Expires in ${daysLeft} days`;

  return (
    <div className="flex items-center gap-3 rounded-xl border px-3.5 py-3"
      style={{ background: `${color}0d`, borderColor: `${color}35` }}>
      <span className="text-[18px] flex-shrink-0">{icon}</span>
      <div className="flex-1 min-w-0">
        <p className="text-[12px] font-black" style={{ color }}>{label}</p>
        <p className="text-[10px] mt-0.5" style={{ color: MUTED }}>
          Renew now to keep uninterrupted access
        </p>
      </div>
      <button
        onClick={onRenew}
        disabled={working}
        className="flex-shrink-0 rounded-xl px-3 py-1.5 text-[11px] font-black text-white transition-all hover:opacity-90"
        style={{
          background: isUrgent ? P : "linear-gradient(135deg,#f59e0b,#d97706)",
          boxShadow:  `0 4px 12px ${color}40`,
          opacity:    working ? 0.7 : 1,
        }}
      >
        {working ? "…" : "Renew"}
      </button>
    </div>
  );
}

// ─── Manage modal ─────────────────────────────────────────────────────────────
interface ManageModalDetail {
  subscriptionId:   string;
  status:           string;
  tier:             "standard" | "vip";
  nextBillingDate:  string | null;
  cancelledAt:      string | null;
  createdAt:        string | null;
  creatorName:      string;
  creatorUsername:  string;
  creatorAvatarUrl: string | null;
  creatorUserId:    string;
  price:            number;
  unreadCount:      number;
}

function ManageModal({
  subscriptionId,
  onClose,
  onUpdated,
}: {
  subscriptionId: string;
  onClose: () => void;
  onUpdated: () => void;
}) {
  const router = useRouter();
  const [detail,        setDetail]        = useState<ManageModalDetail | null>(null);
  const [loading,       setLoading]       = useState(true);
  const [working,       setWorking]       = useState(false);
  const [error,         setError]         = useState("");
  const [success,       setSuccess]       = useState("");
  const [confirmCancel, setConfirmCancel] = useState(false);

  useEffect(() => {
    fetch(`/api/subscriptions/manage?subscriptionId=${subscriptionId}`)
      .then((r) => r.json())
      .then((d) => { setDetail(d); setLoading(false); })
      .catch(() => { setError("Failed to load subscription details"); setLoading(false); });
  }, [subscriptionId]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", handler); document.body.style.overflow = ""; };
  }, [onClose]);

  const refresh = useCallback(async () => {
    const d = await fetch(`/api/subscriptions/manage?subscriptionId=${subscriptionId}`).then(r => r.json());
    setDetail(d);
    onUpdated();
  }, [subscriptionId, onUpdated]);

  const handleCancel = useCallback(async () => {
    if (!confirmCancel) { setConfirmCancel(true); return; }
    setWorking(true); setError("");
    try {
      const res  = await fetch("/api/subscriptions/cancel", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body:   JSON.stringify({ subscriptionId }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Failed to cancel"); setWorking(false); return; }
      setSuccess(data.message ?? "Subscription cancelled.");
      setConfirmCancel(false);
      await refresh();
    } catch { setError("Something went wrong"); }
    finally   { setWorking(false); }
  }, [subscriptionId, confirmCancel, refresh]);

  const handleRenew = useCallback(async () => {
    setWorking(true); setError("");
    try {
      const res  = await fetch("/api/subscriptions/renew", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body:   JSON.stringify({ subscriptionId }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Failed to renew"); setWorking(false); return; }
      setSuccess(data.message ?? "Renewed successfully!");
      await refresh();
    } catch { setError("Something went wrong"); }
    finally   { setWorking(false); }
  }, [subscriptionId, refresh]);

  const isActive = detail?.status === "active";
  const days     = daysUntil(detail?.nextBillingDate);
  const showCountdown = isActive && days >= 0 && days <= 3;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(10px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* Modal — fixed max height, flex column, nothing overflows */}
      <div
        className="w-full max-w-md flex flex-col rounded-[24px] border overflow-hidden"
        style={{
          background:  CARD,
          borderColor: BORDER,
          boxShadow:   "0 24px 80px rgba(0,0,0,0.6)",
          maxHeight:   "min(90vh, 680px)",
          animation:   "popIn 0.25s cubic-bezier(0.175,0.885,0.32,1.275)",
        }}
      >
        {/* Gradient bar — never scrolls */}
        <div className="h-1 flex-shrink-0" style={{ background: GRAD }} />

        {/* Header — never scrolls */}
        <div
          className="flex items-center justify-between px-5 py-4 border-b flex-shrink-0"
          style={{ borderColor: BORDER }}
        >
          <p className="text-[14px] font-black" style={{ color: TEXT }}>Manage Subscription</p>
          <button
            onClick={onClose}
            className="size-8 rounded-xl flex items-center justify-center"
            style={{ background: "rgba(255,255,255,0.05)", color: MUTED }}
          >✕</button>
        </div>

        {/* Scrollable body — takes all remaining space */}
        <div className="flex-1 overflow-y-auto min-h-0 p-5 flex flex-col gap-4">
          {loading ? (
            <div className="flex flex-col gap-3 animate-pulse">
              <div className="h-[60px] rounded-2xl" style={{ background: "rgba(124,58,237,0.1)" }} />
              <div className="h-[52px] rounded-xl" style={{ background: "rgba(124,58,237,0.07)" }} />
              <div className="h-[52px] rounded-xl" style={{ background: "rgba(124,58,237,0.07)" }} />
            </div>
          ) : detail ? (
            <>
              {/* Creator row */}
              <div
                className="flex items-center gap-3 rounded-2xl border px-4 py-3"
                style={{ background: "rgba(255,255,255,0.03)", borderColor: BORDER }}
              >
                <div
                  className="size-11 rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center font-black text-white text-[15px]"
                  style={{
                    background: detail.creatorAvatarUrl ? "transparent" : placeholderGrad(subscriptionId),
                    border:     `2px solid ${V}40`,
                  }}
                >
                  {detail.creatorAvatarUrl
                    ? <img src={detail.creatorAvatarUrl} className="size-full object-cover" alt="" />
                    : detail.creatorName.charAt(0).toUpperCase()
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-black truncate" style={{ color: TEXT }}>{detail.creatorName}</p>
                  <p className="text-[11px]" style={{ color: MUTED }}>@{detail.creatorUsername}</p>
                </div>
                <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                  <span
                    className="text-[9px] font-black uppercase tracking-widest rounded-full px-2.5 py-0.5"
                    style={detail.tier === "vip"
                      ? { background: "rgba(251,191,36,0.15)", color: "#fbbf24" }
                      : { background: "rgba(124,58,237,0.15)", color: "#a78bfa" }}
                  >
                    {detail.tier === "vip" ? "💎 VIP" : "⭐ Standard"}
                  </span>
                  <span
                    className="text-[9px] font-black uppercase tracking-widest rounded-full px-2.5 py-0.5 flex items-center gap-1"
                    style={isActive
                      ? { background: "rgba(34,197,94,0.15)", color: "#4ade80" }
                      : { background: "rgba(239,57,118,0.12)", color: P }}
                  >
                    {isActive && <span className="size-1.5 rounded-full bg-green-400 animate-pulse" />}
                    {isActive ? "Active" : detail.status}
                  </span>
                </div>
              </div>

              {/* Stats grid — 2×2 */}
              <div className="grid grid-cols-2 gap-2.5">
                {[
                  {
                    label: isActive ? "Renews on" : "Expired on",
                    value: formatDate(detail.nextBillingDate),
                    highlight: isActive && days <= 3 && days >= 0,
                  },
                  {
                    label: "Monthly price",
                    value: isNaN(Number(detail.price)) ? "N/A" : `$${Number(detail.price).toFixed(2)}`,
                    highlight: false,
                  },
                  {
                    label: "Subscribed since",
                    value: formatDate(detail.createdAt),
                    highlight: false,
                  },
                  {
                    label: "Unread messages",
                    value: String(detail.unreadCount ?? 0),
                    highlight: (detail.unreadCount ?? 0) > 0,
                  },
                ].map(({ label, value, highlight }) => (
                  <div
                    key={label}
                    className="rounded-xl border px-3 py-2.5"
                    style={{ background: "rgba(255,255,255,0.02)", borderColor: BORDER }}
                  >
                    <p className="text-[9px] font-black uppercase tracking-widest mb-1" style={{ color: "rgba(240,234,255,0.3)" }}>
                      {label}
                    </p>
                    <p className="text-[13px] font-black" style={{ color: highlight ? "#fbbf24" : TEXT }}>
                      {value}
                    </p>
                  </div>
                ))}
              </div>

              {/* Countdown banner — only when ≤ 3 days left */}
              {showCountdown && (
                <ExpiryCountdown daysLeft={days} onRenew={handleRenew} working={working} />
              )}

              {/* Cancellation note */}
              {!isActive && detail.cancelledAt && (
                <div
                  className="flex items-start gap-2 rounded-xl border px-3 py-2.5"
                  style={{ background: "rgba(239,57,118,0.07)", borderColor: "rgba(239,57,118,0.25)" }}
                >
                  <span className="text-[14px] flex-shrink-0 mt-0.5">ℹ️</span>
                  <p className="text-[11px]" style={{ color: MUTED }}>
                    Cancelled on {formatDate(detail.cancelledAt)}.
                    {detail.nextBillingDate && new Date(detail.nextBillingDate) > new Date()
                      ? ` You have access until ${formatDate(detail.nextBillingDate)}.`
                      : " Your access has ended."}
                  </p>
                </div>
              )}

              {/* Feedback */}
              {error && (
                <p className="text-[12px] font-bold text-center rounded-xl border px-3 py-2.5"
                  style={{ color: P, background: "rgba(239,57,118,0.08)", borderColor: "rgba(239,57,118,0.3)" }}>
                  {error}
                </p>
              )}
              {success && (
                <p className="text-[12px] font-bold text-center rounded-xl border px-3 py-2.5"
                  style={{ color: "#4ade80", background: "rgba(34,197,94,0.08)", borderColor: "rgba(34,197,94,0.25)" }}>
                  ✓ {success}
                </p>
              )}

              {/* Confirm cancel warning */}
              {confirmCancel && (
                <div
                  className="rounded-xl border p-3"
                  style={{ background: "rgba(239,57,118,0.08)", borderColor: "rgba(239,57,118,0.3)" }}
                >
                  <p className="text-[12px] font-black mb-1" style={{ color: P }}>Cancel your subscription?</p>
                  <p className="text-[11px]" style={{ color: MUTED }}>
                    You'll keep access until {formatDate(detail.nextBillingDate)}. After that it ends.
                  </p>
                </div>
              )}
            </>
          ) : (
            <p className="text-center text-[13px] py-8" style={{ color: MUTED }}>Subscription not found.</p>
          )}
        </div>

        {/* Fixed action footer — never scrolls */}
        {detail && (
          <div
            className="flex-shrink-0 flex flex-col gap-2.5 px-5 py-4 border-t"
            style={{ borderColor: BORDER, background: CARD }}
          >
            {/* Message */}
            <button
              onClick={() => { onClose(); router.push(`/dashboard/user/message/${detail.creatorUserId}`); }}
              className="w-full py-3 rounded-2xl text-[13px] font-black text-white flex items-center justify-center gap-2 transition-all hover:opacity-90"
              style={{ background: GRAD, boxShadow: "0 4px 16px rgba(124,58,237,0.35)" }}
            >
              💬 Message {detail.creatorName}
              {(detail.unreadCount ?? 0) > 0 && (
                <span
                  className="rounded-full px-2 py-0.5 text-[9px] font-black"
                  style={{ background: "rgba(255,255,255,0.25)" }}
                >
                  {detail.unreadCount} new
                </span>
              )}
            </button>

            {/* Renew — only when cancelled/expired */}
            {!isActive && (
              <button
                onClick={handleRenew}
                disabled={working}
                className="w-full py-2.5 rounded-2xl text-[12px] font-black text-white flex items-center justify-center gap-2 transition-all hover:opacity-90"
                style={{
                  background: "linear-gradient(135deg,#22c55e,#16a34a)",
                  boxShadow:  "0 4px 16px rgba(34,197,94,0.3)",
                  opacity:    working ? 0.7 : 1,
                }}
              >
                {working
                  ? <><svg className="animate-spin size-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="white" strokeWidth="4"/><path className="opacity-75" fill="white" d="M4 12a8 8 0 018-8v8H4z"/></svg>Renewing…</>
                  : "🔄 Renew Subscription"
                }
              </button>
            )}

            {/* Cancel — only when active */}
            {isActive && (
              <>
                <button
                  onClick={handleCancel}
                  disabled={working}
                  className="w-full py-2.5 rounded-2xl text-[12px] font-black border transition-all hover:opacity-80"
                  style={{
                    background:  confirmCancel ? "rgba(239,57,118,0.15)" : "transparent",
                    borderColor: confirmCancel ? "rgba(239,57,118,0.5)" : "rgba(239,57,118,0.3)",
                    color:       P,
                    opacity:     working ? 0.7 : 1,
                  }}
                >
                  {working
                    ? "Cancelling…"
                    : confirmCancel
                      ? "⚠️ Yes, cancel my subscription"
                      : "Cancel Subscription"
                  }
                </button>
                {confirmCancel && (
                  <button
                    onClick={() => setConfirmCancel(false)}
                    className="w-full text-[11px] font-bold py-1 hover:opacity-80 transition-opacity"
                    style={{ color: MUTED }}
                  >
                    Keep my subscription
                  </button>
                )}
              </>
            )}

            <button
              onClick={onClose}
              className="w-full text-[11px] font-bold py-1 hover:opacity-60 transition-opacity"
              style={{ color: "rgba(240,234,255,0.3)" }}
            >
              Close
            </button>
          </div>
        )}
      </div>

      <style>{`@keyframes popIn{from{transform:scale(0.92);opacity:0}to{transform:scale(1);opacity:1}}`}</style>
    </div>
  );
}

// ─── Subscription card ────────────────────────────────────────────────────────
function SubscriptionCard({
  subscription,
  onManage,
}: {
  subscription: SubscriptionWithCreator;
  onManage: (id: string) => void;
}) {
  const router   = useRouter();
  const isActive = subscription.status === "active";
  const days     = daysUntil(subscription.nextBillingDate);
  const priceNum = Number(subscription.price);
  const showCountdown = isActive && days >= 0 && days <= 3;

  return (
    <div
      className="rounded-[20px] border overflow-hidden flex flex-col transition-all duration-200 hover:-translate-y-0.5"
      style={{ background: CARD, borderColor: showCountdown ? "rgba(251,191,36,0.4)" : BORDER }}
    >
      {/* Cover */}
      <div className="relative w-full h-28 overflow-hidden flex-shrink-0">
        {subscription.creatorCoverUrl ? (
          <img src={subscription.creatorCoverUrl} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full" style={{ background: placeholderGrad(subscription.subscriptionId) }} />
        )}
        <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, transparent 30%, rgba(26,22,53,0.9) 100%)" }} />

        {/* Status */}
        <div className="absolute top-2.5 right-2.5">
          <span
            className="text-[9px] font-black uppercase tracking-wider rounded-full px-2.5 py-1 flex items-center gap-1"
            style={isActive
              ? { background: "rgba(34,197,94,0.2)", color: "#4ade80", border: "1px solid rgba(34,197,94,0.3)" }
              : { background: "rgba(239,57,118,0.15)", color: P, border: "1px solid rgba(239,57,118,0.3)" }}
          >
            {isActive && <span className="size-1.5 rounded-full bg-green-400 animate-pulse" />}
            {isActive ? "Active" : subscription.status}
          </span>
        </div>

        {/* Tier */}
        <div className="absolute bottom-2.5 left-2.5">
          <span
            className="text-[9px] font-black uppercase tracking-wider rounded-full px-2.5 py-1"
            style={subscription.tier === "vip"
              ? { background: "rgba(251,191,36,0.2)", color: "#fbbf24", border: "1px solid rgba(251,191,36,0.3)" }
              : { background: "rgba(124,58,237,0.2)", color: "#a78bfa", border: `1px solid ${BORDER}` }}
          >
            {subscription.tier === "vip" ? "💎 VIP" : "⭐ Standard"}
          </span>
        </div>
      </div>

      {/* Creator info */}
      <div className="px-4 pt-3 pb-0 flex items-center gap-3">
        <div
          className="size-11 rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center font-black text-white text-[14px] -mt-7 relative z-10"
          style={{
            background: subscription.creatorAvatarUrl ? "transparent" : placeholderGrad(subscription.subscriptionId),
            border:     `2.5px solid ${CARD}`,
            boxShadow:  `0 0 0 2px ${V}40`,
          }}
        >
          {subscription.creatorAvatarUrl
            ? <img src={subscription.creatorAvatarUrl} className="size-full object-cover" alt="" />
            : subscription.creatorName?.charAt(0).toUpperCase() ?? "?"
          }
        </div>
        <div className="flex-1 min-w-0 -mt-1">
          <p className="text-[13px] font-black truncate" style={{ color: TEXT }}>
            {subscription.creatorName ?? "Unknown Creator"}
          </p>
          <p className="text-[10px]" style={{ color: MUTED }}>
            @{subscription.creatorUsername ?? "unknown"}
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="px-4 py-3 grid grid-cols-2 gap-2">
        <div>
          <p className="text-[9px] font-black uppercase tracking-widest mb-0.5" style={{ color: "rgba(240,234,255,0.3)" }}>
            {isActive ? "Renews" : "Expired"}
          </p>
          <p className="text-[12px] font-black" style={{ color: showCountdown ? "#fbbf24" : TEXT }}>
            {subscription.nextBillingDate
              ? new Date(subscription.nextBillingDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })
              : "N/A"}
          </p>
        </div>
        <div>
          <p className="text-[9px] font-black uppercase tracking-widest mb-0.5" style={{ color: "rgba(240,234,255,0.3)" }}>Price</p>
          <p className="text-[12px] font-black" style={{ color: TEXT }}>
            {isNaN(priceNum) ? "N/A" : `$${priceNum.toFixed(2)}/mo`}
          </p>
        </div>
      </div>

      {/* Countdown strip on the card itself */}
      {showCountdown && (
        <div
          className="mx-4 mb-3 rounded-xl px-3 py-2 flex items-center gap-2"
          style={{ background: "rgba(251,191,36,0.08)", border: "1px solid rgba(251,191,36,0.3)" }}
        >
          <span className="text-[12px]">{days <= 1 ? "🚨" : "⚠️"}</span>
          <p className="text-[10px] font-black flex-1" style={{ color: "#fbbf24" }}>
            {days <= 0 ? "Expires today" : days === 1 ? "Expires tomorrow" : `Expires in ${days} days`}
          </p>
          <span className="text-[10px] font-bold" style={{ color: MUTED }}>Tap Manage to renew</span>
        </div>
      )}

      {/* Unread messages */}
      {(subscription.unreadMessageCount ?? 0) > 0 && (
        <div
          className="mx-4 mb-3 rounded-xl px-3 py-2 flex items-center justify-between"
          style={{ background: "rgba(239,57,118,0.08)", border: "1px solid rgba(239,57,118,0.25)" }}
        >
          <p className="text-[10px] font-bold" style={{ color: P }}>
            💬 {subscription.unreadMessageCount} unread message{subscription.unreadMessageCount === 1 ? "" : "s"}
          </p>
          <button
            onClick={() => router.push(`/dashboard/user/message/${subscription.creatorUserId}`)}
            className="text-[9px] font-black transition-opacity hover:opacity-80"
            style={{ color: P }}
          >
            View →
          </button>
        </div>
      )}

      {/* Actions */}
      <div className="px-4 pb-4 mt-auto flex flex-col gap-2">
        <div className="flex gap-2">
          <a
            href={`/${subscription.creatorUsername}`}
            className="flex-1 py-2 rounded-xl text-[11px] font-black text-center transition-all hover:opacity-80"
            style={{ background: "rgba(124,58,237,0.1)", border: `1px solid ${BORDER}`, color: "#a78bfa" }}
          >
            👤 Profile
          </a>
          <button
            onClick={() => router.push(`/dashboard/user/message/${subscription.creatorUserId}`)}
            className="flex-1 py-2 rounded-xl text-[11px] font-black text-center transition-all hover:opacity-80"
            style={{ background: "rgba(239,57,118,0.1)", border: "1px solid rgba(239,57,118,0.25)", color: P }}
          >
            💬 Message
          </button>
        </div>
        <button
          onClick={() => onManage(subscription.subscriptionId)}
          className="w-full py-2.5 rounded-xl text-[12px] font-black text-white transition-all hover:opacity-90"
          style={{ background: GRAD, boxShadow: "0 4px 14px rgba(124,58,237,0.3)" }}
        >
          Manage Subscription
        </button>
      </div>
    </div>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
interface SubscriptionsListProps {
  subscriptions: SubscriptionWithCreator[];
}

export function SubscriptionsList({ subscriptions: initialSubs }: SubscriptionsListProps) {
  const [subs,         setSubs]         = useState(initialSubs);
  const [searchQuery,  setSearchQuery]  = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "expired">("all");
  const [managingId,   setManagingId]   = useState<string | null>(null);

  const filtered = subs.filter((sub) => {
    const q           = searchQuery.toLowerCase();
    const matchSearch = sub.creatorName?.toLowerCase().includes(q) || sub.creatorUsername?.toLowerCase().includes(q);
    const matchStatus =
      statusFilter === "all" ||
      (statusFilter === "active"  && sub.status === "active") ||
      (statusFilter === "expired" && sub.status !== "active");
    return matchSearch && matchStatus;
  });

  const activeCount  = subs.filter((s) => s.status === "active").length;
  const expiredCount = subs.filter((s) => s.status !== "active").length;
  const expiringCount = subs.filter((s) => {
    const d = daysUntil(s.nextBillingDate);
    return s.status === "active" && d >= 0 && d <= 3;
  }).length;

  const handleUpdated = useCallback(async () => {
    try {
      const res  = await fetch("/api/subscriptions");
      const data = await res.json();
      if (data.subscriptions) setSubs(data.subscriptions);
    } catch {}
  }, []);

  return (
    <div
      className="flex flex-col gap-5"
      style={{ fontFamily: "'Be Vietnam Pro', sans-serif" }}
    >
      {/* Expiring soon banner */}
      {expiringCount > 0 && (
        <div
          className="flex items-center gap-3 rounded-2xl border px-5 py-3.5"
          style={{ background: "rgba(251,191,36,0.07)", borderColor: "rgba(251,191,36,0.3)" }}
        >
          <span className="text-[20px]">⚠️</span>
          <p className="text-[13px] font-black flex-1" style={{ color: "#fbbf24" }}>
            {expiringCount} subscription{expiringCount > 1 ? "s expire" : " expires"} within 3 days
          </p>
          <button
            onClick={() => setStatusFilter("active")}
            className="text-[11px] font-black transition-opacity hover:opacity-80"
            style={{ color: "#fbbf24" }}
          >
            View →
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 flex-wrap">
        {/* Filter pills */}
        <div className="flex gap-2 flex-shrink-0">
          {([
            { id: "all",     label: `All (${subs.length})`      },
            { id: "active",  label: `Active (${activeCount})`   },
            { id: "expired", label: `Expired (${expiredCount})` },
          ] as const).map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setStatusFilter(id)}
              className="rounded-full border px-4 py-1.5 text-[11px] font-black whitespace-nowrap transition-all"
              style={statusFilter === id
                ? { background: GRAD, color: "#fff", border: "none", boxShadow: "0 4px 14px rgba(124,58,237,0.3)" }
                : { background: "rgba(255,255,255,0.03)", borderColor: BORDER, color: MUTED }}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative ml-auto w-full sm:w-52">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2" width="13" height="13"
            viewBox="0 0 24 24" fill="none" stroke="rgba(240,234,255,0.3)" strokeWidth="2" strokeLinecap="round">
            <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
          </svg>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search creators…"
            className="w-full rounded-2xl border pl-8 pr-3 py-2 text-[12px] outline-none"
            style={{ background: "rgba(255,255,255,0.04)", borderColor: BORDER, color: TEXT, fontFamily: "inherit" }}
          />
        </div>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div
          className="flex flex-col items-center gap-4 py-20 text-center rounded-[20px] border"
          style={{ background: CARD, borderColor: BORDER }}
        >
          <span className="text-5xl">⭐</span>
          <div>
            <p className="text-[16px] font-black" style={{ color: TEXT }}>
              {searchQuery ? "No creators found" : statusFilter === "active" ? "No active subscriptions" : "No subscriptions yet"}
            </p>
            <p className="text-[13px] mt-1" style={{ color: MUTED }}>
              {searchQuery ? "Try a different search" : "Discover creators to subscribe to"}
            </p>
          </div>
          {!searchQuery && (
            <a
              href="/dashboard/user/discover"
              className="px-6 py-3 rounded-xl text-[13px] font-black text-white"
              style={{ background: GRAD, boxShadow: "0 6px 20px rgba(124,58,237,0.4)" }}
            >
              Discover Creators →
            </a>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((sub) => (
            <SubscriptionCard
              key={sub.subscriptionId}
              subscription={sub}
              onManage={setManagingId}
            />
          ))}
        </div>
      )}

      {/* Manage modal */}
      {managingId && (
        <ManageModal
          subscriptionId={managingId}
          onClose={() => setManagingId(null)}
          onUpdated={handleUpdated}
        />
      )}
    </div>
  );
}