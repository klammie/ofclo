"use client";

// components/status/StatusTierUpOverlay.tsx
//
// Detects when the user's overall status tier changes (Explorer → Supporter →
// Fanatic → Presidential) and shows a full-screen celebration overlay.
// Drop this near the root of your dashboard layout and pass the user's
// current statusXp — it tracks the previous tier via localStorage so it only
// fires once per actual tier-up.

import { useState, useEffect, useRef } from "react";
import { STATUS_TIERS, getTierFromXp } from "@/components/status/StatusModal";

interface StatusTierUpOverlayProps {
  statusXp: number;
}

export function StatusTierUpOverlay({ statusXp }: StatusTierUpOverlayProps) {
  const [show, setShow]         = useState(false);
  const [fromTier, setFromTier] = useState<typeof STATUS_TIERS[0] | null>(null);
  const [toTier,   setToTier]   = useState<typeof STATUS_TIERS[0] | null>(null);
  const initialized = useRef(false);

  useEffect(() => {
    const currentTier = getTierFromXp(statusXp);
    const storageKey  = "status_last_tier_id";
    const lastSeenId  = localStorage.getItem(storageKey);

    if (!initialized.current) {
      initialized.current = true;
      if (!lastSeenId) {
        localStorage.setItem(storageKey, currentTier.id);
      } else if (lastSeenId !== currentTier.id) {
        const lastTier = STATUS_TIERS.find((t) => t.id === lastSeenId);
        const lastIdx  = lastTier ? STATUS_TIERS.findIndex((t) => t.id === lastTier.id) : -1;
        const curIdx   = STATUS_TIERS.findIndex((t) => t.id === currentTier.id);
        // Only celebrate UPGRADES, never downgrades (shouldn't happen, but just in case)
        if (curIdx > lastIdx) {
          setFromTier(lastTier ?? STATUS_TIERS[0]);
          setToTier(currentTier);
          setShow(true);
        }
        localStorage.setItem(storageKey, currentTier.id);
      }
      return;
    }

    if (lastSeenId !== currentTier.id) {
      const lastTier = STATUS_TIERS.find((t) => t.id === lastSeenId);
      const lastIdx  = lastTier ? STATUS_TIERS.findIndex((t) => t.id === lastTier.id) : -1;
      const curIdx   = STATUS_TIERS.findIndex((t) => t.id === currentTier.id);
      if (curIdx > lastIdx) {
        setFromTier(lastTier ?? STATUS_TIERS[0]);
        setToTier(currentTier);
        setShow(true);
      }
      localStorage.setItem(storageKey, currentTier.id);
    }
  }, [statusXp]);

  if (!show || !toTier) return null;

  const isPresidential = toTier.id === "presidential";

  return (
    <div className="fixed inset-0 z-[75] flex items-center justify-center p-4"
      style={{ background: "rgba(13,13,26,0.94)", backdropFilter: "blur(10px)" }}
      onClick={() => setShow(false)}>

      <div className="relative flex flex-col items-center gap-5 text-center max-w-sm"
        style={{ animation: "tierUpPop 0.6s cubic-bezier(0.175,0.885,0.32,1.5) forwards" }}
        onClick={(e) => e.stopPropagation()}>

        {/* Radial glow */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ top: -40 }}>
          <div style={{
            width: 320, height: 320, borderRadius: "50%",
            background: `radial-gradient(circle, ${toTier.glow} 0%, transparent 70%)`,
            animation: "tierGlowPulse 2s ease-in-out infinite",
          }} />
        </div>

        {/* Particle ring for Presidential — extra fanfare */}
        {isPresidential && <PresidentialParticles color={toTier.color} />}

        {/* Tier transition */}
        <div className="relative z-10 flex items-center gap-4">
          {fromTier && (
            <>
              <div className="flex flex-col items-center opacity-40">
                <div className="size-14 rounded-full flex items-center justify-center text-[22px] border-2"
                  style={{ borderColor: fromTier.border, background: fromTier.bg }}>
                  {fromTier.emoji}
                </div>
                <span className="text-[8px] font-black uppercase tracking-widest mt-1.5 text-white/40">
                  {fromTier.label}
                </span>
              </div>

              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
                <path d="M5 12h14M13 6l6 6-6 6"/>
              </svg>
            </>
          )}

          <div className="flex flex-col items-center">
            <div className="size-24 rounded-full flex items-center justify-center text-[40px] border-4 relative"
              style={{
                borderColor: toTier.color,
                background:  toTier.bg,
                boxShadow:   `0 0 36px ${toTier.glow}`,
                animation:   "tierBadgeBounce 0.7s cubic-bezier(0.175,0.885,0.32,1.6) 0.2s backwards",
              }}>
              {toTier.emoji}
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest mt-2" style={{ color: toTier.color }}>
              {toTier.label}
            </span>
          </div>
        </div>

        {/* Text */}
        <div className="relative z-10">
          <p className="text-[12px] font-black uppercase tracking-[0.2em]" style={{ color: toTier.color }}>
            Status Upgraded!
          </p>
          <h2 className="text-[24px] font-black text-white mt-1">
            Welcome to {toTier.label}
          </h2>
          <p className="text-[13px] text-white/50 mt-2 max-w-xs mx-auto leading-relaxed">
            {isPresidential
              ? "You've reached the highest tier. Enjoy maximum perks and exclusive Presidential benefits."
              : `New perks unlocked. Check your Status to see what's new.`}
          </p>
        </div>

        <button onClick={() => setShow(false)}
          className="relative z-10 mt-2 px-7 py-3 rounded-2xl text-[13px] font-black text-white transition-all hover:opacity-90 active:scale-95"
          style={{ background: `linear-gradient(135deg, ${toTier.color}, ${toTier.color}cc)`, boxShadow: `0 6px 24px ${toTier.glow}` }}>
          Awesome!
        </button>
      </div>

      <style>{`
        @keyframes tierUpPop {
          0%   { transform: scale(0.7); opacity: 0; }
          100% { transform: scale(1);   opacity: 1; }
        }
        @keyframes tierGlowPulse {
          0%, 100% { transform: scale(1);    opacity: 0.5; }
          50%      { transform: scale(1.2);  opacity: 1;   }
        }
        @keyframes tierBadgeBounce {
          0%   { transform: scale(0) rotate(-20deg); }
          60%  { transform: scale(1.15) rotate(8deg); }
          100% { transform: scale(1) rotate(0deg); }
        }
      `}</style>
    </div>
  );
}

