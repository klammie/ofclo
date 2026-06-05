// components/profile/CreatorProfileDashboard.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { ProfilePost } from "./ProfilePost";
import { MediaGrid } from "./MediaGrid";
import { TipModal } from "../tips/TipModal";

// ─── Theme ────────────────────────────────────────────────────────────────────
const V      = "#7c3aed";
const P      = "#ef3976";
const GRAD   = `linear-gradient(135deg, ${V}, ${P})`;
const CARD   = "#1a1635";
const BORDER = "rgba(124,58,237,0.18)";
const TEXT   = "#f0eaff";
const MUTED  = "rgba(240,234,255,0.45)";

type Rarity = "common" | "rare" | "epic" | "legendary";

const RARITY: Record<Rarity, { color: string; glow: string; label: string; icon: string }> = {
  common:    { color: "#94a3b8", glow: "rgba(148,163,184,0)",   label: "Common",    icon: "◆" },
  rare:      { color: "#38bdf8", glow: "rgba(56,189,248,0.25)", label: "Rare",      icon: "◆" },
  epic:      { color: "#a78bfa", glow: "rgba(167,139,250,0.3)", label: "Epic",      icon: "◆" },
  legendary: { color: "#fbbf24", glow: "rgba(251,191,36,0.4)",  label: "Legendary", icon: "♦" },
};

function getRarity(n: number): Rarity {
  if (n >= 10000) return "legendary";
  if (n >= 1000)  return "epic";
  if (n >= 100)   return "rare";
  return "common";
}

// ─── Epic shimmer overlay (purple shimmer sweep across cover) ─────────────────
function EpicCoverFX() {
  return (
    <>
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Sweeping shimmer */}
        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(105deg, transparent 40%, rgba(167,139,250,0.18) 50%, transparent 60%)",
          animation: "epicShimmer 3s ease-in-out infinite",
        }} />
        {/* Edge glow */}
        <div style={{
          position: "absolute", inset: 0,
          boxShadow: "inset 0 0 60px rgba(167,139,250,0.15), inset 0 0 120px rgba(124,58,237,0.08)",
        }} />
      </div>
      <style>{`
        @keyframes epicShimmer {
          0%   { transform: translateX(-100%); }
          60%  { transform: translateX(200%); }
          100% { transform: translateX(200%); }
        }
      `}</style>
    </>
  );
}

// ─── Legendary particle field (golden sparks floating up over cover) ──────────
function LegendaryCoverFX() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width  = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    // Particle pool
    const COUNT = 28;
    const particles = Array.from({ length: COUNT }, () => ({
      x:       Math.random() * canvas.width,
      y:       canvas.height + Math.random() * 60,
      size:    1 + Math.random() * 2.5,
      speed:   0.4 + Math.random() * 0.7,
      drift:   (Math.random() - 0.5) * 0.4,
      alpha:   0,
      fadeDir: 1,
      color:   Math.random() > 0.5 ? "#fbbf24" : "#f59e0b",
    }));

    let raf: number;
    const tick = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (const p of particles) {
        p.y    -= p.speed;
        p.x    += p.drift;
        p.alpha = Math.max(0, Math.min(1, p.alpha + 0.02 * p.fadeDir));
        if (p.y < canvas.height * 0.3) p.fadeDir = -1;
        if (p.alpha <= 0 || p.y < -10) {
          // Reset
          p.x     = Math.random() * canvas.width;
          p.y     = canvas.height + 10;
          p.alpha = 0;
          p.fadeDir = 1;
          p.speed = 0.4 + Math.random() * 0.7;
          p.drift = (Math.random() - 0.5) * 0.4;
        }
        ctx.save();
        ctx.globalAlpha = p.alpha * 0.85;
        ctx.fillStyle   = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur  = 6;
        ctx.beginPath();
        // Diamond shape
        ctx.moveTo(p.x,           p.y - p.size * 1.5);
        ctx.lineTo(p.x + p.size,  p.y);
        ctx.lineTo(p.x,           p.y + p.size * 1.5);
        ctx.lineTo(p.x - p.size,  p.y);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }
      raf = requestAnimationFrame(tick);
    };
    tick();

    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", resize); };
  }, []);

  return (
    <>
      <canvas ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none"
        style={{ zIndex: 2 }} />
      {/* Golden edge glow */}
      <div className="absolute inset-0 pointer-events-none" style={{
        boxShadow: "inset 0 0 80px rgba(251,191,36,0.18), inset 0 0 160px rgba(245,158,11,0.08)",
        zIndex: 1,
      }} />
      {/* Sweeping gold shimmer */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 1 }}>
        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(105deg, transparent 35%, rgba(251,191,36,0.14) 50%, transparent 65%)",
          animation: "legendaryShimmer 2.5s ease-in-out infinite",
        }} />
      </div>
      <style>{`
        @keyframes legendaryShimmer {
          0%   { transform: translateX(-120%); }
          55%  { transform: translateX(220%); }
          100% { transform: translateX(220%); }
        }
      `}</style>
    </>
  );
}

