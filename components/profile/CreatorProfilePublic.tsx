"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ProfilePost } from "./ProfilePost";
import { LandingNav } from "@/components/landing/LandingNav";

// ─── Theme ────────────────────────────────────────────────────────────────────
const V      = "#7c3aed";
const P      = "#ef3976";
const GRAD   = `linear-gradient(135deg, ${V}, ${P})`;
const CARD   = "#1a1635";
const SURF   = "#13112b";
const BORDER = "rgba(124,58,237,0.18)";
const TEXT   = "#f0eaff";
const MUTED  = "rgba(240,234,255,0.45)";

// ─── Types ────────────────────────────────────────────────────────────────────
type Rarity = "common" | "rare" | "epic" | "legendary";

interface Post {
  id: string;
  title?: string | null;
  description?: string | null;
  mediaType: string;
  mediaUrl: string;
  thumbnailUrl?: string | null;
  isLocked: boolean;
  ppvPrice?: number | null;
  likeCount: number;
  commentCount: number;
  viewCount?: number;
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

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmt(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `${(n / 1_000).toFixed(1)}k`;
  return String(n);
}

function getRarity(n: number): Rarity {
  if (n >= 10000) return "legendary";
  if (n >= 1000)  return "epic";
  if (n >= 100)   return "rare";
  return "common";
}

const RARITY: Record<Rarity, { label: string; color: string; icon: string; glow: string; badge: string; border: string }> = {
  common:    { label: "Common",    color: "#94a3b8", icon: "◆", glow: "rgba(148,163,184,0)",   badge: "rgba(148,163,184,0.1)",  border: "rgba(148,163,184,0.3)" },
  rare:      { label: "Rare",      color: "#38bdf8", icon: "◆", glow: "rgba(56,189,248,0.25)", badge: "rgba(56,189,248,0.12)",  border: "rgba(56,189,248,0.4)"  },
  epic:      { label: "Epic",      color: "#a78bfa", icon: "◆", glow: "rgba(167,139,250,0.3)", badge: "rgba(167,139,250,0.12)", border: "rgba(167,139,250,0.45)" },
  legendary: { label: "Legendary", color: "#fbbf24", icon: "♦", glow: "rgba(251,191,36,0.4)",  badge: "rgba(251,191,36,0.12)",  border: "rgba(251,191,36,0.5)"  },
};

const PLACEHOLDER_GRADS = [
  "linear-gradient(135deg,#7c3aed,#ef3976)",
  "linear-gradient(135deg,#0ea5e9,#7c3aed)",
  "linear-gradient(135deg,#f59e0b,#ef3976)",
  "linear-gradient(135deg,#4ade80,#06b6d4)",
];
function placeholderGrad(id: string) {
  return PLACEHOLDER_GRADS[id.split("").reduce((a, c) => a + c.charCodeAt(0), 0) % PLACEHOLDER_GRADS.length];
}

// ─── Avatar ───────────────────────────────────────────────────────────────────
function Avatar({ profile, size = 96 }: { profile: Profile; size?: number }) {
  const rarity = getRarity(profile.subscriberCount);
  const r      = RARITY[rarity];
  return (
    <div className="rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center font-black text-white"
      style={{
        width: size, height: size, fontSize: size * 0.36,
        background:  profile.avatarUrl ? "transparent" : placeholderGrad(profile.userId),
        border:      `3px solid ${r.color}`,
        boxShadow:   `0 0 20px ${r.glow}, 0 0 0 4px rgba(13,13,26,1)`,
      }}>
      {profile.avatarUrl
        ? <img src={profile.avatarUrl} alt={profile.name} className="size-full object-cover" />
        : profile.name.charAt(0).toUpperCase()
      }
    </div>
  );
}

// ─── Stat pill ────────────────────────────────────────────────────────────────
function StatPill({ value, label }: { value: string | number; label: string }) {
  return (
    <div className="flex flex-col items-center gap-0.5 px-5 py-3 rounded-2xl"
      style={{ background: "rgba(124,58,237,0.08)", border: `1px solid ${BORDER}` }}>
      <span className="text-[20px] font-black" style={{ color: TEXT }}>{fmt(Number(value))}</span>
      <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: MUTED }}>{label}</span>
    </div>
  );
}

