"use client";

import { useState, useEffect, useCallback } from "react";

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
type ItemType = "badge" | "booster_xp" | "booster_coin" | "streak_freeze" | "gift" |
                "mystery_box" | "frame" | "title" | "emote" | "vip_pass" | string;
type Source = "purchased" | "mystery_box" | "fan_pass" | "quest" | string;

interface InventoryItem {
  inventoryId:          number;
  quantity:             number;
  acquiredAt:           string;
  isEquipped:           boolean | null;
  source:               Source | null;
  itemId:               string;
  name:                 string;
  description:          string | null;
  icon:                 string;
  rarity:               Rarity;
  type:                 ItemType;
  coinPrice:            number;
  boosterMultiplier:    number | null;
  boosterDurationHours: number | null;
  boosterActiveUntil:   string | null;
}

// ─── Config ───────────────────────────────────────────────────────────────────
const RARITY_CONFIG: Record<Rarity, { label: string; color: string; bg: string; border: string; glow: string }> = {
  common:    { label: "Common",    color: "#94a3b8", bg: "rgba(148,163,184,0.08)", border: "rgba(148,163,184,0.2)",  glow: "rgba(148,163,184,0)"   },
  rare:      { label: "Rare",      color: "#38bdf8", bg: "rgba(56,189,248,0.08)",  border: "rgba(56,189,248,0.25)",  glow: "rgba(56,189,248,0.2)"  },
  epic:      { label: "Epic",      color: "#a78bfa", bg: "rgba(124,58,237,0.1)",   border: "rgba(124,58,237,0.3)",   glow: "rgba(124,58,237,0.2)"  },
  legendary: { label: "Legendary", color: "#fbbf24", bg: "rgba(251,191,36,0.08)",  border: "rgba(251,191,36,0.28)",  glow: "rgba(251,191,36,0.25)" },
};

const SOURCE_CONFIG: Record<string, { label: string; color: string; icon: string }> = {
  purchased:   { label: "Purchased",   color: "#38bdf8", icon: "💰" },
  mystery_box: { label: "Mystery Box", color: "#a78bfa", icon: "🎲" },
  fan_pass:    { label: "Fan Pass",    color: "#ef3976", icon: "🎟️" },
  quest:       { label: "Quest",       color: "#4ade80", icon: "🎯" },
};

const TYPE_CATEGORIES = [
  { id: "all",           label: "All",       icon: "🎒" },
  { id: "badge",         label: "Badges",    icon: "🏅" },
  { id: "booster_xp",   label: "XP Boost",  icon: "⚡" },
  { id: "booster_coin", label: "Coin Boost", icon: "💰" },
  { id: "streak_freeze",label: "Freezes",   icon: "🛡️" },
  { id: "gift",          label: "Gifts",     icon: "🎁" },
  { id: "frame",         label: "Frames",    icon: "🖼️" },
  { id: "title",         label: "Titles",    icon: "✍️" },
  { id: "emote",         label: "Emotes",    icon: "😄" },
  { id: "mystery_box",  label: "Boxes",     icon: "📦" },
];

function relTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const d = Math.floor(diff / 86400000);
  const h = Math.floor(diff / 3600000);
  const m = Math.floor(diff / 60000);
  if (d > 30) return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
  if (d > 0)  return `${d}d ago`;
  if (h > 0)  return `${h}h ago`;
  if (m > 0)  return `${m}m ago`;
  return "just now";
}

function isBoosterActive(item: InventoryItem): boolean {
  if (!item.boosterActiveUntil) return false;
  return new Date(item.boosterActiveUntil) > new Date();
}

function boosterTimeLeft(until: string): string {
  const ms   = new Date(until).getTime() - Date.now();
  const h    = Math.floor(ms / 3600000);
  const m    = Math.floor((ms % 3600000) / 60000);
  if (h > 0) return `${h}h ${m}m left`;
  return `${m}m left`;
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function Skeleton() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
      {[...Array(8)].map((_, i) => (
        <div key={i} className="rounded-[18px] border h-44 animate-pulse"
          style={{ background: CARD, borderColor: BORDER }} />
      ))}
    </div>
  );
}

