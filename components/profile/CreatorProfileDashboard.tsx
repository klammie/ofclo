// components/profile/CreatorProfileDashboard.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { ProfilePost } from "./ProfilePost";

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

// ─── Epic shimmer overlay ─────────────────────────────────────────────────────
function EpicCoverFX() {
  return (
    <>
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(105deg, transparent 40%, rgba(167,139,250,0.18) 50%, transparent 60%)", animation: "epicShimmer 3s ease-in-out infinite" }} />
        <div style={{ position: "absolute", inset: 0, boxShadow: "inset 0 0 60px rgba(167,139,250,0.15), inset 0 0 120px rgba(124,58,237,0.08)" }} />
      </div>
      <style>{`@keyframes epicShimmer{0%{transform:translateX(-100%)}60%,100%{transform:translateX(200%)}}`}</style>
    </>
  );
}

// ─── Legendary particle field ─────────────────────────────────────────────────
function LegendaryCoverFX() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext("2d"); if (!ctx) return;
    const resize = () => { canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight; };
    resize(); window.addEventListener("resize", resize);
    const COUNT = 28;
    const particles = Array.from({ length: COUNT }, () => ({
      x: Math.random() * canvas.width, y: canvas.height + Math.random() * 60,
      size: 1 + Math.random() * 2.5, speed: 0.4 + Math.random() * 0.7,
      drift: (Math.random() - 0.5) * 0.4, alpha: 0, fadeDir: 1,
      color: Math.random() > 0.5 ? "#fbbf24" : "#f59e0b",
    }));
    let raf: number;
    const tick = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (const p of particles) {
        p.y -= p.speed; p.x += p.drift;
        p.alpha = Math.max(0, Math.min(1, p.alpha + 0.02 * p.fadeDir));
        if (p.y < canvas.height * 0.3) p.fadeDir = -1;
        if (p.alpha <= 0 || p.y < -10) { p.x = Math.random() * canvas.width; p.y = canvas.height + 10; p.alpha = 0; p.fadeDir = 1; p.speed = 0.4 + Math.random() * 0.7; p.drift = (Math.random() - 0.5) * 0.4; }
        ctx.save(); ctx.globalAlpha = p.alpha * 0.85; ctx.fillStyle = p.color; ctx.shadowColor = p.color; ctx.shadowBlur = 6;
        ctx.beginPath(); ctx.moveTo(p.x, p.y - p.size * 1.5); ctx.lineTo(p.x + p.size, p.y); ctx.lineTo(p.x, p.y + p.size * 1.5); ctx.lineTo(p.x - p.size, p.y); ctx.closePath(); ctx.fill(); ctx.restore();
      }
      raf = requestAnimationFrame(tick);
    };
    tick();
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", resize); };
  }, []);
  return (
    <>
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 2 }} />
      <div className="absolute inset-0 pointer-events-none" style={{ boxShadow: "inset 0 0 80px rgba(251,191,36,0.18), inset 0 0 160px rgba(245,158,11,0.08)", zIndex: 1 }} />
      <div className="absolute inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 1 }}>
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(105deg, transparent 35%, rgba(251,191,36,0.14) 50%, transparent 65%)", animation: "legendaryShimmer 2.5s ease-in-out infinite" }} />
      </div>
      <style>{`@keyframes legendaryShimmer{0%{transform:translateX(-120%)}55%,100%{transform:translateX(220%)}}`}</style>
    </>
  );
}

function EpicAvatarRing({ color }: { color: string }) {
  return (
    <div className="absolute inset-0 rounded-full pointer-events-none" style={{ zIndex: 1 }}>
      <div style={{ position: "absolute", inset: -3, borderRadius: "50%", border: `2px solid ${color}`, animation: "epicRingPulse 2s ease-in-out infinite", boxShadow: `0 0 12px ${color}80` }} />
      <style>{`@keyframes epicRingPulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:0.4;transform:scale(1.08)}}`}</style>
    </div>
  );
}

