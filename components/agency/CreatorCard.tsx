// components/agency/CreatorCard.tsx
"use client";

import { useState } from "react";
import Link from "next/link";

const V      = "#7c3aed";
const P      = "#ef3976";
const GRAD   = `linear-gradient(135deg, ${V}, ${P})`;
const CARD   = "#1a1635";
const BORDER = "rgba(124,58,237,0.18)";
const TEXT   = "#f0eaff";
const MUTED  = "rgba(240,234,255,0.45)";

const PLACEHOLDER_GRADS = [
  "linear-gradient(135deg,#7c3aed,#ef3976)",
  "linear-gradient(135deg,#0ea5e9,#7c3aed)",
  "linear-gradient(135deg,#f59e0b,#ef3976)",
  "linear-gradient(135deg,#4ade80,#06b6d4)",
];
function placeholderGrad(id: string) {
  return PLACEHOLDER_GRADS[
    id.split("").reduce((a, c) => a + c.charCodeAt(0), 0) % PLACEHOLDER_GRADS.length
  ];
}

function fmt(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `${(n / 1_000).toFixed(1)}k`;
  return String(n);
}

interface CreatorCardProps {
  creator: any;
}

export function CreatorCard({ creator }: CreatorCardProps) {
  const [isImpersonating, setIsImpersonating] = useState(false);

  const unreadMessages = Number(creator.unread_messages ?? 0);

  async function handleImpersonate() {
    setIsImpersonating(true);
    try {
      const res = await fetch("/api/agency/impersonate", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ creatorUserId: creator.creator_user_id }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Failed to impersonate");
      }
      const data = await res.json();
      window.location.href = data.redirectTo ?? "/dashboard/creator";
    } catch (error: any) {
      alert(error.message ?? "Failed to impersonate creator");
      setIsImpersonating(false);
    }
  }

  return (
    <div
      className="rounded-[20px] border overflow-hidden flex flex-col transition-all duration-200 hover:-translate-y-0.5"
      style={{
        background:  CARD,
        borderColor: unreadMessages > 0 ? "rgba(56,189,248,0.4)" : BORDER,
        boxShadow:   unreadMessages > 0 ? "0 0 20px rgba(56,189,248,0.08)" : "none",
        fontFamily:  "'Be Vietnam Pro', sans-serif",
      }}
    >
      {/* Top accent */}
      <div className="h-0.5" style={{ background: GRAD }} />

      {/* Header */}
      <div className="flex items-center gap-3 p-4 pb-3">
        {/* Avatar */}
        <div
          className="size-14 rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center font-black text-white text-[18px]"
          style={{
            background: creator.avatar_url ? "transparent" : placeholderGrad(creator.creator_id),
            border:     `2px solid ${V}50`,
          }}
        >
          {creator.avatar_url
            ? <img src={creator.avatar_url} className="size-full object-cover" alt={creator.creator_name} />
            : creator.creator_name?.charAt(0).toUpperCase()
          }
        </div>

        {/* Name + username */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <p className="text-[14px] font-black truncate" style={{ color: TEXT }}>
              {creator.creator_name}
            </p>
            {creator.is_verified && (
              <svg className="size-4 flex-shrink-0" viewBox="0 0 20 20" fill="#38bdf8">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"/>
              </svg>
            )}
          </div>
          <p className="text-[11px]" style={{ color: MUTED }}>@{creator.username}</p>
        </div>

        {/* Impersonate button */}
        <button
          onClick={handleImpersonate}
          disabled={isImpersonating}
          title="Log in as this creator"
          className="flex-shrink-0 size-9 rounded-xl flex items-center justify-center transition-all hover:opacity-80"
          style={{ background: "rgba(124,58,237,0.1)", border: `1px solid ${BORDER}`, color: TEXT }}
        >
          {isImpersonating ? (
            <svg className="animate-spin size-4" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="white" strokeWidth="4"/>
              <path className="opacity-75" fill="white" d="M4 12a8 8 0 018-8v8H4z"/>
            </svg>
          ) : "👤"}
        </button>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-2 px-4 pb-3">
        <div className="rounded-[14px] border p-3" style={{ background: "rgba(255,255,255,0.02)", borderColor: BORDER }}>
          <p className="text-[9px] font-black uppercase tracking-widest mb-1" style={{ color: MUTED }}>Subscribers</p>
          <p className="text-[18px] font-black" style={{ color: TEXT }}>{fmt(Number(creator.active_subscribers ?? 0))}</p>
        </div>

        {/* Unread messages — replaces post count, highlighted when > 0 */}
        <div
          className="rounded-[14px] border p-3"
          style={{
            background:  unreadMessages > 0 ? "rgba(56,189,248,0.08)" : "rgba(255,255,255,0.02)",
            borderColor: unreadMessages > 0 ? "rgba(56,189,248,0.3)" : BORDER,
          }}
        >
          <p className="text-[9px] font-black uppercase tracking-widest mb-1"
            style={{ color: unreadMessages > 0 ? "#38bdf8" : MUTED }}>
            Unread DMs
          </p>
          <div className="flex items-center gap-1.5">
            <p className="text-[18px] font-black"
              style={{ color: unreadMessages > 0 ? "#38bdf8" : TEXT }}>
              {fmt(unreadMessages)}
            </p>
            {unreadMessages > 0 && (
              <span className="text-[14px] animate-pulse">💬</span>
            )}
          </div>
        </div>

        <div className="rounded-[14px] border p-3" style={{ background: "rgba(255,255,255,0.02)", borderColor: BORDER }}>
          <p className="text-[9px] font-black uppercase tracking-widest mb-1" style={{ color: MUTED }}>Revenue</p>
          <p className="text-[18px] font-black" style={{ color: "#4ade80" }}>
            ${parseFloat(creator.total_revenue ?? "0").toLocaleString()}
          </p>
        </div>

        <div className="rounded-[14px] border p-3" style={{ background: "rgba(255,255,255,0.02)", borderColor: BORDER }}>
          <p className="text-[9px] font-black uppercase tracking-widest mb-1" style={{ color: MUTED }}>Pricing</p>
          <p className="text-[13px] font-black" style={{ color: TEXT }}>
            ${creator.standard_price ?? "–"} / ${creator.vip_price ?? "–"}
          </p>
        </div>
      </div>

      {/* Manage button */}
      <div className="px-4 pb-4">
        <Link
          href={`/dashboard/agency/creators/${creator.creator_id}`}
          className="w-full py-2.5 rounded-xl text-[12px] font-black text-white flex items-center justify-center gap-2 transition-all hover:opacity-90"
          style={{ background: GRAD, boxShadow: "0 4px 14px rgba(124,58,237,0.3)" }}
        >
          ⚙️ Manage Creator
        </Link>
      </div>
    </div>
  );
}