"use client";

import { useState, useEffect, useCallback, useRef } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface FullscreenImage {
  url: string;
  caption?: string | null;
  creatorName?: string;
  creatorAvatar?: string | null;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useFullscreen() {
  const [image, setImage] = useState<FullscreenImage | null>(null);

  const open  = useCallback((img: FullscreenImage) => setImage(img), []);
  const close = useCallback(() => setImage(null), []);

  // Close on Escape
  useEffect(() => {
    if (!image) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") close(); };
    document.addEventListener("keydown", handler);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handler);
      document.body.style.overflow = "";
    };
  }, [image, close]);

  return { image, open, close };
}

// ─── Fullscreen Viewer Component ──────────────────────────────────────────────

interface FullscreenViewerProps {
  image: FullscreenImage;
  onClose: () => void;
}

export function FullscreenViewer({ image, onClose }: FullscreenViewerProps) {
  const [loaded, setLoaded]   = useState(false);
  const [zoomed, setZoomed]   = useState(false);
  const [scale, setScale]     = useState(1);
  const [pos, setPos]         = useState({ x: 0, y: 0 });
  const [dragging, setDrag]   = useState(false);
  const dragStart             = useRef({ mx: 0, my: 0, px: 0, py: 0 });

  // Double-click to zoom 2×, click again to reset
  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (zoomed) {
      setScale(1);
      setPos({ x: 0, y: 0 });
      setZoomed(false);
    } else {
      setScale(2.2);
      setZoomed(true);
    }
  }, [zoomed]);

  // Drag to pan when zoomed
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!zoomed) return;
    e.preventDefault();
    setDrag(true);
    dragStart.current = { mx: e.clientX, my: e.clientY, px: pos.x, py: pos.y };
  }, [zoomed, pos]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!dragging) return;
    setPos({
      x: dragStart.current.px + e.clientX - dragStart.current.mx,
      y: dragStart.current.py + e.clientY - dragStart.current.my,
    });
  }, [dragging]);

  const handleMouseUp = useCallback(() => setDrag(false), []);

  // Scroll to zoom
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const next = Math.min(Math.max(scale - e.deltaY * 0.002, 1), 4);
    setScale(next);
    setZoomed(next > 1);
    if (next === 1) setPos({ x: 0, y: 0 });
  }, [scale]);

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center"
      style={{ background: "rgba(0,0,0,0.96)" }}
      onClick={onClose}
    >
      {/* Toolbar */}
      <div
        className="absolute top-0 left-0 right-0 flex items-center justify-between px-5 py-4 z-10"
        style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.7), transparent)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Creator info */}
        <div className="flex items-center gap-2.5">
          {image.creatorAvatar && (
            <img src={image.creatorAvatar} alt=""
              className="size-8 rounded-full object-cover border border-white/20" />
          )}
          {image.creatorName && (
            <span className="text-[13px] font-bold text-white">{image.creatorName}</span>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {/* Zoom in */}
          <button
            onClick={() => { const n = Math.min(scale + 0.5, 4); setScale(n); setZoomed(n > 1); }}
            className="size-9 rounded-full flex items-center justify-center transition-all hover:bg-white/15"
            style={{ background: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.8)", border: "none", cursor: "pointer" }}
            title="Zoom in"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35M11 8v6M8 11h6"/>
            </svg>
          </button>

          {/* Zoom out */}
          <button
            onClick={() => { const n = Math.max(scale - 0.5, 1); setScale(n); setZoomed(n > 1); if (n === 1) setPos({ x: 0, y: 0 }); }}
            className="size-9 rounded-full flex items-center justify-center transition-all hover:bg-white/15"
            style={{ background: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.8)", border: "none", cursor: "pointer" }}
            title="Zoom out"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35M8 11h6"/>
            </svg>
          </button>

          {/* Download */}
          <a
            href={image.url}
            download
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="size-9 rounded-full flex items-center justify-center transition-all hover:bg-white/15"
            style={{ background: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.8)", textDecoration: "none" }}
            title="Download"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
          </a>

          {/* Close */}
          <button
            onClick={onClose}
            className="size-9 rounded-full flex items-center justify-center transition-all hover:bg-white/15"
            style={{ background: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.9)", border: "none", cursor: "pointer" }}
            title="Close (Esc)"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Image container */}
      <div
        className="relative flex items-center justify-center w-full h-full overflow-hidden"
        style={{ cursor: zoomed ? (dragging ? "grabbing" : "grab") : "zoom-in" }}
        onClick={(e) => { if (!zoomed) return; e.stopPropagation(); }}
        onDoubleClick={handleDoubleClick}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      >
        {/* Loading spinner */}
        {!loaded && (
          <div className="absolute inset-0 flex items-center justify-center">
            <svg className="animate-spin size-10" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-20" cx="12" cy="12" r="10" stroke="white" strokeWidth="3"/>
              <path className="opacity-80" fill="white" d="M4 12a8 8 0 018-8v8H4z"/>
            </svg>
          </div>
        )}

        <img
          src={image.url}
          alt={image.caption ?? "Full size image"}
          onLoad={() => setLoaded(true)}
          style={{
            maxWidth:      zoomed ? "none" : "90vw",
            maxHeight:     zoomed ? "none" : "90vh",
            width:         zoomed ? "auto" : undefined,
            objectFit:     "contain",
            transform:     `scale(${scale}) translate(${pos.x / scale}px, ${pos.y / scale}px)`,
            transition:    dragging ? "none" : "transform 0.2s ease",
            opacity:       loaded ? 1 : 0,
            userSelect:    "none",
            pointerEvents: "none",
            borderRadius:  zoomed ? 0 : 8,
          }}
          draggable={false}
        />
      </div>

      {/* Caption + hint */}
      {(image.caption || !zoomed) && (
        <div
          className="absolute bottom-0 left-0 right-0 px-5 py-5 z-10"
          style={{ background: "linear-gradient(to top, rgba(0,0,0,0.7), transparent)" }}
          onClick={(e) => e.stopPropagation()}
        >
          {image.caption && (
            <p className="text-[13px] text-white/80 text-center mb-1 line-clamp-2 max-w-lg mx-auto">
              {image.caption}
            </p>
          )}
          <p className="text-[10px] text-center text-white/30">
            Scroll to zoom · Double-click to zoom in · Drag to pan · Esc to close
          </p>
        </div>
      )}

      {/* Zoom indicator */}
      {scale > 1 && (
        <div
          className="absolute bottom-16 right-5 rounded-full px-2.5 py-1 text-[11px] font-bold text-white"
          style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}
        >
          {Math.round(scale * 100)}%
        </div>
      )}
    </div>
  );
}