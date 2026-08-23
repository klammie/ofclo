"use client";

import { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

interface Counts {
  messages:      number;
  notifications: number;
}

// Singleton SSE connection — one connection per tab, shared across components
let globalEventSource: EventSource | null = null;
const listeners: Set<(counts: Counts) => void> = new Set();
let currentCounts: Counts = { messages: 0, notifications: 0 };

function getOrCreateEventSource() {
  if (globalEventSource && globalEventSource.readyState !== EventSource.CLOSED) {
    return globalEventSource;
  }
  globalEventSource = new EventSource("/api/sse");
  globalEventSource.addEventListener("counts", (e) => {
    try {
      currentCounts = JSON.parse(e.data);
      listeners.forEach((fn) => fn(currentCounts));
    } catch {}
  });
  globalEventSource.onerror = () => {
    // Reconnect after 5s on error
    globalEventSource?.close();
    globalEventSource = null;
    setTimeout(getOrCreateEventSource, 5_000);
  };
  return globalEventSource;
}

export function useRealtimeCounts(): Counts {
  const [counts, setCounts] = useState<Counts>(currentCounts);
  const pathname = usePathname();

  useEffect(() => {
    getOrCreateEventSource();
    const listener = (c: Counts) => setCounts({ ...c });
    listeners.add(listener);
    // Set current counts immediately
    setCounts(currentCounts);
    return () => { listeners.delete(listener); };
  }, []);

  // Clear message count when inside a conversation
  const messages = /\/message\/[^/]+/.test(pathname ?? "")
    ? 0
    : counts.messages;

  return { ...counts, messages };
}