// ─── Epic avatar ring (pulsing purple ring) ───────────────────────────────────
function EpicAvatarRing({ color }: { color: string }) {
  return (
    <div className="absolute inset-0 rounded-full pointer-events-none" style={{ zIndex: 1 }}>
      <div style={{
        position: "absolute", inset: -3,
        borderRadius: "50%",
        border: `2px solid ${color}`,
        animation: "epicRingPulse 2s ease-in-out infinite",
        boxShadow: `0 0 12px ${color}80`,
      }} />
      <style>{`
        @keyframes epicRingPulse {
          0%, 100% { opacity: 1;   transform: scale(1);    }
          50%       { opacity: 0.4; transform: scale(1.08); }
        }
      `}</style>
    </div>
  );
}

// ─── Legendary avatar ring (rotating golden dashes + outer glow) ──────────────
function LegendaryAvatarRing({ color }: { color: string }) {
  return (
    <div className="absolute inset-0 rounded-full pointer-events-none" style={{ zIndex: 1 }}>
      {/* Outer glow pulse */}
      <div style={{
        position: "absolute", inset: -6,
        borderRadius: "50%",
        background: `radial-gradient(circle, ${color}30 0%, transparent 70%)`,
        animation: "legendaryGlow 1.8s ease-in-out infinite",
      }} />
      {/* Rotating dashed ring */}
      <div style={{
        position: "absolute", inset: -4,
        borderRadius: "50%",
        border: `2.5px dashed ${color}`,
        animation: "legendaryRotate 6s linear infinite",
        boxShadow: `0 0 16px ${color}60`,
      }} />
      {/* Solid inner ring */}
      <div style={{
        position: "absolute", inset: -1,
        borderRadius: "50%",
        border: `1.5px solid ${color}90`,
      }} />
      <style>{`
        @keyframes legendaryGlow    { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.5;transform:scale(1.15)} }
        @keyframes legendaryRotate  { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
      `}</style>
    </div>
  );
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

// ─── Types ────────────────────────────────────────────────────────────────────

interface Post {
  id: string;
  title?: string | null;
  description?: string | null;
  mediaType: string;
  mediaUrl: string;
  thumbnailUrl?: string | null;
  duration?: number | null;     // ← seconds, used by MediaGridItem
  isLocked: boolean;
  ppvPrice?: number | null;
  likeCount: number;
  commentCount: number;
  viewCount?: number | null;
  createdAt: Date | string;
  isLiked?: boolean;
}

interface Profile {
  userId: string;
  name: string;
  username: string;
  bio?: string | null;
  avatarUrl?: string | null;
  coverUrl?: string | null;
  location?: string | null;
  website?: string | null;
  joinedAt: Date | string;
  isVerified?: boolean;
  subscriberCount: number;
  postCount: number;
  isCreator?: boolean;
  creatorId?: string | null;
  standardPrice?: number | null;
  vipPrice?: number | null;
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

export function CreatorProfileDashboard({
  profile,
  posts,
  isOwnProfile,
  isSubscribed,
  subscriptionTier,
  currentUserId,
}: {
  profile: Profile;
  posts: Post[];
  isOwnProfile: boolean;
  isSubscribed: boolean;
  subscriptionTier: "standard" | "vip" | null;
  currentUserId: string | null;
}) {
  const router = useRouter();
  const [activeTab,     setActiveTab]     = useState<"posts" | "media">("posts");
  const [showTipModal,  setShowTipModal]  = useState(false);
  const [isSubscribing, setSubscribing]  = useState(false);

  const rarity = getRarity(profile.subscriberCount);
  const r      = RARITY[rarity];

  const joinedDate = new Date(profile.joinedAt).toLocaleDateString("en-US", {
    month: "long", year: "numeric",
  });

  async function handleSubscribe(tier: "standard" | "vip") {
    if (!currentUserId) { router.push("/login"); return; }
    setSubscribing(true);
    try {
      const res = await fetch("/api/subscriptions/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ creatorId: profile.creatorId, tier }),
      });
      if (!res.ok) throw new Error();
      router.refresh();
    } catch {
      alert("Failed to subscribe. Please try again.");
    } finally {
      setSubscribing(false);
    }
  }

  return (
    <div className="min-h-screen w-full"
      style={{ background: "#0d0d1a", fontFamily: "'Be Vietnam Pro', sans-serif", color: TEXT }}>

      {/* ── Cover ── */}
      <div className="relative h-52 sm:h-64 w-full overflow-hidden">
        {profile.coverUrl ? (
          <img src={profile.coverUrl} alt="Cover" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full"
            style={{ background: `linear-gradient(145deg, ${r.color}18, ${V}18, #0d0d1a)` }} />
        )}
        <div className="absolute inset-0"
          style={{ background: "linear-gradient(to bottom, transparent 40%, rgba(13,13,26,0.8) 80%, #0d0d1a 100%)" }} />
        {/* ── Rarity cover FX ── */}
        {rarity === "epic"      && <EpicCoverFX />}
        {rarity === "legendary" && <LegendaryCoverFX />}
      </div>

      {/* ── Profile header ── */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 -mt-14 relative z-10">

        {/* Avatar + actions row */}
        <div className="flex items-end justify-between gap-4 mb-5">
          {/* Avatar */}
          <div className="relative flex-shrink-0" style={{ width: 88, height: 88 }}>
            <div className="rounded-full overflow-hidden flex items-center justify-center font-black text-white size-full"
              style={{
                fontSize: 32,
                background:  profile.avatarUrl ? "transparent" : placeholderGrad(profile.userId),
                border:      `3px solid ${r.color}`,
                boxShadow:   `0 0 18px ${r.glow}, 0 0 0 4px #0d0d1a`,
              }}>
              {profile.avatarUrl
                ? <img src={profile.avatarUrl} alt={profile.name} className="size-full object-cover" />
                : profile.name.charAt(0).toUpperCase()
              }
            </div>
            {/* ── Rarity avatar ring FX ── */}
            {rarity === "epic"      && <EpicAvatarRing color={r.color} />}
            {rarity === "legendary" && <LegendaryAvatarRing color={r.color} />}
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 pb-1 flex-wrap justify-end">
            {isOwnProfile ? (
              <button onClick={() => router.push("/dashboard/creator/profile/edit")}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-[12px] font-black border transition-all hover:opacity-80"
                style={{ background: "rgba(124,58,237,0.1)", borderColor: BORDER, color: TEXT }}>
                ✏️ Edit Profile
              </button>
            ) : isSubscribed ? (
              <>
                <button onClick={() => router.push(`/dashboard/user/message/${profile.userId}`)}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-[12px] font-black text-white transition-all hover:opacity-90"
                  style={{ background: GRAD, boxShadow: "0 4px 14px rgba(124,58,237,0.35)" }}>
                  💬 Message
                </button>
                <button onClick={() => setShowTipModal(true)}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-[12px] font-black text-white transition-all hover:opacity-90"
                  style={{ background: "linear-gradient(135deg,#f59e0b,#ef3976)", boxShadow: "0 4px 14px rgba(251,191,36,0.3)" }}>
                  💰 Tip
                </button>
                <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[11px] font-black border"
                  style={{ background: "rgba(34,197,94,0.08)", borderColor: "rgba(34,197,94,0.3)", color: "#4ade80" }}>
                  ✓ {subscriptionTier === "vip" ? "VIP" : "Subscribed"}
                </div>
              </>
            ) : profile.standardPrice != null ? (
              <button onClick={() => handleSubscribe("standard")} disabled={isSubscribing}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-[12px] font-black text-white transition-all hover:opacity-90"
                style={{ background: GRAD, boxShadow: "0 4px 14px rgba(124,58,237,0.35)", opacity: isSubscribing ? 0.7 : 1 }}>
                {isSubscribing ? "Processing…" : `Subscribe · $${profile.standardPrice.toFixed(2)}/mo`}
              </button>
            ) : null}
          </div>
        </div>

        {/* Name + rarity + verified */}
        <div className="flex items-center gap-2.5 flex-wrap mb-1">
          <h1 className="text-[24px] font-black" style={{ color: TEXT }}>{profile.name}</h1>
          {profile.isVerified && (
            <svg className="size-5 flex-shrink-0" viewBox="0 0 20 20" fill={r.color}>
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"/>
            </svg>
          )}
          {rarity !== "common" && (
            <div className="flex items-center gap-1 rounded-full px-2 py-0.5"
              style={{ background: `${r.color}15`, border: `1px solid ${r.color}30` }}>
              <span style={{ color: r.color, fontSize: 7 }}>{r.icon}</span>
              <span className="text-[8px] font-black uppercase tracking-wider" style={{ color: r.color }}>{r.label}</span>
            </div>
          )}
        </div>

        <p className="text-[12px] mb-3" style={{ color: MUTED }}>@{profile.username}</p>

        {/* Bio */}
        {profile.bio && (
          <p className="text-[13px] leading-relaxed mb-4 max-w-xl" style={{ color: "rgba(240,234,255,0.7)" }}>
            {profile.bio}
          </p>
        )}

        {/* Meta */}
        <div className="flex flex-wrap items-center gap-4 mb-5 text-[11px]" style={{ color: MUTED }}>
          {profile.location && (
            <span className="flex items-center gap-1.5">📍 {profile.location}</span>
          )}
          {profile.website && (
            <a href={profile.website} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1.5 hover:opacity-80" style={{ color: V }}>
              🔗 {profile.website.replace(/^https?:\/\//, "")}
            </a>
          )}
          <span>🗓 Joined {joinedDate}</span>
        </div>

        {/* Stats */}
        <div className="flex gap-3 mb-6">
          {[
            { value: profile.subscriberCount, label: "Fans"  },
            { value: profile.postCount,        label: "Posts" },
          ].map(({ value, label }) => (
            <div key={label} className="flex flex-col items-center gap-0.5 px-5 py-2.5 rounded-2xl"
              style={{ background: "rgba(124,58,237,0.08)", border: `1px solid ${BORDER}` }}>
              <span className="text-[18px] font-black" style={{ color: TEXT }}>{fmt(value)}</span>
              <span className="text-[9px] font-bold uppercase tracking-wider" style={{ color: MUTED }}>{label}</span>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex border-b" style={{ borderColor: BORDER }}>
          {(["posts", "media"] as const).map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className="flex items-center gap-2 px-5 py-3 text-[12px] font-black capitalize border-b-2 transition-all"
              style={activeTab === tab
                ? { color: TEXT, borderColor: V, background: "rgba(124,58,237,0.06)" }
                : { color: MUTED, borderColor: "transparent" }}>
              {tab === "posts" ? "📝" : "🖼️"} {tab}
            </button>
          ))}
        </div>
      </div>

      {/* ── Content ── */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
        {activeTab === "posts" ? (
          <div className="flex flex-col gap-5">
            {posts.length === 0 ? (
              <div className="flex flex-col items-center gap-4 py-20 text-center rounded-[20px] border"
                style={{ background: CARD, borderColor: BORDER }}>
                <span className="text-5xl">📭</span>
                <p className="text-[16px] font-black" style={{ color: TEXT }}>No posts yet</p>
                <p className="text-[13px]" style={{ color: MUTED }}>Check back later for new content!</p>
              </div>
            ) : (
              posts.map((post) => (
                <ProfilePost
                  key={post.id}
                  post={post}
                  creator={{
                    id:        profile.creatorId,
                    name:      profile.name,
                    username:  profile.username,
                    avatarUrl: profile.avatarUrl,
                  }}
                  isSubscribed={isSubscribed}
                  currentUserId={currentUserId}
                />
              ))
            )}
          </div>
        ) : (
          <MediaGrid
            posts={posts}
            isSubscribed={isSubscribed}
            creatorId={profile.creatorId}
            currentUserId={currentUserId}
          />
        )}
      </div>

      {/* Tip modal */}
      {showTipModal && (
        <TipModal
          creator={{ id: profile.creatorId, name: profile.name, username: profile.username, avatarUrl: profile.avatarUrl }}
          onClose={() => setShowTipModal(false)}
          onSuccess={() => { alert("Tip sent!"); setShowTipModal(false); }}
        />
      )}
    </div>
  );
}