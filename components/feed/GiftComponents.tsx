"use client";

// ─────────────────────────────────────────────────────────────────────────────
// FILE 1: Updated GiftModal — drop-in replacement for the existing GiftModal
// in your feed component. Key changes:
//   - Re-fetches inventory after each successful send (fixes stale quantity)
//   - Uses response.remainingQuantity to update state precisely
//   - Passes inventoryId correctly (always the integer PK)
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

const V      = "#7c3aed";
const P      = "#ef3976";
const GRAD   = `linear-gradient(135deg, ${V}, ${P})`;
const CARD   = "#1a1635";
const BORDER = "rgba(124,58,237,0.18)";
const TEXT   = "#f0eaff";
const MUTED  = "rgba(240,234,255,0.45)";

type Rarity = "common" | "rare" | "epic" | "legendary";

const RARITY_CONFIG: Record<Rarity, { color: string; bg: string; border: string }> = {
  common:    { color: "#94a3b8", bg: "rgba(148,163,184,0.08)", border: "rgba(148,163,184,0.2)"  },
  rare:      { color: "#38bdf8", bg: "rgba(56,189,248,0.08)",  border: "rgba(56,189,248,0.25)"  },
  epic:      { color: "#a78bfa", bg: "rgba(124,58,237,0.1)",   border: "rgba(124,58,237,0.3)"   },
  legendary: { color: "#fbbf24", bg: "rgba(251,191,36,0.08)",  border: "rgba(251,191,36,0.28)"  },
};

interface GiftItem {
  id:          string;   // itemId (string) — for display only
  inventoryId: number;   // serial PK from user_inventory.id — sent to API
  name:        string;
  icon:        string;
  quantity:    number;
  rarity:      Rarity;
}

