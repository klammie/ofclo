"use client";

import { useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { PostGiftOverlay, GiftModal } from "@/components/feed/GiftComponents";

// ─── Theme — identical to PostCard ───────────────────────────────────────────
const V      = "#7c3aed";
const P      = "#ef3976";
const GRAD   = `linear-gradient(135deg, ${V}, ${P})`;
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

function timeAgoStr(date: string | Date): string {
  const diff = Date.now() - new Date(date).getTime();
  const m = Math.floor(diff / 60000);
  const h = Math.floor(diff / 3600000);
  const d = Math.floor(diff / 86400000);
  if (m < 1)  return "just now";
  if (m < 60) return `${m}m`;
  if (h < 24) return `${h}h`;
  if (d < 7)  return `${d}d`;
  return new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// ─── Types ────────────────────────────────────────────────────────────────────
interface Creator {
  id:        string;
  userId:    string;
  name:      string;
  username:  string;
  avatarUrl: string | null;
}

interface Post {
  id:           string;
  creatorId:    string;
  title:        string | null;
  description:  string | null;
  mediaUrl:     string | null;
  mediaType:    "image" | "video";
  thumbnailUrl: string | null;
  isLocked:     boolean;
  ppvPrice:     number | null;
  status:       string;
  likeCount:    number;
  commentCount: number;
  createdAt:    string | Date;
  isLiked?:     boolean;
  isBookmarked?: boolean;
  giftCount?:   number;
}

interface Comment {
  id:         string;
  userId:     string;
  userName:   string;
  userAvatar: string | null;
  text:       string;
  createdAt:  string;
}

interface ProfilePostProps {
  post:           Post;
  creator:        Creator;
  currentUserId:  string | null;
  isSubscribed?:  boolean;
  isOwner?:       boolean;
}

// ─── Comment section — identical to PostCard ─────────────────────────────────
function CommentSection({ postId, currentUserId, initialCount, onCountChange }: {
  postId:        string;
  currentUserId: string | null;
  initialCount:  number;
  onCountChange: (n: number) => void;
}) {
  const [comments,  setComments]  = useState<Comment[]>([]);
  const [loading,   setLoading]   = useState(false);
  const [loaded,    setLoaded]    = useState(false);
  const [text,      setText]      = useState("");
  const [submitting, setSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    if (loaded) return;
    setLoading(true);
    try {
      const res  = await fetch(`/api/posts/${postId}/comments`);
      const data = await res.json();
      setComments(data.comments ?? []);
      setLoaded(true);
    } catch {}
    finally { setLoading(false); }
  }, [postId, loaded]);

  const submit = useCallback(async () => {
    if (!text.trim() || submitting || !currentUserId) return;
    setSubmitting(true);
    try {
      const res  = await fetch(`/api/posts/${postId}/comments`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ text: text.trim() }),
      });
      const data = await res.json();
      if (res.ok && data.comment) {
        setComments((prev) => [data.comment, ...prev]);
        onCountChange(initialCount + 1);
        setText("");
      }
    } catch {}
    finally { setSubmitting(false); }
  }, [text, submitting, currentUserId, postId, initialCount, onCountChange]);

  return (
    <div className="flex flex-col gap-3">
      {/* Load comments trigger */}
      {!loaded && (
        <button
          onClick={load}
          className="text-[12px] font-bold text-left transition-opacity hover:opacity-70"
          style={{ color: MUTED }}
        >
          {loading ? "Loading…" : `View all ${fmt(initialCount)} comments`}
        </button>
      )}

      {/* Comment list */}
      {loaded && comments.length === 0 && (
        <p className="text-[12px]" style={{ color: MUTED }}>No comments yet. Be first!</p>
      )}
      {loaded && comments.slice(0, 5).map((c) => (
        <div key={c.id} className="flex items-start gap-2">
          <div
            className="size-6 rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center text-[9px] font-black text-white"
            style={{ background: placeholderGrad(c.userId) }}
          >
            {c.userAvatar
              ? <img src={c.userAvatar} alt="" className="size-full object-cover" />
              : c.userName?.charAt(0).toUpperCase()
            }
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-[12px] font-black mr-1.5" style={{ color: TEXT }}>{c.userName}</span>
            <span className="text-[12px]" style={{ color: "rgba(240,234,255,0.7)" }}>{c.text}</span>
            <p className="text-[10px] mt-0.5" style={{ color: "rgba(240,234,255,0.3)" }}>
              {timeAgoStr(c.createdAt)}
            </p>
          </div>
        </div>
      ))}

      {/* Input */}
      {currentUserId && (
        <div className="flex items-center gap-2 mt-1">
          <input
            ref={inputRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") submit(); }}
            placeholder="Add a comment…"
            className="flex-1 rounded-full border px-3.5 py-2 text-[12px] outline-none"
            style={{
              background:  "rgba(255,255,255,0.04)",
              borderColor: BORDER,
              color:       TEXT,
            }}
          />
          {text.trim() && (
            <button
              onClick={submit}
              disabled={submitting}
              className="text-[12px] font-black transition-opacity hover:opacity-80"
              style={{ color: V }}
            >
              {submitting ? "…" : "Post"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export function ProfilePost({
  post,
  creator,
  currentUserId,
  isSubscribed = false,
  isOwner = false,
}: ProfilePostProps) {
  const router = useRouter();

  const [likeCount,    setLikeCount]    = useState(post.likeCount ?? 0);
  const [commentCount, setCommentCount] = useState(post.commentCount ?? 0);
  const [isLiked,      setIsLiked]      = useState(post.isLiked ?? false);
  const [isBookmarked, setIsBookmarked] = useState(post.isBookmarked ?? false);
  const [showComments, setShowComments] = useState(false);
  const [showGiftModal, setShowGiftModal] = useState(false);
  const [giftFloat,    setGiftFloat]    = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const lastTap = useRef(0);

  const timeAgo = timeAgoStr(post.createdAt);

  const canView = isOwner || isSubscribed || !post.isLocked;

  // ── Like ──────────────────────────────────────────────────────────────────
  const handleLike = useCallback(async () => {
    if (!currentUserId) { router.push("/login"); return; }
    const next = !isLiked;
    setIsLiked(next);
    setLikeCount((c) => c + (next ? 1 : -1));
    try {
      await fetch(`/api/posts/${post.id}/like`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ liked: next }),
      });
    } catch {
      setIsLiked(!next);
      setLikeCount((c) => c + (next ? -1 : 1));
    }
  }, [currentUserId, isLiked, post.id, router]);

  // ── Bookmark ──────────────────────────────────────────────────────────────
  const handleBookmark = useCallback(async () => {
    if (!currentUserId) { router.push("/login"); return; }
    const next = !isBookmarked;
    setIsBookmarked(next);
    try {
      await fetch(`/api/posts/${post.id}/bookmark`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ bookmarked: next }),
      });
    } catch { setIsBookmarked(!next); }
  }, [currentUserId, isBookmarked, post.id, router]);

  // ── Double-tap to like ────────────────────────────────────────────────────
  const handleMediaTap = useCallback(() => {
    const now = Date.now();
    if (now - lastTap.current < 300) {
      if (!isLiked) handleLike();
    } else {
      setIsFullscreen(true);
    }
    lastTap.current = now;
  }, [isLiked, handleLike]);

  // ── Gift float ────────────────────────────────────────────────────────────
  const handleGiftSent = useCallback((icon: string) => {
    setGiftFloat(icon);
    setTimeout(() => setGiftFloat(null), 1800);
  }, []);

  return (
    <>
      <article style={{ fontFamily: "'Be Vietnam Pro', sans-serif" }}>

        {/* ── Creator header — identical to PostCard ── */}
        <div className="flex items-center gap-3 px-1 py-3">
          <a href={`/${creator.username}`} className="flex-shrink-0">
            <div
              className="size-9 rounded-full overflow-hidden flex items-center justify-center font-black text-white text-[13px] transition-opacity hover:opacity-80"
              style={{
                background: creator.avatarUrl ? "transparent" : placeholderGrad(post.id),
                border:     "2px solid rgba(124,58,237,0.45)",
                boxShadow:  "0 0 0 1.5px #0d0d1a",
              }}
            >
              {creator.avatarUrl
                ? <img src={creator.avatarUrl} alt={creator.name} className="size-full object-cover" />
                : creator.name?.charAt(0).toUpperCase()
              }
            </div>
          </a>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <a
                href={`/${creator.username}`}
                className="text-[13px] font-black hover:underline"
                style={{ color: TEXT }}
              >
                {creator.name}
              </a>
              <span style={{ color: "rgba(240,234,255,0.2)" }}>·</span>
              <span className="text-[11px]" style={{ color: MUTED }}>{timeAgo}</span>
            </div>
            <p className="text-[10px] mt-0.5" style={{ color: "rgba(240,234,255,0.28)" }}>
              @{creator.username}
            </p>
          </div>

          {/* Three-dot */}
          <button
            className="size-8 flex items-center justify-center rounded-full transition-colors hover:bg-white/5 flex-shrink-0"
            style={{ color: MUTED }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <circle cx="5" cy="12" r="1.5"/>
              <circle cx="12" cy="12" r="1.5"/>
              <circle cx="19" cy="12" r="1.5"/>
            </svg>
          </button>
        </div>

        {/* ── Media ── */}
        <div
          className="relative w-full overflow-hidden cursor-pointer"
          style={{ borderRadius: 16 }}
          onClick={handleMediaTap}
        >
          {/* Locked overlay */}
          {post.isLocked && !canView && (
            <div
              className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3"
              style={{ background: "rgba(13,13,26,0.85)", backdropFilter: "blur(12px)" }}
            >
              <span className="text-[36px]">🔒</span>
              <p className="text-[14px] font-black" style={{ color: TEXT }}>Subscribers only</p>
              {post.ppvPrice && (
                <p className="text-[12px]" style={{ color: MUTED }}>
                  or unlock for ${post.ppvPrice}
                </p>
              )}
              <button
                onClick={(e) => { e.stopPropagation(); router.push(`/${creator.username}`); }}
                className="mt-1 px-5 py-2.5 rounded-xl text-[12px] font-black text-white"
                style={{ background: GRAD, boxShadow: "0 4px 14px rgba(124,58,237,0.4)" }}
              >
                Subscribe to unlock
              </button>
            </div>
          )}

          {post.mediaType === "video" ? (
            <video
              src={post.mediaUrl ?? undefined}
              poster={post.thumbnailUrl ?? undefined}
              controls={canView}
              playsInline
              className="w-full object-cover"
              style={{ maxHeight: 680, minHeight: 320, background: "#0d0d1a" }}
            />
          ) : (
            <img
              src={canView ? (post.mediaUrl ?? "") : (post.thumbnailUrl ?? post.mediaUrl ?? "")}
              alt={post.title ?? "Post"}
              className="w-full object-cover"
              style={{
                maxHeight: 680,
                minHeight: 320,
                filter:    post.isLocked && !canView ? "blur(18px) brightness(0.5)" : "none",
              }}
            />
          )}

          {/* Double-tap heart float */}
          {isLiked && (
            <div
              className="absolute inset-0 flex items-center justify-center pointer-events-none"
              style={{ zIndex: 5 }}
            >
              <span
                className="text-[64px] animate-ping"
                style={{ animationDuration: "0.6s", animationIterationCount: 1 }}
              >
                ❤️
              </span>
            </div>
          )}

          {/* Gift float */}
          {giftFloat && (
            <div
              className="absolute bottom-4 left-1/2 -translate-x-1/2 text-[40px] pointer-events-none"
              style={{
                animation: "floatUp 1.8s ease-out forwards",
                zIndex: 20,
              }}
            >
              {giftFloat}
            </div>
          )}
        </div>

        {/* ── Action row — identical to PostCard ── */}
        <div className="flex items-center justify-between px-1 py-3">
          <div className="flex items-center gap-4">
            {/* Like */}
            <button
              onClick={handleLike}
              className="flex items-center gap-1.5 transition-all active:scale-90"
            >
              <svg
                width="22" height="22" viewBox="0 0 24 24"
                fill={isLiked ? P : "none"}
                stroke={isLiked ? P : "rgba(240,234,255,0.6)"}
                strokeWidth="2" strokeLinecap="round"
                style={{ transition: "all 0.2s", transform: isLiked ? "scale(1.15)" : "scale(1)" }}
              >
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
              </svg>
            </button>

            {/* Comment */}
            <button
              onClick={() => setShowComments((p) => !p)}
              className="transition-all active:scale-90"
            >
              <svg
                width="22" height="22" viewBox="0 0 24 24"
                fill="none" stroke="rgba(240,234,255,0.6)"
                strokeWidth="2" strokeLinecap="round"
              >
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
            </button>

            {/* Gift */}
            <div className="flex items-center gap-1.5">
              {/* Gift overlay — shows gifted items */}
              <PostGiftOverlay postId={post.id} initialTotal={post.giftCount ?? 0} />

              <button
                onClick={() => {
                  if (!currentUserId) { router.push("/login"); return; }
                  setShowGiftModal(true);
                }}
                className="transition-all active:scale-90"
              >
                <svg
                  width="22" height="22" viewBox="0 0 24 24"
                  fill="none" stroke="rgba(240,234,255,0.6)"
                  strokeWidth="2" strokeLinecap="round"
                >
                  <polyline points="20 12 20 22 4 22 4 12"/>
                  <rect x="2" y="7" width="20" height="5"/>
                  <line x1="12" y1="22" x2="12" y2="7"/>
                  <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/>
                  <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/>
                </svg>
              </button>
            </div>
          </div>

          {/* Bookmark */}
          <button
            onClick={handleBookmark}
            className="transition-all active:scale-90"
          >
            <svg
              width="22" height="22" viewBox="0 0 24 24"
              fill={isBookmarked ? V : "none"}
              stroke={isBookmarked ? V : "rgba(240,234,255,0.6)"}
              strokeWidth="2" strokeLinecap="round"
              style={{ transition: "all 0.2s" }}
            >
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
            </svg>
          </button>
        </div>

        {/* ── Like count ── */}
        {likeCount > 0 && (
          <p className="px-1 text-[13px] font-black" style={{ color: TEXT }}>
            {fmt(likeCount)} {likeCount === 1 ? "like" : "likes"}
          </p>
        )}

        {/* ── Caption — creator name inline, identical to PostCard ── */}
        {(post.description || post.title) && (
          <div className="px-1 mt-1">
            <p className="text-[13px] leading-relaxed" style={{ color: TEXT }}>
              <a
                href={`/${creator.username}`}
                className="font-black mr-1.5 hover:underline"
                style={{ color: TEXT }}
              >
                {creator.name}
              </a>
              {post.isLocked && !canView ? (
                <span style={{ color: MUTED }}>🔒 Subscribe to read…</span>
              ) : (
                // Show description only — identical to PostCard feed behaviour
                post.description ?? post.title
              )}
            </p>
          </div>
        )}

        {/* ── Comment count / toggle ── */}
        {commentCount > 0 && !showComments && (
          <button
            onClick={() => setShowComments(true)}
            className="px-1 mt-1 text-left"
          >
            <p className="text-[12px] font-bold" style={{ color: MUTED }}>
              View all {fmt(commentCount)} comments
            </p>
          </button>
        )}

        {/* ── Comments ── */}
        {showComments && (
          <div className="px-1 mt-3">
            <CommentSection
              postId={post.id}
              currentUserId={currentUserId}
              initialCount={commentCount}
              onCountChange={setCommentCount}
            />
          </div>
        )}

        {/* ── Divider ── */}
        <div className="mt-3 h-px" style={{ background: "rgba(255,255,255,0.05)" }} />
      </article>

      {/* ── Gift modal ── */}
      {showGiftModal && (
        <GiftModalWrapper
          post={{ ...post, creator: { userId: creator.userId } }}
          onClose={() => setShowGiftModal(false)}
          onGiftSent={handleGiftSent}
        />
      )}

      {/* ── Fullscreen ── */}
      {isFullscreen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: "rgba(0,0,0,0.95)" }}
          onClick={() => setIsFullscreen(false)}
        >
          <img
            src={post.mediaUrl ?? ""}
            alt=""
            className="max-w-full max-h-full object-contain"
          />
        </div>
      )}

      <style>{`
        @keyframes floatUp {
          0%   { transform: translate(-50%, 0)   scale(1);   opacity: 1; }
          100% { transform: translate(-50%, -80px) scale(1.3); opacity: 0; }
        }
      `}</style>
    </>
  );
}

// ─── Gift modal wrapper ───────────────────────────────────────────────────────
function GiftModalWrapper({ post, onClose, onGiftSent }: {
  post:       any;
  onClose:    () => void;
  onGiftSent: (icon: string) => void;
}) {
  return <GiftModal post={post} onClose={onClose} onGiftSent={onGiftSent} />;
}