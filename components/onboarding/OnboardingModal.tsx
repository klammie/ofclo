"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

const V      = "#7c3aed";
const P      = "#ef3976";
const GRAD   = `linear-gradient(135deg, ${V}, ${P})`;
const CARD   = "#1a1635";
const SURF   = "#13112b";
const BORDER = "rgba(124,58,237,0.18)";
const TEXT   = "#f0eaff";
const MUTED  = "rgba(240,234,255,0.45)";

const STEPS = [
  {
    icon:     "👋",
    title:    "Welcome to Fanzluv!",
    subtitle: "Your all-in-one fan platform",
    body:     "Connect with your favorite creators, unlock exclusive content, earn rewards, and so much more. Let's take a quick tour so you know your way around.",
    cta:      "Let's go →",
    color:    V,
    bg:       "rgba(124,58,237,0.12)",
    border:   "rgba(124,58,237,0.3)",
    href:     null,
  },
  {
    icon:     "🏠",
    title:    "Your Feed",
    subtitle: "/dashboard/user/feed",
    body:     "This is your home base. See the latest posts from every creator you're subscribed to — photos, videos, exclusive drops — all in one place, in real time.",
    cta:      "Got it →",
    color:    "#38bdf8",
    bg:       "rgba(56,189,248,0.08)",
    border:   "rgba(56,189,248,0.25)",
    href:     "/dashboard/user/feed",
  },
  {
    icon:     "🔍",
    title:    "Discover Creators",
    subtitle: "/dashboard/user/discover",
    body:     "Find new creators to follow. Browse by category, see trending profiles, and discover exclusive content from creators you'll love.",
    cta:      "Got it →",
    color:    "#a78bfa",
    bg:       "rgba(167,139,250,0.08)",
    border:   "rgba(167,139,250,0.25)",
    href:     "/dashboard/user/discover",
  },
  {
    icon:     "⭐",
    title:    "Subscriptions",
    subtitle: "/dashboard/user/subscriptions",
    body:     "Manage all your active subscriptions in one place. See renewal dates, message creators directly, and switch between Standard and VIP tiers anytime.",
    cta:      "Got it →",
    color:    "#fbbf24",
    bg:       "rgba(251,191,36,0.08)",
    border:   "rgba(251,191,36,0.25)",
    href:     "/dashboard/user/subscriptions",
  },
  {
    icon:     "🎟️",
    title:    "Fan Pass",
    subtitle: "/dashboard/user/fan-pass",
    body:     "Complete daily quests, earn XP, level up your Fan Pass and unlock exclusive rewards — badges, mystery boxes, coin boosts, and creator content drops.",
    cta:      "Got it →",
    color:    "#4ade80",
    bg:       "rgba(74,222,128,0.08)",
    border:   "rgba(74,222,128,0.25)",
    href:     "/dashboard/user/fan-pass",
  },
  {
    icon:     "💬",
    title:    "Messages",
    subtitle: "/dashboard/user/message",
    body:     "DM your favorite creators directly. Send messages, share reactions, and build a real connection — subscribers get priority responses.",
    cta:      "Got it →",
    color:    "#f472b6",
    bg:       "rgba(244,114,182,0.08)",
    border:   "rgba(244,114,182,0.25)",
    href:     "/dashboard/user/message",
  },
  {
    icon:     "💳",
    title:    "Wallet",
    subtitle: "/dashboard/user/wallet",
    body:     "Add funds, buy coins, and manage your balance. Coins are used to tip creators, buy gifts from the shop, and unlock pay-per-view content.",
    cta:      "Got it →",
    color:    "#34d399",
    bg:       "rgba(52,211,153,0.08)",
    border:   "rgba(52,211,153,0.25)",
    href:     "/dashboard/user/wallet",
  },
  {
    icon:     "🛍️",
    title:    "Fan Shop",
    subtitle: "/dashboard/user/shop",
    body:     "Spend your coins on gifts for creators, mystery boxes, XP boosters, badges and more. Items you buy go straight into your inventory.",
    cta:      "Got it →",
    color:    P,
    bg:       "rgba(239,57,118,0.08)",
    border:   "rgba(239,57,118,0.25)",
    href:     "/dashboard/user/shop",
  },
  {
    icon:     "🎉",
    title:    "You're all set!",
    subtitle: "Time to explore",
    body:     "That's everything you need to know to get started. Head to your feed, discover some creators, and start your fan journey. Welcome to Fanzluv!",
    cta:      "Start exploring →",
    color:    V,
    bg:       "rgba(124,58,237,0.12)",
    border:   "rgba(124,58,237,0.3)",
    href:     "/dashboard/user/feed",
  },
];

