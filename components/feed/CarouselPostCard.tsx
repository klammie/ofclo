"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";

// ─── Theme ────────────────────────────────────────────────────────────────────
const V      = "#7c3aed";
const P      = "#ef3976";
const GRAD   = `linear-gradient(135deg, ${V}, ${P})`;
const CARD   = "#1a1635";
const BORDER = "rgba(124,58,237,0.15)";
const TEXT   = "#f0eaff";
const MUTED  = "rgba(240,234,255,0.45)";

// ─── Types ────────────────────────────────────────────────────────────────────
type Rarity = "common" | "rare" | "epic" | "legendary";

interface MediaItem {
  id?:          string;
  sortOrder:    number;
  mediaType:    "image" | "video";
  mediaUrl:     string;
  thumbnailUrl?: string | null;
  duration?:    number | null;
}

interface CarouselPost {
  id:                  string;
  creatorId?:          string;
  creatorUserId?:      string;
  creatorName:         string;
  creatorUsername?:    string;
  creatorAvatarUrl?:   string | null;
  creatorIsVerified?:  boolean;
  subscriberCount?:    number;
  title?:              string | null;
  description?:        string | null;
  caption?:            string | null;
  isLocked?:           boolean;
  mediaItems:          MediaItem[];   // all carousel slides
  likeCount:           number;
  commentCount:        number;
  isLiked?:            boolean;
  isBookmarked?:       boolean;
  createdAt:           string | Date;
}

