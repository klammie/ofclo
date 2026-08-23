"use client";

// components/fans-pass/LevelUpOverlay.tsx
//
// Detects when the user's Fan Pass level increases and shows a full-screen
// celebration overlay. Drop this into FansPassDashboard and pass the current
// passLevel — it tracks the previous value internally via localStorage so
// the animation only fires once per actual level-up, not on every page load.

import { useState, useEffect, useRef } from "react";

const V    = "#7c3aed";
const P    = "#ef3976";
const GOLD = "#fbbf24";

interface PassLevel {
  level: number;
  title: string;
}

function levelBadgeColor(level: number): string {
  if (level >= 50) return "#fbbf24";
  if (level >= 35) return "#a78bfa";
  if (level >= 20) return "#38bdf8";
  if (level >= 10) return "#4ade80";
  if (level >= 5)  return "#7c3aed";
  return "#94a3b8";
}

interface LevelUpOverlayProps {
  passLevel: PassLevel;
  seasonId:  number;
}

export function LevelUpOverlay({ passLevel, seasonId }: LevelUpOverlayProps) {
  const [show, setShow] = useState(false);
  const [fromLevel, setFromLevel] = useState(0);
  const initialized = useRef(false);

  // Notify the server of the level-up so it can grant bonus status XP.
  // Idempotent server-side, safe to call every time this fires.
  function notifyLevelUp(level: number) {
    fetch("/api/fan-pass/level-up", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ seasonId, newLevel: level }),
    }).catch(() => {}); // fire-and-forget, never block the animation
  }

  useEffect(() => {
    const storageKey = `fanpass_last_level_${seasonId}`;
    const lastSeen = localStorage.getItem(storageKey);
    const lastLevel = lastSeen ? parseInt(lastSeen, 10) : passLevel.level;

    if (!initialized.current) {
      // First mount — just record the current level, don't animate
      // (prevents firing on every page load)
      initialized.current = true;
      if (!lastSeen) {
        localStorage.setItem(storageKey, String(passLevel.level));
      } else if (passLevel.level > lastLevel) {
        // They leveled up since their last visit — show it once
        setFromLevel(lastLevel);
        setShow(true);
        notifyLevelUp(passLevel.level);
        localStorage.setItem(storageKey, String(passLevel.level));
      }
      return;
    }

    // Subsequent renders within this session — level increased live
    if (passLevel.level > lastLevel) {
      setFromLevel(lastLevel);
      setShow(true);
      notifyLevelUp(passLevel.level);
      localStorage.setItem(storageKey, String(passLevel.level));
    }
  }, [passLevel.level, seasonId]);

  if (!show) return null;

  const color = levelBadgeColor(passLevel.level);

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4"
      style={{ background: "rgba(13,13,26,0.92)", backdropFilter: "blur(8px)" }}
      onClick={() => setShow(false)}>

      <div className="relative flex flex-col items-center gap-5 text-center max-w-sm"
        style={{ animation: "levelUpPop 0.6s cubic-bezier(0.175,0.885,0.32,1.5) forwards" }}
        onClick={(e) => e.stopPropagation()}>

        {/* Burst rays behind the badge */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ top: -60 }}>
          <div style={{
            width: 280, height: 280, borderRadius: "50%",
            background: `radial-gradient(circle, ${color}30 0%, transparent 70%)`,
            animation: "levelUpPulse 1.8s ease-in-out infinite",
          }} />
        </div>

        {/* Confetti particles */}
        <ConfettiBurst color={color} />

        {/* Level badge */}
        <div className="relative z-10 flex items-center gap-4">
          <div className="flex flex-col items-center opacity-50">
            <div className="size-12 rounded-full flex items-center justify-center text-[16px] font-black border-2"
              style={{ borderColor: "rgba(255,255,255,0.2)", color: "rgba(255,255,255,0.5)" }}>
              {fromLevel}
            </div>
            <span className="text-[8px] font-bold uppercase tracking-widest mt-1 text-white/30">Was</span>
          </div>

          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
            <path d="M5 12h14M13 6l6 6-6 6"/>
          </svg>

          <div className="flex flex-col items-center">
            <div className="size-20 rounded-full flex items-center justify-center text-[28px] font-black border-4"
              style={{
                borderColor: color,
                background:  `${color}25`,
                color:       "#fff",
                boxShadow:   `0 0 30px ${color}80`,
                animation:   "levelBadgeBounce 0.7s cubic-bezier(0.175,0.885,0.32,1.6) 0.2s backwards",
              }}>
              {passLevel.level}
            </div>
            <span className="text-[9px] font-black uppercase tracking-widest mt-1.5" style={{ color }}>
              Now
            </span>
          </div>
        </div>

        {/* Text */}
        <div className="relative z-10">
          <p className="text-[12px] font-black uppercase tracking-[0.2em]" style={{ color }}>
            Level Up!
          </p>
          <h2 className="text-[26px] font-black text-white mt-1">{passLevel.title}</h2>
          <p className="text-[13px] text-white/50 mt-2">
            You've reached Fan Pass Level {passLevel.level}
          </p>
        </div>

        <button onClick={() => setShow(false)}
          className="relative z-10 mt-2 px-7 py-3 rounded-2xl text-[13px] font-black text-white transition-all hover:opacity-90 active:scale-95"
          style={{ background: `linear-gradient(135deg, ${V}, ${P})`, boxShadow: `0 6px 24px ${color}50` }}>
          Continue
        </button>
      </div>

      <style>{`
        @keyframes levelUpPop {
          0%   { transform: scale(0.7); opacity: 0; }
          100% { transform: scale(1);   opacity: 1; }
        }
        @keyframes levelUpPulse {
          0%, 100% { transform: scale(1);    opacity: 0.6; }
          50%      { transform: scale(1.15); opacity: 1;   }
        }
        @keyframes levelBadgeBounce {
          0%   { transform: scale(0); }
          60%  { transform: scale(1.15); }
          100% { transform: scale(1); }
        }
      `}</style>
    </div>
  );
}

// ─── Confetti burst — simple CSS particles, no canvas needed ─────────────────
function ConfettiBurst({ color }: { color: string }) {
  const colors = [color, "#fbbf24", "#ef3976", "#7c3aed", "#4ade80"];
  const particles = Array.from({ length: 24 }, (_, i) => ({
    id:    i,
    angle: (360 / 24) * i + Math.random() * 12,
    dist:  80 + Math.random() * 100,
    size:  4 + Math.random() * 4,
    color: colors[i % colors.length],
    delay: Math.random() * 0.15,
  }));

  return (
    <div className="absolute inset-0 pointer-events-none overflow-visible" style={{ top: -20 }}>
      {particles.map((p) => {
        const rad = (p.angle * Math.PI) / 180;
        const x = Math.cos(rad) * p.dist;
        const y = Math.sin(rad) * p.dist;
        return (
          <div key={p.id}
            className="absolute left-1/2 top-1/2 rounded-sm"
            style={{
              width:  p.size,
              height: p.size,
              background: p.color,
              animation: `confettiFly 1s ease-out ${p.delay}s forwards`,
              ["--tx" as any]: `${x}px`,
              ["--ty" as any]: `${y}px`,
            }} />
        );
      })}
      <style>{`
        @keyframes confettiFly {
          0%   { transform: translate(-50%,-50%) translate(0,0) rotate(0deg);   opacity: 1; }
          100% { transform: translate(-50%,-50%) translate(var(--tx),var(--ty)) rotate(540deg); opacity: 0; }
        }
      `}</style>
    </div>
  );
}