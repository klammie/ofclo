"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { usePathname } from "next/navigation";

interface AppCounts {
  messages:      number;
  notifications: number;
}

// Module-level cache — persists across component mounts within the same tab session
let cache: AppCounts         = { messages: 0, notifications: 0 };
let lastFetched: number      = 0;
let listeners: Set<() => void> = new Set();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes — only refetch after this

function notify() { listeners.forEach((fn) => fn()); }

async function fetchCounts() {
  // Don't refetch if cache is fresh
  if (Date.now() - lastFetched < CACHE_TTL) return;
  try {
    const res  = await fetch("/api/app-counts", { cache: "no-store" });
    const data = await res.json();
    cache       = { messages: data.messages ?? 0, notifications: data.notifications ?? 0 };
    lastFetched = Date.now();
    notify();
  } catch {}
}

export function invalidateCounts() {
  // Call this after sending a message or reading notifications
  // Forces next fetch to bypass cache
  lastFetched = 0;
  fetchCounts().then(notify);
}

export function useAppCounts(): AppCounts & { refresh: () => void } {
  const [counts,  setCounts]  = useState<AppCounts>(cache);
  const pathname              = usePathname();
  const isMounted             = useRef(true);

  const refresh = useCallback(() => {
    lastFetched = 0; // bust cache
    fetchCounts();
  }, []);

  useEffect(() => {
    isMounted.current = true;
    const listener = () => {
      if (isMounted.current) setCounts({ ...cache });
    };
    listeners.add(listener);

    // Fetch on mount if cache is stale
    fetchCounts().then(() => {
      if (isMounted.current) setCounts({ ...cache });
    });

    // Refetch when tab becomes visible after being hidden
    const onVisible = () => {
      if (document.visibilityState === "visible") fetchCounts();
    };
    document.addEventListener("visibilitychange", onVisible);

    // Refetch when window regains focus (user switches back from another app)
    const onFocus = () => fetchCounts();
    window.addEventListener("focus", onFocus);

    return () => {
      isMounted.current = false;
      listeners.delete(listener);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onFocus);
    };
  }, []);

  // Clear message badge when inside a specific conversation
  const isInConversation = /\/message\/[^/]+/.test(pathname ?? "");
  const messages = isInConversation ? 0 : counts.messages;

  return { ...counts, messages, refresh };
}