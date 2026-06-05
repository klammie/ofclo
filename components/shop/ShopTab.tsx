"use client";

import { useState, useEffect, useCallback } from "react";
import { useShop } from "@/lib/hooks/user-shop";
import MysteryBoxOpener from "@/components/shop/MysteryBoxOpener";
import type { ShopItem, ShopCategory, ShopItemRarity } from "@/lib/types";
import { getTierFromXp } from "@/components/status/StatusModal";

// ─── Theme ────────────────────────────────────────────────────────────────────
const P      = "#ef3976";
const V      = "#7c3aed";
const GRAD   = `linear-gradient(135deg, ${V} 0%, ${P} 100%)`;
const CARD   = "#1a1635";
const SURF   = "#13112b";
const BORDER = "rgba(124,58,237,0.15)";
const TEXT   = "#f0eaff";
const MUTED  = "rgba(240,234,255,0.45)";

// ─── Rarity config ────────────────────────────────────────────────────────────
const RARITY: Record<ShopItemRarity, { label: string; color: string; bg: string; border: string }> = {
  common:    { label: "Common",    color: "#94a3b8", bg: "rgba(148,163,184,0.08)", border: "rgba(148,163,184,0.2)"  },
  rare:      { label: "Rare",      color: "#38bdf8", bg: "rgba(56,189,248,0.08)",  border: "rgba(56,189,248,0.25)"  },
  epic:      { label: "Epic",      color: "#a78bfa", bg: "rgba(124,58,237,0.1)",   border: "rgba(124,58,237,0.3)"   },
  legendary: { label: "Legendary", color: "#fbbf24", bg: "rgba(251,191,36,0.08)",  border: "rgba(251,191,36,0.28)"  },
};

// ─── For You offers per tier ──────────────────────────────────────────────────
// These are curated offer hints shown as a section header.
// The actual filtering uses tag/rarity matching on real shop items.
const TIER_OFFERS: Record<string, { title: string; subtitle: string; icon: string; color: string; bg: string; border: string }> = {
  bronze: {
    title:    "Starter Picks for You",
    subtitle: "Great value items to kickstart your fan journey",
    icon:     "🥉", color: "#cd7f32",
    bg:       "rgba(205,127,50,0.08)", border: "rgba(205,127,50,0.25)",
  },
  silver: {
    title:    "Silver Fan Picks",
    subtitle: "Rare items and boosters matched to your Silver status",
    icon:     "🥈", color: "#94a3b8",
    bg:       "rgba(148,163,184,0.08)", border: "rgba(148,163,184,0.25)",
  },
  gold: {
    title:    "Gold Exclusives for You",
    subtitle: "Premium selections curated for Gold Fans — 10% coin bonus active",
    icon:     "🥇", color: "#fbbf24",
    bg:       "rgba(251,191,36,0.08)", border: "rgba(251,191,36,0.28)",
  },
  platinum: {
    title:    "Platinum Specials",
    subtitle: "Epic & Legendary items at your 20% platinum discount",
    icon:     "💎", color: "#38bdf8",
    bg:       "rgba(56,189,248,0.08)", border: "rgba(56,189,248,0.25)",
  },
  diamond: {
    title:    "Diamond-Only Selections",
    subtitle: "Exclusive items and drops available only to Diamond Fans",
    icon:     "👑", color: "#a78bfa",
    bg:       "rgba(167,139,250,0.1)", border: "rgba(167,139,250,0.3)",
  },
  legend: {
    title:    "Legend Tier — All Access",
    subtitle: "Every item, every drop — you have maximum access",
    icon:     "🔥", color: "#ef3976",
    bg:       "rgba(239,57,118,0.08)", border: "rgba(239,57,118,0.3)",
  },
};

// Map tier → min rarity for "For You" section
const TIER_MIN_RARITY: Record<string, ShopItemRarity[]> = {
  bronze:   ["common"],
  silver:   ["common", "rare"],
  gold:     ["rare", "epic"],
  platinum: ["epic", "legendary"],
  diamond:  ["epic", "legendary"],
  legend:   ["common", "rare", "epic", "legendary"],
};