interface OnboardingModalProps {
  onComplete: () => void;
}

export function OnboardingModal({ onComplete }: OnboardingModalProps) {
  const router  = useRouter();
  const [step,  setStep]    = useState(0);
  const [exiting, setExiting] = useState(false);
  const [animDir, setAnimDir] = useState<"forward" | "back">("forward");
  const [visible, setVisible] = useState(false);

  const current = STEPS[step];
  const isLast  = step === STEPS.length - 1;
  const isFirst = step === 0;

  // Fade in on mount
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 50);
    return () => clearTimeout(t);
  }, []);

  const markComplete = useCallback(async () => {
  await fetch("/api/user/onboarding-complete", { method: "POST" }).catch(() => {});
  router.refresh(); // ← forces layout to re-run and read updated DB value
  onComplete();
}, [onComplete, router]);

  const handleNext = useCallback(async () => {
    if (isLast) {
      setExiting(true);
      setTimeout(async () => {
        await markComplete();
        router.push("/dashboard/user/feed");
      }, 300);
      return;
    }
    setAnimDir("forward");
    setStep((s) => s + 1);
  }, [isLast, markComplete, router]);

  const handleBack = useCallback(() => {
    if (isFirst) return;
    setAnimDir("back");
    setStep((s) => s - 1);
  }, [isFirst]);

  const handleSkip = useCallback(async () => {
    setExiting(true);
    setTimeout(async () => {
      await markComplete();
    }, 300);
  }, [markComplete]);

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "Enter") handleNext();
      if (e.key === "ArrowLeft")  handleBack();
      if (e.key === "Escape")     handleSkip();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [handleNext, handleBack, handleSkip]);

  const progress = ((step) / (STEPS.length - 1)) * 100;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{
        background:   "rgba(0,0,0,0.92)",
        backdropFilter: "blur(16px)",
        opacity:      visible && !exiting ? 1 : 0,
        transition:   "opacity 0.3s ease",
      }}
    >
      <div
        className="w-full max-w-md flex flex-col overflow-hidden"
        style={{
          background:   CARD,
          border:       `1px solid ${current.border}`,
          borderRadius: 28,
          boxShadow:    `0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px ${current.color}15`,
          transform:    visible && !exiting ? "scale(1) translateY(0)" : "scale(0.95) translateY(16px)",
          transition:   "transform 0.35s cubic-bezier(0.175,0.885,0.32,1.275), border-color 0.3s ease, box-shadow 0.3s ease",
          fontFamily:   "'Be Vietnam Pro', sans-serif",
        }}
      >
        {/* Progress bar */}
        <div className="h-1 w-full" style={{ background: "rgba(255,255,255,0.05)" }}>
          <div
            className="h-full transition-all duration-500 ease-out"
            style={{ width: `${progress}%`, background: GRAD }}
          />
        </div>

        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4 border-b"
          style={{ borderColor: BORDER, background: SURF }}
        >
          <div className="flex items-center gap-2">
            {/* Step dots */}
            <div className="flex items-center gap-1">
              {STEPS.map((_, i) => (
                <button
                  key={i}
                  onClick={() => { setAnimDir(i > step ? "forward" : "back"); setStep(i); }}
                  className="transition-all duration-300"
                  style={{
                    width:        i === step ? 16 : 6,
                    height:       6,
                    borderRadius: 999,
                    background:   i === step ? current.color : i < step ? `${current.color}60` : "rgba(255,255,255,0.1)",
                  }}
                />
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-[10px] font-bold" style={{ color: MUTED }}>
              {step + 1} / {STEPS.length}
            </span>
            <button
              onClick={handleSkip}
              className="text-[11px] font-black px-3 py-1 rounded-lg border transition-all hover:opacity-80"
              style={{ background: "transparent", borderColor: BORDER, color: MUTED }}
            >
              Skip tour
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 flex flex-col items-center gap-5 text-center">
          {/* Icon */}
          <div
            className="size-20 rounded-[24px] flex items-center justify-center text-[42px] transition-all duration-300"
            style={{
              background: current.bg,
              border:     `2px solid ${current.border}`,
              boxShadow:  `0 8px 32px ${current.color}25`,
            }}
          >
            {current.icon}
          </div>

          {/* Title */}
          <div className="flex flex-col gap-1">
            <h2 className="text-[22px] font-black leading-tight" style={{ color: TEXT }}>
              {current.title}
            </h2>
            {current.subtitle && current.subtitle.startsWith("/") ? (
              <p className="text-[11px] font-black rounded-full px-3 py-0.5 self-center"
                style={{ background: `${current.color}15`, color: current.color }}>
                {current.subtitle}
              </p>
            ) : (
              <p className="text-[13px] font-bold" style={{ color: current.color }}>
                {current.subtitle}
              </p>
            )}
          </div>

          {/* Body */}
          <p className="text-[14px] leading-relaxed" style={{ color: MUTED }}>
            {current.body}
          </p>

          {/* Feature highlight strip — shown on feature steps (not first/last) */}
          {!isFirst && !isLast && (
            <div
              className="w-full rounded-[14px] border px-4 py-3 flex items-center gap-3 text-left"
              style={{ background: `${current.color}0a`, borderColor: `${current.color}30` }}
            >
              <span className="text-[20px] flex-shrink-0">{current.icon}</span>
              <p className="text-[11px] font-bold leading-snug" style={{ color: `${current.color}dd` }}>
                {getFeatureTip(step)}
              </p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div
          className="flex items-center gap-3 px-5 py-4 border-t"
          style={{ borderColor: BORDER, background: SURF }}
        >
          {/* Back */}
          <button
            onClick={handleBack}
            disabled={isFirst}
            className="flex-shrink-0 size-10 rounded-xl flex items-center justify-center border transition-all"
            style={{
              background:  "transparent",
              borderColor: isFirst ? "transparent" : BORDER,
              color:       isFirst ? "transparent" : MUTED,
              cursor:      isFirst ? "default" : "pointer",
            }}
          >
            ←
          </button>

          {/* Next / Finish */}
          <button
            onClick={handleNext}
            className="flex-1 py-3 rounded-xl text-[13px] font-black text-white transition-all hover:opacity-90 active:scale-[0.98]"
            style={{
              background: `linear-gradient(135deg, ${current.color}, ${isLast ? P : current.color}dd)`,
              boxShadow:  `0 6px 20px ${current.color}40`,
            }}
          >
            {current.cta}
          </button>
        </div>

        {/* Keyboard hint */}
        <p className="text-center pb-3 text-[9px] font-bold" style={{ color: "rgba(240,234,255,0.15)" }}>
          ← → arrow keys to navigate · Esc to skip
        </p>
      </div>
    </div>
  );
}

// ─── Feature tips shown in the highlight strip ────────────────────────────────
function getFeatureTip(step: number): string {
  const tips: Record<number, string> = {
    1: "Scroll through posts, double-tap to like, and tap any post to view it fullscreen.",
    2: "Filter by category, search by name, and subscribe directly from the discover page.",
    3: "Your subscriptions auto-renew monthly. You'll get a reminder 3 days before expiry.",
    4: "Daily quests reset every 24 hours. Complete them to earn XP and level up your Fan Pass.",
    5: "Subscribed fans get priority DMs. Some creators offer exclusive chat content too.",
    6: "Coins never expire. Add funds once and spend them across gifts, tips, and PPV content.",
    7: "Gifted items appear on the post for everyone to see. Send gifts from the post itself.",
  };
  return tips[step] ?? "";
}