// ─── Media grid tile ──────────────────────────────────────────────────────────
function MediaTile({ post, onClick }: { post: Post; onClick: () => void }) {
  const thumb = post.thumbnailUrl ?? (post.mediaType === "image" ? post.mediaUrl : null);
  const isVideo = post.mediaType === "video";

  return (
    <button onClick={onClick}
      className="relative aspect-square overflow-hidden rounded-xl group cursor-pointer"
      style={{ background: "#0d0d1a" }}>

      {/* Thumbnail / gradient placeholder */}
      {thumb ? (
        <img src={thumb} alt="" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
      ) : (
        <div className="w-full h-full transition-transform duration-500 group-hover:scale-105"
          style={{ background: placeholderGrad(post.id) }} />
      )}

      {/* Lock overlay */}
      {post.isLocked && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2"
          style={{ backdropFilter: "blur(14px)", background: "rgba(13,13,26,0.55)" }}>
          <div className="size-10 rounded-2xl flex items-center justify-center"
            style={{ background: "rgba(239,57,118,0.2)", border: "1px solid rgba(239,57,118,0.4)" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ef3976" strokeWidth="2.5" strokeLinecap="round">
              <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
          </div>
          <p className="text-[9px] font-black text-white uppercase tracking-wider">Locked</p>
        </div>
      )}

      {/* Video badge */}
      {isVideo && !post.isLocked && (
        <div className="absolute top-2 right-2 size-7 rounded-full flex items-center justify-center"
          style={{ background: "rgba(0,0,0,0.6)" }}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="white"><path d="M8 5v14l11-7z"/></svg>
        </div>
      )}

      {/* Hover stats */}
      {!post.isLocked && (
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-end"
          style={{ background: "linear-gradient(to top,rgba(0,0,0,0.8),transparent)" }}>
          <div className="flex items-center gap-3 p-3">
            <span className="text-white text-[11px] font-bold flex items-center gap-1">
              <span style={{ fontSize: 12 }}>❤️</span>{fmt(post.likeCount)}
            </span>
            <span className="text-white text-[11px] font-bold flex items-center gap-1">
              <span style={{ fontSize: 12 }}>💬</span>{fmt(post.commentCount)}
            </span>
          </div>
        </div>
      )}
    </button>
  );
}

// ─── Subscription card ────────────────────────────────────────────────────────
function SubCard({ tier, price, features, onSubscribe, isSubscribing, isPopular }: {
  tier: "standard" | "vip";
  price: number;
  features: string[];
  onSubscribe: () => void;
  isSubscribing: boolean;
  isPopular?: boolean;
}) {
  const isVip = tier === "vip";

  return (
    <div className="relative rounded-[20px] border overflow-hidden flex flex-col"
      style={{
        background:  isVip ? "linear-gradient(145deg,#2d1b69,#1a1635)" : CARD,
        borderColor: isVip ? "rgba(251,191,36,0.35)" : BORDER,
        boxShadow:   isVip ? "0 0 40px rgba(251,191,36,0.12)" : "none",
      }}>

      {isPopular && (
        <div className="absolute top-0 left-0 right-0 flex justify-center">
          <span className="text-[9px] font-black uppercase tracking-widest px-4 py-1 text-white rounded-b-xl"
            style={{ background: GRAD }}>
            Most Popular
          </span>
        </div>
      )}

      <div className="p-5 pt-7 flex flex-col gap-4 flex-1">
        {/* Tier label + icon */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[9px] font-black uppercase tracking-widest mb-1"
              style={{ color: isVip ? "#fbbf24" : MUTED }}>
              {isVip ? "⭐ VIP Tier" : "Standard Tier"}
            </p>
            <p className="text-[26px] font-black" style={{ color: TEXT }}>
              ${price.toFixed(2)}
              <span className="text-[12px] font-bold ml-1" style={{ color: MUTED }}>/mo</span>
            </p>
          </div>
          <div className="size-11 rounded-2xl flex items-center justify-center text-xl"
            style={{ background: isVip ? "rgba(251,191,36,0.15)" : "rgba(124,58,237,0.1)", border: `1px solid ${isVip ? "rgba(251,191,36,0.3)" : BORDER}` }}>
            {isVip ? "💎" : "⭐"}
          </div>
        </div>

        {/* Features */}
        <ul className="flex flex-col gap-2 flex-1">
          {features.map((f) => (
            <li key={f} className="flex items-start gap-2">
              <span className="size-4 rounded-full flex items-center justify-center text-[9px] font-black flex-shrink-0 mt-0.5"
                style={{ background: isVip ? "rgba(251,191,36,0.2)" : "rgba(124,58,237,0.15)", color: isVip ? "#fbbf24" : V }}>
                ✓
              </span>
              <span className="text-[12px]" style={{ color: "rgba(240,234,255,0.7)" }}>{f}</span>
            </li>
          ))}
        </ul>

        {/* Button */}
        <button onClick={onSubscribe} disabled={isSubscribing}
          className="w-full py-3 rounded-xl text-[13px] font-black text-white transition-all"
          style={{
            background:  isVip ? "linear-gradient(135deg,#fbbf24,#f59e0b)" : GRAD,
            color:       isVip ? "#0d0d1a" : "#fff",
            boxShadow:   isVip ? "0 6px 20px rgba(251,191,36,0.35)" : "0 6px 20px rgba(124,58,237,0.35)",
            opacity:     isSubscribing ? 0.7 : 1,
          }}>
          {isSubscribing ? "Processing…" : `Subscribe · $${price.toFixed(2)}/mo`}
        </button>
      </div>
    </div>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
interface CreatorProfilePublicProps {
  profile: Profile;
  posts: Post[];
  isOwnProfile: boolean;
  isSubscribed: boolean;
  subscriptionTier: "standard" | "vip" | null;
  currentUserId: string | null;
}

type Tab = "posts" | "media";

export function CreatorProfilePublic({
  profile, posts, isOwnProfile, isSubscribed, subscriptionTier, currentUserId,
}: CreatorProfilePublicProps) {
  const router       = useRouter();
  const [activeTab, setActiveTab]     = useState<Tab>("posts");
  const [isSubscribing, setSubscribing] = useState(false);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);

  const rarity = getRarity(profile.subscriberCount);
  const r      = RARITY[rarity];

  const joinedDate = new Date(profile.joinedAt).toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const showSidebar = profile.isCreator && !isOwnProfile && !isSubscribed
    && (profile.standardPrice || profile.vipPrice);

  const handleSubscribe = useCallback(async (tier: "standard" | "vip") => {
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
  }, [currentUserId, profile.creatorId, router]);

  const handleMessage = () => {
    if (!currentUserId) { router.push("/login"); return; }
    router.push(`/dashboard/user/message/${profile.userId}`);
  };

  return (
    <div className="min-h-screen w-full" style={{ background: "#0d0d1a", fontFamily: "'Be Vietnam Pro', sans-serif", color: TEXT }}>

      {/* ── Landing page nav sits above everything ── */}
      <LandingNav anchored={false} />

      {/* ── Cover — pt-16 so it starts below the fixed nav ── */}
      <div className="relative h-52 sm:h-64 w-full overflow-hidden pt-16">
        {profile.coverUrl ? (
          <img src={profile.coverUrl} alt="Cover" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full" style={{ background: `linear-gradient(145deg, ${r.color}18, ${V}18, #0d0d1a)` }} />
        )}
        {/* gradient fade to page bg */}
        <div className="absolute inset-0"
          style={{ background: "linear-gradient(to bottom, transparent 40%, rgba(13,13,26,0.8) 80%, #0d0d1a 100%)" }} />
        {/* rarity shimmer for legendary/epic */}
        {(rarity === "legendary" || rarity === "epic") && (
          <div className="absolute inset-0"
            style={{ background: `linear-gradient(135deg, ${r.color}08, transparent 60%)` }} />
        )}
      </div>

      {/* ── Profile header ── */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 -mt-16 relative z-10">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">

          {/* Avatar + name */}
          <div className="flex items-end gap-4">
            <Avatar profile={profile} size={96} />
            <div className="pb-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-[24px] sm:text-[28px] font-black" style={{ color: TEXT }}>
                  {profile.name}
                </h1>
                {profile.isVerified && (
                  <svg className="size-6 flex-shrink-0" viewBox="0 0 20 20" fill={r.color}>
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"/>
                  </svg>
                )}
                {/* Rarity badge */}
                <div className="flex items-center gap-1 rounded-full px-2 py-0.5"
                  style={{ background: r.badge, border: `1px solid ${r.border}` }}>
                  <span style={{ color: r.color, fontSize: 8 }}>{r.icon}</span>
                  <span className="text-[9px] font-black uppercase tracking-wider" style={{ color: r.color }}>
                    {r.label}
                  </span>
                </div>
              </div>
              <p className="text-[13px] mt-0.5" style={{ color: MUTED }}>@{profile.username}</p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            {isOwnProfile ? (
              <button onClick={() => router.push("/dashboard/creator/profile/edit")}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-[13px] font-black border transition-all hover:opacity-80"
                style={{ background: "rgba(124,58,237,0.1)", borderColor: BORDER, color: TEXT }}>
                ✏️ Edit Profile
              </button>
            ) : isSubscribed ? (
              <>
                <button onClick={handleMessage}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-[13px] font-black text-white transition-all hover:opacity-90"
                  style={{ background: GRAD, boxShadow: "0 4px 16px rgba(124,58,237,0.35)" }}>
                  💬 Message
                </button>
                <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[12px] font-black border"
                  style={{ background: "rgba(34,197,94,0.08)", borderColor: "rgba(34,197,94,0.3)", color: "#4ade80" }}>
                  ✓ {subscriptionTier === "vip" ? "VIP" : "Subscribed"}
                </div>
              </>
            ) : profile.isCreator && profile.standardPrice ? (
              <button onClick={() => handleSubscribe("standard")} disabled={isSubscribing}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-[13px] font-black text-white transition-all hover:opacity-90"
                style={{ background: GRAD, boxShadow: "0 4px 16px rgba(124,58,237,0.35)", opacity: isSubscribing ? 0.7 : 1 }}>
                {isSubscribing ? "Processing…" : `Subscribe · $${profile.standardPrice.toFixed(2)}/mo`}
              </button>
            ) : null}

            {/* Share */}
            <button
              className="size-10 rounded-xl flex items-center justify-center transition-all hover:opacity-80"
              style={{ background: "rgba(124,58,237,0.1)", border: `1px solid ${BORDER}`, color: MUTED }}
              onClick={() => navigator.share?.({ title: profile.name, url: window.location.href })}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Bio */}
        {profile.bio && (
          <p className="text-[13px] leading-relaxed mb-5 max-w-2xl" style={{ color: "rgba(240,234,255,0.7)" }}>
            {profile.bio}
          </p>
        )}

        {/* Meta row */}
        <div className="flex flex-wrap items-center gap-4 mb-6 text-[12px]" style={{ color: MUTED }}>
          {profile.location && (
            <span className="flex items-center gap-1.5">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
              </svg>
              {profile.location}
            </span>
          )}
          {profile.website && (
            <a href={profile.website} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1.5 hover:opacity-80 transition-opacity"
              style={{ color: V }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
              </svg>
              {profile.website.replace(/^https?:\/\//, "")}
            </a>
          )}
          <span className="flex items-center gap-1.5">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
            Joined {joinedDate}
          </span>
        </div>

        {/* Stats row */}
        <div className="flex gap-3 flex-wrap mb-8">
          <StatPill value={profile.subscriberCount} label="Fans" />
          <StatPill value={profile.postCount}        label="Posts" />
        </div>

        {/* ── Tab bar ── */}
        <div className="flex border-b mb-0" style={{ borderColor: BORDER }}>
          {(["posts", "media"] as Tab[]).map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className="flex items-center gap-2 px-5 py-3 text-[12px] font-black border-b-2 capitalize transition-all"
              style={activeTab === tab
                ? { color: TEXT, borderColor: V, background: "rgba(124,58,237,0.06)" }
                : { color: MUTED, borderColor: "transparent" }}>
              {tab === "posts" ? "📝" : "🖼️"} {tab}
            </button>
          ))}
        </div>
      </div>

      {/* ── Content area ── */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        {activeTab === "posts" ? (

          /* ── POSTS tab: feed left, subscription sidebar right ── */
          <div className="flex gap-6 items-start">

            {/* Posts column */}
            <div className="flex-1 min-w-0 flex flex-col gap-5">
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
                    creator={{ name: profile.name, username: profile.username, avatarUrl: profile.avatarUrl }}
                    isSubscribed={isSubscribed}
                    currentUserId={currentUserId}
                  />
                ))
              )}
            </div>

            {/* Subscription sidebar — right of posts */}
            {showSidebar && (
              <aside className="hidden lg:flex flex-col gap-4 w-72 flex-shrink-0">
                {/* Sticky header */}
                <div className="rounded-[20px] border p-4 flex flex-col gap-4"
                  style={{ background: CARD, borderColor: BORDER, position: "sticky", top: 24 }}>

                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest mb-1" style={{ color: MUTED }}>
                      Unlock All Content
                    </p>
                    <p className="text-[13px]" style={{ color: "rgba(240,234,255,0.65)" }}>
                      Subscribe to get full access to {profile.name}'s posts, videos and messages.
                    </p>
                  </div>

                  {profile.standardPrice != null && (
                    <SubCard
                      tier="standard"
                      price={profile.standardPrice}
                      features={[
                        "All posts & photos",
                        "Direct messaging",
                        "Early access to new content",
                      ]}
                      onSubscribe={() => handleSubscribe("standard")}
                      isSubscribing={isSubscribing}
                    />
                  )}

                  {profile.vipPrice != null && (
                    <SubCard
                      tier="vip"
                      price={profile.vipPrice}
                      features={[
                        "Everything in Standard",
                        "Full 4K video archive",
                        "Priority DMs",
                        "Custom content requests",
                      ]}
                      onSubscribe={() => handleSubscribe("vip")}
                      isSubscribing={isSubscribing}
                      isPopular
                    />
                  )}
                </div>
              </aside>
            )}
          </div>

        ) : (

          /* ── MEDIA tab: masonry grid, all posts shown, locked = overlay ── */
          <div>
            {posts.length === 0 ? (
              <div className="flex flex-col items-center gap-4 py-20 text-center rounded-[20px] border"
                style={{ background: CARD, borderColor: BORDER }}>
                <span className="text-5xl">🎬</span>
                <p className="text-[16px] font-black" style={{ color: TEXT }}>No media yet</p>
                <p className="text-[13px]" style={{ color: MUTED }}>Check back later for photos and videos!</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-1">
                {posts.map((post) => (
                  <MediaTile
                    key={post.id}
                    post={post}
                    onClick={() => !post.isLocked && setSelectedPost(post)}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Media lightbox ── */}
      {selectedPost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.92)", backdropFilter: "blur(8px)" }}
          onClick={() => setSelectedPost(null)}>
          <div className="relative max-w-4xl w-full rounded-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setSelectedPost(null)}
              className="absolute top-3 right-3 z-10 size-9 rounded-full flex items-center justify-center"
              style={{ background: "rgba(0,0,0,0.6)", color: TEXT }}>✕</button>
            {selectedPost.mediaType === "video" ? (
              <video src={selectedPost.mediaUrl} controls autoPlay  className="w-full max-h-[85vh] object-contain"
                controlsList="nodownload" onContextMenu={(e) => e.preventDefault()} />
            ) : (
              <img src={selectedPost.mediaUrl} alt="" className="w-full max-h-[85vh] object-contain" />
            )}
            {(selectedPost.description || selectedPost.title) && (
              <div className="px-5 py-4" style={{ background: SURF }}>
                <p className="text-[13px]" style={{ color: "rgba(240,234,255,0.8)" }}>
                  {selectedPost.description ?? selectedPost.title}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}