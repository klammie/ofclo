"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import Link from "next/link";

// ─── Types ────────────────────────────────────────────────────────────────────

type CreatorCardData = {
  id: string;
  userId: string;
  name: string;
  username: string;
  avatarUrl: string | null;
  coverImageUrl: string | null;
  bio: string | null;
  isVerified: boolean;
  subscriberCount: number;
  postCount: number;
  standardPrice: number;
  vipPrice: number;
  previewImage: string | null;
  isSubscribed: boolean;
  // Optional teaser content from their free/public posts
  teaserContent?: TeaserPost[];
};

type TeaserPost = {
  id: string;
  imageUrl: string | null;
  videoThumbnail: string | null;
  type: "image" | "video" | "text";
  likesCount: number;
  commentsCount: number;
  caption: string | null;
  isBlurred: boolean; // true = subscriber-only preview (blurred), false = public
};

type CreatorRarity = "common" | "rare" | "epic" | "legendary";
type SortOption    = "trending" | "new" | "top" | "price_low" | "price_high" | "free";

// ─── Rarity ───────────────────────────────────────────────────────────────────

function getRarity(subscriberCount: number): CreatorRarity {
  if (subscriberCount >= 10000) return "legendary";
  if (subscriberCount >= 1000)  return "epic";
  if (subscriberCount >= 100)   return "rare";
  return "common";
}

const RARITY = {
  common:    { label: "Common",    icon: "◆", color: "#94a3b8", glow: "rgba(148,163,184,0)",    border: "rgba(148,163,184,0.25)", badgeBg: "rgba(148,163,184,0.12)", shine: false },
  rare:      { label: "Rare",      icon: "◆", color: "#38bdf8", glow: "rgba(56,189,248,0.22)",  border: "rgba(56,189,248,0.4)",   badgeBg: "rgba(56,189,248,0.14)",  shine: false },
  epic:      { label: "Epic",      icon: "◆", color: "#a78bfa", glow: "rgba(167,139,250,0.28)", border: "rgba(167,139,250,0.5)",  badgeBg: "rgba(167,139,250,0.16)", shine: true  },
  legendary: { label: "Legendary", icon: "♦", color: "#fbbf24", glow: "rgba(251,191,36,0.38)",  border: "rgba(251,191,36,0.6)",   badgeBg: "rgba(251,191,36,0.16)", shine: true  },
};

// ─── Categories ───────────────────────────────────────────────────────────────

const CATEGORIES = [
  { id: "all",       label: "All",       icon: "🔥" },
  { id: "lifestyle", label: "Lifestyle", icon: "✨" },
  { id: "fitness",   label: "Fitness",   icon: "💪" },
  { id: "art",       label: "Art",       icon: "🎨" },
  { id: "music",     label: "Music",     icon: "🎵" },
  { id: "gaming",    label: "Gaming",    icon: "🎮" },
  { id: "fashion",   label: "Fashion",   icon: "👗" },
  { id: "cooking",   label: "Cooking",   icon: "🍳" },
  { id: "comedy",    label: "Comedy",    icon: "😂" },
];

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "trending",   label: "Trending"     },
  { value: "new",        label: "Newest"       },
  { value: "top",        label: "Most Popular" },
  { value: "price_low",  label: "Price: Low"   },
  { value: "price_high", label: "Price: High"  },
  { value: "free",       label: "Free Pages"   },
];

const RARITY_FILTERS = [
  { value: "all",       label: "All"       },
  { value: "legendary", label: "Legendary" },
  { value: "epic",      label: "Epic"      },
  { value: "rare",      label: "Rare"      },
  { value: "common",    label: "Common"    },
];

// ─── Mock teaser posts (replace with real DB query) ───────────────────────────
// In your real app, fetch these from your posts table where isPublic = true
// or where subscriptionRequired = false, ordered by createdAt desc, limit 4

