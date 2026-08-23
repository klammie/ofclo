"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { PostGiftOverlay } from "./GiftComponents";

// ─── Theme ────────────────────────────────────────────────────────────────────
const V      = "#7c3aed";
const P      = "#ef3976";
const GRAD   = `linear-gradient(135deg, ${V}, ${P})`;
const CARD   = "#1a1635";
const SURF   = "#13112b";
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
  return PLACEHOLDER_GRADS[id.split("").reduce((a, c) => a + c.charCodeAt(0), 0) % PLACEHOLDER_GRADS.length];
}

function fmt(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `${(n / 1_000).toFixed(1)}k`;
  return String(n);
}

function relTime(date: Date): string {
  const s = Math.floor((Date.now() - date.getTime()) / 1000);
  if (s < 60)    return "just now";
  if (s < 3600)  return `${Math.floor(s / 60)}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  if (s < 604800) return `${Math.floor(s / 86400)}d`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// ─── Rarity ───────────────────────────────────────────────────────────────────
type Rarity = "common" | "rare" | "epic" | "legendary";
const RARITY_CONFIG: Record<Rarity, { color: string; bg: string; border: string }> = {
  common:    { color: "#94a3b8", bg: "rgba(148,163,184,0.1)",  border: "rgba(148,163,184,0.25)" },
  rare:      { color: "#38bdf8", bg: "rgba(56,189,248,0.1)",   border: "rgba(56,189,248,0.3)"   },
  epic:      { color: "#a78bfa", bg: "rgba(124,58,237,0.12)",  border: "rgba(124,58,237,0.35)"  },
  legendary: { color: "#fbbf24", bg: "rgba(251,191,36,0.1)",   border: "rgba(251,191,36,0.35)"  },
};

// ─── Gift modal ───────────────────────────────────────────────────────────────
interface GiftItem {
  id:           string;
  name:         string;
  icon:         string;
  quantity:     number;
  rarity:       Rarity;
  inventoryId?: number;
}

function GiftModal({ post, onClose, onGiftSent }: {
  post: any; onClose: () => void; onGiftSent?: (emoji: string) => void;
}) {
  const router = useRouter();
  const [tab,      setTab]      = useState<"inventory" | "shop">("inventory");
  const [gifts,    setGifts]    = useState<GiftItem[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(false);
  const [sending,  setSending]  = useState<string | null>(null);
  const [justSent, setJustSent] = useState<string | null>(null);

  // Close on Escape + lock body scroll
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", handler); document.body.style.overflow = ""; };
  }, [onClose]);

  useEffect(() => {
    fetch("/api/shop/inventory")
      .then((r) => r.json())
      .then((data) => {
        const items = (data.items ?? []).filter((i: any) => i.type === "gift");
        setGifts(items.map((i: any) => ({
          id:          String(i.itemId),      // string — for display only
          inventoryId: Number(i.inventoryId), // integer PK — sent to API
          name:        i.name,
          icon:        i.icon,
          quantity:    i.quantity,
          rarity:      i.rarity as Rarity,
        })));
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  const handleSend = async (gift: GiftItem) => {
  if (gift.quantity < 1 || sending) return;
  setSending(gift.inventoryId);
  try {
    const res = await fetch("/api/gift/send", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        inventoryId: gift.inventoryId,
        recipientId: post.creator?.id ?? post.creatorUserId ?? post.creator?.userId,
        postId:      post.id,
      }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      console.error("[GiftModal] send failed:", data.error);
      return;
    }

    const data = await res.json();
    const remaining = data.remainingQuantity ?? 0;

    setJustSent(gift.id);
    onGiftSent?.(gift.icon);

    if (remaining <= 0) {
      setGifts((prev) => prev.filter((g) => g.inventoryId !== gift.inventoryId));
    } else {
      setGifts((prev) => prev.map((g) =>
        g.inventoryId === gift.inventoryId ? { ...g, quantity: remaining } : g
      ));
    }

    setTimeout(() => setJustSent(null), 2000);
  } catch (e) {
    console.error("[GiftModal] network error:", e);
  } finally {
    setSending(null);
  }
};

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(12px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>

      <div className="w-full sm:max-w-sm flex flex-col overflow-hidden"
        style={{
          background:    CARD,
          border:        `1px solid ${BORDER}`,
          borderRadius:  "28px 28px 0 0",
          boxShadow:     "0 -8px 40px rgba(0,0,0,0.5)",
          maxHeight:     "85vh",
          animation:     "slideUp .3s cubic-bezier(.32,.72,0,1)",
        }}>

        {/* Handle (mobile) */}
        <div className="flex justify-center pt-3 pb-0 flex-shrink-0">
          <div className="w-10 h-1 rounded-full" style={{ background: "rgba(255,255,255,0.15)" }} />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-3 pb-3 border-b flex-shrink-0"
          style={{ borderColor: BORDER }}>
          <div>
            <p className="text-[15px] font-black" style={{ color: TEXT }}>Send a Gift 🎁</p>
            <p className="text-[11px] mt-0.5" style={{ color: MUTED }}>
              to {post.creator?.name ?? post.creatorName ?? "Creator"}
            </p>
          </div>
          <button onClick={onClose}
            className="size-8 rounded-xl flex items-center justify-center"
            style={{ background: "rgba(255,255,255,0.05)", color: MUTED }}>✕</button>
        </div>

        {/* Tabs */}
        <div className="flex border-b flex-shrink-0" style={{ borderColor: BORDER }}>
          {(["inventory","shop"] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className="flex-1 py-3 text-[12px] font-black border-b-2 transition-all"
              style={tab === t
                ? { color: TEXT, borderColor: V, background: "rgba(124,58,237,0.05)" }
                : { color: MUTED, borderColor: "transparent" }}>
              {t === "inventory" ? "🎒 My Gifts" : "🛍️ Buy More"}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4">
          {tab === "inventory" ? (
            loading ? (
              <div className="grid grid-cols-3 gap-3">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="rounded-[16px] h-24 animate-pulse"
                    style={{ background: "rgba(124,58,237,0.08)" }} />
                ))}
              </div>
            ) : error ? (
              <div className="flex flex-col items-center gap-3 py-10 text-center">
                <span className="text-4xl">⚠️</span>
                <p className="text-[14px] font-black" style={{ color: TEXT }}>Couldn't load your inventory</p>
                <p className="text-[12px]" style={{ color: MUTED }}>Please try again in a moment</p>
              </div>
            ) : gifts.filter((g) => g.quantity > 0).length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-10 text-center">
                <span className="text-4xl">🎁</span>
                <p className="text-[14px] font-black" style={{ color: TEXT }}>No gifts yet</p>
                <p className="text-[12px]" style={{ color: MUTED }}>Buy gifts from the shop to send to creators</p>
                <button onClick={() => setTab("shop")}
                  className="mt-1 px-5 py-2.5 rounded-xl text-[12px] font-black text-white"
                  style={{ background: GRAD }}>Browse Shop</button>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-3">
                {gifts.filter((g) => g.quantity > 0).map((g) => {
                  const rc       = RARITY_CONFIG[g.rarity];
                  const isSent   = justSent === g.id;
                  const isBusy   = sending  === g.id;
                  const outStock = g.quantity < 1;
                  return (
                    <button key={g.id}
                      onClick={() => handleSend(g)}
                      disabled={outStock || !!sending}
                      className="flex flex-col items-center gap-2 rounded-[16px] border p-3 transition-all active:scale-95"
                      style={{
                        background:  isSent ? "rgba(34,197,94,0.1)" : outStock ? "rgba(255,255,255,0.02)" : rc.bg,
                        borderColor: isSent ? "rgba(34,197,94,0.4)" : outStock ? "rgba(255,255,255,0.06)" : rc.border,
                        opacity:     outStock ? 0.4 : 1,
                        cursor:      outStock || !!sending ? "not-allowed" : "pointer",
                      }}>
                      <span className="text-[28px]">
                        {isSent ? "✅" : isBusy ? "⏳" : g.icon}
                      </span>
                      <div className="text-center">
                        <p className="text-[10px] font-black"
                          style={{ color: isSent ? "#4ade80" : TEXT }}>
                          {isSent ? "Sent!" : g.name}
                        </p>
                        <p className="text-[9px] font-bold mt-0.5"
                          style={{ color: outStock ? MUTED : rc.color }}>
                          {outStock ? "Out of stock" : `×${g.quantity}`}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )
          ) : (
            <div className="flex flex-col items-center gap-4 py-8 text-center">
              <span className="text-5xl">🛍️</span>
              <p className="text-[14px] font-black" style={{ color: TEXT }}>Get gifts from the Shop</p>
              <p className="text-[12px]" style={{ color: MUTED }}>
                Browse gifts, mystery boxes, and more in the Fan Shop
              </p>
              <button onClick={() => { onClose(); router.push("/dashboard/user/shop"); }}
                className="px-6 py-3 rounded-xl text-[13px] font-black text-white"
                style={{ background: GRAD, boxShadow: "0 6px 20px rgba(124,58,237,0.4)" }}>
                Open Fan Shop →
              </button>
            </div>
          )}
        </div>
      </div>
      <style>{`@keyframes slideUp{from{transform:translateY(100%);opacity:0}to{transform:translateY(0);opacity:1}}`}</style>
    </div>
  );
}

// ─── Comment modal (Instagram style — slides up from bottom) ─────────────────
interface Comment {
  id:        string;
  content:   string;
  createdAt: string;
  userId:    string;
  isOwn:     boolean;
  user:      { name: string; username: string; avatarUrl: string | null };
}

function CommentModal({ post, currentUserId, onClose, onCommentAdded }: {
  post:           any;
  currentUserId:  string;
  onClose:        () => void;
  onCommentAdded: () => void;
}) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [input,    setInput]    = useState("");
  const [posting,  setPosting]  = useState(false);
  const inputRef  = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const caption  = post.description ?? post.caption ?? post.content ?? null;
  const creatorName     = post.creator?.name     ?? post.creatorName     ?? "Creator";
  const creatorUsername = post.creator?.username ?? post.creatorUsername ?? "";
  const avatarUrl: string | null =
    post.creator?.avatarUrl ?? post.creator?.image ?? post.creatorAvatarUrl ?? null;

  // Lock body scroll + close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handler);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  // Fetch comments
  useEffect(() => {
    fetch(`/api/posts/comments?postId=${post.id}`)
      .then((r) => r.json())
      .then((d) => setComments(d.comments ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
    // Focus input after mount
    setTimeout(() => inputRef.current?.focus(), 400);
  }, [post.id]);

  const postComment = useCallback(async () => {
    if (!input.trim() || posting) return;
    setPosting(true);
    try {
      const res  = await fetch("/api/posts/comments", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ postId: post.id, content: input.trim() }),
      });
      const data = await res.json();
      if (res.ok && data.comment) {
        setComments((prev) => [data.comment, ...prev]);
        setInput("");
        onCommentAdded();
        // Scroll to top to see new comment
        scrollRef.current?.scrollTo({ top: 0, behavior: "smooth" });
      }
    } catch {}
    finally { setPosting(false); }
  }, [input, posting, post.id, onCommentAdded]);

  return (
    <div className="fixed inset-0 z-50 flex items-end lg:items-center justify-center"
      style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>

      <div
  className="w-full sm:max-w-lg flex flex-col overflow-hidden"
  style={{
    background: "#1a1635",
    borderRadius: "24px 24px 0 0",
    border: "1px solid rgba(124,58,237,0.18)",
    borderBottom: "none",
    boxShadow: "0 -8px 40px rgba(0,0,0,0.5)",
    maxHeight: "90vh",
    animation: "cmSlideUp .32s cubic-bezier(.32,.72,0,1)",
  }}
  // Fully rounded on large screens
  ref={(el) => {
    if (el && window.innerWidth >= 1024) {
      el.style.borderRadius = "24px";
      el.style.borderBottom = "1px solid rgba(124,58,237,0.18)";
    }
  }}
>
  {/* Drag handle */}
  <div className="flex justify-center pt-3 pb-2 flex-shrink-0">
    <div
      className="w-10 h-1 rounded-full"
      style={{ background: "rgba(255,255,255,0.15)" }}
    />
  </div>


        {/* Header */}
        <div className="flex items-center justify-between px-4 pb-3 border-b flex-shrink-0"
          style={{ borderColor: "rgba(124,58,237,0.12)" }}>
          <h3 className="text-[15px] font-black" style={{ color: "#f0eaff" }}>Comments</h3>
          <button onClick={onClose}
            className="size-8 rounded-xl flex items-center justify-center text-[13px]"
            style={{ background: "rgba(255,255,255,0.06)", color: "rgba(240,234,255,0.5)" }}>
            ✕
          </button>
        </div>

        {/* Scrollable comments */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-4 min-h-0">

          {/* Caption as first "comment" */}
          {caption && (
            <div className="flex gap-3 pb-3 border-b" style={{ borderColor: "rgba(124,58,237,0.08)" }}>
              <div className="size-8 rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center font-black text-white text-[11px]"
                style={{ background: avatarUrl ? "transparent" : placeholderGrad(post.id), border: "1.5px solid rgba(124,58,237,0.3)" }}>
                {avatarUrl
                  ? <img src={avatarUrl} className="size-full object-cover" alt="" />
                  : creatorName.charAt(0).toUpperCase()
                }
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] leading-relaxed" style={{ color: "#f0eaff" }}>
                  <span className="font-black mr-1.5">{creatorName}</span>
                  {caption}
                </p>
                <p className="text-[10px] mt-1" style={{ color: "rgba(240,234,255,0.35)" }}>
                  {relTime(new Date(post.createdAt))}
                </p>
              </div>
            </div>
          )}

          {/* Loading skeleton */}
          {loading && (
            <div className="flex flex-col gap-4 animate-pulse">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex gap-3">
                  <div className="size-8 rounded-full flex-shrink-0" style={{ background: "rgba(124,58,237,0.1)" }} />
                  <div className="flex flex-col gap-1.5 flex-1">
                    <div className="h-2.5 w-24 rounded-full" style={{ background: "rgba(124,58,237,0.1)" }} />
                    <div className="h-2 w-40 rounded-full" style={{ background: "rgba(124,58,237,0.07)" }} />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Empty state */}
          {!loading && comments.length === 0 && (
            <div className="flex flex-col items-center gap-3 py-10 text-center">
              <span className="text-3xl">💬</span>
              <p className="text-[13px] font-black" style={{ color: "#f0eaff" }}>No comments yet</p>
              <p className="text-[11px]" style={{ color: "rgba(240,234,255,0.45)" }}>Be the first to comment</p>
            </div>
          )}

          {/* Comments list */}
          {!loading && comments.map((c) => (
            <div key={c.id} className="flex gap-3">
              <div className="size-8 rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center font-black text-white text-[10px]"
                style={{ background: c.user.avatarUrl ? "transparent" : placeholderGrad(c.userId), border: "1.5px solid rgba(124,58,237,0.2)" }}>
                {c.user.avatarUrl
                  ? <img src={c.user.avatarUrl} className="size-full object-cover" alt="" />
                  : c.user.name.charAt(0).toUpperCase()
                }
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] leading-relaxed" style={{ color: "#f0eaff" }}>
                  <span className="font-black mr-1.5"
                    style={{ color: c.isOwn ? "#7c3aed" : "#f0eaff" }}>
                    {c.user.username}
                  </span>
                  {c.content}
                </p>
                <p className="text-[10px] mt-0.5" style={{ color: "rgba(240,234,255,0.35)" }}>
                  {relTime(new Date(c.createdAt))}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Comment input */}
        <div className="flex items-center gap-3 px-4 py-3 border-t flex-shrink-0"
          style={{ borderColor: "rgba(124,58,237,0.12)", paddingBottom: "calc(12px + env(safe-area-inset-bottom, 0px))" }}>
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); postComment(); }}}
            placeholder="Add a comment…"
            maxLength={500}
            className="flex-1 bg-transparent outline-none text-[13px]"
            style={{ color: "#f0eaff", fontFamily: "inherit" }}
          />
          <button
            onClick={postComment}
            disabled={!input.trim() || posting}
            className="text-[13px] font-black transition-opacity"
            style={{
              color:   input.trim() ? "#7c3aed" : "rgba(240,234,255,0.25)",
              opacity: posting ? 0.5 : 1,
              background: "none", border: "none", cursor: input.trim() ? "pointer" : "default",
            }}>
            {posting ? "…" : "Post"}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes cmSlideUp {
          from { transform: translateY(100%); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }
      `}</style>
    </div>
  );
}