// ─── Item card ────────────────────────────────────────────────────────────────
function InventoryCard({
  item, onEquip, onUse, isActing,
}: {
  item:      InventoryItem;
  onEquip:   (id: number, equip: boolean) => void;
  onUse:     (item: InventoryItem) => void;
  isActing:  boolean;
}) {
  const r         = RARITY_CONFIG[item.rarity] ?? RARITY_CONFIG.common;
  const src       = SOURCE_CONFIG[item.source ?? "purchased"] ?? SOURCE_CONFIG.purchased;
  const equipped  = Boolean(item.isEquipped);
  const active    = isBoosterActive(item);
  const isConsumable = ["booster_xp","booster_coin","streak_freeze","gift","mystery_box"].includes(item.type);
  const isEquippable = ["badge","frame","title","emote"].includes(item.type);

  return (
    <div
      className="relative flex flex-col rounded-[18px] border overflow-hidden transition-all duration-200 group"
      style={{
        background:  CARD,
        borderColor: equipped ? r.color : active ? r.border : BORDER,
        boxShadow:   equipped ? `0 0 18px ${r.glow}` : active ? `0 0 10px ${r.glow}` : "none",
      }}
    >
      {/* Top accent for equipped/active */}
      {(equipped || active) && (
        <div className="h-0.5" style={{ background: equipped ? r.color : `linear-gradient(90deg,${r.color},transparent)` }} />
      )}

      {/* Rarity + source badges */}
      <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between pointer-events-none z-10">
        <span className="text-[8px] font-black uppercase tracking-wider rounded-full px-2 py-0.5"
          style={{ background: r.bg, color: r.color, border: `1px solid ${r.border}` }}>
          {r.label}
        </span>
        <span className="text-[9px] rounded-full px-1.5 py-0.5"
          style={{ background: "rgba(0,0,0,0.5)" }}>
          {src.icon}
        </span>
      </div>

      {/* Icon */}
      <div className="flex items-center justify-center pt-9 pb-2 px-4">
        <div className="relative size-12 rounded-[14px] flex items-center justify-center text-[24px] border transition-transform duration-200 group-hover:scale-110"
          style={{ background: r.bg, borderColor: r.border }}>
          {item.icon}
          {/* Quantity badge */}
          {item.quantity > 1 && (
            <div className="absolute -bottom-1 -right-1 size-5 rounded-full flex items-center justify-center text-[9px] font-black text-white"
              style={{ background: V, border: `1.5px solid ${CARD}` }}>
              {item.quantity > 99 ? "99+" : item.quantity}
            </div>
          )}
        </div>
      </div>

      {/* Info */}
      <div className="px-3 pb-1 flex flex-col gap-0.5 flex-1">
        <h3 className="text-[12px] font-black leading-tight" style={{ color: TEXT }}>{item.name}</h3>
        {item.description && (
          <p className="text-[10px] leading-snug line-clamp-2" style={{ color: MUTED }}>{item.description}</p>
        )}

        {/* Booster info */}
        {(item.type === "booster_xp" || item.type === "booster_coin") && item.boosterMultiplier && (
          <span className="text-[9px] font-black rounded-full px-2 py-0.5 self-start mt-0.5"
            style={{ background: "rgba(124,58,237,0.12)", color: V }}>
            {item.boosterMultiplier}× · {item.boosterDurationHours}h
          </span>
        )}

        {/* Active booster timer */}
        {active && item.boosterActiveUntil && (
          <span className="text-[9px] font-black rounded-full px-2 py-0.5 self-start animate-pulse"
            style={{ background: "rgba(34,197,94,0.1)", color: "#4ade80" }}>
            ⚡ {boosterTimeLeft(item.boosterActiveUntil)}
          </span>
        )}

        {/* Equipped badge */}
        {equipped && (
          <span className="text-[9px] font-black rounded-full px-2 py-0.5 self-start"
            style={{ background: `${r.color}20`, color: r.color }}>
            ✓ Equipped
          </span>
        )}

        <p className="text-[9px] mt-0.5" style={{ color: "rgba(240,234,255,0.25)" }}>
          {relTime(item.acquiredAt)}
        </p>
      </div>

      {/* Action button */}
      <div className="p-3 pt-1.5 mt-auto">
        {isEquippable && (
          <button
            onClick={() => onEquip(item.inventoryId, !equipped)}
            disabled={isActing}
            className="w-full py-2 rounded-xl text-[11px] font-black transition-all"
            style={{
              background:  equipped ? "rgba(239,57,118,0.1)" : r.bg,
              border:      `1px solid ${equipped ? "rgba(239,57,118,0.3)" : r.border}`,
              color:       equipped ? P : r.color,
              cursor:      isActing ? "not-allowed" : "pointer",
              opacity:     isActing ? 0.6 : 1,
            }}>
            {isActing ? "…" : equipped ? "Unequip" : "Equip"}
          </button>
        )}
        {isConsumable && !active && (
          <button
            onClick={() => onUse(item)}
            disabled={isActing || item.quantity < 1}
            className="w-full py-2 rounded-xl text-[11px] font-black text-white transition-all"
            style={{
              background: item.quantity > 0 ? GRAD : "rgba(124,58,237,0.1)",
              cursor:     isActing || item.quantity < 1 ? "not-allowed" : "pointer",
              opacity:    isActing || item.quantity < 1 ? 0.6 : 1,
              boxShadow:  item.quantity > 0 ? "0 4px 12px rgba(124,58,237,0.25)" : "none",
            }}>
            {isActing ? "…" : item.quantity < 1 ? "Used up" : "Use"}
          </button>
        )}
        {isConsumable && active && (
          <div className="w-full py-2 rounded-xl text-[11px] font-black text-center border"
            style={{ background: "rgba(34,197,94,0.07)", borderColor: "rgba(34,197,94,0.2)", color: "#4ade80" }}>
            Active
          </div>
        )}
        {!isEquippable && !isConsumable && (
          <div className="w-full py-2 rounded-xl text-[11px] font-black text-center border"
            style={{ background: "rgba(255,255,255,0.02)", borderColor: BORDER, color: MUTED }}>
            Owned
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Use confirm modal ────────────────────────────────────────────────────────
function UseModal({ item, onConfirm, onCancel }: {
  item: InventoryItem; onConfirm: () => void; onCancel: () => void;
}) {
  const r = RARITY_CONFIG[item.rarity] ?? RARITY_CONFIG.common;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(10px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}>
      <div className="w-full max-w-sm rounded-[22px] border overflow-hidden"
        style={{ background: CARD, borderColor: r.border, boxShadow: `0 24px 60px rgba(0,0,0,0.5)`, animation: "popIn 0.25s cubic-bezier(0.175,0.885,0.32,1.275)" }}>
        <div className="h-0.5" style={{ background: r.color }} />
        <div className="p-6 flex flex-col items-center gap-4 text-center">
          <div className="size-16 rounded-2xl flex items-center justify-center text-3xl border"
            style={{ background: r.bg, borderColor: r.border }}>{item.icon}</div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest mb-1" style={{ color: r.color }}>{r.label}</p>
            <h3 className="text-[17px] font-black" style={{ color: TEXT }}>{item.name}</h3>
            {item.boosterMultiplier && (
              <p className="text-[12px] mt-1" style={{ color: MUTED }}>
                Activates {item.boosterMultiplier}× boost for {item.boosterDurationHours}h
              </p>
            )}
            {item.type === "streak_freeze" && (
              <p className="text-[12px] mt-1" style={{ color: MUTED }}>
                Protects your streak for 1 missed day
              </p>
            )}
            <p className="text-[11px] mt-2 font-bold" style={{ color: P }}>
              {item.quantity - 1} remaining after use
            </p>
          </div>
          <div className="flex gap-2.5 w-full">
            <button onClick={onCancel}
              className="flex-1 py-2.5 rounded-xl text-[12px] font-black border"
              style={{ background: "transparent", borderColor: BORDER, color: MUTED }}>
              Cancel
            </button>
            <button onClick={onConfirm}
              className="flex-[2] py-2.5 rounded-xl text-[12px] font-black text-white"
              style={{ background: GRAD, boxShadow: "0 4px 14px rgba(124,58,237,0.3)" }}>
              Use Now
            </button>
          </div>
        </div>
      </div>
      <style>{`@keyframes popIn{from{transform:scale(0.92);opacity:0}to{transform:scale(1);opacity:1}}`}</style>
    </div>
  );
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
export default function InventoryTab() {
  const [items,          setItems]         = useState<InventoryItem[]>([]);
  const [loading,        setLoading]       = useState(true);
  const [error,          setError]         = useState<string | null>(null);
  const [activeCategory, setCategory]      = useState("all");
  const [activeSource,   setSource]        = useState<string>("all");
  const [actingId,       setActingId]      = useState<number | null>(null);
  const [useTarget,      setUseTarget]     = useState<InventoryItem | null>(null);
  const [toast,          setToast]         = useState<string | null>(null);

  const fetch_ = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res  = await fetch("/api/shop/inventory");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");
      setItems(data.items ?? []);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch_(); }, [fetch_]);

  // Show toast
  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  // Equip / unequip
  const handleEquip = useCallback(async (inventoryId: number, equip: boolean) => {
    setActingId(inventoryId);
    try {
      const res = await fetch("/api/shop/inventory", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ inventoryId, equip }),
      });
      if (!res.ok) throw new Error();
      setItems((prev) => prev.map((i) =>
        i.inventoryId === inventoryId ? { ...i, isEquipped: equip } : i
      ));
      showToast(equip ? "Item equipped! ✓" : "Item unequipped");
    } catch {
      showToast("Failed to update item");
    } finally {
      setActingId(null);
    }
  }, []);

  // Use consumable
  const handleUseConfirm = useCallback(async () => {
    if (!useTarget) return;
    setActingId(useTarget.inventoryId);
    setUseTarget(null);
    try {
      const res = await fetch("/api/shop/use-item", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ inventoryId: useTarget.inventoryId }),
      });
      if (!res.ok) throw new Error();
      // Decrement quantity locally; remove if 0
      setItems((prev) => prev
        .map((i) => i.inventoryId === useTarget.inventoryId
          ? { ...i, quantity: i.quantity - 1 } : i)
        .filter((i) => i.quantity > 0)
      );
      showToast(`${useTarget.name} activated! 🎉`);
    } catch {
      showToast("Failed to use item");
    } finally {
      setActingId(null);
    }
  }, [useTarget]);

  // Filter
  const sources  = ["all", ...Array.from(new Set(items.map((i) => i.source ?? "purchased")))];
  const filtered = items.filter((i) => {
    const catMatch = activeCategory === "all" || i.type === activeCategory;
    const srcMatch = activeSource   === "all" || (i.source ?? "purchased") === activeSource;
    return catMatch && srcMatch;
  });

  const equipped = filtered.filter((i) => i.isEquipped);
  const active   = filtered.filter((i) => !i.isEquipped && isBoosterActive(i));
  const rest     = filtered.filter((i) => !i.isEquipped && !isBoosterActive(i));

  return (
    <div className="flex flex-col gap-6" style={{ fontFamily: "'Be Vietnam Pro', sans-serif" }}>

      {/* ── Header ── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-[20px] font-black" style={{ color: TEXT }}>Inventory</h2>
          <p className="text-[12px] mt-0.5" style={{ color: MUTED }}>
            {items.length} item{items.length !== 1 ? "s" : ""} collected
          </p>
        </div>
        {/* Source filter */}
        <div className="flex gap-2 flex-wrap">
          {sources.map((src) => {
            const cfg = src === "all" ? { label: "All Sources", icon: "🎒", color: V } : SOURCE_CONFIG[src] ?? { label: src, icon: "📦", color: MUTED };
            return (
              <button key={src} onClick={() => setSource(src)}
                className="flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[10px] font-black transition-all"
                style={activeSource === src
                  ? { background: "rgba(124,58,237,0.15)", borderColor: V, color: TEXT }
                  : { background: "transparent", borderColor: BORDER, color: MUTED }}>
                <span>{cfg.icon}</span> {cfg.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Category tabs ── */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {TYPE_CATEGORIES.map((cat) => {
          const count  = cat.id === "all" ? items.length : items.filter((i) => i.type === cat.id).length;
          if (count === 0 && cat.id !== "all") return null;
          return (
            <button key={cat.id} onClick={() => setCategory(cat.id)}
              className="flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-[11px] font-black whitespace-nowrap flex-shrink-0 transition-all"
              style={activeCategory === cat.id
                ? { background: "rgba(124,58,237,0.15)", borderColor: V, color: TEXT, boxShadow: "0 0 10px rgba(124,58,237,0.2)" }
                : { background: "transparent", borderColor: BORDER, color: MUTED }}>
              <span>{cat.icon}</span> {cat.label}
              {count > 0 && (
                <span className="rounded-full px-1.5 text-[8px] font-black"
                  style={{ background: activeCategory === cat.id ? "rgba(124,58,237,0.3)" : "rgba(124,58,237,0.1)", color: activeCategory === cat.id ? TEXT : MUTED }}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {error && (
        <div className="rounded-xl border px-4 py-3 flex items-center gap-2"
          style={{ background: "rgba(239,57,118,0.08)", borderColor: "rgba(239,57,118,0.25)" }}>
          <span>⚠️</span>
          <p className="text-[12px] font-bold" style={{ color: P }}>{error}</p>
          <button onClick={fetch_} className="ml-auto text-[11px] font-black" style={{ color: P }}>Retry</button>
        </div>
      )}

      {loading ? <Skeleton /> : filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-4 py-20 text-center rounded-[20px] border"
          style={{ background: CARD, borderColor: BORDER }}>
          <span className="text-5xl">🎒</span>
          <p className="text-[16px] font-black" style={{ color: TEXT }}>
            {activeCategory === "all" ? "Your inventory is empty" : `No ${activeCategory.replace("_", " ")}s yet`}
          </p>
          <p className="text-[13px]" style={{ color: MUTED }}>
            Buy items in the Shop or earn them from Fan Pass quests and mystery boxes
          </p>
        </div>
      ) : (
        <>
          {/* Equipped section */}
          {equipped.length > 0 && (
            <section className="flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <span className="text-[11px]">✓</span>
                <p className="text-[10px] font-black uppercase tracking-[0.14em]" style={{ color: MUTED }}>Equipped</p>
                <div className="flex-1 h-px" style={{ background: BORDER }} />
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {equipped.map((item) => (
                  <InventoryCard key={item.inventoryId} item={item}
                    onEquip={handleEquip} onUse={setUseTarget}
                    isActing={actingId === item.inventoryId} />
                ))}
              </div>
            </section>
          )}

          {/* Active boosters */}
          {active.length > 0 && (
            <section className="flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <span className="text-[11px]">⚡</span>
                <p className="text-[10px] font-black uppercase tracking-[0.14em]" style={{ color: "#4ade80" }}>Active</p>
                <div className="flex-1 h-px" style={{ background: BORDER }} />
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {active.map((item) => (
                  <InventoryCard key={item.inventoryId} item={item}
                    onEquip={handleEquip} onUse={setUseTarget}
                    isActing={actingId === item.inventoryId} />
                ))}
              </div>
            </section>
          )}

          {/* Rest */}
          {rest.length > 0 && (
            <section className="flex flex-col gap-3">
              {(equipped.length > 0 || active.length > 0) && (
                <div className="flex items-center gap-2">
                  <p className="text-[10px] font-black uppercase tracking-[0.14em]" style={{ color: MUTED }}>Collection</p>
                  <div className="flex-1 h-px" style={{ background: BORDER }} />
                </div>
              )}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                {rest.map((item) => (
                  <InventoryCard key={item.inventoryId} item={item}
                    onEquip={handleEquip} onUse={setUseTarget}
                    isActing={actingId === item.inventoryId} />
                ))}
              </div>
            </section>
          )}
        </>
      )}

      {/* Use confirm modal */}
      {useTarget && (
        <UseModal item={useTarget}
          onConfirm={handleUseConfirm}
          onCancel={() => setUseTarget(null)} />
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-24 md:bottom-6 right-4 z-50 flex items-center gap-3 rounded-2xl border px-4 py-3"
          style={{
            background:  CARD,
            borderColor: BORDER,
            boxShadow:   "0 8px 32px rgba(0,0,0,0.5)",
            animation:   "slideUp 0.3s cubic-bezier(0.175,0.885,0.32,1.275)",
          }}>
          <p className="text-[13px] font-black" style={{ color: TEXT }}>{toast}</p>
        </div>
      )}

      <style>{`
        @keyframes slideUp { from { transform: translateY(12px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        @keyframes popIn   { from { transform: scale(0.92); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}