function getMockTeaserPosts(creatorId: string): TeaserPost[] {
  // Gradient placeholder colours per creator — gives visual variety
  const palettes = [
    ["#ef3976", "#7c3aed"], ["#38bdf8", "#0ea5e9"], ["#fbbf24", "#f59e0b"],
    ["#a78bfa", "#7c3aed"], ["#4ade80", "#22c55e"], ["#fb923c", "#ef3976"],
  ];
  const pal = palettes[parseInt(creatorId.replace(/\D/g, "").slice(-1) || "0") % palettes.length];

  return [
    { id: `${creatorId}-1`, imageUrl: null, videoThumbnail: null, type: "image", likesCount: Math.floor(Math.random() * 2000) + 50, commentsCount: Math.floor(Math.random() * 200) + 5, caption: "Latest post", isBlurred: false,   _gradient: `linear-gradient(135deg, ${pal[0]}60, ${pal[1]}40)` } as any,
    { id: `${creatorId}-2`, imageUrl: null, videoThumbnail: null, type: "video", likesCount: Math.floor(Math.random() * 5000) + 100, commentsCount: Math.floor(Math.random() * 500) + 10, caption: "Exclusive content", isBlurred: true, _gradient: `linear-gradient(135deg, ${pal[1]}50, ${pal[0]}30)` } as any,
    { id: `${creatorId}-3`, imageUrl: null, videoThumbnail: null, type: "image", likesCount: Math.floor(Math.random() * 1500) + 30, commentsCount: Math.floor(Math.random() * 150) + 3, caption: "Behind the scenes", isBlurred: true, _gradient: `linear-gradient(135deg, ${pal[0]}40, ${pal[1]}60)` } as any,
    { id: `${creatorId}-4`, imageUrl: null, videoThumbnail: null, type: "image", likesCount: Math.floor(Math.random() * 800) + 20, commentsCount: Math.floor(Math.random() * 80) + 2, caption: "Preview", isBlurred: false, _gradient: `linear-gradient(135deg, ${pal[1]}35, ${pal[0]}55)` } as any,
  ];
}

// ─── Format numbers ───────────────────────────────────────────────────────────

function fmt(n: number): string {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000)    return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

// ─── Rarity badge ─────────────────────────────────────────────────────────────

function RarityBadge({ rarity }: { rarity: CreatorRarity }) {
  const r = RARITY[rarity];
  return (
    <div className="flex items-center gap-1 rounded-full px-2 py-0.5"
      style={{ background: r.badgeBg, border: `1px solid ${r.border}` }}>
      <span style={{ color: r.color, fontSize: 7 }}>{r.icon}</span>
      <span className="text-[9px] font-black uppercase tracking-wider" style={{ color: r.color }}>{r.label}</span>
    </div>
  );
}

// ─── Avatar ───────────────────────────────────────────────────────────────────

function Avatar({ creator, rarity, size = 44 }: { creator: CreatorCardData; rarity: CreatorRarity; size?: number }) {
  const r = RARITY[rarity];
  return (
    <div className="rounded-full overflow-hidden flex-shrink-0"
      style={{ width: size, height: size, border: `2.5px solid ${r.color}`, boxShadow: `0 0 10px ${r.glow}` }}>
      {creator.avatarUrl ? (
        <Image src={creator.avatarUrl} alt={creator.name} width={size} height={size} className="object-cover size-full" />
      ) : (
        <div className="size-full flex items-center justify-center font-black text-white"
          style={{ background: `linear-gradient(135deg, ${r.color}40, ${r.color}20)`, fontSize: size * 0.32 }}>
          {creator.name.charAt(0).toUpperCase()}
        </div>
      )}
    </div>
  );
}

// ─── Teaser grid tile ─────────────────────────────────────────────────────────