// ─── Extra particle fanfare for reaching Presidential (max tier) ─────────────
function PresidentialParticles({ color }: { color: string }) {
  const particles = Array.from({ length: 32 }, (_, i) => ({
    id:    i,
    angle: (360 / 32) * i,
    dist:  100 + Math.random() * 120,
    size:  3 + Math.random() * 5,
    delay: Math.random() * 0.3,
  }));

  return (
    <div className="absolute inset-0 pointer-events-none overflow-visible" style={{ top: -20 }}>
      {particles.map((p) => {
        const rad = (p.angle * Math.PI) / 180;
        const x = Math.cos(rad) * p.dist;
        const y = Math.sin(rad) * p.dist;
        return (
          <div key={p.id}
            className="absolute left-1/2 top-1/2"
            style={{
              width:  p.size,
              height: p.size,
              background: color,
              borderRadius: "2px",
              animation: `presParticleFly 1.4s ease-out ${p.delay}s forwards`,
              ["--tx" as any]: `${x}px`,
              ["--ty" as any]: `${y}px`,
            }} />
        );
      })}
      <style>{`
        @keyframes presParticleFly {
          0%   { transform: translate(-50%,-50%) translate(0,0) rotate(0deg) scale(1); opacity: 1; }
          100% { transform: translate(-50%,-50%) translate(var(--tx),var(--ty)) rotate(720deg) scale(0.3); opacity: 0; }
        }
      `}</style>
    </div>
  );
}