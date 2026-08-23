"use client";

// components/bookmarks/BookmarkPostCard.tsx

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";

// ─── Theme ────────────────────────────────────────────────────────────────────
const V      = "#7c3aed";
const P      = "#ef3976";
const GRAD   = `linear-gradient(135deg, ${V}, ${P})`;
const CARD   = "#1a1635";
const BORDER = "rgba(124,58,237,0.15)";
const TEXT   = "#f0eaff";
const MUTED  = "rgba(240,234,255,0.45)";

// ─── Helpers ──────────────────────────────────────────────────────────────────
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
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

function formatDate(d: string | Date): string {
  const date = new Date(d);
  if (isNaN(date.getTime())) return "";
  const diff = Date.now() - date.getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7)  return `${days}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// ─── Fullscreen media viewer ──────────────────────────────────────────────────
function FullscreenMediaViewer({ post, onClose }: { post: any; onClose: () => void }) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handler);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const isVideo = post.mediaType === "video";

  const viewer = (
    <div className="fixed inset-0 z-[60] flex items-center justify-center"
      style={{ background: "rgba(0,0,0,0.96)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>

      {/* Close */}
      <button onClick={onClose}
        className="absolute top-4 right-4 z-20 size-9 rounded-full flex items-center justify-center transition-all hover:scale-105"
        style={{ background: "rgba(255,255,255,0.1)", color: "#fff", backdropFilter: "blur(4px)" }}>
        ✕
      </button>

      {/* Media — full, uncropped */}
      <div className="relative w-full h-full flex items-center justify-center p-4 sm:p-10"
        onClick={(e) => e.stopPropagation()}>
        {isVideo ? (
          <video
            src={post.mediaUrl}
            poster={post.thumbnailUrl ?? undefined}
            controls
            autoPlay
            className="max-w-full max-h-full"
            style={{ objectFit: "contain" }}
            controlsList="nodownload"
            onContextMenu={(e) => e.preventDefault()}
          />
        ) : (
          <img
            src={post.mediaUrl ?? post.thumbnailUrl}
            alt={post.title ?? "Post"}
            className="max-w-full max-h-full select-none"
            style={{ objectFit: "contain" }}
            onContextMenu={(e) => e.preventDefault()}
          />
        )}
      </div>
    </div>
  );

  // Render via portal directly into document.body — this escapes any parent
  // element with a CSS transform (the card uses transform: scale() for its
  // remove animation), which would otherwise turn "fixed" into a local
  // containing block instead of covering the full viewport.
  if (typeof document === "undefined") return null;
  return createPortal(viewer, document.body);
}

// ─── COMPONENT ────────────────────────────────────────────────────────────────
export function BookmarkPostCard({ post, currentUserId, onRemoveBookmark }: {
  post:              any;
  currentUserId:     string;
  onRemoveBookmark:  (id: string) => void;
}) {
  const [isRemoving, setIsRemoving] = useState(false);
  const [showFullscreen, setShowFullscreen] = useState(false);
  const [removed,    setRemoved]    = useState(false);

  async function handleRemove() {
    if (isRemoving) return;
    setIsRemoving(true);
    try {
      const res = await fetch("/api/bookmarks/toggle", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ postId: post.id }),
      });
      if (!res.ok) throw new Error();
      setRemoved(true);
      setTimeout(() => onRemoveBookmark(post.id), 300);
    } catch {
      // silently fail — no alert
    } finally {
      setIsRemoving(false);
    }
  }

  // Resolve thumbnail — for videos use thumbnailUrl, for images use mediaUrl
  const thumb = post.thumbnailUrl
    ?? (post.mediaType === "image" ? post.mediaUrl : null);

  const isVideo = post.mediaType === "video";
  const creatorUsername = post.creator?.username ?? "";
  const creatorName     = post.creator?.name     ?? "Creator";
  const creatorAvatar   = post.creator?.avatarUrl ?? post.creator?.image ?? null;

  return (
    <div
      className="rounded-[20px] border overflow-hidden flex flex-col transition-all duration-300"
      style={{
        background:  CARD,
        borderColor: BORDER,
        opacity:     removed ? 0 : 1,
        transform:   removed ? "scale(0.96)" : "scale(1)",
        fontFamily:  "'Be Vietnam Pro', sans-serif",
      }}
    >
      {/* ── Media ── */}
      <div
        className="relative w-full overflow-hidden group cursor-pointer"
        style={{ aspectRatio: "1 / 1" }}
        onClick={() => {
          if (post.mediaUrl || post.thumbnailUrl) setShowFullscreen(true);
        }}
      >

        {/* Thumbnail */}
        {thumb ? (
          <img
            src={thumb}
            alt={post.title ?? "Post"}
            className="w-full h-full transition-transform duration-500 group-hover:scale-105"
            style={{ objectFit: "contain", background: "#0d0d1a" }}
          />
        ) : (
          <div className="w-full h-full transition-transform duration-500 group-hover:scale-105"
            style={{ background: placeholderGrad(post.id) }} />
        )}

        {/* Gradient overlay — always visible at bottom */}
        <div className="absolute inset-0"
          style={{ background: "linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 50%)" }} />

        {/* Video badge */}
        {isVideo && (
          <div className="absolute top-2.5 left-2.5 size-7 rounded-full flex items-center justify-center"
            style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(4px)" }}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="white">
              <path d="M8 5v14l11-7z"/>
            </svg>
          </div>
        )}

        {/* Remove bookmark button */}
        <button
          onClick={(e) => { e.stopPropagation(); handleRemove(); }}
          disabled={isRemoving}
          className="absolute top-2.5 right-2.5 size-8 rounded-xl flex items-center justify-center transition-all hover:scale-110 active:scale-95"
          style={{
            background:   isRemoving ? "rgba(124,58,237,0.3)" : "rgba(0,0,0,0.65)",
            backdropFilter: "blur(4px)",
            border:       `1px solid ${BORDER}`,
          }}
          title="Remove bookmark"
        >
          {isRemoving ? (
            <svg className="animate-spin size-3.5" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="white" strokeWidth="4"/>
              <path className="opacity-75" fill="white" d="M4 12a8 8 0 018-8v8H4z"/>
            </svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 24 24"
              fill={V} stroke={V} strokeWidth="1.5"
              strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
            </svg>
          )}
        </button>

        {/* Creator info — bottom of image */}
        <Link href={`/dashboard/user/feed/${creatorUsername}`}
          className="absolute bottom-0 left-0 right-0 flex items-center gap-2 px-3 py-2.5"
          onClick={(e) => e.stopPropagation()}>
          <div className="size-6 rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center font-black text-white text-[9px]"
            style={{
              background:  creatorAvatar ? "transparent" : placeholderGrad(post.id),
              border:      "1.5px solid rgba(255,255,255,0.3)",
            }}>
            {creatorAvatar
              ? <img src={creatorAvatar} className="size-full object-cover" alt="" />
              : creatorName.charAt(0).toUpperCase()
            }
          </div>
          <span className="text-[11px] font-black text-white truncate flex-1">
            {creatorName}
          </span>
          {post.creator?.isVerified && (
            <svg className="size-3.5 flex-shrink-0" viewBox="0 0 20 20" fill="#38bdf8">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"/>
            </svg>
          )}
        </Link>
      </div>

      {/* ── Info ── */}
      <div className="px-3.5 py-3 flex flex-col gap-2">

        {/* Title */}
        {post.title && (
          <p className="text-[13px] font-black leading-snug line-clamp-1" style={{ color: TEXT }}>
            {post.title}
          </p>
        )}

        {/* Description */}
        {post.description && (
          <p className="text-[11px] leading-relaxed line-clamp-2" style={{ color: MUTED }}>
            {post.description}
          </p>
        )}

        {/* Stats row */}
        <div className="flex items-center gap-3 pt-0.5">
          {/* Likes */}
          <div className="flex items-center gap-1">
            <svg width="13" height="13" viewBox="0 0 24 24"
              fill={P} stroke={P} strokeWidth="1.5" strokeLinecap="round">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
            </svg>
            <span className="text-[11px] font-bold" style={{ color: MUTED }}>
              {fmt(post.likeCount ?? 0)}
            </span>
          </div>

          {/* Comments */}
          <div className="flex items-center gap-1">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
              stroke={MUTED} strokeWidth="2" strokeLinecap="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
            <span className="text-[11px] font-bold" style={{ color: MUTED }}>
              {fmt(post.commentCount ?? 0)}
            </span>
          </div>

          {/* Bookmarked date */}
          {post.bookmarkedAt && (
            <span className="ml-auto text-[10px] font-bold" style={{ color: "rgba(240,234,255,0.25)" }}>
              {formatDate(post.bookmarkedAt)}
            </span>
          )}
        </div>
      </div>

      {/* Fullscreen media viewer */}
      {showFullscreen && (post.mediaUrl || post.thumbnailUrl) && (
        <FullscreenMediaViewer post={post} onClose={() => setShowFullscreen(false)} />
      )}
    </div>
  );
}