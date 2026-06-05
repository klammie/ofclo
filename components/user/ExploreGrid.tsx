"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

// ─── Types ────────────────────────────────────────────────────────────────────

type CreatorRarity = "common" | "rare" | "epic" | "legendary";

type ExplorePost = {
  id: string;
  creatorId: string;
  creatorUserId: string;
  creatorName: string;
  creatorUsername: string;
  creatorAvatarUrl: string | null;
  creatorIsVerified: boolean;
  creatorRarity: CreatorRarity;
  isSubscribed: boolean;
  mediaUrl: string | null;
  mediaType: "image" | "video";
  thumbnailUrl: string | null;
  caption: string | null;
  isLocked: boolean;
  likeCount: number;
  commentCount: number;
  isLiked: boolean;
  isBookmarked: boolean;
  createdAt: string;
  // Grid layout hints — assigned client-side for visual variety
  span?: "normal" | "wide" | "tall";
};

type PostCategory = "all" | "lifestyle" | "fitness" | "art" | "music" | "gaming" | "fashion" | "cooking" | "comedy";

// ─── Rarity config ────────────────────────────────────────────────────────────

const RARITY = {
  common:    { color: "#94a3b8", icon: "◆" },
  rare:      { color: "#38bdf8", icon: "◆" },
  epic:      { color: "#a78bfa", icon: "◆" },
  legendary: { color: "#fbbf24", icon: "♦" },
};

// ─── Categories ───────────────────────────────────────────────────────────────

const CATEGORIES: { id: PostCategory; label: string }[] = [
  { id: "all",       label: "All"       },
  { id: "lifestyle", label: "Lifestyle" },
  { id: "fitness",   label: "Fitness"   },
  { id: "art",       label: "Art"       },
  { id: "music",     label: "Music"     },
  { id: "gaming",    label: "Gaming"    },
  { id: "fashion",   label: "Fashion"   },
  { id: "cooking",   label: "Cooking"   },
  { id: "comedy",    label: "Comedy"    },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `${(n / 1_000).toFixed(1)}k`;
  return String(n);
}

function relTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  const h = Math.floor(diff / 3600000);
  const d = Math.floor(diff / 86400000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m`;
  if (h < 24) return `${h}h`;
  if (d < 7)  return `${d}d`;
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// Uniform grid — all tiles the same size, clean and consistent.
// No variable tall/wide spans that cause cropping and mismatches.
function assignSpans(posts: ExplorePost[]): ExplorePost[] {
  return posts.map((p) => ({ ...p, span: "normal" as const }));
}

// ─── Gradient placeholder when no image ──────────────────────────────────────

const GRADIENTS = [
  "linear-gradient(135deg, #7c3aed 0%, #ef3976 100%)",
  "linear-gradient(135deg, #0ea5e9 0%, #7c3aed 100%)",
  "linear-gradient(135deg, #f59e0b 0%, #ef3976 100%)",
  "linear-gradient(135deg, #06b6d4 0%, #4ade80 100%)",
  "linear-gradient(135deg, #a78bfa 0%, #38bdf8 100%)",
  "linear-gradient(135deg, #fb923c 0%, #fbbf24 100%)",
];

function gradientFor(id: string) {
  const i = id.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  return GRADIENTS[i % GRADIENTS.length];
}

// ─── Locked overlay ───────────────────────────────────────────────────────────

function LockedOverlay({ small }: { small?: boolean }) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2"
      style={{ backdropFilter: "blur(14px)", background: "rgba(13,13,26,0.45)" }}>
      <div className="rounded-full flex items-center justify-center"
        style={{ width: small ? 28 : 40, height: small ? 28 : 40, background: "rgba(239,57,118,0.2)", border: "1px solid rgba(239,57,118,0.4)" }}>
        <svg width={small ? 13 : 18} height={small ? 13 : 18} viewBox="0 0 24 24" fill="none" stroke="#ef3976" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
        </svg>
      </div>
      {!small && <p className="text-[10px] font-black text-white uppercase tracking-wider">Subscribe to unlock</p>}
    </div>
  );
}

// ─── Post modal ───────────────────────────────────────────────────────────────

function PostModal({ post, onClose, onLike, onBookmark, onSubscribe }: {
  post: ExplorePost;
  onClose: () => void;
  onLike: (id: string) => void;
  onBookmark: (id: string) => void;
  onSubscribe: (creatorId: string) => void;
}) {
  const router = useRouter();
  const r = RARITY[post.creatorRarity];
  const [comment, setComment] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handler);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>

      <div className="relative flex w-full max-w-5xl rounded-2xl overflow-hidden"
        style={{ maxHeight: "90vh", background: "#1a1635", boxShadow: "0 24px 80px rgba(0,0,0,0.6)" }}>

        {/* Close button */}
        <button onClick={onClose}
          className="absolute top-3 right-3 z-20 size-8 rounded-full flex items-center justify-center transition-all hover:scale-110"
          style={{ background: "rgba(0,0,0,0.5)", color: "rgba(240,234,255,0.8)" }}>
          ✕
        </button>

        {/* ── Left: Media ── */}
        <div className="relative flex-1 min-w-0 flex items-center justify-center"
          style={{ background: "#0d0d1a", minHeight: 480, maxHeight: "90vh" }}>
          {post.mediaUrl ? (
            post.mediaType === "video" ? (
              // For videos in the modal: show video player with poster thumbnail
              <video
                src={post.mediaUrl}
                poster={post.thumbnailUrl ?? undefined}
                controls
                className="w-full h-full object-contain"
                style={{ maxHeight: "100%", background: "#0d0d1a" }}
                controlsList="nodownload"
                onContextMenu={(e) => e.preventDefault()}
              />
            ) : (
              <img src={post.mediaUrl} alt={post.caption ?? "Post"}
                className="w-full h-full"
                style={{ objectFit: "contain", background: "#0d0d1a" }} />
            )
          ) : (
            <div className="w-full h-full" style={{ background: gradientFor(post.id), minHeight: 480 }} />
          )}
          {post.isLocked && <LockedOverlay />}

          {/* Video badge */}
          {post.mediaType === "video" && !post.isLocked && (
            <div className="absolute top-4 right-4 rounded-full size-9 flex items-center justify-center"
              style={{ background: "rgba(0,0,0,0.6)" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="white"><path d="M8 5v14l11-7z"/></svg>
            </div>
          )}
        </div>

        {/* ── Right: Details ── */}
        <div className="w-80 flex-shrink-0 flex flex-col border-l"
          style={{ borderColor: "rgba(124,58,237,0.2)", maxHeight: "90vh" }}>

          {/* Creator header */}
          <div className="flex items-center gap-3 px-4 py-4 border-b"
            style={{ borderColor: "rgba(124,58,237,0.12)" }}>
            <div className="rounded-full overflow-hidden flex-shrink-0"
              style={{ width: 44, height: 44, border: `2px solid ${r.color}`, boxShadow: `0 0 10px ${r.color}40` }}>
              {post.creatorAvatarUrl ? (
                <img src={post.creatorAvatarUrl} className="size-full object-cover" alt={post.creatorName} />
              ) : (
                <div className="size-full flex items-center justify-center font-black text-white"
                  style={{ background: gradientFor(post.creatorId), fontSize: 16 }}>
                  {post.creatorName.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <p className="text-[14px] font-black truncate" style={{ color: "#f0eaff" }}>
                  {post.creatorName}
                </p>
                {post.creatorIsVerified && (
                  <svg className="size-4 flex-shrink-0" viewBox="0 0 20 20" fill={r.color}>
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"/>
                  </svg>
                )}
              </div>
              <div className="flex items-center gap-1.5">
                <p className="text-[11px]" style={{ color: "rgba(240,234,255,0.4)" }}>@{post.creatorUsername}</p>
                <span style={{ color: r.color, fontSize: 8 }}>{r.icon}</span>
                <span className="text-[9px] font-black capitalize" style={{ color: r.color }}>{post.creatorRarity}</span>
              </div>
            </div>

            {/* Subscribe / subscribed */}
            {post.isSubscribed ? (
              <button onClick={() => router.push(`/dashboard/user/message/${post.creatorUserId}`)}
                className="flex-shrink-0 rounded-xl px-3 py-1.5 text-[11px] font-black text-white"
                style={{ background: "linear-gradient(135deg, #7c3aed, #ef3976)" }}>
                Message
              </button>
            ) : (
              <button onClick={() => onSubscribe(post.creatorId)}
                className="flex-shrink-0 rounded-xl px-3 py-1.5 text-[11px] font-black border transition-all"
                style={{ background: `${r.color}18`, borderColor: `${r.color}40`, color: r.color }}>
                Subscribe
              </button>
            )}
          </div>

          {/* Caption + comments area */}
          <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-4">
            {/* Caption */}
            {post.caption && (
              <div className="flex gap-3">
                <div className="rounded-full overflow-hidden flex-shrink-0 size-8"
                  style={{ border: `1.5px solid ${r.color}60` }}>
                  {post.creatorAvatarUrl ? (
                    <img src={post.creatorAvatarUrl} className="size-full object-cover" />
                  ) : (
                    <div className="size-full flex items-center justify-center font-black text-white text-[10px]"
                      style={{ background: gradientFor(post.creatorId) }}>
                      {post.creatorName.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-[12px]" style={{ color: "rgba(240,234,255,0.8)", lineHeight: 1.6 }}>
                    <span className="font-black text-[#f0eaff] mr-1.5">{post.creatorName}</span>
                    {post.isLocked ? (
                      <span style={{ color: "rgba(240,234,255,0.35)" }}>🔒 Subscribe to read the full caption…</span>
                    ) : post.caption}
                  </p>
                  <p className="text-[10px] mt-1" style={{ color: "rgba(240,234,255,0.3)" }}>{relTime(post.createdAt)}</p>
                </div>
              </div>
            )}

            {/* Locked CTA */}
            {post.isLocked && (
              <div className="rounded-[14px] border p-4 flex flex-col gap-3"
                style={{ background: "rgba(239,57,118,0.06)", borderColor: "rgba(239,57,118,0.25)" }}>
                <p className="text-[12px] font-bold" style={{ color: "#f0eaff" }}>
                  🔒 This post is exclusive to subscribers
                </p>
                <p className="text-[11px]" style={{ color: "rgba(240,234,255,0.5)" }}>
                  Subscribe to {post.creatorName} to see the full post, caption and comments.
                </p>
                <button onClick={() => onSubscribe(post.creatorId)}
                  className="w-full py-2.5 rounded-xl text-[12px] font-black text-white"
                  style={{ background: "linear-gradient(135deg, #7c3aed, #ef3976)", boxShadow: "0 4px 16px rgba(124,58,237,0.35)" }}>
                  Subscribe Now
                </button>
              </div>
            )}

            {/* Placeholder comments (wire up real comments from DB) */}
            {!post.isLocked && (
              <div className="flex flex-col gap-3">
                <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: "rgba(240,234,255,0.3)" }}>
                  Comments · {fmt(post.commentCount)}
                </p>
                {/* Placeholder comment rows — replace with real data */}
                {[
                  { user: "fan_user1",  text: "This is amazing! 🔥",            time: "2h"  },
                  { user: "superfan99", text: "Absolutely love this content 💜", time: "5h"  },
                  { user: "user_xyz",   text: "Keep it up! 🙌",                  time: "1d"  },
                ].map((c, i) => (
                  <div key={i} className="flex gap-2.5">
                    <div className="size-7 rounded-full flex-shrink-0 flex items-center justify-center text-[10px] font-black text-white"
                      style={{ background: GRADIENTS[i % GRADIENTS.length] }}>
                      {c.user[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="text-[12px]" style={{ color: "rgba(240,234,255,0.8)", lineHeight: 1.5 }}>
                        <span className="font-black text-[#f0eaff] mr-1.5">{c.user}</span>{c.text}
                      </p>
                      <p className="text-[10px] mt-0.5" style={{ color: "rgba(240,234,255,0.3)" }}>{c.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Actions bar */}
          <div className="border-t px-4 py-3 flex flex-col gap-3"
            style={{ borderColor: "rgba(124,58,237,0.12)" }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {/* Like */}
                <button onClick={() => onLike(post.id)}
                  className="flex items-center gap-1.5 transition-all hover:scale-110">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill={post.isLiked ? "#ef3976" : "none"}
                    stroke={post.isLiked ? "#ef3976" : "rgba(240,234,255,0.6)"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                  </svg>
                  <span className="text-[12px] font-bold" style={{ color: post.isLiked ? "#ef3976" : "rgba(240,234,255,0.6)" }}>
                    {fmt(post.likeCount)}
                  </span>
                </button>

                {/* Comment */}
                <button onClick={() => inputRef.current?.focus()}
                  className="flex items-center gap-1.5 transition-all hover:scale-110">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
                    stroke="rgba(240,234,255,0.6)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                  </svg>
                  <span className="text-[12px] font-bold" style={{ color: "rgba(240,234,255,0.6)" }}>
                    {fmt(post.commentCount)}
                  </span>
                </button>
              </div>

              {/* Bookmark */}
              <button onClick={() => onBookmark(post.id)} className="transition-all hover:scale-110">
                <svg width="22" height="22" viewBox="0 0 24 24"
                  fill={post.isBookmarked ? "#7c3aed" : "none"}
                  stroke={post.isBookmarked ? "#7c3aed" : "rgba(240,234,255,0.6)"}
                  strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
                </svg>
              </button>
            </div>

            {/* Timestamp */}
            <p className="text-[10px] uppercase tracking-wider" style={{ color: "rgba(240,234,255,0.25)" }}>
              {relTime(post.createdAt)} ago
            </p>

            {/* Comment input */}
            {!post.isLocked && (
              <div className="flex items-center gap-2 border-t pt-3" style={{ borderColor: "rgba(124,58,237,0.1)" }}>
                <input ref={inputRef} type="text" value={comment} onChange={(e) => setComment(e.target.value)}
                  placeholder="Add a comment…"
                  className="flex-1 bg-transparent outline-none text-[12px]"
                  style={{ color: "#f0eaff", fontFamily: "inherit" }}
                  onKeyDown={(e) => { if (e.key === "Enter" && comment.trim()) setComment(""); }} />
                {comment.trim() && (
                  <button onClick={() => setComment("")}
                    className="text-[11px] font-black"
                    style={{ color: "#7c3aed" }}>
                    Post
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Grid tile ────────────────────────────────────────────────────────────────

function GridTile({ post, onClick }: { post: ExplorePost; onClick: () => void }) {
  // For videos: use thumbnailUrl as the tile image (not the raw video URL)
  // For images: use thumbnailUrl if available, else mediaUrl
  const thumbSrc = post.thumbnailUrl
    ?? (post.mediaType === "image" ? post.mediaUrl : null);

  return (
    <div
      onClick={onClick}
      className="relative overflow-hidden rounded-2xl cursor-pointer group"
      style={{ background: "#13112b", aspectRatio: "1 / 1" }}
    >
      {/* Media — object-contain so nothing is cropped; dark bg fills letterbox */}
      {thumbSrc ? (
        <img
          src={thumbSrc}
          alt={post.caption ?? ""}
          className="absolute inset-0 w-full h-full transition-transform duration-500 group-hover:scale-105"
          style={{ objectFit: "contain", background: "#0d0d1a" }}
        />
      ) : (
        <div className="absolute inset-0 transition-transform duration-500 group-hover:scale-105"
          style={{ background: gradientFor(post.id) }} />
      )}

      {/* Subtle dark vignette so overlays are always readable */}
      <div className="absolute inset-0"
        style={{ background: "linear-gradient(to top, rgba(0,0,0,0.55) 0%, transparent 45%)" }} />

      {/* Video badge — top-right */}
      {post.mediaType === "video" && !post.isLocked && (
        <div className="absolute top-2 right-2 size-7 rounded-full flex items-center justify-center z-10"
          style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(4px)" }}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="white">
            <path d="M8 5v14l11-7z"/>
          </svg>
        </div>
      )}

      {/* Locked overlay */}
      {post.isLocked && <LockedOverlay small />}

      {/* Hover overlay — stats + creator */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col justify-end z-10">
        <div className="p-3 flex flex-col gap-1.5">
          {/* Stats row */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <svg width="12" height="12" viewBox="0 0 24 24"
                fill={post.isLiked ? "#ef3976" : "white"}
                stroke={post.isLiked ? "#ef3976" : "white"}
                strokeWidth="2" strokeLinecap="round">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
              </svg>
              <span className="text-white text-[10px] font-bold">{fmt(post.likeCount)}</span>
            </div>
            <div className="flex items-center gap-1">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
              <span className="text-white text-[10px] font-bold">{fmt(post.commentCount)}</span>
            </div>
          </div>

          {/* Creator row */}
          <div className="flex items-center gap-1.5">
            <div className="size-5 rounded-full overflow-hidden flex-shrink-0"
              style={{ border: `1.5px solid ${RARITY[post.creatorRarity].color}` }}>
              {post.creatorAvatarUrl
                ? <img src={post.creatorAvatarUrl} className="size-full object-cover" alt="" />
                : <div className="size-full flex items-center justify-center text-[8px] font-black text-white"
                    style={{ background: gradientFor(post.creatorId) }}>
                    {post.creatorName.charAt(0).toUpperCase()}
                  </div>
              }
            </div>
            <span className="text-white text-[10px] font-bold truncate">{post.creatorName}</span>
            {post.creatorIsVerified && (
              <svg className="size-3 flex-shrink-0" viewBox="0 0 20 20"
                fill={RARITY[post.creatorRarity].color}>
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"/>
              </svg>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Skeleton grid ────────────────────────────────────────────────────────────

function GridSkeleton() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
      {[...Array(9)].map((_, i) => (
        <div key={i}
          className="rounded-2xl animate-pulse"
          style={{ background: "#1a1635", aspectRatio: "1 / 1" }} />
      ))}
    </div>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

interface ExploreGridProps {
  /** Pass your real posts from the server component / API */
  initialPosts?: ExplorePost[];
  currentUserId: string;
}

export default function ExploreGrid({ initialPosts = [], currentUserId }: ExploreGridProps) {
  const [posts, setPosts]               = useState<ExplorePost[]>(() => assignSpans(initialPosts));
  const [activeCategory, setCategory]   = useState<PostCategory>("all");
  const [search, setSearch]             = useState("");
  const [selectedPost, setSelectedPost] = useState<ExplorePost | null>(null);
  const [isLoading, setIsLoading]       = useState(initialPosts.length === 0);
  const [isLoadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore]           = useState(true);
  const [page, setPage]                 = useState(0);

  // Fetch posts
  const fetchPosts = useCallback(async (cat: PostCategory, q: string, pg: number, append = false) => {
    if (!append) setIsLoading(true);
    else setLoadingMore(true);
    try {
      const params = new URLSearchParams({ category: cat, search: q, page: String(pg), limit: "18" });
      const res = await fetch(`/api/discover/posts?${params}`);
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      const withSpans = assignSpans(data.posts ?? []);
      setPosts((prev) => append ? [...prev, ...withSpans] : withSpans);
      setHasMore(data.hasMore ?? false);
    } catch {
      // Keep existing posts on error
    } finally {
      setIsLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    if (initialPosts.length === 0) fetchPosts(activeCategory, search, 0);
  }, []);

  const handleCategoryChange = (cat: PostCategory) => {
    setCategory(cat);
    setPage(0);
    fetchPosts(cat, search, 0);
  };

  const handleSearch = (q: string) => {
    setSearch(q);
    setPage(0);
    fetchPosts(activeCategory, q, 0);
  };

  const handleLoadMore = () => {
    const next = page + 1;
    setPage(next);
    fetchPosts(activeCategory, search, next, true);
  };

  // Optimistic like toggle
  const handleLike = useCallback(async (postId: string) => {
    setPosts((prev) => prev.map((p) =>
      p.id === postId
        ? { ...p, isLiked: !p.isLiked, likeCount: p.isLiked ? p.likeCount - 1 : p.likeCount + 1 }
        : p
    ));
    setSelectedPost((prev) => prev?.id === postId
      ? { ...prev, isLiked: !prev.isLiked, likeCount: prev.isLiked ? prev.likeCount - 1 : prev.likeCount + 1 }
      : prev
    );
    await fetch("/api/posts/like", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ postId }),
    }).catch(() => null);
  }, []);

  // Optimistic bookmark toggle
  const handleBookmark = useCallback(async (postId: string) => {
    setPosts((prev) => prev.map((p) =>
      p.id === postId ? { ...p, isBookmarked: !p.isBookmarked } : p
    ));
    setSelectedPost((prev) => prev?.id === postId
      ? { ...prev, isBookmarked: !prev.isBookmarked }
      : prev
    );
    await fetch("/api/posts/bookmark", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ postId }),
    }).catch(() => null);
  }, []);

  // Subscribe handler
  const handleSubscribe = useCallback(async (creatorId: string) => {
    await fetch("/api/subscriptions/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ creatorId, tier: "standard" }),
    }).catch(() => null);
    setPosts((prev) => prev.map((p) =>
      p.creatorId === creatorId ? { ...p, isSubscribed: true } : p
    ));
    setSelectedPost((prev) => prev?.creatorId === creatorId
      ? { ...prev, isSubscribed: true }
      : prev
    );
  }, []);

  return (
    <div className="w-full flex flex-col gap-6"
      style={{ fontFamily: "'Be Vietnam Pro', sans-serif", color: "#f0eaff" }}>

      {/* ── Header ── */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-4">
          <h1 className="text-[24px] font-black" style={{ color: "#f0eaff" }}>Discover</h1>
          {/* Search */}
          <div className="relative max-w-xs w-full">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[13px]"
              style={{ color: "rgba(240,234,255,0.3)" }}>🔍</span>
            <input type="text" value={search} onChange={(e) => handleSearch(e.target.value)}
              placeholder="Search posts…"
              className="w-full rounded-2xl border pl-9 pr-3 py-2 text-[12px] outline-none"
              style={{ background: "#1a1635", borderColor: "rgba(124,58,237,0.25)", color: "#f0eaff", fontFamily: "inherit" }} />
          </div>
        </div>

        {/* Category pills */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {CATEGORIES.map((cat) => {
            const active = activeCategory === cat.id;
            return (
              <button key={cat.id} onClick={() => handleCategoryChange(cat.id)}
                className="rounded-full border px-4 py-1.5 text-[11px] font-black whitespace-nowrap flex-shrink-0 transition-all"
                style={active
                  ? { background: "linear-gradient(135deg, #7c3aed, #ef3976)", color: "#fff", border: "none", boxShadow: "0 4px 16px rgba(124,58,237,0.35)" }
                  : { background: "rgba(255,255,255,0.03)", borderColor: "rgba(124,58,237,0.18)", color: "rgba(240,234,255,0.55)" }
                }>
                {cat.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Grid ── */}
      {isLoading ? <GridSkeleton /> : posts.length === 0 ? (
        <div className="flex flex-col items-center gap-4 py-20">
          <span className="text-5xl">🔍</span>
          <p className="text-[15px] font-bold" style={{ color: "rgba(240,234,255,0.4)" }}>No posts found</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {posts.map((post) => (
              <GridTile key={post.id} post={post} onClick={() => setSelectedPost(post)} />
            ))}
            {isLoadingMore && [...Array(3)].map((_, i) => (
              <div key={`skel-${i}`} className="rounded-2xl animate-pulse"
                style={{ background: "#1a1635", aspectRatio: "1 / 1" }} />
            ))}
          </div>

          {hasMore && !isLoadingMore && (
            <div className="flex justify-center pt-4">
              <button onClick={handleLoadMore}
                className="flex items-center gap-2 rounded-xl px-6 py-3 text-[12px] font-black border transition-all"
                style={{ background: "rgba(124,58,237,0.08)", borderColor: "rgba(124,58,237,0.25)", color: "#a78bfa" }}>
                Load More
              </button>
            </div>
          )}
        </>
      )}

      {/* ── Post modal ── */}
      {selectedPost && (
        <PostModal
          post={selectedPost}
          onClose={() => setSelectedPost(null)}
          onLike={handleLike}
          onBookmark={handleBookmark}
          onSubscribe={handleSubscribe}
        />
      )}
    </div>
  );
}