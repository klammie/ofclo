"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { Notification, NotificationSummary } from "@/lib/types";

const POLL_INTERVAL_MS = 30_000; // poll every 30s

interface UseNotificationsReturn {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  hasMore: boolean;
  markRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
  loadMore: () => Promise<void>;
  refetch: () => Promise<void>;
}

export function useNotifications(): UseNotificationsReturn {
  const [notifs, setNotifs]         = useState<Notification[]>([]);
  const [unreadCount, setUnread]    = useState(0);
  const [isLoading, setIsLoading]   = useState(true);
  const [hasMore, setHasMore]       = useState(false);
  const [cursor, setCursor]         = useState<string | undefined>();
  const pollingRef                  = useRef<NodeJS.Timeout | null>(null);

  const fetchNotifications = useCallback(async (reset = true) => {
    if (reset) setIsLoading(true);
    try {
      const url = reset
        ? "/api/notifications?limit=20"
        : `/api/notifications?limit=20${cursor ? `&cursor=${cursor}` : ""}`;
      const res = await fetch(url);
      if (!res.ok) return;
      const data: NotificationSummary = await res.json();

      if (reset) {
        setNotifs(data.notifications);
      } else {
        setNotifs((prev) => [...prev, ...data.notifications]);
      }

      setUnread(data.unreadCount);
      setHasMore(data.notifications.length === 20);

      if (data.notifications.length > 0) {
        setCursor(data.notifications[data.notifications.length - 1].createdAt);
      }
    } catch {}
    finally { if (reset) setIsLoading(false); }
  }, [cursor]);

  // Polling for unread count (lightweight)
  const pollUnread = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications?limit=1");
      if (!res.ok) return;
      const data: NotificationSummary = await res.json();
      setUnread(data.unreadCount);
    } catch {}
  }, []);

  useEffect(() => {
    fetchNotifications(true);
    pollingRef.current = setInterval(pollUnread, POLL_INTERVAL_MS);
    return () => { if (pollingRef.current) clearInterval(pollingRef.current); };
  }, []);

  const markRead = useCallback(async (id: string) => {
    // Optimistic update
    setNotifs((prev) => prev.map((n) => n.id === id ? { ...n, isRead: true } : n));
    setUnread((prev) => Math.max(0, prev - 1));

    await fetch("/api/notifications/read", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notificationId: id }),
    });
  }, []);

  const markAllRead = useCallback(async () => {
    setNotifs((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnread(0);
    await fetch("/api/notifications/read-all", { method: "POST" });
  }, []);

  const loadMore = useCallback(async () => {
    if (!hasMore || isLoading) return;
    await fetchNotifications(false);
  }, [hasMore, isLoading, fetchNotifications]);

  return {
    notifications: notifs,
    unreadCount,
    isLoading,
    hasMore,
    markRead,
    markAllRead,
    loadMore,
    refetch: () => fetchNotifications(true),
  };
}