function LegendaryAvatarRing({ color }: { color: string }) {
  return (
    <div className="absolute inset-0 rounded-full pointer-events-none" style={{ zIndex: 1 }}>
      <div style={{ position: "absolute", inset: -6, borderRadius: "50%", background: `radial-gradient(circle, ${color}30 0%, transparent 70%)`, animation: "legendaryGlow 1.8s ease-in-out infinite" }} />
      <div style={{ position: "absolute", inset: -4, borderRadius: "50%", border: `2.5px dashed ${color}`, animation: "legendaryRotate 6s linear infinite", boxShadow: `0 0 16px ${color}60` }} />
      <div style={{ position: "absolute", inset: -1, borderRadius: "50%", border: `1.5px solid ${color}90` }} />
      <style>{`@keyframes legendaryGlow{0%,100%{opacity:1;transform:scale(1)}50%{opacity:0.5;transform:scale(1.15)}}@keyframes legendaryRotate{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
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
  duration?: number | null;
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
  mediaCount?: number;
  likeCount?: number;
  isCreator?: boolean;
  creatorId?: string | null;
  standardPrice?: number | null;
  vipPrice?: number | null;
}

// ─── Stat card ────────────────────────────────────────────────────────────────
function StatCard({ icon, value, label, accent }: {
  icon: string; value: string | number; label: string; accent?: string;
}) {
  return (
    <div className="flex-1 min-w-[90px] flex flex-col items-center justify-center gap-1 rounded-[16px] border py-3.5 px-2 text-center"
      style={{ background: accent ? `${accent}0d` : "rgba(255,255,255,0.025)", borderColor: accent ? `${accent}35` : BORDER }}>
      <span className="text-[16px]">{icon}</span>
      <span className="text-[19px] sm:text-[21px] font-black leading-none" style={{ color: accent ?? TEXT }}>
        {typeof value === "number" ? fmt(value) : value}
      </span>
      <span className="text-[8px] font-bold uppercase tracking-widest" style={{ color: MUTED }}>{label}</span>
    </div>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export function CreatorProfileDashboard({
  profile, posts, isOwnProfile, isSubscribed, subscriptionTier, currentUserId,
}: {
  profile:          Profile;
  posts:            Post[];
  isOwnProfile:     boolean;
  isSubscribed:     boolean;
  subscriptionTier: "standard" | "vip" | null;
  currentUserId:    string | null;
}) {
  const router = useRouter();
  const [activeTab,         setActiveTab]        = useState<"posts" | "media">("posts");
  const [showTipModal,      setShowTipModal]      = useState(false);
  const [selectedMediaPost, setSelectedMediaPost] = useState<any>(null);
  const [isSubscribing,     setSubscribing]       = useState(false);

  const rarity     = getRarity(profile.subscriberCount);
  const r          = RARITY[rarity];
  const joinedDate = new Date(profile.joinedAt).toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const mediaCount = profile.mediaCount ?? posts.filter((p) => p.mediaType === "image" || p.mediaType === "video").length;
  const totalLikes = profile.likeCount  ?? posts.reduce((sum, p) => sum + p.likeCount, 0);

  async function handleSubscribe(tier: "standard" | "vip") {
    if (!currentUserId) { router.push("/login"); return; }
    setSubscribing(true);
    try {
      const res  = await fetch("/api/subscriptions/checkout", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body:   JSON.stringify({ creatorId: profile.creatorId, tier }),
      });
      const data = await res.json();
      if (!res.ok) { alert(data.error ?? "Failed to start checkout."); return; }
      if (data.checkoutUrl) window.location.href = data.checkoutUrl;
    } catch { alert("Failed to start checkout. Please try again."); }
    finally   { setSubscribing(false); }
  }

  return (
    <div className="min-h-screen w-full" style={{ background: "#0d0d1a", fontFamily: "'Be Vietnam Pro', sans-serif", color: TEXT }}>

      {/* ── Cover ── */}
      <div className="relative h-44 sm:h-60 w-full overflow-hidden">
        {profile.coverUrl
          ? <img src={profile.coverUrl} alt="Cover" className="w-full h-full object-cover" />
          : <div className="w-full h-full" style={{ background: `linear-gradient(145deg, ${r.color}18, ${V}18, #0d0d1a)` }} />
        }
        <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, transparent 30%, rgba(13,13,26,0.85) 80%, #0d0d1a 100%)" }} />
        {rarity === "epic"      && <EpicCoverFX />}
        {rarity === "legendary" && <LegendaryCoverFX />}
      </div>

      {/* ── Profile header ── */}
      <div className="-mt-12 sm:-mt-14 relative z-10 px-4 sm:px-6">

        {/* Avatar + name + actions */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-5">
          <div className="flex items-end gap-4">
            <div className="relative flex-shrink-0" style={{ width: 92, height: 92 }}>
              <div className="rounded-full overflow-hidden flex items-center justify-center font-black text-white size-full"
                style={{ fontSize: 32, background: profile.avatarUrl ? "transparent" : placeholderGrad(profile.userId), border: `4px solid ${r.color}`, boxShadow: `0 0 18px ${r.glow}, 0 0 0 4px #0d0d1a` }}>
                {profile.avatarUrl
                  ? <img src={profile.avatarUrl} alt={profile.name} className="size-full object-cover" />
                  : profile.name.charAt(0).toUpperCase()
                }
              </div>
              {rarity === "epic"      && <EpicAvatarRing color={r.color} />}
              {rarity === "legendary" && <LegendaryAvatarRing color={r.color} />}
            </div>

            <div className="pb-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-[20px] sm:text-[24px] font-black truncate" style={{ color: TEXT }}>{profile.name}</h1>
                {profile.isVerified && (
                  <svg className="size-5 flex-shrink-0" viewBox="0 0 20 20" fill={r.color}>
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"/>
                  </svg>
                )}
              </div>
              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                <p className="text-[12px]" style={{ color: MUTED }}>@{profile.username}</p>
                {rarity !== "common" && (
                  <div className="flex items-center gap-1 rounded-full px-2 py-0.5"
                    style={{ background: `${r.color}15`, border: `1px solid ${r.color}30` }}>
                    <span style={{ color: r.color, fontSize: 7 }}>{r.icon}</span>
                    <span className="text-[8px] font-black uppercase tracking-wider" style={{ color: r.color }}>{r.label}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            {isOwnProfile ? (
              <button onClick={() => router.push("/dashboard/creator/profile/edit")}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[12px] font-black border transition-all hover:opacity-80"
                style={{ background: "rgba(124,58,237,0.1)", borderColor: BORDER, color: TEXT }}>
                ✏️ Edit Profile
              </button>
            ) : isSubscribed ? (
              <>
                <button onClick={() => router.push(`/dashboard/user/message/${profile.userId}`)}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[12px] font-black text-white transition-all hover:opacity-90"
                  style={{ background: GRAD, boxShadow: "0 4px 14px rgba(124,58,237,0.35)" }}>
                  💬 Message
                </button>
                <button onClick={() => setShowTipModal(true)}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[12px] font-black text-white transition-all hover:opacity-90"
                  style={{ background: "linear-gradient(135deg,#f59e0b,#ef3976)", boxShadow: "0 4px 14px rgba(251,191,36,0.3)" }}>
                  💰 Tip
                </button>
                <div className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-[11px] font-black border"
                  style={{ background: "rgba(34,197,94,0.08)", borderColor: "rgba(34,197,94,0.3)", color: "#4ade80" }}>
                  ✓ {subscriptionTier === "vip" ? "VIP" : "Subscribed"}
                </div>
              </>
            ) : profile.standardPrice != null ? (
              <button onClick={() => handleSubscribe("standard")} disabled={isSubscribing}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[12px] font-black text-white transition-all hover:opacity-90"
                style={{ background: GRAD, boxShadow: "0 4px 14px rgba(124,58,237,0.35)", opacity: isSubscribing ? 0.7 : 1 }}>
                {isSubscribing ? "Processing…" : `Subscribe · $${profile.standardPrice.toFixed(2)}/mo`}
              </button>
            ) : null}
          </div>
        </div>

        {/* Bio */}
        {profile.bio && (
          <p className="text-[13px] leading-relaxed mb-4 max-w-xl" style={{ color: "rgba(240,234,255,0.7)" }}>
            {profile.bio}
          </p>
        )}

        {/* Meta */}
        <div className="flex flex-wrap items-center gap-4 mb-6 text-[11px]" style={{ color: MUTED }}>
          {profile.location && <span className="flex items-center gap-1.5">📍 {profile.location}</span>}
          {profile.website && (
            <a href={profile.website} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1.5 hover:opacity-80" style={{ color: V }}>
              🔗 {profile.website.replace(/^https?:\/\//, "")}
            </a>
          )}
          <span>🗓 Joined {joinedDate}</span>
        </div>

        {/* Stats */}
        <div className="flex gap-2 sm:gap-2.5 mb-6">
          <StatCard icon="👥" value={profile.subscriberCount} label="Subscribers" accent={r.color} />
          <StatCard icon="📸" value={profile.postCount}        label="Posts" />
          <StatCard icon="🎬" value={mediaCount}               label="Media" />
          <StatCard icon="❤️" value={totalLikes}               label="Likes" accent={P} />
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

      {/* ── Posts / Media ── */}
      <div className="py-6 px-4 sm:px-6">
        {activeTab === "posts" ? (
          <div className="flex flex-col gap-5">
            {posts.length === 0 ? (
              <div className="flex flex-col items-center gap-4 py-20 text-center rounded-[20px] border" style={{ background: CARD, borderColor: BORDER }}>
                <span className="text-5xl">📭</span>
                <p className="text-[16px] font-black" style={{ color: TEXT }}>No posts yet</p>
                <p className="text-[13px]" style={{ color: MUTED }}>Check back later for new content!</p>
              </div>
            ) : (
              posts.map((post) => (
                <ProfilePost
                  key={post.id}
                  post={post as any}
                  creator={{ id: profile.creatorId ?? "", userId: profile.userId, name: profile.name, username: profile.username, avatarUrl: profile.avatarUrl ?? null }}
                  isSubscribed={isSubscribed}
                  currentUserId={currentUserId}
                  isOwner={isOwnProfile}
                />
              ))
            )}
          </div>
        ) : (
          <div>
            {posts.length === 0 ? (
              <div className="flex flex-col items-center gap-4 py-20 text-center rounded-[20px] border" style={{ background: CARD, borderColor: BORDER }}>
                <span className="text-5xl">🎬</span>
                <p className="text-[16px] font-black" style={{ color: TEXT }}>No media yet</p>
                <p className="text-[13px]" style={{ color: MUTED }}>Check back later for photos and videos!</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                {posts.map((post) => {
                  const thumb    = post.thumbnailUrl ?? (post.mediaType === "image" ? post.mediaUrl : null);
                  const isLocked = post.isLocked && !isSubscribed;
                  return (
                    <div key={post.id}
                      className="relative aspect-square overflow-hidden rounded-xl group cursor-pointer"
                      style={{ background: "#0d0d1a" }}
                      onClick={() => { if (!isLocked) setSelectedMediaPost(post); }}>
                      {thumb ? (
                        <img src={thumb} alt="" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                          style={isLocked ? { filter: "blur(18px) saturate(0.7) brightness(0.6)", transform: "scale(1.15)" } : undefined} />
                      ) : (
                        <div className="w-full h-full" style={{ background: placeholderGrad(post.id), filter: isLocked ? "blur(12px) brightness(0.6)" : undefined }} />
                      )}
                      {isLocked && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                          <div className="size-10 rounded-2xl flex items-center justify-center" style={{ background: "rgba(239,57,118,0.25)", border: "1px solid rgba(239,57,118,0.5)" }}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ef3976" strokeWidth="2.5" strokeLinecap="round">
                              <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                            </svg>
                          </div>
                          <p className="text-[9px] font-black text-white uppercase tracking-wider">Locked</p>
                        </div>
                      )}
                      {post.mediaType === "video" && !isLocked && (
                        <div className="absolute top-2 right-2 size-7 rounded-full flex items-center justify-center" style={{ background: "rgba(0,0,0,0.6)" }}>
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="white"><path d="M8 5v14l11-7z"/></svg>
                        </div>
                      )}
                      {!isLocked && (
                        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-end pointer-events-none"
                          style={{ background: "linear-gradient(to top,rgba(0,0,0,0.8),transparent)" }}>
                          <div className="flex items-center gap-3 p-3">
                            <span className="text-white text-[11px] font-bold">❤️ {post.likeCount}</span>
                            <span className="text-white text-[11px] font-bold">💬 {post.commentCount}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Media lightbox ── */}
      {selectedMediaPost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.92)", backdropFilter: "blur(8px)" }}
          onClick={() => setSelectedMediaPost(null)}>
          <div className="relative max-w-4xl w-full rounded-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setSelectedMediaPost(null)}
              className="absolute top-3 right-3 z-10 size-9 rounded-full flex items-center justify-center"
              style={{ background: "rgba(0,0,0,0.6)", color: TEXT }}>✕</button>
            {selectedMediaPost.mediaType === "video"
              ? <video src={selectedMediaPost.mediaUrl} controls autoPlay className="w-full max-h-[85vh] object-contain" controlsList="nodownload" onContextMenu={(e) => e.preventDefault()} />
              : <img src={selectedMediaPost.mediaUrl} alt="" className="w-full max-h-[85vh] object-contain" />
            }
          </div>
        </div>
      )}

      {/* ── Tip modal ── */}
      {showTipModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(10px)" }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowTipModal(false); }}>
          <div className="w-full max-w-sm rounded-[24px] border p-6 flex flex-col gap-4"
            style={{ background: CARD, borderColor: BORDER, boxShadow: "0 24px 80px rgba(0,0,0,0.6)" }}>
            <div className="flex items-center justify-between">
              <h2 className="text-[16px] font-black" style={{ color: TEXT }}>💰 Send a Tip</h2>
              <button onClick={() => setShowTipModal(false)} style={{ color: MUTED }}>✕</button>
            </div>
            <p className="text-[13px]" style={{ color: MUTED }}>Tip {profile.name} to show your support</p>
            <div className="flex gap-2 flex-wrap">
              {[1, 3, 5, 10, 20, 50].map((amt) => (
                <button key={amt}
                  className="px-4 py-2 rounded-xl text-[13px] font-black border transition-all hover:opacity-80"
                  style={{ background: "rgba(124,58,237,0.1)", borderColor: BORDER, color: TEXT }}
                  onClick={() => { alert(`Tip $${amt} sent!`); setShowTipModal(false); }}>
                  ${amt}
                </button>
              ))}
            </div>
            <button onClick={() => setShowTipModal(false)} className="w-full py-2.5 text-[12px] font-bold" style={{ color: MUTED }}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}