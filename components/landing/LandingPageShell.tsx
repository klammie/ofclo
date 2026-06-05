"use client";

import { useState, useEffect, useRef } from "react";
import { LandingNav } from "./LandingNav";

// ─── Theme ────────────────────────────────────────────────────────────────────
const P      = "#ef3976";
const V      = "#7c3aed";
const GRAD   = `linear-gradient(135deg, ${V} 0%, ${P} 100%)`;
const GRADR  = `linear-gradient(135deg, ${P} 0%, ${V} 100%)`;
const BG     = "#0d0d1a";
const SURF   = "#13112b";
const CARD   = "#1a1635";
const BORDER = "rgba(124,58,237,0.2)";
const TEXT   = "#f0eaff";
const MUTED  = "rgba(240,234,255,0.5)";

// ─── Animated counter ─────────────────────────────────────────────────────────
function Counter({ to, suffix = "" }: { to: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !started.current) {
        started.current = true;
        const duration = 1800;
        const steps = 60;
        let step = 0;
        const timer = setInterval(() => {
          step++;
          setCount(Math.round(to * (step / steps)));
          if (step >= steps) clearInterval(timer);
        }, duration / steps);
      }
    });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [to]);

  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>;
}

// ─── Creator card (for how it works / showcase) ───────────────────────────────
function CreatorShowcaseCard({ name, tag, rarity, color, subscribers, emoji }: {
  name: string; tag: string; rarity: string; color: string; subscribers: string; emoji: string;
}) {
  return (
    <div className="rounded-[18px] border overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl group"
      style={{ background: CARD, borderColor: color + "40", boxShadow: `0 4px 24px ${color}18` }}>
      {/* Banner */}
      <div className="h-24 relative overflow-hidden"
        style={{ background: `linear-gradient(135deg, ${color}30, ${V}20)` }}>
        <div className="absolute inset-0 flex items-center justify-center text-5xl opacity-20 group-hover:opacity-30 transition-opacity">
          {emoji}
        </div>
        <div className="absolute top-2.5 left-2.5 flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-black uppercase"
          style={{ background: color + "20", border: `1px solid ${color}50`, color }}>
          ◆ {rarity}
        </div>
      </div>
      {/* Avatar */}
      <div className="px-4 -mt-6 relative z-10">
        <div className="size-12 rounded-full flex items-center justify-center font-black text-white border-2 text-[16px]"
          style={{ background: `linear-gradient(135deg, ${color}60, ${V}40)`, borderColor: color }}>
          {name[0]}
        </div>
      </div>
      <div className="px-4 pt-2 pb-4">
        <div className="flex items-center gap-1.5 mb-0.5">
          <p className="text-[14px] font-black" style={{ color: TEXT }}>{name}</p>
          <svg className="size-4" viewBox="0 0 20 20" fill={color}>
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" />
          </svg>
        </div>
        <p className="text-[11px] mb-2" style={{ color: MUTED }}>{tag}</p>
        <p className="text-[10px] font-bold mb-3" style={{ color: color }}>{subscribers} subscribers</p>
        <button className="w-full py-2 rounded-xl text-[11px] font-black border transition-all group-hover:opacity-90"
          style={{ background: color + "18", borderColor: color + "40", color }}>
          Subscribe
        </button>
      </div>
    </div>
  );
}

// ─── Feature card ─────────────────────────────────────────────────────────────
function FeatureCard({ icon, title, description, color }: {
  icon: string; title: string; description: string; color: string;
}) {
  return (
    <div className="rounded-[20px] border p-6 flex flex-col gap-4 transition-all duration-300 hover:-translate-y-1"
      style={{ background: CARD, borderColor: color + "30", boxShadow: `0 4px 24px ${color}10` }}>
      <div className="size-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
        style={{ background: color + "18", border: `1px solid ${color}30` }}>
        {icon}
      </div>
      <div>
        <h3 className="text-[16px] font-black mb-2" style={{ color: TEXT }}>{title}</h3>
        <p className="text-[13px] leading-relaxed" style={{ color: MUTED }}>{description}</p>
      </div>
    </div>
  );
}