// ─── Categories ───────────────────────────────────────────────────────────────
const CATEGORIES: { id: ShopCategory | "mystery_boxes" | "for_you"; label: string; icon: string }[] = [
  { id: "for_you",      label: "For You",      icon: "✨" },
  { id: "all",          label: "All",          icon: "🏪" },
  { id: "mystery_boxes",label: "Mystery Boxes",icon: "🎲" },
  { id: "vip",          label: "VIP",          icon: "💎" },
  { id: "boosters",     label: "Boosters",     icon: "⚡" },
  { id: "badges",       label: "Badges",       icon: "🏅" },
  { id: "gifts",        label: "Gifts",        icon: "🎁" },
  { id: "freezes",      label: "Freezes",      icon: "🛡️" },
  { id: "inventory", label: "Inventory", icon: "🎒" },

];

// ─── Section label ────────────────────────────────────────────────────────────
function SectionLabel({ icon, label }: { icon: string; label: string }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <span className="text-[13px]">{icon}</span>
      <h3 className="text-[11px] font-black uppercase tracking-[0.14em]" style={{ color: MUTED }}>{label}</h3>
      <div className="flex-1 h-px" style={{ background: BORDER }} />
    </div>
  );
}

// ─── Confirm modal ────────────────────────────────────────────────────────────
function ConfirmModal({ item, userCoins, isPurchasing, onConfirm, onCancel }: {
  item: ShopItem; userCoins: number; isPurchasing: boolean;
  onConfirm: () => void; onCancel: () => void;
}) {
  const r = RARITY[item.rarity];
  const canAfford = userCoins >= item.coinPrice;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(13,13,26,0.88)", backdropFilter: "blur(12px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}>
      <div className="w-full max-w-sm rounded-[22px] border overflow-hidden"
        style={{ background: CARD, borderColor: r.border, boxShadow: `0 24px 64px rgba(0,0,0,0.5)`, animation: "popIn 0.25s cubic-bezier(0.175,0.885,0.32,1.275) forwards" }}>
        <div className="h-0.5" style={{ background: `linear-gradient(90deg, ${r.color}, transparent)` }} />
        <div className="p-6 flex flex-col gap-5">
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="size-16 rounded-2xl flex items-center justify-center text-3xl border"
              style={{ background: r.bg, borderColor: r.border }}>{item.icon}</div>
            <div>
              <span className="text-[9px] font-black uppercase tracking-widest rounded-full px-2 py-0.5"
                style={{ background: r.bg, color: r.color }}>{r.label}</span>
              <h3 className="text-[17px] font-black mt-1.5" style={{ color: TEXT }}>{item.name}</h3>
              <p className="text-[12px] mt-0.5" style={{ color: MUTED }}>{item.description}</p>
            </div>
          </div>
          {item.boosterMultiplier && (
            <div className="flex items-center gap-3 rounded-xl border px-4 py-3"
              style={{ background: "rgba(124,58,237,0.07)", borderColor: BORDER }}>
              <span className="text-xl">⚡</span>
              <div>
                <p className="text-[12px] font-black" style={{ color: TEXT }}>{item.boosterMultiplier}× multiplier</p>
                <p className="text-[10px]" style={{ color: MUTED }}>Active for {item.boosterDurationHours}h</p>
              </div>
            </div>
          )}
          <div className="flex items-center justify-between rounded-xl border px-4 py-3"
            style={{ background: "rgba(255,255,255,0.02)", borderColor: BORDER }}>
            <div>
              <p className="text-[9px] font-bold uppercase tracking-widest mb-0.5" style={{ color: "rgba(240,234,255,0.25)" }}>Cost</p>
              <p className="text-[18px] font-black" style={{ color: TEXT }}>
                💰 {item.coinPrice.toLocaleString()}<span className="text-[11px] font-bold ml-1" style={{ color: MUTED }}>coins</span>
              </p>
            </div>
            <div className="text-right">
              <p className="text-[9px] font-bold uppercase tracking-widest mb-0.5" style={{ color: "rgba(240,234,255,0.25)" }}>Balance</p>
              <p className="text-[14px] font-black" style={{ color: canAfford ? "#4ade80" : P }}>{userCoins.toLocaleString()}</p>
            </div>
          </div>
          {!canAfford && <p className="text-center text-[11px] font-bold" style={{ color: P }}>Need {(item.coinPrice - userCoins).toLocaleString()} more coins</p>}
          {canAfford && <p className="text-center text-[10px]" style={{ color: MUTED }}>Balance after: <span className="font-bold" style={{ color: TEXT }}>{(userCoins - item.coinPrice).toLocaleString()} coins</span></p>}
          <div className="flex gap-2.5">
            <button onClick={onCancel} className="flex-1 py-2.5 rounded-xl text-[12px] font-black border transition-all"
              style={{ background: "transparent", borderColor: BORDER, color: MUTED }}>Cancel</button>
            <button onClick={onConfirm} disabled={!canAfford || isPurchasing}
              className="flex-[2] py-2.5 rounded-xl text-[12px] font-black text-white transition-all flex items-center justify-center gap-2"
              style={{ background: canAfford ? GRAD : "rgba(124,58,237,0.15)", opacity: !canAfford || isPurchasing ? 0.6 : 1, boxShadow: canAfford ? "0 4px 16px rgba(124,58,237,0.3)" : "none", cursor: !canAfford || isPurchasing ? "not-allowed" : "pointer" }}>
              {isPurchasing ? <><svg className="animate-spin size-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg>Buying…</> : canAfford ? "Confirm" : "Can't afford"}
            </button>
          </div>
        </div>
      </div>
      <style>{`@keyframes popIn{from{transform:scale(0.9);opacity:0}to{transform:scale(1);opacity:1}}`}</style>
    </div>
  );
}

