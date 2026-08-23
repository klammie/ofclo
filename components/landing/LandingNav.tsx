"use client";

// components/landing/LandingNav.tsx
// Shared navbar used on the landing page AND public creator profiles.
// Transparent when at top, blurs + darkens on scroll.

import { useState, useEffect } from "react";

// ─── Theme ────────────────────────────────────────────────────────────────────
const V      = "#7c3aed";
const P      = "#ef3976";
const GRAD   = `linear-gradient(135deg, ${V}, ${P})`;
const BORDER = "rgba(124,58,237,0.18)";
const TEXT   = "#f0eaff";
const MUTED  = "rgba(240,234,255,0.55)";

const NAV_ITEMS = ["Features", "Creators", "Fan Pass", "Pricing"];

interface LandingNavProps {
  /** When true, nav links scroll to sections on the landing page.
   *  When false (e.g. on creator profiles), they navigate to /#section */
  anchored?: boolean;
}

export function LandingNav({ anchored = true }: LandingNavProps) {
  const [scrolled,  setScrolled]  = useState(false);
  const [menuOpen,  setMenuOpen]  = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handler, { passive: true });
    handler();
    return () => window.removeEventListener("scroll", handler);
  }, []);

  const navHref = (item: string) => {
    const hash = `#${item.toLowerCase().replace(" ", "-")}`;
    return anchored ? hash : `/${hash}`;
  };

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
      style={{
        background:   scrolled ? "rgba(10,8,20,0.98)" : "rgba(10,8,20,0)",
        backdropFilter: scrolled ? "blur(24px) saturate(180%)" : "none",
        borderBottom: scrolled ? `1px solid ${BORDER}` : "1px solid transparent",
        boxShadow:    scrolled ? "0 2px 40px rgba(0,0,0,0.5)" : "none",
      }}
    >
      <div className="max-w-6xl mx-auto px-6 py-2.5 flex items-center justify-between">

        {/* Logo */}
        <a href="/" style={{ textDecoration: "none" }}
          className="flex items-center gap-2.5 size-24">
          <img src="\Copilot_20260423_142214.png" alt="logo" />
  
        </a>

        {/* Desktop nav links */}
        <div className="hidden md:flex items-center gap-8">
          {NAV_ITEMS.map((item) => (
            <a key={item} href={navHref(item)}
              className="text-[13px] font-bold transition-colors"
              style={{ color: MUTED, textDecoration: "none" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = TEXT)}
              onMouseLeave={(e) => (e.currentTarget.style.color = MUTED)}>
              {item}
            </a>
          ))}
        </div>

        {/* Desktop CTA */}
        <div className="hidden md:flex items-center gap-3">
          <a href="/login"
            className="text-[13px] font-black px-4 py-2 rounded-xl border transition-all"
            style={{ borderColor: BORDER, color: MUTED, textDecoration: "none" }}
            onMouseEnter={(e) => { e.currentTarget.style.color = TEXT; e.currentTarget.style.borderColor = V; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = MUTED; e.currentTarget.style.borderColor = BORDER; }}>
            Sign In
          </a>
          <a href="/signup"
            className="text-[13px] font-black px-5 py-2 rounded-xl text-white transition-all"
            style={{ background: GRAD, boxShadow: "0 4px 16px rgba(124,58,237,0.35)", textDecoration: "none" }}>
            Get Started Free
          </a>
        </div>

        {/* Mobile hamburger */}
        <button className="md:hidden text-[22px]"
          onClick={() => setMenuOpen((o) => !o)}
          style={{ color: TEXT, background: "none", border: "none", cursor: "pointer" }}>
          {menuOpen ? "✕" : "☰"}
        </button>
      </div>

      {/* Mobile dropdown */}
      {menuOpen && (
        <div className="md:hidden px-6 pb-5 flex flex-col gap-3"
          style={{ background: "rgba(13,13,26,0.98)" }}>
          {NAV_ITEMS.map((item) => (
            <a key={item} href={navHref(item)}
              className="text-[14px] font-bold py-2 border-b"
              style={{ color: MUTED, textDecoration: "none", borderColor: BORDER }}
              onClick={() => setMenuOpen(false)}>
              {item}
            </a>
          ))}
          <div className="flex gap-3 mt-2">
            <a href="/login"
              className="flex-1 text-center text-[13px] font-black py-2.5 rounded-xl border"
              style={{ borderColor: BORDER, color: TEXT, textDecoration: "none" }}>
              Sign In
            </a>
            <a href="/signup"
              className="flex-1 text-center text-[13px] font-black py-2.5 rounded-xl text-white"
              style={{ background: GRAD, textDecoration: "none" }}>
              Get Started
            </a>
          </div>
        </div>
      )}
    </nav>
  );
}