// ─── Fullscreen media viewer ──────────────────────────────────────────────────
function FullscreenMediaViewer({ post, onClose, onLike }: {
  post: any; onClose: () => void; onLike: (x: number, y: number) => void;
}) {
  const lastTap   = useRef(0);
  const [likeAnim, setLikeAnim] = useState(false);
  const [likePos,  setLikePos]  = useState({ x: 50, y: 50 });
  // scroll-guard: ignore taps where finger moved > 8px
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const didMove    = useRef(false);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handler);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  function handleTouchStart(e: React.TouchEvent) {
    touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    didMove.current = false;
  }
  function handleTouchMove(e: React.TouchEvent) {
    if (!touchStart.current) return;
    const dx = Math.abs(e.touches[0].clientX - touchStart.current.x);
    const dy = Math.abs(e.touches[0].clientY - touchStart.current.y);
    if (dx > 8 || dy > 8) didMove.current = true;
  }

  function handleTap(e: React.MouseEvent | React.TouchEvent) {
    if ("changedTouches" in e && didMove.current) { didMove.current = false; return; }
    const now  = Date.now();
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    let cx: number, cy: number;
    if ("changedTouches" in e && e.changedTouches.length > 0) {
      cx = e.changedTouches[0].clientX; cy = e.changedTouches[0].clientY;
    } else if ("clientX" in e) {
      cx = e.clientX; cy = e.clientY;
    } else { return; }
    const x = ((cx - rect.left) / rect.width)  * 100;
    const y = ((cy - rect.top)  / rect.height) * 100;

    if (now - lastTap.current < 300) {
      lastTap.current = 0;
      setLikePos({ x, y });
      setLikeAnim(true);
      setTimeout(() => setLikeAnim(false), 900);
      onLike(x, y);
    } else {
      lastTap.current = now;
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center"
      style={{ background: "rgba(0,0,0,0.96)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>

      <button onClick={onClose}
        className="absolute top-4 right-4 z-20 size-9 rounded-full flex items-center justify-center transition-all hover:scale-105"
        style={{ background: "rgba(255,255,255,0.1)", color: "#fff", backdropFilter: "blur(4px)" }}>
        ✕
      </button>

      {/* Media — double-tap-to-like zone */}
      <div className="relative w-full h-full flex items-center justify-center p-4 sm:p-10"
        onClick={handleTap}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTap}>

        {post.mediaType === "video" ? (
          <video src={post.mediaUrl} poster={post.thumbnailUrl ?? undefined} controls autoPlay
            className="max-w-full max-h-full" style={{ objectFit: "contain" }}
            controlsList="nodownload" onContextMenu={(e) => e.preventDefault()}
            onClick={(e) => e.stopPropagation()} />
        ) : (
          <img src={post.mediaUrl} alt={post.title ?? "Post"}
            className="max-w-full max-h-full select-none" style={{ objectFit: "contain" }}
            onContextMenu={(e) => e.preventDefault()} />
        )}

        {/* Double-tap heart burst */}
        {likeAnim && (
          <div className="absolute inset-0 pointer-events-none">
            <div style={{
              position: "absolute", left: `${likePos.x}%`, top: `${likePos.y}%`,
              transform: "translate(-50%,-50%)", fontSize: 80, userSelect: "none",
              animation: "fsHeartBurst 0.9s cubic-bezier(0.17,0.89,0.32,1.28) forwards",
              filter: "drop-shadow(0 0 20px rgba(239,57,118,0.8))",
            }}>❤️</div>
          </div>
        )}

        {/* "Double tap to like" hint — fades after 2s */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 pointer-events-none"
          style={{ animation: "fadeHint 2s ease-out 0.5s forwards", opacity: 0 }}>
          <p className="text-[12px] font-bold text-white/60 bg-black/30 rounded-full px-3 py-1.5 backdrop-blur-sm">
            Double tap to like
          </p>
        </div>
      </div>

      <style>{`
        @keyframes fsHeartBurst {
          0%   { transform: translate(-50%,-50%) scale(0);   opacity: 0; }
          15%  { transform: translate(-50%,-50%) scale(1.4); opacity: 1; }
          30%  { transform: translate(-50%,-50%) scale(1.0); opacity: 1; }
          50%  { transform: translate(-50%,-50%) scale(1.2); opacity: 1; }
          80%  { transform: translate(-50%,-50%) scale(1.0); opacity: 0.8; }
          100% { transform: translate(-50%,-50%) scale(1.1); opacity: 0; }
        }
        @keyframes fadeHint {
          0%   { opacity: 0; }
          20%  { opacity: 1; }
          80%  { opacity: 1; }
          100% { opacity: 0; }
        }
      `}</style>
    </div>
  );
}

// ─── POST CARD — Instagram style ──────────────────────────────────────────────
export function PostCard({ post, currentUserId, onLikeUpdate }) {
  const [isLiking,          setIsLiking]         = useState(false);
  const [showComments,      setShowComments]      = useState(false);
  const [localCommentCount, setLocalCommentCount] = useState(post.commentCount);
  const [isBookmarking,     setIsBookmarking]     = useState(false);
  const [bookmarked,        setBookmarked]        = useState<boolean>(Boolean(post.isBookmarked));
  const [showGiftModal,     setShowGiftModal]     = useState(false);
  const [showFullscreen,    setShowFullscreen]    = useState(false);
  const [captionExpanded,   setCaptionExpanded]   = useState(false);

  // ── Double-tap to like ───────────────────────────────────────────────────────
  const [likeAnim,    setLikeAnim]    = useState(false);   // big heart burst
  const [likePos,     setLikePos]     = useState({ x: 50, y: 50 }); // % position
  const [heartBounce, setHeartBounce] = useState(false);   // action bar heart bounce
  const tapTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTap  = useRef<number>(0);
  const touchStartPos = useRef<{ x: number; y: number } | null>(null);
  const didScroll      = useRef(false);

  // ── Gift sent animation ───────────────────────────────────────────────────────
  const [giftAnim,     setGiftAnim]     = useState<string | null>(null); // emoji
  const [giftAnimPos,  setGiftAnimPos]  = useState({ x: 50, y: 80 });

  useEffect(() => { setBookmarked(Boolean(post.isBookmarked)); }, [post.isBookmarked]);

  // Resolve fields
  const avatarUrl: string | null =
    post.creator?.avatarUrl ?? post.creator?.avatar_url ??
    post.creator?.image     ?? post.creatorAvatarUrl     ?? null;
  const creatorName     = post.creator?.name     ?? post.creatorName     ?? "Creator";
  const creatorUsername = post.creator?.username ?? post.creatorUsername ?? "";
  const caption         = post.description ?? post.caption ?? post.content ?? null;
  const isLong          = (caption?.length ?? 0) > 125;
  const timeAgo         = relTime(new Date(post.createdAt));

  // ── Handlers ────────────────────────────────────────────────────────────────
  async function handleLike(triggerAnim = false, x = 50, y = 50) {
    if (isLiking) return;
    setIsLiking(true);
    if (triggerAnim) {
      setLikePos({ x, y });
      setLikeAnim(true);
      setHeartBounce(true);
      setTimeout(() => setLikeAnim(false),    900);
      setTimeout(() => setHeartBounce(false), 400);
    }
    try {
      const res  = await fetch(`/api/posts/${post.id}/like`, { method: "POST" });
      const data = await res.json();
      onLikeUpdate(post.id, data.liked, data.liked ? post.likeCount + 1 : post.likeCount - 1);
    } catch {}
    finally { setIsLiking(false); }
  }

  // Double-tap detection on the media area
  // Track touch start position to detect scrolling vs tapping
  function handleTouchStart(e: React.TouchEvent<HTMLDivElement>) {
    const t = e.touches[0];
    touchStartPos.current = { x: t.clientX, y: t.clientY };
    didScroll.current = false;
  }

  function handleTouchMove(e: React.TouchEvent<HTMLDivElement>) {
    if (!touchStartPos.current) return;
    const t = e.touches[0];
    const dx = Math.abs(t.clientX - touchStartPos.current.x);
    const dy = Math.abs(t.clientY - touchStartPos.current.y);
    // If the finger moved more than ~8px in any direction, treat as a scroll/swipe, not a tap
    if (dx > 8 || dy > 8) didScroll.current = true;
  }

  function handleMediaTap(e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) {
    // Ignore taps that were actually scrolls
    if ("changedTouches" in e && didScroll.current) {
      didScroll.current = false;
      touchStartPos.current = null;
      return;
    }
    touchStartPos.current = null;
    if (post.isLocked) return;

    const now = Date.now();
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();

    let clientX: number, clientY: number;
    if ("touches" in e && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else if ("clientX" in e) {
      clientX = e.clientX;
      clientY = e.clientY;
    } else {
      clientX = rect.left + rect.width / 2;
      clientY = rect.top  + rect.height / 2;
    }

    const x = ((clientX - rect.left) / rect.width)  * 100;
    const y = ((clientY - rect.top)  / rect.height) * 100;

    // Single tap → open fullscreen immediately (no delay)
    // Double-tap-to-like now lives INSIDE the fullscreen viewer
    if (!post.isLocked) setShowFullscreen(true);
  }

  // Gift sent animation trigger (called from GiftModal)
  function handleGiftSent(emoji: string) {
    setGiftAnim(emoji);
    setGiftAnimPos({ x: 50, y: 60 });
    setTimeout(() => setGiftAnim(null), 1800);
  }

  async function handleBookmark() {
    if (isBookmarking) return;
    setIsBookmarking(true);
    try {
      const res  = await fetch("/api/bookmarks/toggle", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId: post.id }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setBookmarked(data.bookmarked);
      toast.custom((t) => (
        <div className={`flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl transition-all duration-300 ${t.visible ? "opacity-100" : "opacity-0"}`}
          style={{ background: data.bookmarked ? GRAD : CARD, border: `1px solid ${BORDER}`, color: TEXT, fontFamily: "'Be Vietnam Pro', sans-serif", minWidth: 180 }}>
          <span className="text-[18px]">{data.bookmarked ? "🔖" : "✕"}</span>
          <p className="text-[13px] font-black">{data.bookmarked ? "Post bookmarked!" : "Bookmark removed"}</p>
        </div>
      ), { duration: 2500, position: "bottom-center" });
    } catch {
      toast.custom((t) => (
        <div className={`flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl ${t.visible ? "opacity-100" : "opacity-0"}`}
          style={{ background: CARD, border: "1px solid rgba(239,57,118,0.4)", color: TEXT, fontFamily: "'Be Vietnam Pro', sans-serif" }}>
          <span>⚠️</span>
          <p className="text-[13px] font-black" style={{ color: P }}>Failed to update bookmark</p>
        </div>
      ), { duration: 2500, position: "bottom-center" });
    } finally { setIsBookmarking(false); }
  }

  return (
    <>
      <article style={{ fontFamily: "'Be Vietnam Pro', sans-serif" }}>

        {/* ── Creator header ── */}
        <div className="flex items-center gap-3 px-1 py-3">
          <a href={`/dashboard/user/feed/${creatorUsername}`} className="flex-shrink-0">
            <div className="size-9 rounded-full overflow-hidden flex items-center justify-center font-black text-white text-[13px] transition-opacity hover:opacity-80"
              style={{
                background: avatarUrl ? "transparent" : placeholderGrad(post.id),
                border:     `2px solid rgba(124,58,237,0.45)`,
                boxShadow:  "0 0 0 1.5px #0d0d1a",
              }}>
              {avatarUrl
                ? <Image src={avatarUrl} alt={creatorName} width={36} height={36} className="size-full object-cover" />
                : creatorName.charAt(0).toUpperCase()
              }
            </div>
          </a>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <a href={`/dashboard/user/feed/${creatorUsername}`}
                className="text-[13px] font-black hover:underline"
                style={{ color: TEXT }}>
                {creatorName}
              </a>
              <span className="text-[11px]" style={{ color: "rgba(240,234,255,0.2)" }}>·</span>
              <span className="text-[11px]" style={{ color: MUTED }}>{timeAgo}</span>
            </div>
            {creatorUsername && (
              <p className="text-[10px] mt-0.5" style={{ color: "rgba(240,234,255,0.28)" }}>
                @{creatorUsername}
              </p>
            )}
          </div>

          {/* Three-dot */}
          <button className="size-8 flex items-center justify-center rounded-full transition-colors hover:bg-white/5 flex-shrink-0"
            style={{ color: MUTED }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <circle cx="5" cy="12" r="1.5"/>
              <circle cx="12" cy="12" r="1.5"/>
              <circle cx="19" cy="12" r="1.5"/>
            </svg>
          </button>
        </div>

        {/* ── Media — full-width square (Instagram style) ── */}
        <div className="relative w-full overflow-hidden"
          style={{ aspectRatio: post.mediaType === "video" ? "4/5" : "1/1", borderRadius: 12, background: "#0d0d1a" }}
          onClick={handleMediaTap}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleMediaTap}
        >

          {post.isLocked ? (
            <>
              {post.thumbnailUrl && (
                <img src={post.thumbnailUrl} className="absolute inset-0 w-full h-full object-cover"
                  style={{ filter: "blur(20px)", transform: "scale(1.1)", opacity: 0.35 }} alt="" />
              )}
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 z-10">
                <div className="size-14 rounded-2xl flex items-center justify-center"
                  style={{ background: "rgba(239,57,118,0.15)", border: "1px solid rgba(239,57,118,0.4)" }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
                    stroke="#ef3976" strokeWidth="2.5" strokeLinecap="round">
                    <rect x="3" y="11" width="18" height="11" rx="2"/>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                </div>
                <p className="text-[13px] font-black text-white">Subscribe to unlock</p>
                {post.ppvPrice && (
                  <p className="text-[11px]" style={{ color: MUTED }}>Unlock for ${Number(post.ppvPrice).toFixed(2)}</p>
                )}
              </div>
            </>
          ) : post.mediaType === "video" ? (
            <video src={post.mediaUrl} poster={post.thumbnailUrl ?? undefined}
              controls className="w-full h-full object-cover"
              controlsList="nodownload" onContextMenu={(e) => e.preventDefault()} />
          ) : post.mediaUrl ? (
            <Image src={post.mediaUrl} alt={post.title ?? "Post"} fill className="object-cover" />
          ) : (
            <div className="w-full h-full" style={{ background: placeholderGrad(post.id) }} />
          )}

          {/* ── Double-tap heart burst overlay ── */}
          {likeAnim && (
            <div className="absolute inset-0 pointer-events-none z-20 flex items-center justify-center">
              <div style={{
                position:  "absolute",
                left:      `${likePos.x}%`,
                top:       `${likePos.y}%`,
                transform: "translate(-50%, -50%)",
                animation: "heartBurst 0.9s cubic-bezier(0.17,0.89,0.32,1.28) forwards",
                fontSize:  80,
                filter:    "drop-shadow(0 0 20px rgba(239,57,118,0.8))",
                userSelect: "none",
              }}>❤️</div>
            </div>
          )}

          {/* ── Gift float animation ── */}
          {giftAnim && (
            <div className="absolute inset-0 pointer-events-none z-20">
              <div style={{
                position:  "absolute",
                left:      `${giftAnimPos.x}%`,
                top:       `${giftAnimPos.y}%`,
                transform: "translate(-50%, -50%)",
                animation: "giftFloat 1.8s ease-out forwards",
                fontSize:  48,
                filter:    "drop-shadow(0 0 12px rgba(124,58,237,0.8))",
                userSelect: "none",
              }}>{giftAnim}</div>
            </div>
          )}
        </div>

        {/* ── Actions row — Instagram style ── */}
        <div className="flex items-center px-1 pt-2.5 pb-1" style={{ gap: 2 }}>

          {/* Like */}
          <button onClick={() => handleLike(false)} disabled={isLiking}
            className="p-1.5 rounded-xl active:scale-95"
            style={{
              transform:  heartBounce ? "scale(1.35)" : "scale(1)",
              transition: "transform 0.2s cubic-bezier(0.175,0.885,0.32,1.8)",
            }}>
            <svg width="25" height="25" viewBox="0 0 24 24"
              fill={post.isLiked ? P : "none"}
              stroke={post.isLiked ? P : TEXT}
              strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
            </svg>
          </button>

          {/* Comment */}
          <button onClick={() => setShowComments(!showComments)}
            className="p-1.5 rounded-xl transition-all hover:scale-110 active:scale-95">
            <svg width="25" height="25" viewBox="0 0 24 24" fill="none"
              stroke={showComments ? V : TEXT}
              strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
          </button>

          {/* Gift — only shown to non-owners */}
          {currentUserId !== (post.creator?.userId ?? post.creatorUserId) && (
            <>
            <PostGiftOverlay postId={post.id} initialTotal={post.giftCount ?? 0} />
            <button onClick={() => setShowGiftModal(true)}
              className="p-1.5 rounded-xl transition-all hover:scale-110 active:scale-95">
              <svg width="25" height="25" viewBox="0 0 24 24" fill="none"
                stroke={TEXT} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 12 20 22 4 22 4 12"/>
                <rect x="2" y="7" width="20" height="5"/>
                <line x1="12" y1="22" x2="12" y2="7"/>
                <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/>
                <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/>
              </svg>
            </button>
            </>
          )}

          {/* Bookmark — pushed to right */}
          <button onClick={handleBookmark} disabled={isBookmarking}
            className="ml-auto p-1.5 rounded-xl transition-all hover:scale-110 active:scale-95">
            <svg width="25" height="25" viewBox="0 0 24 24"
              fill={bookmarked ? TEXT : "none"}
              stroke={TEXT} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
            </svg>
          </button>
        </div>

        {/* ── Like count ── */}
        {post.likeCount > 0 && (
          <p className="px-1 text-[13px] font-black" style={{ color: TEXT }}>
            {fmt(post.likeCount)} {post.likeCount === 1 ? "like" : "likes"}
          </p>
        )}

        {/* ── Caption — creator name inline, Instagram style ── */}
        {caption && (
          <div className="px-1 mt-1">
            <p className="text-[13px] leading-relaxed" style={{ color: TEXT }}>
              <a href={`/dashboard/user/feed/${creatorUsername}`}
                className="font-black mr-1.5 hover:underline"
                style={{ color: TEXT }}>
                {creatorName}
              </a>
              {post.isLocked ? (
                <span style={{ color: MUTED }}>🔒 Subscribe to read…</span>
              ) : captionExpanded || !isLong ? (
                caption
              ) : (
                <>
                  {caption.slice(0, 125)}…{" "}
                  <button onClick={() => setCaptionExpanded(true)}
                    className="font-bold"
                    style={{ color: MUTED, background: "none", border: "none", cursor: "pointer" }}>
                    more
                  </button>
                </>
              )}
            </p>
          </div>
        )}

        {/* ── Comment count shortcut ── */}
        {/* ── View comments shortcut ── */}
        {localCommentCount > 0 && (
          <button onClick={() => setShowComments(true)}
            className="px-1 mt-1 text-left"
            style={{ background: "none", border: "none", cursor: "pointer" }}>
            <p className="text-[12px] font-bold" style={{ color: MUTED }}>
              View all {fmt(localCommentCount)} comments
            </p>
          </button>
        )}

        {/* ── Divider ── */}
        <div className="mt-3 h-px" style={{ background: "rgba(255,255,255,0.05)" }} />
      </article>

      {/* Comment modal */}
      {showComments && (
        <CommentModal
          post={post}
          currentUserId={currentUserId}
          onClose={() => setShowComments(false)}
          onCommentAdded={() => setLocalCommentCount((prev) => prev + 1)}
        />
      )}

      {/* Gift modal */}
      {showGiftModal && (
        <GiftModal
          post={post}
          onClose={() => setShowGiftModal(false)}
          onGiftSent={(emoji) => { setShowGiftModal(false); handleGiftSent(emoji); }}
        />
      )}

      {/* Fullscreen media viewer */}
      {showFullscreen && post.mediaUrl && !post.isLocked && (
        <FullscreenMediaViewer post={post} onClose={() => setShowFullscreen(false)}
          onLike={(x, y) => { if (!post.isLiked) handleLike(true, x, y); else { setLikePos({ x, y }); setLikeAnim(true); setHeartBounce(true); setTimeout(() => setLikeAnim(false), 900); setTimeout(() => setHeartBounce(false), 400); } }} />
      )}

      {/* ── Global animation keyframes ── */}
      <style>{`
        @keyframes heartBurst {
          0%   { transform: translate(-50%,-50%) scale(0);   opacity: 0; }
          15%  { transform: translate(-50%,-50%) scale(1.4); opacity: 1; }
          30%  { transform: translate(-50%,-50%) scale(1.0); opacity: 1; }
          50%  { transform: translate(-50%,-50%) scale(1.2); opacity: 1; }
          80%  { transform: translate(-50%,-50%) scale(1.0); opacity: 0.8; }
          100% { transform: translate(-50%,-50%) scale(1.1); opacity: 0; }
        }
        @keyframes giftFloat {
          0%   { transform: translate(-50%,-50%) scale(0.4) rotate(-15deg); opacity: 0; }
          15%  { transform: translate(-50%,-50%) scale(1.2) rotate(8deg);   opacity: 1; }
          35%  { transform: translate(-50%,-50%) scale(1.0) rotate(-4deg);  opacity: 1; }
          70%  { transform: translate(-50%, -120%) scale(0.9) rotate(6deg); opacity: 0.8; }
          100% { transform: translate(-50%, -200%) scale(0.7) rotate(-8deg);opacity: 0; }
        }
      `}</style>
    </>
  );
}