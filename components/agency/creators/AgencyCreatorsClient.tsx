"use client";

// components/agency/creators/AgencyCreatorsClient.tsx

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AddCreatorButton } from "./AddCreatorButton";
import { AgencyCreateCampaignButton } from "@/components/campaigns/AgencyCreateCampaignButton";

const V      = "#7c3aed";
const P      = "#ef3976";
const GRAD   = `linear-gradient(135deg, ${V}, ${P})`;
const CARD   = "#1a1635";
const SURF   = "#13112b";
const BORDER = "rgba(124,58,237,0.18)";
const TEXT   = "#f0eaff";
const MUTED  = "rgba(240,234,255,0.45)";

interface CreatorListItem {
  creatorId:       string;
  userId:          string;
  name:            string;
  username:        string;
  avatarUrl:       string | null;
  isVerified:      boolean;
  subscriberCount: number;
  postCount:       number;
  standardPrice:   number | null;
  vipPrice:        number | null;
}

function fmt(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `${(n / 1_000).toFixed(1)}k`;
  return String(n);
}

const PLACEHOLDER_GRADS = [
  "linear-gradient(135deg,#7c3aed,#ef3976)",
  "linear-gradient(135deg,#0ea5e9,#7c3aed)",
  "linear-gradient(135deg,#f59e0b,#ef3976)",
  "linear-gradient(135deg,#4ade80,#06b6d4)",
];
function placeholderGrad(id: string) {
  return PLACEHOLDER_GRADS[id.split("").reduce((a, c) => a + c.charCodeAt(0), 0) % PLACEHOLDER_GRADS.length];
}

function CreatorRow({ creator }: { creator: CreatorListItem }) {
  const router = useRouter();
  return (
    <button
      onClick={() => router.push(`/dashboard/agency/creators/${creator.creatorId}`)}
      className="flex items-center gap-4 rounded-[18px] border p-4 text-left w-full transition-all hover:opacity-90 active:scale-[0.99]"
      style={{ background: CARD, borderColor: BORDER }}
    >
      <div className="size-14 rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center font-black text-white text-[18px]"
        style={{ background: creator.avatarUrl ? "transparent" : placeholderGrad(creator.creatorId), border: `2px solid ${V}50` }}>
        {creator.avatarUrl
          ? <img src={creator.avatarUrl} className="size-full object-cover" alt={creator.name} />
          : creator.name.charAt(0).toUpperCase()
        }
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <p className="text-[14px] font-black truncate" style={{ color: TEXT }}>{creator.name}</p>
          {creator.isVerified && (
            <svg className="size-4 flex-shrink-0" viewBox="0 0 20 20" fill="#38bdf8">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"/>
            </svg>
          )}
        </div>
        <p className="text-[11px]" style={{ color: MUTED }}>@{creator.username}</p>
      </div>

      <div className="hidden sm:flex items-center gap-5 flex-shrink-0">
        <div className="text-right">
          <p className="text-[14px] font-black" style={{ color: TEXT }}>{fmt(creator.subscriberCount)}</p>
          <p className="text-[9px] font-bold uppercase tracking-wider" style={{ color: MUTED }}>Subs</p>
        </div>
        <div className="text-right">
          <p className="text-[14px] font-black" style={{ color: TEXT }}>{fmt(creator.postCount)}</p>
          <p className="text-[9px] font-bold uppercase tracking-wider" style={{ color: MUTED }}>Posts</p>
        </div>
        <div className="text-right">
          <p className="text-[14px] font-black" style={{ color: TEXT }}>
            {creator.standardPrice != null ? `$${creator.standardPrice.toFixed(2)}` : "–"}
          </p>
          <p className="text-[9px] font-bold uppercase tracking-wider" style={{ color: MUTED }}>/mo</p>
        </div>
      </div>

      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={MUTED} strokeWidth="2" strokeLinecap="round" className="flex-shrink-0">
        <path d="M9 18l6-6-6-6"/>
      </svg>
    </button>
  );
}

export function AgencyCreatorsClient({ initialCreators }: { initialCreators: CreatorListItem[] }) {
  const router = useRouter();
  const [creatorsList, setCreatorsList] = useState(initialCreators);
  const [search, setSearch] = useState("");

  const filtered = creatorsList.filter((c) =>
    !search ||
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.username.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-6" style={{ fontFamily: "'Be Vietnam Pro', sans-serif" }}>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-black" style={{ color: TEXT }}>My Creators</h1>
          <p className="text-[12px] mt-0.5" style={{ color: MUTED }}>
            {creatorsList.length} creator{creatorsList.length === 1 ? "" : "s"} managed by your agency
          </p>
        </div>

        {/* Quick actions */}
        <div className="flex items-center gap-2 flex-wrap">
          <AddCreatorButton onCreated={(c) => {
            setCreatorsList((prev) => [{
              creatorId:       c.creatorId,
              userId:          c.userId,
              name:            c.name,
              username:        c.username,
              avatarUrl:       null,
              isVerified:      false,
              subscriberCount: 0,
              postCount:       0,
              standardPrice:   null,
              vipPrice:        null,
            }, ...prev]);
          }} />
          <AgencyCreateCampaignButton onCreated={() => router.refresh()} />
        </div>
      </div>

      {/* Search */}
      <div className="relative w-full sm:max-w-xs">
        <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 size-3.5" viewBox="0 0 24 24"
          fill="none" stroke="rgba(240,234,255,0.35)" strokeWidth="2" strokeLinecap="round">
          <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
        </svg>
        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Search creators…"
          className="w-full rounded-2xl border pl-10 pr-4 py-2.5 text-[12px] outline-none transition-all focus:border-[#7c3aed]"
          style={{ background: "rgba(255,255,255,0.03)", borderColor: BORDER, color: TEXT, fontFamily: "inherit" }} />
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-4 py-20 text-center rounded-[20px] border" style={{ background: CARD, borderColor: BORDER }}>
          <span className="text-5xl">{search ? "🔍" : "👥"}</span>
          <div>
            <p className="text-[16px] font-black" style={{ color: TEXT }}>
              {search ? "No creators found" : "No creators yet"}
            </p>
            <p className="text-[13px] mt-1" style={{ color: MUTED }}>
              {search ? "Try a different search" : "Add your first creator to get started"}
            </p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {filtered.map((creator) => (
            <CreatorRow key={creator.creatorId} creator={creator} />
          ))}
        </div>
      )}
    </div>
  );
}