interface CarouselPostCardProps {
  post:           CarouselPost;
  currentUserId:  string;
  onLike:         (id: string) => void;
  onBookmark:     (id: string) => void;
  onComment:      (id: string) => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmt(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `${(n / 1_000).toFixed(1)}k`;
  return String(n);
}

function relTime(d: string | Date): string {
  const diff = Date.now() - new Date(d).getTime();
  const m    = Math.floor(diff / 60000);
  const h    = Math.floor(diff / 3600000);
  const day  = Math.floor(diff / 86400000);
  if (m < 1)  return "just now";
  if (m < 60) return `${m}m ago`;
  if (h < 24) return `${h}h ago`;
  if (day < 7) return `${day}d ago`;
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatDuration(s: number): string {
  const h   = Math.floor(s / 3600);
  const m   = Math.floor((s % 3600) / 60);
  const sec = Math.floor(s % 60);
  if (h > 0) return `${h}:${String(m).padStart(2,"0")}:${String(sec).padStart(2,"0")}`;
  return `${m}:${String(sec).padStart(2,"0")}`;
}

function getRarity(n = 0): Rarity {
  if (n >= 10000) return "legendary";
  if (n >= 1000)  return "epic";
  if (n >= 100)   return "rare";
  return "common";
}

const RARITY: Record<Rarity, { color: string; glow: string }> = {
  common:    { color: "#94a3b8", glow: "rgba(148,163,184,0)"   },
  rare:      { color: "#38bdf8", glow: "rgba(56,189,248,0.2)"  },
  epic:      { color: "#a78bfa", glow: "rgba(167,139,250,0.3)" },
  legendary: { color: "#fbbf24", glow: "rgba(251,191,36,0.4)"  },
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

// ─── Single carousel slide ────────────────────────────────────────────────────
function CarouselSlide({ item, isLocked }: { item: MediaItem; isLocked?: boolean }) {
  const thumb = item.thumbnailUrl ?? (item.mediaType === "image" ? item.mediaUrl : null);

  return (
    <div className="relative w-full h-full flex-shrink-0">
      {item.mediaType === "video" ? (
        <video
          src={isLocked ? undefined : item.mediaUrl}
          poster={thumb ?? undefined}
          controls={!isLocked}
          controlsList="nodownload"
          onContextMenu={(e) => e.preventDefault()}
          className="w-full h-full object-cover"
          style={isLocked ? { filter: "blur(20px)", transform: "scale(1.1)" } : undefined}
        />
      ) : thumb ? (
        <img
          src={thumb}
          alt=""
          className="w-full h-full object-cover"
          style={isLocked ? { filter: "blur(20px)", transform: "scale(1.1)", opacity: 0.5 } : undefined}
        />
      ) : (
        <div className="w-full h-full" style={{ background: placeholderGrad(item.mediaUrl) }} />
      )}

      {/* Video duration badge */}
      {item.mediaType === "video" && !isLocked && item.duration != null && (
        <div className="absolute bottom-3 right-3 rounded-md px-2 py-0.5 text-[10px] font-black text-white"
          style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}>
          {formatDuration(item.duration)}
        </div>
      )}

      {/* Video play badge */}
      {item.mediaType === "video" && !isLocked && (
        <div className="absolute top-3 right-3 size-8 rounded-full flex items-center justify-center"
          style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="white"><path d="M8 5v14l11-7z"/></svg>
        </div>
      )}
    </div>
  );
}

// ─── CAROUSEL POST CARD ───────────────────────────────────────────────────────
export function CarouselPostCard({
  post, currentUserId, onLike, onBookmark, onComment,
}: CarouselPostCardProps) {
  const router            = useRouter();
  const [slide, setSlide] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const trackRef          = useRef<HTMLDivElement>(null);
  const touchStart        = useRef<number | null>(null);

  const items   = post.mediaItems ?? [];
  const total   = items.length;
  const caption = post.caption ?? post.description ?? post.title ?? null;
  const isLong  = (caption?.length ?? 0) > 160;

  const rarity = getRarity(post.subscriberCount);
  const r      = RARITY[rarity];

  const prev = useCallback(() => setSlide((s) => Math.max(0, s - 1)), []);
  const next = useCallback(() => setSlide((s) => Math.min(total - 1, s + 1)), [total]);

  // Touch swipe
  const onTouchStart = (e: React.TouchEvent) => { touchStart.current = e.touches[0].clientX; };
  const onTouchEnd   = (e: React.TouchEvent) => {
    if (touchStart.current == null) return;
    const dx = e.changedTouches[0].clientX - touchStart.current;
    if (dx < -40) next();
    else if (dx > 40) prev();
    touchStart.current = null;
  };

  const goProfile = () => {
    if (post.creatorUsername) router.push(`/dashboard/user/feed/${post.creatorUsername}`);
  };

  return (
    <article className="rounded-[20px] border overflow-hidden flex flex-col"
      style={{ background: CARD, borderColor: BORDER }}>

      {/* ── Creator header ── */}
      <div className="flex items-center gap-3 px-4 py-3.5">
        {/* Avatar */}
        <button onClick={goProfile} className="flex-shrink-0">
          <div className="rounded-full overflow-hidden flex items-center justify-center font-black text-white"
            style={{
              width: 42, height: 42, fontSize: 15,
              background: post.creatorAvatarUrl ? "transparent" : placeholderGrad(post.id),
              border:     `2px solid ${r.color}`,
              boxShadow:  `0 0 8px ${r.glow}`,
            }}>
            {post.creatorAvatarUrl
              ? <img src={post.creatorAvatarUrl} alt={post.creatorName} className="size-full object-cover" />
              : post.creatorName.charAt(0).toUpperCase()
            }
          </div>
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <button onClick={goProfile} className="text-[14px] font-black hover:underline text-left"
              style={{ color: TEXT }}>
              {post.creatorName}
            </button>
            {post.creatorIsVerified && (
              <svg className="size-4 flex-shrink-0" viewBox="0 0 20 20" fill={r.color}>
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"/>
              </svg>
            )}
            {/* Multi-media badge */}
            {total > 1 && (
              <div className="flex items-center gap-1 rounded-full px-2 py-0.5"
                style={{ background: "rgba(124,58,237,0.12)", border: `1px solid ${BORDER}` }}>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={V} strokeWidth="2.5" strokeLinecap="round">
                  <rect x="3" y="3" width="8" height="8"/><rect x="13" y="3" width="8" height="8"/>
                  <rect x="3" y="13" width="8" height="8"/><rect x="13" y="13" width="8" height="8"/>
                </svg>
                <span className="text-[9px] font-black" style={{ color: V }}>{total}</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-1.5 mt-0.5">
            {post.creatorUsername && (
              <p className="text-[11px]" style={{ color: MUTED }}>@{post.creatorUsername}</p>
            )}
            <span style={{ color: "rgba(240,234,255,0.2)" }}>·</span>
            <p className="text-[11px]" style={{ color: MUTED }}>{relTime(post.createdAt)}</p>
          </div>
        </div>
      </div>

      {/* ── Carousel ── */}
      {items.length > 0 && (
        <div className="relative w-full overflow-hidden" style={{ aspectRatio: "4/3" }}
          onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>

          {/* Track */}
          <div ref={trackRef}
            className="flex h-full transition-transform duration-300 ease-out"
            style={{ transform: `translateX(-${slide * 100}%)` }}>
            {items.map((item) => (
              <div key={item.sortOrder} className="w-full h-full flex-shrink-0">
                <CarouselSlide item={item} isLocked={post.isLocked} />
              </div>
            ))}
          </div>

          {/* Locked overlay */}
          {post.isLocked && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3"
              style={{ backdropFilter: "blur(4px)", background: "rgba(13,13,26,0.4)" }}>
              <div className="size-14 rounded-2xl flex items-center justify-center"
                style={{ background: "rgba(239,57,118,0.15)", border: "1px solid rgba(239,57,118,0.4)" }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ef3976" strokeWidth="2.5" strokeLinecap="round">
                  <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
              </div>
              <p className="text-[12px] font-black text-white">Subscribe to unlock</p>
            </div>
          )}

          {/* Prev / Next arrows */}
          {total > 1 && !post.isLocked && (
            <>
              {slide > 0 && (
                <button onClick={prev}
                  className="absolute left-3 top-1/2 -translate-y-1/2 size-9 rounded-full flex items-center justify-center transition-all hover:scale-110"
                  style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)", color: "#fff" }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <path d="M15 19l-7-7 7-7"/>
                  </svg>
                </button>
              )}
              {slide < total - 1 && (
                <button onClick={next}
                  className="absolute right-3 top-1/2 -translate-y-1/2 size-9 rounded-full flex items-center justify-center transition-all hover:scale-110"
                  style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)", color: "#fff" }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <path d="M9 5l7 7-7 7"/>
                  </svg>
                </button>
              )}
            </>
          )}

          {/* Dot indicators */}
          {total > 1 && (
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5">
              {items.map((_, i) => (
                <button key={i} onClick={() => setSlide(i)}
                  className="rounded-full transition-all duration-200"
                  style={{
                    width:   i === slide ? 20 : 6,
                    height:  6,
                    background: i === slide ? "#fff" : "rgba(255,255,255,0.4)",
                  }} />
              ))}
            </div>
          )}

          {/* Slide counter top-right */}
          {total > 1 && (
            <div className="absolute top-3 right-3 rounded-full px-2.5 py-1 text-[11px] font-black text-white"
              style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}>
              {slide + 1} / {total}
            </div>
          )}
        </div>
      )}

      {/* ── Actions ── */}
      <div className="px-4 pt-3 pb-1.5 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => onLike(post.id)}
            className="flex items-center gap-1.5 transition-all hover:scale-110 active:scale-95">
            <svg width="22" height="22" viewBox="0 0 24 24"
              fill={post.isLiked ? P : "none"}
              stroke={post.isLiked ? P : "rgba(240,234,255,0.5)"}
              strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
            </svg>
            <span className="text-[13px] font-bold" style={{ color: post.isLiked ? P : MUTED }}>
              {fmt(post.likeCount)}
            </span>
          </button>

          <button onClick={() => onComment(post.id)}
            className="flex items-center gap-1.5 transition-all hover:scale-110 active:scale-95">
            <svg width="21" height="21" viewBox="0 0 24 24" fill="none"
              stroke="rgba(240,234,255,0.5)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
            <span className="text-[13px] font-bold" style={{ color: MUTED }}>
              {fmt(post.commentCount)}
            </span>
          </button>
        </div>

        <button onClick={() => onBookmark(post.id)} className="transition-all hover:scale-110 active:scale-95">
          <svg width="21" height="21" viewBox="0 0 24 24"
            fill={post.isBookmarked ? V : "none"}
            stroke={post.isBookmarked ? V : "rgba(240,234,255,0.5)"}
            strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
          </svg>
        </button>
      </div>

      {/* ── Caption ── */}
      {caption && (
        <div className="px-4 pb-4">
          <p className="text-[13px] leading-relaxed" style={{ color: "rgba(240,234,255,0.8)" }}>
            <span className="font-black mr-1.5" style={{ color: TEXT }}>{post.creatorName}</span>
            {post.isLocked
              ? <span style={{ color: MUTED }}>🔒 Subscribe to read…</span>
              : expanded || !isLong
                ? caption
                : `${caption.slice(0, 160)}…`
            }
            {isLong && !post.isLocked && (
              <button onClick={() => setExpanded(!expanded)}
                className="ml-1.5 font-bold text-[12px]"
                style={{ color: MUTED, background: "none", border: "none", cursor: "pointer" }}>
                {expanded ? "less" : "more"}
              </button>
            )}
          </p>
        </div>
      )}
    </article>
  );
}