// ─── Stat card ────────────────────────────────────────────────────────────────
function StatCard({ value, suffix, label, color }: {
  value: number; suffix?: string; label: string; color: string;
}) {
  return (
    <div className="flex flex-col items-center gap-1 p-6 rounded-[20px] border"
      style={{ background: CARD, borderColor: color + "30" }}>
      <p className="text-[36px] font-black leading-none" style={{ color }}>
        <Counter to={value} suffix={suffix} />
      </p>
      <p className="text-[12px] font-bold uppercase tracking-wider" style={{ color: MUTED }}>{label}</p>
    </div>
  );
}

// ─── Fan Pass preview card ────────────────────────────────────────────────────
function FanPassPreview() {
  const rewards = [
    { level: 5,  free: "🪙 100 Coins",   vip: "🏅 Badge",         freeColor: "#94a3b8", vipColor: "#fbbf24" },
    { level: 10, free: "🎁 Mystery Box", vip: "👑 Elite Profile",  freeColor: "#38bdf8", vipColor: V         },
    { level: 15, free: "🪙 250 Coins",   vip: "✨ Exclusive Post", freeColor: "#94a3b8", vipColor: P         },
  ];

  return (
    <div className="rounded-[20px] border overflow-hidden"
      style={{ background: CARD, borderColor: BORDER }}>
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b"
        style={{ background: SURF, borderColor: BORDER }}>
        <div className="flex items-center gap-2">
          <span className="text-[16px]">🏆</span>
          <span className="text-[14px] font-black" style={{ color: TEXT }}>Fans Pass — Season 1</span>
        </div>
        <div className="flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-black"
          style={{ background: "rgba(239,57,118,0.15)", border: `1px solid rgba(239,57,118,0.3)`, color: P }}>
          🔥 14 Days Left
        </div>
      </div>

      {/* Track labels */}
      <div className="flex justify-between px-5 pt-4 pb-2">
        <span className="text-[9px] font-black uppercase tracking-widest" style={{ color: MUTED }}>Free Track</span>
        <span className="text-[9px] font-black uppercase tracking-widest" style={{ color: P }}>Premium Track</span>
      </div>

      {/* Reward rows */}
      <div className="relative px-5 pb-5 flex flex-col gap-5">
        <div className="absolute left-1/2 top-0 bottom-0 w-px -translate-x-1/2"
          style={{ background: `repeating-linear-gradient(to bottom, ${P}40 0, ${P}40 6px, transparent 6px, transparent 12px)` }} />

        {rewards.map((r) => (
          <div key={r.level} className="flex items-center justify-between gap-3">
            {/* Free side */}
            <div className="flex-1 flex justify-end">
              <div className="flex flex-col items-center gap-1 rounded-[14px] border p-3 w-28"
                style={{ background: "rgba(124,58,237,0.06)", borderColor: r.freeColor + "30" }}>
                <span className="text-[18px]">{r.free.split(" ")[0]}</span>
                <p className="text-[9px] font-bold text-center" style={{ color: r.freeColor }}>
                  {r.free.substring(r.free.indexOf(" ") + 1)}
                </p>
              </div>
            </div>

            {/* Level pill */}
            <div className="size-10 rounded-full flex items-center justify-center text-[12px] font-black z-10 flex-shrink-0"
              style={{ background: GRAD, color: "#fff", boxShadow: `0 0 12px rgba(124,58,237,0.4)` }}>
              {r.level}
            </div>

            {/* VIP side */}
            <div className="flex-1 flex justify-start">
              <div className="flex flex-col items-center gap-1 rounded-[14px] border p-3 w-28"
                style={{ background: "rgba(239,57,118,0.08)", borderColor: r.vipColor + "40" }}>
                <span className="text-[18px]">{r.vip.split(" ")[0]}</span>
                <p className="text-[9px] font-bold text-center" style={{ color: r.vipColor }}>
                  {r.vip.substring(r.vip.indexOf(" ") + 1)}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── MAIN LANDING PAGE ────────────────────────────────────────────────────────
export default function LandingPage() {
  return (
    <div style={{ background: BG, color: TEXT, fontFamily: "'Be Vietnam Pro', sans-serif", overflowX: "hidden" }}>

      {/* ── Shared landing nav ── */}
      <LandingNav anchored={true} />

      {/* ══════════════════════════════════════════════════════════════
          HERO
      ══════════════════════════════════════════════════════════════ */}
      <section className="relative min-h-screen flex items-center justify-center px-6 pt-24 pb-16 overflow-hidden">
        {/* Bg glows */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/4 w-[600px] h-[600px] rounded-full opacity-20"
            style={{ background: `radial-gradient(circle, ${V}, transparent 65%)`, transform: "translate(-30%, -30%)" }} />
          <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] rounded-full opacity-15"
            style={{ background: `radial-gradient(circle, ${P}, transparent 65%)`, transform: "translate(30%, 30%)" }} />
          {/* Grid pattern */}
          <div className="absolute inset-0 opacity-[0.03]"
            style={{ backgroundImage: `linear-gradient(${BORDER} 1px, transparent 1px), linear-gradient(90deg, ${BORDER} 1px, transparent 1px)`, backgroundSize: "48px 48px" }} />
        </div>

        <div className="relative z-10 max-w-5xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 rounded-full px-4 py-2 mb-8 border text-[12px] font-black"
            style={{ background: "rgba(124,58,237,0.12)", borderColor: V + "50", color: V }}>
            <span className="size-1.5 rounded-full animate-pulse" style={{ background: V }} />
            The creator platform built for real fans
          </div>

          {/* Headline */}
          <h1 className="text-[48px] sm:text-[64px] lg:text-[76px] font-black leading-[1.05] tracking-tight mb-6">
            Where Fans and<br />
            <span style={{
              background: GRAD,
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}>Creators Connect</span>
          </h1>

          <p className="text-[17px] sm:text-[19px] leading-relaxed max-w-2xl mx-auto mb-10"
            style={{ color: MUTED }}>
            Subscribe to your favourite creators, earn rewards with the Fan Pass,
            spend coins in the shop — and get rewarded just for showing up.
          </p>

          {/* CTA buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <a href="/signup"
              className="flex items-center gap-2 px-8 py-4 rounded-2xl text-[15px] font-black text-white transition-all hover:scale-105"
              style={{ background: GRAD, boxShadow: "0 8px 32px rgba(124,58,237,0.4)", textDecoration: "none" }}>
              Start for Free
              <span style={{ fontSize: 18 }}>→</span>
            </a>
            <a href="/login"
              className="flex items-center gap-2 px-8 py-4 rounded-2xl text-[15px] font-black border transition-all hover:scale-105"
              style={{ borderColor: BORDER, color: TEXT, textDecoration: "none",
                       background: "rgba(255,255,255,0.03)" }}>
              Explore Creators
              <span style={{ fontSize: 16 }}>✨</span>
            </a>
          </div>

          {/* Social proof */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-2 text-[13px]"
            style={{ color: MUTED }}>
            <div className="flex -space-x-2">
              {["#ef3976", "#7c3aed", "#38bdf8", "#4ade80", "#fbbf24"].map((c, i) => (
                <div key={i} className="size-8 rounded-full border-2 flex items-center justify-center font-black text-[10px] text-white"
                  style={{ background: c, borderColor: BG }}>
                  {["A", "K", "J", "E", "R"][i]}
                </div>
              ))}
            </div>
            <span>Join <strong style={{ color: TEXT }}>50,000+</strong> fans already on the platform</span>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          STATS
      ══════════════════════════════════════════════════════════════ */}
      <section className="py-16 px-6" style={{ background: SURF }}>
        <div className="max-w-5xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatCard value={50000}  suffix="+"  label="Active Fans"        color={P} />
          <StatCard value={2400}   suffix="+"  label="Creators"           color={V} />
          <StatCard value={180000} suffix="+"  label="Subscriptions"      color="#38bdf8" />
          <StatCard value={4800000} suffix="+" label="Coins Distributed"  color="#fbbf24" />
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          CREATOR SHOWCASE
      ══════════════════════════════════════════════════════════════ */}
      <section id="creators" className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-[11px] font-black uppercase tracking-[0.2em] mb-3" style={{ color: V }}>
              Creator Rarities
            </p>
            <h2 className="text-[36px] sm:text-[44px] font-black leading-tight mb-4">
              Find creators you'll{" "}
              <span style={{ background: GRAD, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
                love
              </span>
            </h2>
            <p className="text-[15px] max-w-xl mx-auto" style={{ color: MUTED }}>
              Every creator earns a rarity tier based on their community. Discover
              common, rare, epic and legendary creators.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <CreatorShowcaseCard name="Alysia Megan"  tag="Lifestyle & Wellness"  rarity="Legendary" color="#fbbf24" subscribers="42.1k" emoji="✨" />
            <CreatorShowcaseCard name="Kira Shanon"   tag="Art & Fashion"         rarity="Epic"      color="#a78bfa" subscribers="8.2k"  emoji="🎨" />
            <CreatorShowcaseCard name="Jasun Luv"     tag="Gaming & Entertainment" rarity="Rare"     color="#38bdf8" subscribers="1.2k"  emoji="🎮" />
            <CreatorShowcaseCard name="Nova Dreams"   tag="Music & Vibes"         rarity="Common"    color="#94a3b8" subscribers="45"    emoji="🎵" />
          </div>

          {/* Rarity legend */}
          <div className="flex flex-wrap justify-center gap-6 mt-10">
            {[
              { label: "Common",    color: "#94a3b8", desc: "Up to 99 fans"    },
              { label: "Rare",      color: "#38bdf8", desc: "100 – 999 fans"   },
              { label: "Epic",      color: "#a78bfa", desc: "1k – 9.9k fans"   },
              { label: "Legendary", color: "#fbbf24", desc: "10k+ fans"        },
            ].map((r) => (
              <div key={r.label} className="flex items-center gap-2">
                <span style={{ color: r.color, fontSize: 10 }}>◆</span>
                <span className="text-[12px] font-black" style={{ color: r.color }}>{r.label}</span>
                <span className="text-[11px]" style={{ color: MUTED }}>{r.desc}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          FEATURES
      ══════════════════════════════════════════════════════════════ */}
      <section id="features" className="py-24 px-6" style={{ background: SURF }}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-[11px] font-black uppercase tracking-[0.2em] mb-3" style={{ color: P }}>
              Everything you need
            </p>
            <h2 className="text-[36px] sm:text-[44px] font-black leading-tight">
              Built for fans. Built for creators.
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            <FeatureCard icon="🎟️" color={P}        title="Fan Pass"
              description="Battle-pass style reward track. Earn XP from daily quests, login streaks and activity. Free and VIP tracks with exclusive rewards at every level." />
            <FeatureCard icon="💰" color="#fbbf24"   title="Coin Economy"
              description="Earn coins through quests and streaks. Spend them in the shop on badges, boosters, streak freezes, mystery boxes and more." />
            <FeatureCard icon="🏪" color={V}         title="Fan Shop"
              description="A full coin-powered shop. Buy XP boosters, profile badges, gifts to send creators, and VIP passes — all with coins you've earned." />
            <FeatureCard icon="🔥" color="#fb923c"   title="Login Streaks"
              description="Daily login bonuses that reward consistency. Hit 3, 7, 14 and 30-day milestones for big coin and XP drops. Protect your streak with freezes." />
            <FeatureCard icon="💬" color="#38bdf8"   title="Direct Messaging"
              description="Chat directly with your favourite creators. Subscribers get priority messaging and creators can send exclusive DMs to their top fans." />
            <FeatureCard icon="💳" color="#4ade80"   title="Built-in Wallet"
              description="Deposit with card or crypto (BTC, ETH, USDT and more). Withdraw earnings via bank transfer or crypto. Full transaction history." />
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          FAN PASS PREVIEW
      ══════════════════════════════════════════════════════════════ */}
      <section id="fan-pass" className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.2em] mb-3" style={{ color: V }}>
                Fan Pass System
              </p>
              <h2 className="text-[36px] sm:text-[44px] font-black leading-tight mb-5">
                Your fandom{" "}
                <span style={{ background: GRAD, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
                  earns rewards
                </span>
              </h2>
              <p className="text-[15px] leading-relaxed mb-8" style={{ color: MUTED }}>
                Like a battle pass but for being a fan. Complete daily quests, maintain
                your login streak and level up through the season to unlock exclusive
                badges, coins and content — or go VIP for instant access to every reward.
              </p>
              <div className="flex flex-col gap-4">
                {[
                  { icon: "⚡", label: "Earn XP from every action", color: "#fbbf24" },
                  { icon: "🎁", label: "Unlock rewards at every level", color: P      },
                  { icon: "💎", label: "VIP track with exclusive perks", color: V     },
                  { icon: "🔥", label: "Daily login streak bonuses",     color: "#fb923c" },
                ].map((f) => (
                  <div key={f.label} className="flex items-center gap-3">
                    <div className="size-8 rounded-xl flex items-center justify-center text-[14px]"
                      style={{ background: f.color + "18", border: `1px solid ${f.color}30` }}>
                      {f.icon}
                    </div>
                    <span className="text-[14px] font-bold" style={{ color: TEXT }}>{f.label}</span>
                  </div>
                ))}
              </div>
              <a href="/signup"
                className="inline-flex items-center gap-2 mt-8 px-6 py-3 rounded-xl text-[13px] font-black text-white"
                style={{ background: GRAD, boxShadow: "0 4px 20px rgba(124,58,237,0.35)", textDecoration: "none" }}>
                Start Earning Rewards →
              </a>
            </div>
            <div>
              <FanPassPreview />
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          FOR CREATORS
      ══════════════════════════════════════════════════════════════ */}
      <section className="py-24 px-6" style={{ background: SURF }}>
        <div className="max-w-6xl mx-auto">
          <div className="rounded-[28px] border overflow-hidden relative"
            style={{ background: `linear-gradient(135deg, rgba(124,58,237,0.15) 0%, rgba(239,57,118,0.1) 100%)`, borderColor: BORDER }}>
            <div className="absolute inset-0 pointer-events-none"
              style={{ background: `radial-gradient(ellipse 70% 60% at 80% 50%, rgba(239,57,118,0.08), transparent)` }} />
            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-0">
              <div className="p-10 lg:p-14">
                <p className="text-[11px] font-black uppercase tracking-[0.2em] mb-3" style={{ color: P }}>
                  For Creators
                </p>
                <h2 className="text-[32px] sm:text-[40px] font-black leading-tight mb-5">
                  Turn your passion<br />into a business
                </h2>
                <p className="text-[15px] leading-relaxed mb-8" style={{ color: MUTED }}>
                  Set your own subscription price. Keep 80% of everything you earn.
                  Get paid via bank transfer or crypto. Your fans, your rules.
                </p>
                <div className="grid grid-cols-2 gap-4 mb-8">
                  {[
                    { value: "80%",    label: "You keep",          color: "#4ade80" },
                    { value: "$20",    label: "Min withdrawal",    color: "#fbbf24" },
                    { value: "1-3d",   label: "Payout speed",      color: "#38bdf8" },
                    { value: "∞",      label: "Subscriber limit",  color: V        },
                  ].map((s) => (
                    <div key={s.label} className="rounded-[14px] border p-3"
                      style={{ background: "rgba(255,255,255,0.04)", borderColor: BORDER }}>
                      <p className="text-[22px] font-black leading-none" style={{ color: s.color }}>{s.value}</p>
                      <p className="text-[10px] font-bold mt-1" style={{ color: MUTED }}>{s.label}</p>
                    </div>
                  ))}
                </div>
                <a href="/dashboard/user/apply-creator"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-[13px] font-black text-white"
                  style={{ background: GRAD, boxShadow: "0 4px 20px rgba(239,57,118,0.3)", textDecoration: "none" }}>
                  Apply to Become a Creator →
                </a>
              </div>

              {/* Right: steps */}
              <div className="p-10 lg:p-14 border-t lg:border-t-0 lg:border-l" style={{ borderColor: BORDER }}>
                <h3 className="text-[16px] font-black mb-6" style={{ color: TEXT }}>How it works</h3>
                <div className="flex flex-col gap-5">
                  {[
                    { n: "01", title: "Apply",        desc: "Submit your identity verification and creator profile." },
                    { n: "02", title: "Get Approved",  desc: "Our team reviews your application within 1-3 business days." },
                    { n: "03", title: "Set Your Price",desc: "Choose your standard and VIP subscription prices." },
                    { n: "04", title: "Get Paid",      desc: "Earn monthly. Withdraw to your bank or crypto wallet anytime." },
                  ].map((step) => (
                    <div key={step.n} className="flex items-start gap-4">
                      <div className="size-9 rounded-xl flex items-center justify-center text-[11px] font-black flex-shrink-0"
                        style={{ background: GRAD, color: "#fff" }}>
                        {step.n}
                      </div>
                      <div>
                        <p className="text-[13px] font-black" style={{ color: TEXT }}>{step.title}</p>
                        <p className="text-[12px] mt-0.5" style={{ color: MUTED }}>{step.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          PRICING
      ══════════════════════════════════════════════════════════════ */}
      <section id="pricing" className="py-24 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-[11px] font-black uppercase tracking-[0.2em] mb-3" style={{ color: V }}>Pricing</p>
            <h2 className="text-[36px] sm:text-[44px] font-black leading-tight mb-4">Free to join.<br />Pay to unlock more.</h2>
            <p className="text-[15px]" style={{ color: MUTED }}>Start for free. Upgrade when you're ready for the full experience.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Free */}
            <div className="rounded-[24px] border p-8 flex flex-col gap-5"
              style={{ background: CARD, borderColor: BORDER }}>
              <div>
                <p className="text-[11px] font-black uppercase tracking-widest mb-2" style={{ color: MUTED }}>Free Fan</p>
                <p className="text-[40px] font-black leading-none" style={{ color: TEXT }}>$0</p>
                <p className="text-[12px] mt-1" style={{ color: MUTED }}>Forever free</p>
              </div>
              <div className="h-px" style={{ background: BORDER }} />
              <ul className="flex flex-col gap-3">
                {[
                  "Browse all creators",
                  "Subscribe to creators",
                  "Free track Fan Pass rewards",
                  "Daily login streak bonuses",
                  "Earn coins through quests",
                  "Basic fan shop access",
                ].map((f) => (
                  <li key={f} className="flex items-center gap-2 text-[13px]" style={{ color: MUTED }}>
                    <span style={{ color: "#4ade80" }}>✓</span> {f}
                  </li>
                ))}
              </ul>
              <a href="/signup"
                className="mt-auto w-full text-center py-3 rounded-xl text-[13px] font-black border transition-all"
                style={{ borderColor: BORDER, color: TEXT, textDecoration: "none" }}>
                Get Started Free
              </a>
            </div>

            {/* VIP */}
            <div className="rounded-[24px] border p-8 flex flex-col gap-5 relative overflow-hidden"
              style={{ background: `linear-gradient(160deg, rgba(124,58,237,0.18) 0%, ${CARD} 60%)`, borderColor: V + "60", boxShadow: `0 8px 40px rgba(124,58,237,0.2)` }}>
              <div className="absolute top-4 right-4 text-[10px] font-black px-2.5 py-1 rounded-full"
                style={{ background: GRAD, color: "#fff" }}>
                MOST POPULAR
              </div>
              <div>
                <p className="text-[11px] font-black uppercase tracking-widest mb-2" style={{ color: V }}>VIP Fan Pass</p>
                <div className="flex items-baseline gap-1">
                  <p className="text-[40px] font-black leading-none" style={{ color: TEXT }}>$9.99</p>
                  <span className="text-[13px]" style={{ color: MUTED }}>/month</span>
                </div>
                <p className="text-[12px] mt-1" style={{ color: MUTED }}>Or 5,000 coins</p>
              </div>
              <div className="h-px" style={{ background: BORDER }} />
              <ul className="flex flex-col gap-3">
                {[
                  "Everything in Free",
                  "VIP reward track unlocked",
                  "2× XP multiplier on all tasks",
                  "Instant reward unlocks",
                  "Exclusive VIP badges & emotes",
                  "Priority messaging",
                  "Early campaign access",
                ].map((f) => (
                  <li key={f} className="flex items-center gap-2 text-[13px]" style={{ color: TEXT }}>
                    <span style={{ color: P }}>✓</span> {f}
                  </li>
                ))}
              </ul>
              <a href="/signup"
                className="mt-auto w-full text-center py-3 rounded-xl text-[13px] font-black text-white transition-all"
                style={{ background: GRAD, boxShadow: "0 4px 20px rgba(124,58,237,0.35)", textDecoration: "none" }}>
                Get VIP Pass
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          CTA FOOTER BANNER
      ══════════════════════════════════════════════════════════════ */}
      <section className="py-24 px-6" style={{ background: SURF }}>
        <div className="max-w-3xl mx-auto text-center">
          <div className="rounded-[28px] border p-12 relative overflow-hidden"
            style={{ background: `linear-gradient(135deg, rgba(124,58,237,0.2) 0%, rgba(239,57,118,0.15) 100%)`, borderColor: BORDER }}>
            <div className="absolute inset-0 pointer-events-none"
              style={{ background: `radial-gradient(ellipse 80% 80% at 50% 50%, rgba(124,58,237,0.1), transparent)` }} />
            <div className="relative z-10">
              <h2 className="text-[36px] sm:text-[48px] font-black leading-tight mb-4">
                Ready to join{" "}
                <span style={{ background: GRAD, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
                  Fanzluv?
                </span>
              </h2>
              <p className="text-[16px] mb-8" style={{ color: MUTED }}>
                Join thousands of fans already earning rewards and connecting with their favourite creators.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <a href="/signup"
                  className="px-8 py-4 rounded-2xl text-[15px] font-black text-white transition-all hover:scale-105"
                  style={{ background: GRAD, boxShadow: "0 8px 32px rgba(124,58,237,0.4)", textDecoration: "none" }}>
                  Create Your Free Account
                </a>
                <a href="/login"
                  className="px-8 py-4 rounded-2xl text-[15px] font-black border transition-all hover:scale-105"
                  style={{ borderColor: BORDER, color: TEXT, textDecoration: "none" }}>
                  Sign In
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="py-12 px-6 border-t" style={{ borderColor: BORDER }}>
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2.5">
              <div className="size-8 rounded-xl flex items-center justify-center font-black text-white text-sm"
                style={{ background: GRAD }}>F</div>
              <span className="text-[17px] font-black" style={{ color: TEXT }}>Fanzluv</span>
            </div>
            <div className="flex flex-wrap justify-center gap-6">
              {["Terms", "Privacy", "Content Policy", "Support", "Blog"].map((link) => (
                <a key={link} href="#"
                  className="text-[12px] font-bold transition-colors"
                  style={{ color: MUTED, textDecoration: "none" }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = TEXT)}
                  onMouseLeave={(e) => (e.currentTarget.style.color = MUTED)}>
                  {link}
                </a>
              ))}
            </div>
            <p className="text-[11px]" style={{ color: "rgba(240,234,255,0.25)" }}>
              © {new Date().getFullYear()} Fanzluv
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}