export function GiftModal({ post, onClose, onGiftSent }: {
  post: any;
  onClose: () => void;
  onGiftSent?: (icon: string) => void;
}) {
  const router = useRouter();
  const [tab,      setTab]      = useState<"inventory" | "shop">("inventory");
  const [gifts,    setGifts]    = useState<GiftItem[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(false);
  const [sending,  setSending]  = useState<number | null>(null); // tracks inventoryId
  const [justSent, setJustSent] = useState<number | null>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", handler); document.body.style.overflow = ""; };
  }, [onClose]);

  // Fetch gift inventory — called on mount and after each send
  const fetchGifts = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const res  = await fetch("/api/shop/inventory");
      const data = await res.json();
      const items = (data.items ?? []).filter((i: any) => i.type === "gift" && i.quantity > 0);
      setGifts(items.map((i: any) => ({
        id:          String(i.itemId),
        inventoryId: Number(i.inventoryId), // ← always the integer PK
        name:        i.name,
        icon:        i.icon,
        quantity:    i.quantity,
        rarity:      i.rarity as Rarity,
      })));
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchGifts(); }, [fetchGifts]);

  const handleSend = async (gift: GiftItem) => {
    if (gift.quantity < 1 || sending !== null) return;
    setSending(gift.inventoryId);
    try {
      const res = await fetch("/api/gift/send", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          inventoryId: gift.inventoryId,               // integer PK — always correct
          recipientId: post.creator?.userId ?? post.creatorUserId,
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

      setJustSent(gift.inventoryId);
      onGiftSent?.(gift.icon);

      // Update quantity locally — remove card if used up
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

  const availableGifts = gifts.filter((g) => g.quantity > 0);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(12px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="w-full sm:max-w-sm flex flex-col overflow-hidden"
        style={{
          background:   CARD,
          border:       `1px solid ${BORDER}`,
          borderRadius: "28px 28px 0 0",
          boxShadow:    "0 -8px 40px rgba(0,0,0,0.5)",
          maxHeight:    "85vh",
          animation:    "slideUp .3s cubic-bezier(.32,.72,0,1)",
        }}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-0 flex-shrink-0">
          <div className="w-10 h-1 rounded-full" style={{ background: "rgba(255,255,255,0.15)" }} />
        </div>

        {/* Header */}
        <div
          className="flex items-center justify-between px-5 pt-3 pb-3 border-b flex-shrink-0"
          style={{ borderColor: BORDER }}
        >
          <div>
            <p className="text-[15px] font-black" style={{ color: TEXT }}>Send a Gift 🎁</p>
            <p className="text-[11px] mt-0.5" style={{ color: MUTED }}>
              to {post.creator?.name ?? post.creatorName ?? "Creator"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="size-8 rounded-xl flex items-center justify-center"
            style={{ background: "rgba(255,255,255,0.05)", color: MUTED }}
          >✕</button>
        </div>

        {/* Tabs */}
        <div className="flex border-b flex-shrink-0" style={{ borderColor: BORDER }}>
          {(["inventory", "shop"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className="flex-1 py-3 text-[12px] font-black border-b-2 transition-all"
              style={tab === t
                ? { color: TEXT, borderColor: V, background: "rgba(124,58,237,0.05)" }
                : { color: MUTED, borderColor: "transparent" }}
            >
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
                <button
                  onClick={fetchGifts}
                  className="px-4 py-2 rounded-xl text-[12px] font-black text-white"
                  style={{ background: GRAD }}
                >Retry</button>
              </div>
            ) : availableGifts.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-10 text-center">
                <span className="text-4xl">🎁</span>
                <p className="text-[14px] font-black" style={{ color: TEXT }}>No gifts in your inventory</p>
                <p className="text-[12px]" style={{ color: MUTED }}>Buy gifts from the shop to send to creators</p>
                <button
                  onClick={() => setTab("shop")}
                  className="mt-1 px-5 py-2.5 rounded-xl text-[12px] font-black text-white"
                  style={{ background: GRAD }}
                >Browse Shop</button>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-3">
                {availableGifts.map((g) => {
                  const rc     = RARITY_CONFIG[g.rarity] ?? RARITY_CONFIG.common;
                  const isSent = justSent === g.inventoryId;
                  const isBusy = sending  === g.inventoryId;
                  return (
                    <button
                      key={g.inventoryId}
                      onClick={() => handleSend(g)}
                      disabled={!!sending}
                      className="flex flex-col items-center gap-2 rounded-[16px] border p-3 transition-all active:scale-95"
                      style={{
                        background:  isSent ? "rgba(34,197,94,0.1)" : rc.bg,
                        borderColor: isSent ? "rgba(34,197,94,0.4)" : rc.border,
                        cursor:      sending !== null ? "not-allowed" : "pointer",
                        opacity:     sending !== null && !isBusy ? 0.5 : 1,
                      }}
                    >
                      <span className="text-[28px]">
                        {isSent ? "✅" : isBusy ? "⏳" : g.icon}
                      </span>
                      <div className="text-center">
                        <p className="text-[10px] font-black" style={{ color: isSent ? "#4ade80" : TEXT }}>
                          {isSent ? "Sent!" : g.name}
                        </p>
                        <p className="text-[9px] font-bold mt-0.5" style={{ color: rc.color }}>
                          ×{g.quantity}
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
                Browse gifts, mystery boxes and more in the Fan Shop
              </p>
              <button
                onClick={() => { onClose(); router.push("/dashboard/user/shop"); }}
                className="px-6 py-3 rounded-xl text-[13px] font-black text-white"
                style={{ background: GRAD, boxShadow: "0 6px 20px rgba(124,58,237,0.4)" }}
              >
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


// ─────────────────────────────────────────────────────────────────────────────
// FILE 2: PostGiftOverlay — shows a gift icon button above the gift button
// on a post. Clicking it opens a modal showing all gifts sent to that post.
//
// Usage in your PostCard / feed component:
//   <PostGiftOverlay postId={post.id} onGiftClick={() => setShowGiftModal(true)} />
// ─────────────────────────────────────────────────────────────────────────────

interface PostGift {
  itemId:  string;
  icon:    string;
  name:    string;
  rarity:  string;
  count:   number;
  senders: string[];
}

const RARITY_COLORS: Record<string, string> = {
  common:    "#94a3b8",
  rare:      "#38bdf8",
  epic:      "#a78bfa",
  legendary: "#fbbf24",
};

export function PostGiftOverlay({ postId, initialTotal = 0 }: {
  postId:       string;
  initialTotal?: number;
}) {
  const [gifts,      setGifts]      = useState<PostGift[]>([]);
  const [total,      setTotal]      = useState(initialTotal);
  const [showModal,  setShowModal]  = useState(false);
  const [loading,    setLoading]    = useState(false);

  // Load on first open, not on mount — avoids unnecessary requests
  const loadGifts = useCallback(async () => {
    if (loading) return;
    setLoading(true);
    try {
      const res  = await fetch(`/api/gift/post/${postId}`);
      const data = await res.json();
      setGifts(data.gifts ?? []);
      setTotal(data.totalGifts ?? 0);
    } catch {}
    finally { setLoading(false); }
  }, [postId, loading]);

  const handleOpen = () => {
    setShowModal(true);
    loadGifts();
  };

  if (total === 0 && gifts.length === 0) return null;

  // Show up to 3 gift icons stacked as the trigger button
  const preview = gifts.slice(0, 3);

  return (
    <>
      {/* Gift icon trigger — sits above the gift button in the post actions */}
      <button
        onClick={handleOpen}
        className="flex items-center gap-1.5 rounded-full border px-2.5 py-1 transition-all hover:opacity-80 active:scale-95"
        style={{
          background:  "rgba(124,58,237,0.1)",
          borderColor: BORDER,
        }}
      >
        {/* Stacked gift icons */}
        <div className="flex -space-x-1">
          {preview.map((g) => (
            <span
              key={g.itemId}
              className="text-[14px] leading-none"
              title={`${g.count}× ${g.name}`}
            >
              {g.icon}
            </span>
          ))}
          {gifts.length > 3 && (
            <span className="text-[10px] font-black ml-1.5" style={{ color: MUTED }}>
              +{gifts.length - 3}
            </span>
          )}
        </div>
        {total > 0 && (
          <span className="text-[10px] font-black" style={{ color: TEXT }}>
            {total}
          </span>
        )}
      </button>

      {/* Gift gallery modal */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(12px)" }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false); }}
        >
          <div
            className="w-full max-w-sm rounded-[24px] border overflow-hidden flex flex-col"
            style={{
              background:  CARD,
              borderColor: BORDER,
              boxShadow:   "0 24px 60px rgba(0,0,0,0.6)",
              maxHeight:   "80vh",
              animation:   "popIn 0.25s cubic-bezier(0.175,0.885,0.32,1.275)",
            }}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between px-5 py-4 border-b flex-shrink-0"
              style={{ borderColor: BORDER }}
            >
              <div>
                <p className="text-[15px] font-black" style={{ color: TEXT }}>Gifts on this post 🎁</p>
                <p className="text-[11px] mt-0.5" style={{ color: MUTED }}>
                  {total} gift{total !== 1 ? "s" : ""} sent
                </p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="size-8 rounded-xl flex items-center justify-center"
                style={{ background: "rgba(255,255,255,0.05)", color: MUTED }}
              >✕</button>
            </div>

            {/* Gift list */}
            <div className="flex-1 overflow-y-auto p-4">
              {loading ? (
                <div className="flex flex-col gap-3">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-14 rounded-xl animate-pulse"
                      style={{ background: "rgba(124,58,237,0.08)" }} />
                  ))}
                </div>
              ) : gifts.length === 0 ? (
                <div className="flex flex-col items-center gap-3 py-10 text-center">
                  <span className="text-4xl">🎁</span>
                  <p className="text-[13px]" style={{ color: MUTED }}>No gifts yet</p>
                </div>
              ) : (
                <div className="flex flex-col gap-2.5">
                  {gifts.map((g) => {
                    const color = RARITY_COLORS[g.rarity] ?? "#94a3b8";
                    return (
                      <div
                        key={g.itemId}
                        className="flex items-center gap-3 rounded-[14px] border px-4 py-3"
                        style={{ background: `${color}0d`, borderColor: `${color}30` }}
                      >
                        <span className="text-[24px] flex-shrink-0">{g.icon}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] font-black" style={{ color: TEXT }}>{g.name}</p>
                          <p className="text-[10px] mt-0.5" style={{ color: MUTED }}>
                            {g.senders.length} fan{g.senders.length !== 1 ? "s" : ""} gifted this
                          </p>
                        </div>
                        {/* Count badge */}
                        <div
                          className="flex-shrink-0 rounded-full px-2.5 py-1 text-[11px] font-black"
                          style={{ background: `${color}20`, color }}
                        >
                          ×{g.count}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
          <style>{`@keyframes popIn{from{transform:scale(0.92);opacity:0}to{transform:scale(1);opacity:1}}`}</style>
        </div>
      )}
    </>
  );
}