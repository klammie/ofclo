"use client";

// components/feed/FeedGrid.tsx

import { useState } from "react";
import { PostCard } from "./PostCard";
import Link from "next/link";

// ─── Theme ────────────────────────────────────────────────────────────────────
const V    = "#7c3aed";
const P    = "#ef3976";
const GRAD = `linear-gradient(135deg, ${V}, ${P})`;
const TEXT = "#f0eaff";
const MUTED = "rgba(240,234,255,0.45)";

export function FeedGrid({ posts, currentUserId }) {
  const [postsList, setPostsList] = useState(posts);

  function handleLikeUpdate(postId: string, isLiked: boolean, newCount: number) {
    setPostsList((prev: any[]) =>
      prev.map((p) =>
        p.id === postId ? { ...p, isLiked, likeCount: newCount } : p
      )
    );
  }

  if (postsList.length === 0) {
    return (
      <div className="flex flex-col items-center gap-5 py-24 text-center"
        style={{ fontFamily: "'Be Vietnam Pro', sans-serif" }}>
        <span className="text-6xl">📭</span>
        <div>
          <p className="text-[20px] font-black" style={{ color: TEXT }}>Your feed is empty</p>
          <p className="text-[13px] mt-1.5" style={{ color: MUTED }}>
            Subscribe to creators to see their posts here
          </p>
        </div>
        <Link href="/dashboard/user/discover"
          className="px-6 py-3 rounded-2xl text-[13px] font-black text-white"
          style={{ background: GRAD, boxShadow: "0 6px 20px rgba(124,58,237,0.4)" }}>
          Discover Creators →
        </Link>
      </div>
    );
  }

  return (
    // Max-width matches Instagram's feed width — centered, single column
    <div className="max-w-[470px] mx-auto w-full"
      style={{ fontFamily: "'Be Vietnam Pro', sans-serif" }}>
      {postsList.map((post: any) => (
        <PostCard
          key={post.id}
          post={post}
          currentUserId={currentUserId}
          onLikeUpdate={handleLikeUpdate}
        />
      ))}
    </div>
  );
}