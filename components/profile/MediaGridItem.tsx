// components/profile/MediaGridItem.tsx
"use client";

interface MediaGridItemProps {
  post: {
    id: string;
    mediaType: string;
    mediaUrl: string;
    thumbnailUrl?: string | null;
    isLocked: boolean;
    duration?: number | null;   // seconds
    viewCount?: number | null;
  };
  isSubscribed: boolean;
  onClick: () => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDuration(seconds: number): string {
  const h    = Math.floor(seconds / 3600);
  const m    = Math.floor((seconds % 3600) / 60);
  const s    = Math.floor(seconds % 60);
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
}

const PLACEHOLDER_GRADS = [
  "linear-gradient(135deg,#7c3aed,#ef3976)",
  "linear-gradient(135deg,#0ea5e9,#7c3aed)",
  "linear-gradient(135deg,#f59e0b,#ef3976)",
  "linear-gradient(135deg,#4ade80,#06b6d4)",
];
function placeholderGrad(id: string) {
  return PLACEHOLDER_GRADS[id.split("").reduce((a, c) => a + c.charCodeAt(0), 0) % PLACEHOLDER_GRADS.length];
}

// ─── Component ────────────────────────────────────────────────────────────────

export function MediaGridItem({ post, isSubscribed, onClick }: MediaGridItemProps) {
  const isVideo   = post.mediaType === "video";
  const showLock  = post.isLocked && !isSubscribed;

  // For videos: prefer thumbnailUrl, fall back to a gradient
  // For images: prefer thumbnailUrl, fall back to mediaUrl
  const thumb = post.thumbnailUrl
    ?? (isVideo ? null : post.mediaUrl);

  return (
    <button
      onClick={onClick}
      className="relative aspect-square overflow-hidden group cursor-pointer"
      style={{ background: "#0d0d1a" }}
    >
      {/* ── Thumbnail ── */}
      {thumb ? (
        <img
          src={thumb}
          alt=""
          className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 ${
            showLock ? "blur-sm scale-105" : ""
          }`}
        />
      ) : (
        // Gradient placeholder when no thumbnail (e.g. video with no thumb yet)
        <div
          className={`w-full h-full transition-transform duration-500 group-hover:scale-105 ${
            showLock ? "blur-sm scale-105" : ""
          }`}
          style={{ background: placeholderGrad(post.id) }}
        />
      )}

      {/* ── Video badge + duration ── */}
      {isVideo && !showLock && (
        <>
          {/* Play icon — top right */}
          <div
            className="absolute top-2 right-2 size-8 rounded-full flex items-center justify-center"
            style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(4px)" }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="white">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>

          {/* Duration badge — bottom right */}
          {post.duration != null && post.duration > 0 && (
            <div
              className="absolute bottom-2 right-2 rounded-md px-1.5 py-0.5 text-[10px] font-black text-white"
              style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)", letterSpacing: "0.02em" }}
            >
              {formatDuration(post.duration)}
            </div>
          )}
        </>
      )}

      {/* ── Lock overlay ── */}
      {showLock && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2"
          style={{ backdropFilter: "blur(2px)", background: "rgba(13,13,26,0.6)" }}>
          <div className="size-10 rounded-2xl flex items-center justify-center"
            style={{ background: "rgba(239,57,118,0.18)", border: "1px solid rgba(239,57,118,0.4)" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
              stroke="#ef3976" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
          </div>
          <p className="text-[9px] font-black text-white uppercase tracking-wider">Subscribe to unlock</p>
        </div>
      )}

      {/* ── Hover overlay with stats (unlocked only) ── */}
      {!showLock && (
        <div
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-end"
          style={{ background: "linear-gradient(to top, rgba(0,0,0,0.75) 0%, transparent 50%)" }}
        >
          <div className="flex items-center gap-3 px-3 pb-3">
            <span className="text-white text-[11px] font-bold flex items-center gap-1">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="white" opacity="0.8">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
              </svg>
              {(post.viewCount ?? 0).toLocaleString()}
            </span>
          </div>
        </div>
      )}
    </button>
  );
}