"use client";

// components/agency/tabs/OverviewTab.tsx
//
// Shown inside CreatorManagementTabs at /dashboard/agency/creators/[creatorId].
// Receives `creator` (from the page's DB query) and `stats` (from
// getCreatorFullStats). Every field is optional-chained / defaulted so this
// NEVER crashes regardless of what stats actually contains — this was the
// root cause of "Cannot read properties of undefined (reading 'level')".

const V      = "#7c3aed";
const P      = "#ef3976";
const GOLD   = "#fbbf24";
const GRAD   = `linear-gradient(135deg, ${V}, ${P})`;
const CARD   = "#1a1635";
const BORDER = "rgba(124,58,237,0.18)";
const TEXT   = "#f0eaff";
const MUTED  = "rgba(240,234,255,0.45)";

function fmt(n: number | undefined | null): string {
  const v = Number(n ?? 0);
  if (isNaN(v)) return "0";
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000)     return `${(v / 1_000).toFixed(1)}k`;
  return String(v);
}

function fmtMoney(n: number | string | undefined | null): string {
  const v = Number(n ?? 0);
  return isNaN(v) ? "$0.00" : `$${v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

interface OverviewTabProps {
  creator: {
    id?: string;
    userId?: string;
    userName?: string;
    username?: string | null;
    avatarUrl?: string | null;
    bio?: string | null;
    isVerified?: boolean;
    subscriberCount?: number;
    postCount?: number;
    standardPrice?: number | string | null;
    vipPrice?: number | string | null;
  };
  // `stats` shape is unknown/variable from getCreatorFullStats — every read
  // below is defensively guarded so missing fields just show 0 / "–" instead
  // of crashing the page.
  stats?: {
    level?: number;
    totalEarnings?: number | string;
    monthlyEarnings?: number | string;
    totalRevenue?: number | string;
    totalLikes?: number;
    totalComments?: number;
    totalViews?: number;
    engagementRate?: number;
    newSubscribersThisMonth?: number;
    [key: string]: any;
  } | null;
}

function StatBox({ icon, label, value, accent }: {
  icon: string; label: string; value: string; accent?: string;
}) {
  return (
    <div className="flex flex-col gap-1 rounded-[16px] border p-4"
      style={{ background: accent ? `${accent}0d` : "rgba(255,255,255,0.025)", borderColor: accent ? `${accent}30` : BORDER }}>
      <div className="flex items-center gap-1.5">
        <span className="text-[15px]">{icon}</span>
        <span className="text-[9px] font-bold uppercase tracking-widest" style={{ color: MUTED }}>{label}</span>
      </div>
      <span className="text-[20px] font-black" style={{ color: accent ?? TEXT }}>{value}</span>
    </div>
  );
}

export default function OverviewTab({ creator, stats }: OverviewTabProps) {
  // Safe fallback — stats may be undefined/null entirely if the query failed
  const s = stats ?? {};

  const level             = s.level ?? null; // only shown if actually present
  const totalEarnings     = s.totalEarnings ?? s.totalRevenue ?? 0;
  const monthlyEarnings   = s.monthlyEarnings ?? 0;
  const newSubsThisMonth  = s.newSubscribersThisMonth ?? 0;
  const engagementRate    = s.engagementRate ?? null;

  return (
    <div className="flex flex-col gap-6" style={{ fontFamily: "'Be Vietnam Pro', sans-serif" }}>

      {/* Bio */}
      {creator?.bio && (
        <div className="rounded-[16px] border p-4" style={{ background: CARD, borderColor: BORDER }}>
          <p className="text-[9px] font-black uppercase tracking-widest mb-2" style={{ color: MUTED }}>Bio</p>
          <p className="text-[13px] leading-relaxed" style={{ color: "rgba(240,234,255,0.75)" }}>{creator.bio}</p>
        </div>
      )}

      {/* Core stats — always available from the creator row itself */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatBox icon="👥" label="Subscribers" value={fmt(creator?.subscriberCount)} accent={V} />
        <StatBox icon="📸" label="Posts"        value={fmt(creator?.postCount)} />
        <StatBox icon="💵" label="Standard"     value={fmtMoney(creator?.standardPrice)} />
        <StatBox icon="💎" label="VIP Price"    value={creator?.vipPrice != null ? fmtMoney(creator.vipPrice) : "–"} accent={GOLD} />
      </div>

      {/* Extended stats — only rendered if present on stats object */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <StatBox icon="💰" label="Total Earnings"   value={fmtMoney(totalEarnings)} accent="#4ade80" />
          <StatBox icon="📅" label="This Month"        value={fmtMoney(monthlyEarnings)} />
          <StatBox icon="✨" label="New Subs (30d)"    value={fmt(newSubsThisMonth)} accent={P} />
          {level != null && (
            <StatBox icon="🏆" label="Level" value={String(level)} accent={GOLD} />
          )}
          {engagementRate != null && (
            <StatBox icon="📈" label="Engagement" value={`${Number(engagementRate).toFixed(1)}%`} />
          )}
        </div>
      )}

      {/* Empty state if stats query genuinely returned nothing */}
      {!stats && (
        <div className="flex items-center gap-3 rounded-[16px] border px-4 py-3"
          style={{ background: "rgba(251,191,36,0.06)", borderColor: "rgba(251,191,36,0.2)" }}>
          <span>ℹ️</span>
          <p className="text-[12px]" style={{ color: MUTED }}>
            Extended analytics aren't available for this creator yet.
          </p>
        </div>
      )}
    </div>
  );
}