// ─── Purchase toast ───────────────────────────────────────────────────────────
function PurchaseToast({ item, onDone }: { item: ShopItem; onDone: () => void }) {
  useEffect(() => { const t = setTimeout(onDone, 3000); return () => clearTimeout(t); }, [onDone]);
  const r = RARITY[item.rarity];
  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-2xl border px-4 py-3"
      style={{ background: CARD, borderColor: r.border, boxShadow: "0 8px 32px rgba(0,0,0,0.4)", animation: "slideUp 0.35s cubic-bezier(0.175,0.885,0.32,1.275) forwards" }}>
      <div className="size-10 rounded-xl flex items-center justify-center text-xl" style={{ background: r.bg }}>{item.icon}</div>
      <div>
        <p className="text-[12px] font-black" style={{ color: TEXT }}>Added to inventory</p>
        <p className="text-[11px]" style={{ color: MUTED }}>{item.name}</p>
      </div>
      <div className="size-5 rounded-full bg-green-500 flex items-center justify-center text-[9px] text-white font-black">✓</div>
      <style>{`@keyframes slideUp{from{transform:translateY(16px);opacity:0}to{transform:translateY(0);opacity:1}}`}</style>
    </div>
  );
}

// ─── Shop item card ───────────────────────────────────────────────────────────
function ShopItemCard({ item, userCoins, isPurchasing, onBuy, highlight }: {
  item: ShopItem; userCoins: number; isPurchasing: boolean;
  onBuy: (item: ShopItem) => void; highlight?: boolean;
}) {
  const r = RARITY[item.rarity];
  const canAfford = userCoins >= item.coinPrice;
  const isOwned   = item.owned && ["badge", "vip_pass", "emote"].includes(item.type);

  return (
    <div className="relative flex flex-col rounded-[18px] border overflow-hidden transition-all duration-200 group hover:translate-y-[-2px]"
      style={{ background: CARD, borderColor: highlight ? r.border : BORDER, boxShadow: highlight ? `0 0 20px ${r.bg}` : "none" }}>
      <div className="h-[2px]" style={{ background: highlight ? r.color : "transparent" }} />
      <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none z-10">
        <span className="text-[8px] font-black uppercase tracking-wider rounded-full px-2 py-0.5"
          style={{ background: r.bg, color: r.color, border: `1px solid ${r.border}` }}>{r.label}</span>
        <div className="flex gap-1">
          {item.isFeatured    && <span className="text-[8px] font-black rounded-full px-1.5 py-0.5" style={{ background: "rgba(251,191,36,0.15)", color: "#fbbf24" }}>★</span>}
          {item.isLimitedTime && <span className="text-[8px] font-black rounded-full px-1.5 py-0.5 animate-pulse" style={{ background: "rgba(239,57,118,0.15)", color: P }}>⏱</span>}
        </div>
      </div>
      <div className="flex items-center justify-center pt-8 pb-3 px-4">
        <div className="size-12 rounded-[14px] flex items-center justify-center text-[22px] border transition-transform duration-200 group-hover:scale-110"
          style={{ background: r.bg, borderColor: r.border }}>{item.icon}</div>
      </div>
      <div className="px-3 pb-1 flex flex-col gap-0.5 flex-1">
        <h3 className="text-[12px] font-black leading-tight" style={{ color: TEXT }}>{item.name}</h3>
        <p className="text-[10px] leading-snug line-clamp-2" style={{ color: MUTED }}>{item.description}</p>
        {item.boosterMultiplier && (
          <span className="text-[9px] font-black rounded-full px-2 py-0.5 self-start mt-0.5"
            style={{ background: "rgba(124,58,237,0.12)", color: V }}>{item.boosterMultiplier}× · {item.boosterDurationHours}h</span>
        )}
        {item.stock !== undefined && item.stock <= 10 && (
          <p className="text-[9px] font-bold" style={{ color: P }}>Only {item.stock} left</p>
        )}
      </div>
      <div className="p-3 pt-2 mt-auto">
        {isOwned ? (
          <div className="w-full py-2 rounded-xl flex items-center justify-center gap-1.5 text-[11px] font-black border"
            style={{ background: "rgba(34,197,94,0.07)", borderColor: "rgba(34,197,94,0.2)", color: "#4ade80" }}>✓ Owned</div>
        ) : (
          <button onClick={() => onBuy(item)} disabled={isPurchasing}
            className="w-full py-2 rounded-xl flex items-center justify-center gap-1.5 text-[11px] font-black transition-all"
            style={{ background: canAfford ? GRAD : "rgba(124,58,237,0.1)", color: canAfford ? "#fff" : MUTED, boxShadow: canAfford ? "0 4px 12px rgba(124,58,237,0.25)" : "none", cursor: isPurchasing ? "not-allowed" : "pointer" }}>
            {isPurchasing
              ? <svg className="animate-spin size-3.5" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg>
              : <><span>💰</span>{item.coinPrice.toLocaleString()}{!canAfford && <span className="text-[9px] opacity-50">need more</span>}</>
            }
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function SkeletonCard() {
  return <div className="rounded-[18px] border overflow-hidden animate-pulse h-44" style={{ background: CARD, borderColor: BORDER }} />;
}

// ─── For You banner ───────────────────────────────────────────────────────────
function ForYouBanner({ tierId }: { tierId: string }) {
  const offer = TIER_OFFERS[tierId] ?? TIER_OFFERS.bronze;
  return (
    <div className="rounded-[18px] border px-5 py-4 flex items-center gap-4"
      style={{ background: offer.bg, borderColor: offer.border }}>
      <span className="text-[32px] flex-shrink-0">{offer.icon}</span>
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-black" style={{ color: TEXT }}>{offer.title}</p>
        <p className="text-[11px] mt-0.5" style={{ color: MUTED }}>{offer.subtitle}</p>
      </div>
    </div>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
interface ShopTabProps {
  statusXp?: number; // user's total status XP — passed from parent
}

export default function ShopTab({ statusXp = 0 }: ShopTabProps) {
  const { items, coins, isLoading, isPurchasing, lastPurchase, error, purchase, refetch } = useShop();

  const [activeCategory, setActiveCategory] = useState<ShopCategory | "mystery_boxes" | "for_you">("for_you");
  const [selectedItem,   setSelectedItem]   = useState<ShopItem | null>(null);
  const [showToast,      setShowToast]      = useState(false);
  const [toastItem,      setToastItem]      = useState<ShopItem | null>(null);

  const tier          = getTierFromXp(statusXp);
  const allowedRarity = TIER_MIN_RARITY[tier.id] ?? ["common"];

  useEffect(() => {
    if (lastPurchase) {
      setToastItem(lastPurchase.item);
      setShowToast(true);
      setSelectedItem(null);
    }
  }, [lastPurchase]);

  const handleBuy     = useCallback((item: ShopItem) => setSelectedItem(item), []);
  const handleConfirm = useCallback(async () => { if (!selectedItem) return; await purchase(selectedItem.id, "coins"); }, [selectedItem, purchase]);

  // Filter items based on active tab
  const filtered =
    activeCategory === "for_you"
      ? items.filter((i) => allowedRarity.includes(i.rarity))
      : activeCategory === "all"
        ? items
        : items.filter((i) => i.category === activeCategory);

  const featured = filtered.filter((i) => i.isFeatured);
  const regular  = filtered.filter((i) => !i.isFeatured);

  return (
    <div className="flex flex-col gap-6 pb-8" style={{ fontFamily: "'Be Vietnam Pro', sans-serif" }}>

      {/* ── Header ── */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-[20px] font-black" style={{ color: TEXT }}>Fan Shop</h2>
          <p className="text-[12px] mt-0.5" style={{ color: MUTED }}>Spend your coins on badges, boosters, gifts and more</p>
        </div>
        {/* Balance + Status pills */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Status pill */}
          <div className="flex items-center gap-1.5 rounded-2xl border px-3 py-1.5"
            style={{ background: tier.bg, borderColor: tier.border }}>
            <span className="text-[14px]">{tier.emoji}</span>
            <span className="text-[11px] font-black" style={{ color: tier.color }}>{tier.label}</span>
          </div>
          {/* Coin balance */}
          <div className="flex items-center gap-2 rounded-2xl border px-4 py-2"
            style={{ background: "rgba(251,191,36,0.07)", borderColor: "rgba(251,191,36,0.22)" }}>
            <span className="text-[18px]">💰</span>
            <div>
              <p className="text-[8px] font-black uppercase tracking-widest" style={{ color: "rgba(251,191,36,0.55)" }}>Balance</p>
              <p className="text-[16px] font-black leading-none" style={{ color: TEXT }}>{coins.toLocaleString()}</p>
            </div>
            <span className="text-[10px] font-bold" style={{ color: MUTED }}>coins</span>
          </div>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-3 rounded-xl border px-4 py-3"
          style={{ background: "rgba(239,57,118,0.07)", borderColor: "rgba(239,57,118,0.25)" }}>
          <span>⚠️</span>
          <p className="text-[12px] font-bold flex-1" style={{ color: P }}>{error}</p>
        </div>
      )}

      {/* ── Category pills ── */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {CATEGORIES.map((cat) => {
          const count  = cat.id === "all"     ? items.length
                       : cat.id === "for_you" ? items.filter((i) => allowedRarity.includes(i.rarity)).length
                       : items.filter((i) => i.category === cat.id).length;
          const active = activeCategory === cat.id;
          return (
            <button key={cat.id} onClick={() => setActiveCategory(cat.id)}
              className="flex items-center gap-1.5 rounded-full border px-4 py-2 text-[11px] font-black whitespace-nowrap flex-shrink-0 transition-all"
              style={active
                ? { background: cat.id === "for_you" ? tier.bg : "rgba(124,58,237,0.15)", borderColor: cat.id === "for_you" ? tier.border : V, color: TEXT, boxShadow: "0 0 10px rgba(124,58,237,0.2)" }
                : { background: "transparent", borderColor: BORDER, color: MUTED }}>
              <span>{cat.icon}</span>
              {cat.label}
              {count > 0 && (
                <span className="rounded-full px-1.5 py-px text-[8px] font-black"
                  style={{ background: active ? "rgba(124,58,237,0.25)" : "rgba(124,58,237,0.08)", color: active ? TEXT : MUTED }}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── Content ── */}
      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {[...Array(8)].map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : (
        <>
          {/* For You banner + items */}
          {activeCategory === "for_you" && (
            <section className="flex flex-col gap-4">
              <ForYouBanner tierId={tier.id} />
              {filtered.length === 0 ? (
                <div className="flex flex-col items-center gap-3 py-12">
                  <span className="text-4xl">🏪</span>
                  <p className="text-[13px] font-bold" style={{ color: MUTED }}>No items available yet</p>
                </div>
              ) : (
                <>
                  {featured.length > 0 && (
                    <>
                      <SectionLabel icon="✨" label="Featured for You" />
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                        {featured.map((item) => (
                          <ShopItemCard key={item.id} item={item} userCoins={coins}
                            isPurchasing={isPurchasing === item.id} onBuy={handleBuy} highlight />
                        ))}
                      </div>
                    </>
                  )}
                  {regular.length > 0 && (
                    <>
                      <SectionLabel icon="🏪" label={`More ${tier.label} Picks`} />
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                        {regular.map((item) => (
                          <ShopItemCard key={item.id} item={item} userCoins={coins}
                            isPurchasing={isPurchasing === item.id} onBuy={handleBuy} />
                        ))}
                      </div>
                    </>
                  )}
                </>
              )}

              {/* Upgrade CTA if not max tier */}
              {tier.id !== "legend" && (
                <div className="rounded-[18px] border p-4 flex items-center gap-4"
                  style={{ background: "rgba(124,58,237,0.05)", borderColor: BORDER }}>
                  <span className="text-[28px]">⬆️</span>
                  <div className="flex-1">
                    <p className="text-[12px] font-black" style={{ color: TEXT }}>
                      Rank up to unlock more items
                    </p>
                    <p className="text-[11px] mt-0.5" style={{ color: MUTED }}>
                      Higher status unlocks exclusive offers, discounts and rare drops
                    </p>
                  </div>
                </div>
              )}
            </section>
          )}

          {/* Mystery boxes */}
          {(activeCategory === "all" || activeCategory === "mystery_boxes") && (
            <section>
              <SectionLabel icon="🎲" label="Mystery Boxes" />
              <MysteryBoxOpener coinBalance={coins} onBalanceChange={() => refetch()} />
            </section>
          )}

          {/* Featured */}
          {featured.length > 0 && activeCategory !== "mystery_boxes" && activeCategory !== "for_you" && (
            <section>
              <SectionLabel icon="✨" label="Featured" />
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {featured.map((item) => (
                  <ShopItemCard key={item.id} item={item} userCoins={coins}
                    isPurchasing={isPurchasing === item.id} onBuy={handleBuy} />
                ))}
              </div>
            </section>
          )}

          {/* Regular items */}
          {regular.length > 0 && activeCategory !== "mystery_boxes" && activeCategory !== "for_you" && (
            <section>
              {featured.length > 0 && <SectionLabel icon="🏪" label="All Items" />}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                {regular.map((item) => (
                  <ShopItemCard key={item.id} item={item} userCoins={coins}
                    isPurchasing={isPurchasing === item.id} onBuy={handleBuy} />
                ))}
              </div>
            </section>
          )}

          {/* Empty */}
          {filtered.length === 0 && activeCategory !== "mystery_boxes" && activeCategory !== "for_you" && (
            <div className="flex flex-col items-center gap-3 py-20">
              <span className="text-4xl">🏪</span>
              <p className="text-[14px] font-bold" style={{ color: MUTED }}>No items in this category</p>
            </div>
          )}
        </>
      )}

      {/* ── Earn coins tip ── */}
      <div className="flex items-center gap-4 rounded-[16px] border px-5 py-4"
        style={{ background: "rgba(124,58,237,0.04)", borderColor: BORDER }}>
        <span className="text-2xl flex-shrink-0">💡</span>
        <div className="flex-1 min-w-0">
          <p className="text-[12px] font-black" style={{ color: TEXT }}>How to earn more coins</p>
          <p className="text-[11px] mt-0.5" style={{ color: MUTED }}>Daily quests · Login streaks · Tip creators · Refer friends · Complete campaigns</p>
        </div>
        <button className="flex-shrink-0 rounded-xl px-4 py-2 text-[11px] font-black text-white"
          style={{ background: GRAD }}>Quests</button>
      </div>

      {/* Modals */}
      {selectedItem && (
        <ConfirmModal item={selectedItem} userCoins={coins}
          isPurchasing={isPurchasing === selectedItem.id}
          onConfirm={handleConfirm} onCancel={() => setSelectedItem(null)} />
      )}
      {showToast && toastItem && (
        <PurchaseToast item={toastItem} onDone={() => setShowToast(false)} />
      )}
    </div>
  );
}