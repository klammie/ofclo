"use client";

// components/feed/FeedGrid.tsx

import { useState, useRef, useCallback } from "react";
import { PostCard } from "./PostCard";
import Link from "next/link";
import { useRouter } from "next/navigation";

const V    = "#7c3aed";
const P    = "#ef3976";
const GRAD = `linear-gradient(135deg, ${V}, ${P})`;
const TEXT = "#f0eaff";
const MUTED = "rgba(240,234,255,0.45)";

// ─── Pull-to-refresh hook ─────────────────────────────────────────────────────
function usePullToRefresh(onRefresh: () => Promise<void>) {
  const startY      = useRef(0);
  const pulling     = useRef(false);
  const [pullDist,  setPullDist]  = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const THRESHOLD = 72;

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    if (window.scrollY > 0) return;
    startY.current = e.touches[0].clientY;
    pulling.current = true;
  }, []);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (!pulling.current || refreshing) return;
    const dist = Math.max(0, e.touches[0].clientY - startY.current);
    setPullDist(Math.min(dist * 0.5, THRESHOLD + 20));
  }, [refreshing]);

  const onTouchEnd = useCallback(async () => {
    if (!pulling.current) return;
    pulling.current = false;
    if (pullDist >= THRESHOLD) {
      setRefreshing(true);
      setPullDist(THRESHOLD);
      try { await onRefresh(); } catch {}
      finally {
        setRefreshing(false);
        setPullDist(0);
      }
    } else {
      setPullDist(0);
    }
  }, [pullDist, onRefresh]);

  return { pullDist, refreshing, onTouchStart, onTouchMove, onTouchEnd, THRESHOLD };
}

export function FeedGrid({ posts, currentUserId }) {
  const router = useRouter();
  const [postsList, setPostsList] = useState(posts);
  const [isRefreshing, setIsRefreshing] = useState(false);

  function handleLikeUpdate(postId: string, isLiked: boolean, newCount: number) {
    setPostsList((prev: any[]) =>
      prev.map((p) => p.id === postId ? { ...p, isLiked, likeCount: newCount } : p)
    );
  }

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    router.refresh();
    await new Promise((r) => setTimeout(r, 1000));
    setIsRefreshing(false);
  }, [router]);

  const { pullDist, refreshing, onTouchStart, onTouchMove, onTouchEnd, THRESHOLD } =
    usePullToRefresh(handleRefresh);

  const showPullIndicator = pullDist > 8 || refreshing;
  const pullProgress = Math.min(pullDist / THRESHOLD, 1);

  if (postsList.length === 0) {
    return (
      <div className="flex flex-col items-center gap-6 py-24 text-center"
        style={{ fontFamily: "'Be Vietnam Pro', sans-serif" }}>
        <div className="size-20 rounded-3xl flex items-center justify-center text-4xl"
          style={{ background: "rgba(124,58,237,0.08)", border: "1px solid rgba(124,58,237,0.15)" }}>
          📭
        </div>
        <div>
          <p className="text-[20px] font-black" style={{ color: TEXT }}>Your feed is empty</p>
          <p className="text-[13px] mt-2 max-w-xs mx-auto leading-relaxed" style={{ color: MUTED }}>
            Subscribe to creators to see their posts here
          </p>
        </div>
        <Link href="/dashboard/user/discover"
          className="px-6 py-3 rounded-2xl text-[13px] font-black text-white"
          style={{ background: GRAD, boxShadow: "0 6px 20px rgba(124,58,237,0.35)" }}>
          Discover Creators →
        </Link>
      </div>
    );
  }

  return (
    <div
      className="relative"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      style={{ fontFamily: "'Be Vietnam Pro', sans-serif" }}
    >
      {/* ── Pull-to-refresh indicator ── */}
      {showPullIndicator && (
        <div
          className="flex items-center justify-center"
          style={{
            height:     pullDist > 0 ? `${pullDist}px` : refreshing ? "56px" : "0px",
            overflow:   "hidden",
            transition: pullDist === 0 ? "height 0.3s ease" : "none",
          }}
        >
          <div className="flex items-center gap-2.5 rounded-full px-4 py-2"
            style={{
              background:   "rgba(124,58,237,0.12)",
              border:       "1px solid rgba(124,58,237,0.25)",
              transform:    `scale(${0.7 + pullProgress * 0.3})`,
              opacity:      pullProgress,
              transition:   refreshing ? "none" : "transform 0.1s, opacity 0.1s",
            }}>
            {refreshing ? (
              <svg className="animate-spin size-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke={V} strokeWidth="3"/>
                <path className="opacity-75" fill={V} d="M4 12a8 8 0 018-8v8H4z"/>
              </svg>
            ) : (
              <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke={V} strokeWidth="2.5"
                strokeLinecap="round"
                style={{ transform: `rotate(${pullProgress * 180}deg)`, transition: "transform 0.1s" }}>
                <path d="M12 5v14M5 12l7-7 7 7"/>
              </svg>
            )}
            <span className="text-[12px] font-black" style={{ color: V }}>
              {refreshing ? "Refreshing…" : pullProgress >= 1 ? "Release to refresh" : "Pull to refresh"}
            </span>
          </div>
        </div>
      )}

      {/* ── Posts ── */}
      <div className="max-w-[470px] mx-auto w-full">
        {postsList.map((post: any) => (
          <PostCard
            key={post.id}
            post={post}
            currentUserId={currentUserId}
            onLikeUpdate={handleLikeUpdate}
          />
        ))}

        {/* End of feed */}
        <div className="flex flex-col items-center gap-3 py-12">
          <div className="size-10 rounded-full flex items-center justify-center"
            style={{ background: "rgba(124,58,237,0.08)", border: "1px solid rgba(124,58,237,0.12)" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
              stroke="rgba(124,58,237,0.5)" strokeWidth="2" strokeLinecap="round">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
            </svg>
          </div>
          <p className="text-[11px] font-bold" style={{ color: "rgba(240,234,255,0.2)" }}>
            You're all caught up
          </p>
        </div>
      </div>
    </div>
  );
}