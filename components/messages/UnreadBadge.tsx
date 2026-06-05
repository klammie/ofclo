"use client";

// components/messages/UnreadBadge.tsx
// Drop this wherever you render the Messages nav item badge.
// It polls /api/messages/unread-count every 30s so the count stays live.

import { useState, useEffect } from "react";

interface UnreadBadgeProps {
  /** Initial count passed from the server (SSR) to avoid flash */
  initialCount?: number;
  /** Poll interval in ms. Default 30000 (30s) */
  pollInterval?: number;
}

export function UnreadBadge({ initialCount = 0, pollInterval = 30000 }: UnreadBadgeProps) {
  const [count, setCount] = useState(initialCount);

  useEffect(() => {
    let mounted = true;

    async function fetchCount() {
      try {
        const res  = await fetch("/api/messages/unread-count", { cache: "no-store" });
        const data = await res.json();
        if (mounted) setCount(data.count ?? 0);
      } catch {}
    }

    // Fetch immediately on mount
    fetchCount();

    // Then poll on interval
    const id = setInterval(fetchCount, pollInterval);
    return () => { mounted = false; clearInterval(id); };
  }, [pollInterval]);

  if (count === 0) return null;

  return (
    <span
      className="px-2 py-0.5 rounded-full text-[10px] font-black text-white animate-pulse"
      style={{ background: "linear-gradient(135deg, #7c3aed, #ef3976)" }}
    >
      {count > 99 ? "99+" : count}
    </span>
  );
}