function TeaserTile({ post, size }: { post: TeaserPost & { _gradient?: string }; size: "large" | "small" }) {
  const p = post as any;
  return (
    <div className="relative overflow-hidden rounded-[10px] group/tile" style={{ aspectRatio: size === "large" ? "1/1" : "1/1" }}>
      {/* Content */}
      {post.imageUrl ? (
        <img src={post.imageUrl} className="w-full h-full object-cover" alt="" />
      ) : (
        <div className="w-full h-full" style={{ background: p._gradient ?? "rgba(124,58,237,0.15)" }} />
      )}

      {/* Blur overlay for locked content */}
      {post.isBlurred && (
        <>
          <div className="absolute inset-0" style={{ backdropFilter: "blur(12px)", background: "rgba(13,13,26,0.4)" }} />
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-1">
            <div className="size-7 rounded-full flex items-center justify-center"
              style={{ background: "rgba(239,57,118,0.25)", border: "1px solid rgba(239,57,118,0.4)" }}>
              <span style={{ fontSize: 12 }}>🔒</span>
            </div>
            <p className="text-[8px] font-black text-white/70 uppercase tracking-wider">Subscribe</p>
          </div>
        </>
      )}

      {/* Video badge */}
      {post.type === "video" && !post.isBlurred && (
        <div className="absolute top-1.5 right-1.5 size-5 rounded-full bg-black/60 flex items-center justify-center">
          <span style={{ fontSize: 8 }}>▶</span>
        </div>
      )}

      {/* Stats on hover */}
      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover/tile:opacity-100 transition-opacity duration-200 flex items-end p-2">
        <div className="flex items-center gap-2">
          <span className="text-[9px] font-bold text-white flex items-center gap-0.5">
            <span style={{ fontSize: 9 }}>❤️</span>{fmt(post.likesCount)}
          </span>
          <span className="text-[9px] font-bold text-white flex items-center gap-0.5">
            <span style={{ fontSize: 9 }}>💬</span>{fmt(post.commentsCount)}
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── MAIN CREATOR CARD ────────────────────────────────────────────────────────
// Default state: teaser content grid with creator info overlay
// Hovered state: slides up to show the full creator profile card

function CreatorCard({ creator, currentUserId }: { creator: CreatorCardData; currentUserId: string }) {
  const router = useRouter();
  const [hovered, setHovered]         = useState(false);
  const [isSubscribing, setSubscribing] = useState(false);
  const [isSubscribed, setSubscribed]  = useState(creator.isSubscribed);
  const teaserPosts = creator.teaserContent?.length
    ? creator.teaserContent
    : getMockTeaserPosts(creator.id);

  const rarity = getRarity(creator.subscriberCount);
  const r      = RARITY[rarity];

  async function handleSubscribe(tier: "standard" | "vip") {
    setSubscribing(true);
    try {
      const res = await fetch("/api/subscriptions/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ creatorId: creator.id, tier }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Failed");
      setSubscribed(true);
      router.refresh();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setSubscribing(false);
    }
  }

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="relative rounded-[18px] overflow-hidden transition-all duration-300 cursor-pointer"
      style={{
        background: "#1a1635",
        border: `1px solid ${hovered ? r.border : r.border.replace(/[\d.]+\)$/, "0.3)")}`,
        boxShadow: hovered
          ? `0 12px 40px ${r.glow}, 0 0 0 1px ${r.border}`
          : rarity === "legendary" ? `0 4px 20px ${r.glow}` : rarity === "epic" ? `0 2px 10px ${r.glow}` : "none",
        transform: hovered ? "translateY(-4px)" : "none",
        aspectRatio: "3/4",
      }}
    >
      {/* ── DEFAULT STATE: Teaser content grid ── */}
      <div
        className="absolute inset-0 transition-opacity duration-300"
        style={{ opacity: hovered ? 0 : 1 }}
      >
        {/* 2×2 content grid */}
        <div className="grid grid-cols-2 gap-0.5 h-[65%]">
          {teaserPosts.slice(0, 4).map((post, i) => (
            <TeaserTile key={post.id} post={post as any} size={i === 0 ? "large" : "small"} />
          ))}
        </div>

        {/* Creator info bar at bottom */}
        <div className="absolute bottom-0 left-0 right-0 p-3.5"
          style={{ background: "linear-gradient(to top, rgba(13,13,26,0.98) 0%, rgba(13,13,26,0.85) 60%, transparent 100%)" }}>
          <div className="flex items-center gap-2.5 mb-2">
            <Avatar creator={creator} rarity={rarity} size={36} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1">
                <p className="text-[13px] font-black text-[#f0eaff] truncate">{creator.name}</p>
                {creator.isVerified && (
                  <svg className="size-3.5 flex-shrink-0" viewBox="0 0 20 20" fill={r.color}>
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" />
                  </svg>
                )}
              </div>
              <p className="text-[10px]" style={{ color: "rgba(240,234,255,0.45)" }}>@{creator.username}</p>
            </div>
            <RarityBadge rarity={rarity} />
          </div>

          {/* Quick stats row */}
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-bold flex items-center gap-1" style={{ color: "rgba(240,234,255,0.5)" }}>
              <span>👥</span>
              <span style={{ color: r.color }}>{fmt(creator.subscriberCount)}</span>
            </span>
            <span className="text-[10px] font-bold flex items-center gap-1" style={{ color: "rgba(240,234,255,0.5)" }}>
              <span>📸</span>
              <span>{creator.postCount}</span>
            </span>
            <span className="ml-auto text-[10px] font-black" style={{ color: r.color }}>
              {creator.standardPrice === 0 ? "Free" : `$${creator.standardPrice.toFixed(2)}/mo`}
            </span>
          </div>
        </div>
      </div>

      {/* ── HOVERED STATE: Full creator profile card (slides up) ── */}
      <div
        className="absolute inset-0 flex flex-col transition-all duration-300"
        style={{ opacity: hovered ? 1 : 0, transform: hovered ? "translateY(0)" : "translateY(8px)" }}
      >
        {/* Cover banner */}
        <div className="relative h-28 overflow-hidden flex-shrink-0">
          {creator.coverImageUrl ? (
            
            <Image src={creator.coverImageUrl} alt="" fill className="object-cover" />
            
          ) : (
            <div className="w-full h-full"
              style={{ background: `linear-gradient(135deg, ${r.color}28, #13112b)` }} />
          )}
          {(rarity === "legendary" || rarity === "epic") && (
            <div className="absolute inset-0" style={{ background: `linear-gradient(to bottom, ${r.color}12, transparent 60%)` }} />
          )}
          <div className="absolute top-2.5 left-2.5"><RarityBadge rarity={rarity} /></div>
          {creator.subscriberCount > 0 && (
            <div className="absolute top-2.5 right-2.5 flex items-center gap-1 rounded-full px-2 py-0.5"
              style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)" }}>
              <span className="size-1.5 rounded-full bg-green-400 animate-pulse" />
              <span className="text-[9px] font-bold text-green-400">Online</span>
            </div>
          )}
        </div>

        {/* Avatar row */}
        <div className="relative px-4 -mt-5 flex items-end justify-between z-10">
          <Avatar creator={creator} rarity={rarity} size={52} />
          <div className="mb-1 text-right">
            <p className="text-[11px] font-black" style={{ color: r.color }}>{fmt(creator.subscriberCount)}</p>
            <p className="text-[9px]" style={{ color: "rgba(240,234,255,0.4)" }}>fans</p>
          </div>
        </div>

        {/* Info */}
        <div className="px-4 pt-1.5 pb-1 flex flex-col gap-0.5 flex-1">
          <div className="flex items-center gap-1.5">
            <h3 className="text-[14px] font-black text-[#f0eaff] truncate">{creator.name}</h3>
            {creator.isVerified && (
              <svg className="size-4 flex-shrink-0" viewBox="0 0 20 20" fill={r.color}>
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" />
              </svg>
            )}
          </div>
          <p className="text-[10px]" style={{ color: "rgba(240,234,255,0.4)" }}>@{creator.username}</p>
          {creator.bio && (
            <p className="text-[11px] leading-snug mt-1 line-clamp-2" style={{ color: "rgba(240,234,255,0.55)" }}>
              {creator.bio}
            </p>
          )}
          <div className="flex items-center gap-1 mt-1">
            <span className="text-[10px]" style={{ color: "rgba(240,234,255,0.35)" }}>📸 {creator.postCount} posts</span>
          </div>
        </div>

        {/* Subscribe buttons */}
        <div className="px-4 pb-4 flex flex-col gap-2 mt-auto">
          {isSubscribed ? (
            <>
              <button onClick={() => router.push(`/dashboard/user/message/${creator.userId}`)}
                className="w-full py-2 rounded-xl text-[12px] font-black text-white"
                style={{ background: "linear-gradient(135deg, #ef3976, #7c3aed)", boxShadow: "0 4px 14px rgba(239,57,118,0.3)" }}>
                💬 Send Message
              </button>
              <button onClick={() => router.push(`/${creator.username}`)}
                className="w-full py-2 rounded-xl text-[12px] font-black border"
                style={{ background: "rgba(255,255,255,0.04)", borderColor: "rgba(124,58,237,0.25)", color: "rgba(240,234,255,0.7)" }}>
                👤 View Profile
              </button>
            </>
          ) : (
            <>
              <button onClick={() => handleSubscribe("standard")} disabled={isSubscribing}
                className="w-full py-2 rounded-xl text-[12px] font-black transition-all"
                style={{
                  background: `linear-gradient(135deg, ${r.color}25, ${r.color}15)`,
                  border: `1px solid ${r.border}`,
                  color: r.color,
                  opacity: isSubscribing ? 0.6 : 1,
                }}>
                {isSubscribing ? "Subscribing…" : creator.standardPrice === 0 ? "Follow Free" : `Subscribe · $${creator.standardPrice.toFixed(2)}/mo`}
              </button>
              {creator.vipPrice > creator.standardPrice && (
                <button onClick={() => handleSubscribe("vip")} disabled={isSubscribing}
                  className="w-full py-2 rounded-xl text-[12px] font-black"
                  style={{ background: "rgba(251,191,36,0.1)", border: "1px solid rgba(251,191,36,0.3)", color: "#fbbf24", opacity: isSubscribing ? 0.6 : 1 }}>
                  ⭐ VIP · ${creator.vipPrice.toFixed(2)}/mo
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Shine for epic/legendary */}
      {r.shine && hovered && (
        <div className="absolute inset-0 pointer-events-none z-20 transition-opacity duration-500"
          style={{ background: `linear-gradient(135deg, ${r.color}05 0%, transparent 50%, ${r.color}03 100%)` }} />
      )}
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="rounded-[18px] overflow-hidden animate-pulse" style={{ background: "#1a1635", border: "1px solid rgba(124,58,237,0.1)", aspectRatio: "3/4" }}>
      <div className="grid grid-cols-2 gap-0.5 h-[65%]">
        {[...Array(4)].map((_, i) => <div key={i} style={{ background: "rgba(124,58,237,0.08)" }} />)}
      </div>
      <div className="p-4 flex flex-col gap-2">
        <div className="h-3 w-2/3 rounded-full" style={{ background: "rgba(124,58,237,0.1)" }} />
        <div className="h-2.5 w-1/3 rounded-full" style={{ background: "rgba(124,58,237,0.07)" }} />
      </div>
    </div>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

interface CreatorDiscoveryGridProps {
  creators: CreatorCardData[];
  currentUserId: string;
  total: number;
  currentPage: number;
}

export function CreatorDiscoveryGrid({ creators, currentUserId, total, currentPage }: CreatorDiscoveryGridProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setCategory] = useState("all");
  const [rarityFilter, setRarity]     = useState("all");
  const [sortBy, setSortBy]           = useState<SortOption>("trending");
  const [shuffled, setShuffled]       = useState<CreatorCardData[]>([]);

  // Shuffle creators on mount + when creators list changes
  useEffect(() => {
    const arr = [...creators];
    // Fisher-Yates shuffle
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    setShuffled(arr);
  }, [creators]);

  const filtered = shuffled
    .filter((c) => {
      const q = searchQuery.toLowerCase();
      if (q && !c.name.toLowerCase().includes(q) && !c.username.toLowerCase().includes(q)) return false;
      if (rarityFilter !== "all" && getRarity(c.subscriberCount) !== rarityFilter) return false;
      return true;
    })
    .sort((a, b) => {
      if (sortBy === "top")        return b.subscriberCount - a.subscriberCount;
      if (sortBy === "price_low")  return a.standardPrice - b.standardPrice;
      if (sortBy === "price_high") return b.standardPrice - a.standardPrice;
      if (sortBy === "free")       return a.standardPrice === 0 ? -1 : 1;
      return 0; // trending / new = keep shuffle order
    });

  return (
    <div className="w-full flex flex-col gap-6" style={{ fontFamily: "'Be Vietnam Pro', sans-serif", color: "#f0eaff" }}>

      {/* ── Hero header ── */}
      <div className="text-center py-4 relative">
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: "radial-gradient(ellipse 60% 80% at 50% 0%, rgba(239,57,118,0.07) 0%, transparent 70%)" }} />
        <h1 className="relative text-[26px] sm:text-[32px] font-black leading-tight">
          Find creators that you{" "}
          <span style={{ background: "linear-gradient(135deg, #ef3976, #7c3aed)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
            love
          </span>
        </h1>
        <p className="relative text-[12px] mt-1.5" style={{ color: "rgba(240,234,255,0.5)" }}>
          Hover any card to see creator details · Browse free preview content below
        </p>
      </div>

      {/* ── Search ── */}
      <div className="relative max-w-lg mx-auto w-full">
        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[14px]" style={{ color: "rgba(240,234,255,0.3)" }}>🔍</span>
        <input type="text" placeholder="Search creators…" value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full rounded-2xl border pl-10 pr-4 py-2.5 text-[13px] outline-none"
          style={{ background: "#1a1635", borderColor: "rgba(124,58,237,0.25)", color: "#f0eaff", fontFamily: "inherit" }} />
      </div>

      {/* ── Category pills ── */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {CATEGORIES.map((cat) => {
          const active = activeCategory === cat.id;
          return (
            <button key={cat.id} onClick={() => setCategory(cat.id)}
              className="flex items-center gap-1.5 rounded-full border px-4 py-1.5 text-[11px] font-black whitespace-nowrap flex-shrink-0 transition-all"
              style={active
                ? { background: "rgba(124,58,237,0.18)", borderColor: "#7c3aed", color: "#f0eaff", boxShadow: "0 0 10px rgba(124,58,237,0.22)" }
                : { background: "rgba(255,255,255,0.02)", borderColor: "rgba(124,58,237,0.14)", color: "rgba(240,234,255,0.5)" }
              }>
              <span className="text-[12px]">{cat.icon}</span>{cat.label}
            </button>
          );
        })}
      </div>

      {/* ── Filter + sort row ── */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex gap-1.5 flex-wrap">
          {RARITY_FILTERS.map((rf) => {
            const active = rarityFilter === rf.value;
            const r = rf.value !== "all" ? RARITY[rf.value as CreatorRarity] : null;
            return (
              <button key={rf.value} onClick={() => setRarity(rf.value)}
                className="flex items-center gap-1 rounded-full border px-3 py-1 text-[10px] font-black transition-all"
                style={active
                  ? { background: r ? r.badgeBg : "rgba(124,58,237,0.15)", borderColor: r ? r.border : "#7c3aed", color: r ? r.color : "#f0eaff" }
                  : { background: "transparent", borderColor: "rgba(124,58,237,0.1)", color: "rgba(240,234,255,0.38)" }
                }>
                {r && <span style={{ fontSize: 7, color: r.color }}>{r.icon}</span>}
                {rf.label}
              </button>
            );
          })}
        </div>
        <select value={sortBy} onChange={(e) => setSortBy(e.target.value as SortOption)}
          className="ml-auto rounded-xl border px-3 py-1.5 text-[11px] font-black outline-none"
          style={{ background: "#13112b", borderColor: "rgba(124,58,237,0.18)", color: "rgba(240,234,255,0.65)", fontFamily: "inherit" }}>
          {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <span className="text-[11px] font-bold" style={{ color: "rgba(240,234,255,0.3)" }}>
          {filtered.length} creator{filtered.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* ── Rarity legend ── */}
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-[9px] font-black uppercase tracking-widest" style={{ color: "rgba(240,234,255,0.28)" }}>Rarity:</span>
        {(["legendary", "epic", "rare", "common"] as CreatorRarity[]).map((r) => (
          <div key={r} className="flex items-center gap-1">
            <span style={{ color: RARITY[r].color, fontSize: 8 }}>{RARITY[r].icon}</span>
            <span className="text-[9px] font-bold" style={{ color: RARITY[r].color }}>{RARITY[r].label}</span>
          </div>
        ))}
        <span className="text-[9px]" style={{ color: "rgba(240,234,255,0.2)" }}>· Hover to see full profile</span>
      </div>

      {/* ── Grid ── */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-4 py-20">
          <span className="text-5xl">😔</span>
          <p className="text-[16px] font-bold" style={{ color: "rgba(240,234,255,0.4)" }}>No creators found</p>
          <button onClick={() => { setSearchQuery(""); setCategory("all"); setRarity("all"); setSortBy("trending"); }}
            className="text-[12px] font-black px-5 py-2.5 rounded-xl text-white"
            style={{ background: "linear-gradient(135deg, #7c3aed, #ef3976)" }}>
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filtered.map((creator) => (
            <CreatorCard key={creator.id} creator={creator} currentUserId={currentUserId} />
          ))}
        </div>
      )}
    </div>
  );
}