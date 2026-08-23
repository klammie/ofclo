// components/agency/tabs/PostsTab.tsx
"use client";

import { useState, useEffect } from "react";
import { AgencyPostCreationModal } from "../AgencyPostCreationModal";

const V      = "#7c3aed";
const P      = "#ef3976";
const GRAD   = `linear-gradient(135deg, ${V}, ${P})`;
const BORDER = "rgba(124,58,237,0.18)";
const MUTED  = "rgba(240,234,255,0.45)";
const TEXT   = "#f0eaff";

export function PostsTab({ creatorId, creatorUserId, creatorName }: {
  creatorId: string;
  creatorUserId: string;
  creatorName: string;
}) {
  const [posts,          setPosts]          = useState<any[]>([]);
  const [isLoading,      setIsLoading]      = useState(true);
  const [filter,         setFilter]         = useState("all");
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => { fetchPosts(); }, [filter]);

  async function fetchPosts() {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/agency/creators/${creatorId}/posts?filter=${filter}`);
      if (res.ok) {
        const data = await res.json();
        setPosts(data.posts);
      }
    } catch (e) {
      console.error("Failed to fetch posts:", e);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleDeletePost(postId: string) {
    if (!confirm("Delete this post?")) return;
    const res = await fetch(`/api/agency/posts/${postId}/delete`, { method: "DELETE" });
    if (res.ok) fetchPosts();
    else alert("Failed to delete post");
  }

  return (
    <>
      <div className="space-y-6" style={{ fontFamily: "'Be Vietnam Pro', sans-serif" }}>
        {/* Toolbar */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex gap-2">
            {["all", "published", "scheduled", "draft"].map((f) => (
              <button key={f} onClick={() => setFilter(f)}
                className="px-4 py-2 rounded-lg font-black capitalize text-[12px] transition-colors"
                style={filter === f
                  ? { background: GRAD, color: "#fff" }
                  : { background: "rgba(255,255,255,0.04)", color: MUTED, border: `1px solid ${BORDER}` }}>
                {f}
              </button>
            ))}
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-[12px] font-black text-white transition-all hover:opacity-90 active:scale-[0.97]"
            style={{ background: GRAD, boxShadow: "0 4px 14px rgba(124,58,237,0.3)" }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
              <path d="M12 5v14M5 12h14"/>
            </svg>
            Create Post
          </button>
        </div>

        {/* Grid */}
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="rounded-2xl animate-pulse"
                style={{ background: "#1a1635", aspectRatio: "1/1", border: `1px solid ${BORDER}` }} />
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-20 rounded-2xl border text-center"
            style={{ background: "#1a1635", borderColor: BORDER }}>
            <span className="text-4xl">📭</span>
            <p className="text-[14px] font-black" style={{ color: TEXT }}>No posts found</p>
            <p className="text-[12px]" style={{ color: MUTED }}>Create a post to get started</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {posts.map((post: any) => (
              <PostCard key={post.id} post={post} onDelete={handleDeletePost} />
            ))}
          </div>
        )}
      </div>

      {showCreateModal && (
        <AgencyPostCreationModal
          creatorId={creatorId}
          creatorName={creatorName}
          onClose={() => setShowCreateModal(false)}
          onCreated={() => {
            setShowCreateModal(false);
            fetchPosts();
          }}
        />
      )}
    </>
  );
}

function PostCard({ post, onDelete }: { post: any; onDelete: (id: string) => void }) {
  const statusColors: Record<string, string> = {
    published: "#22c55e",
    scheduled: "#38bdf8",
    draft:     "#94a3b8",
  };
  const color = statusColors[post.status] ?? "#94a3b8";

  return (
    <div className="rounded-2xl overflow-hidden border"
      style={{ background: "#1a1635", borderColor: "rgba(124,58,237,0.12)" }}>
      <div className="relative" style={{ aspectRatio: "1/1", background: "#0d0d1a" }}>
        {post.media_type === "image" ? (
          <img src={post.thumbnail_url || post.media_url} alt={post.title || "Post"}
            className="w-full h-full object-cover" />
        ) : (
          <video src={post.media_url} className="w-full h-full object-cover" muted />
        )}
        <div className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full text-[9px] font-black uppercase"
          style={{ background: `${color}25`, color, border: `1px solid ${color}50` }}>
          {post.status}
        </div>
        {post.is_locked && (
          <div className="absolute top-2.5 left-2.5 size-6 rounded-full flex items-center justify-center"
            style={{ background: "rgba(0,0,0,0.6)" }}>
            <span className="text-[10px]">🔒</span>
          </div>
        )}
      </div>

      <div className="p-3">
        {post.title && (
          <p className="text-[12px] font-black truncate mb-1" style={{ color: "#f0eaff" }}>{post.title}</p>
        )}
        <div className="flex items-center gap-3 text-[10px] mb-2.5" style={{ color: "rgba(240,234,255,0.4)" }}>
          <span>❤️ {post.like_count ?? 0}</span>
          <span>💬 {post.comment_count ?? 0}</span>
        </div>
        <button onClick={() => onDelete(post.id)}
          className="w-full py-1.5 rounded-lg text-[11px] font-black transition-all"
          style={{ background: "rgba(239,57,118,0.1)", color: "#ef3976", border: "1px solid rgba(239,57,118,0.2)" }}>
          🗑️ Delete
        </button>
      </div>
    </div>
  );
}