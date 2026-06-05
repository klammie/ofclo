"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";

// ─── Theme ────────────────────────────────────────────────────────────────────
const V      = "#7c3aed";
const P      = "#ef3976";
const GRAD   = `linear-gradient(135deg, ${V}, ${P})`;
const CARD   = "#1a1635";
const SURF   = "#13112b";
const BORDER = "rgba(124,58,237,0.18)";
const TEXT   = "#f0eaff";
const MUTED  = "rgba(240,234,255,0.45)";

// ─── Types ────────────────────────────────────────────────────────────────────
type UploadState = "idle" | "uploading" | "done" | "error";

interface MediaFile {
  id:           string;
  file:         File;
  previewUrl:   string;     // local blob URL for preview
  mediaType:    "image" | "video";
  uploadState:  UploadState;
  uploadPct:    number;
  // Filled after upload
  mediaUrl?:    string;
  thumbnailUrl?: string | null;
  duration?:    number | null;
  error?:       string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function uid() { return Math.random().toString(36).slice(2); }

function formatDuration(s: number): string {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = Math.floor(s % 60);
  if (h > 0) return `${h}:${String(m).padStart(2,"0")}:${String(sec).padStart(2,"0")}`;
  return `${m}:${String(sec).padStart(2,"0")}`;
}

function filesToMediaFiles(files: File[]): MediaFile[] {
  return files
    .filter((f) => f.type.startsWith("image/") || f.type.startsWith("video/"))
    .map((file) => ({
      id:          uid(),
      file,
      previewUrl:  URL.createObjectURL(file),
      mediaType:   file.type.startsWith("video/") ? "video" : "image",
      uploadState: "idle" as const,
      uploadPct:   0,
    }));
}

// ─── Drop zone ────────────────────────────────────────────────────────────────
function DropZone({ onFiles }: { onFiles: (files: File[]) => void }) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length) onFiles(files);
  }, [onFiles]);

  return (
    <div
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      className="flex flex-col items-center justify-center gap-4 rounded-[20px] border-2 border-dashed cursor-pointer transition-all py-14 px-6"
      style={{
        borderColor: dragging ? V : BORDER,
        background:  dragging ? "rgba(124,58,237,0.07)" : "rgba(255,255,255,0.02)",
      }}
    >
      <div className="size-16 rounded-2xl flex items-center justify-center text-3xl"
        style={{ background: "rgba(124,58,237,0.1)", border: `1px solid ${BORDER}` }}>
        📁
      </div>
      <div className="text-center">
        <p className="text-[14px] font-black" style={{ color: TEXT }}>
          Drop files here or click to browse
        </p>
        <p className="text-[12px] mt-1" style={{ color: MUTED }}>
          Images & videos · Up to 10 files · Max 200MB per video
        </p>
        <p className="text-[11px] mt-1" style={{ color: "rgba(240,234,255,0.25)" }}>
          JPG · PNG · GIF · WebP · MP4 · MOV · WebM
        </p>
      </div>
      <div className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-[12px] font-black text-white"
        style={{ background: GRAD }}>
        <span>+</span> Add Media
      </div>
      <input ref={inputRef} type="file" multiple accept="image/*,video/*" className="hidden"
        onChange={(e) => { const f = Array.from(e.target.files ?? []); if (f.length) { onFiles(f); e.target.value = ""; } }} />
    </div>
  );
}

// ─── Upload progress bar ──────────────────────────────────────────────────────
function UploadBar({ pct, state }: { pct: number; state: UploadState }) {
  return (
    <div className="absolute inset-x-0 bottom-0 h-1">
      <div className="h-full transition-all duration-300 rounded-full"
        style={{
          width:      `${pct}%`,
          background: state === "error" ? P : state === "done" ? "#4ade80" : GRAD,
        }} />
    </div>
  );
}

// ─── Single file tile ─────────────────────────────────────────────────────────
function FileTile({
  mf, index, total,
  onRemove, onMoveLeft, onMoveRight,
}: {
  mf: MediaFile; index: number; total: number;
  onRemove: () => void; onMoveLeft: () => void; onMoveRight: () => void;
}) {
  return (
    <div className="relative rounded-[14px] overflow-hidden flex-shrink-0 group"
      style={{
        width: 160, height: 160,
        border: `2px solid ${mf.uploadState === "error" ? P : mf.uploadState === "done" ? "#4ade8040" : BORDER}`,
      }}>

      {/* Preview */}
      {mf.mediaType === "image" ? (
        <img src={mf.previewUrl} alt="" className="w-full h-full object-cover" />
      ) : (
        <video src={mf.previewUrl} className="w-full h-full object-cover" muted playsInline />
      )}

      {/* Dark overlay on hover */}
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-all duration-200" />

      {/* Video badge */}
      {mf.mediaType === "video" && (
        <div className="absolute top-2 left-2 rounded-full size-6 flex items-center justify-center"
          style={{ background: "rgba(0,0,0,0.65)" }}>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="white"><path d="M8 5v14l11-7z"/></svg>
        </div>
      )}

      {/* Index badge */}
      <div className="absolute top-2 right-2 size-5 rounded-full flex items-center justify-center text-[9px] font-black text-white"
        style={{ background: "rgba(0,0,0,0.7)" }}>
        {index + 1}
      </div>

      {/* Upload overlay */}
      {mf.uploadState === "uploading" && (
        <div className="absolute inset-0 flex items-center justify-center"
          style={{ background: "rgba(13,13,26,0.7)" }}>
          <div className="flex flex-col items-center gap-1.5">
            <svg className="animate-spin size-6" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="white" strokeWidth="3"/>
              <path className="opacity-75" fill="white" d="M4 12a8 8 0 018-8v8H4z"/>
            </svg>
            <span className="text-[10px] font-black text-white">{mf.uploadPct}%</span>
          </div>
        </div>
      )}

      {/* Done checkmark */}
      {mf.uploadState === "done" && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-8 rounded-full bg-green-500 flex items-center justify-center text-white font-black text-sm opacity-0 group-hover:opacity-100 transition-all">
          ✓
        </div>
      )}

      {/* Error */}
      {mf.uploadState === "error" && (
        <div className="absolute inset-0 flex items-center justify-center"
          style={{ background: "rgba(239,57,118,0.15)" }}>
          <span className="text-[10px] font-black text-center px-2" style={{ color: P }}>
            {mf.error ?? "Failed"}
          </span>
        </div>
      )}

      {/* Controls (hover) */}
      <div className="absolute inset-x-0 bottom-0 flex items-center justify-between px-1.5 pb-1.5 opacity-0 group-hover:opacity-100 transition-all">
        <div className="flex gap-1">
          {index > 0 && (
            <button onClick={onMoveLeft}
              className="size-6 rounded-lg flex items-center justify-center text-white text-[11px] font-black"
              style={{ background: "rgba(0,0,0,0.7)" }}>←</button>
          )}
          {index < total - 1 && (
            <button onClick={onMoveRight}
              className="size-6 rounded-lg flex items-center justify-center text-white text-[11px] font-black"
              style={{ background: "rgba(0,0,0,0.7)" }}>→</button>
          )}
        </div>
        <button onClick={onRemove}
          className="size-6 rounded-lg flex items-center justify-center text-white text-[11px] font-black"
          style={{ background: "rgba(239,57,118,0.8)" }}>✕</button>
      </div>

      {/* Progress bar */}
      {mf.uploadState === "uploading" && <UploadBar pct={mf.uploadPct} state={mf.uploadState} />}
    </div>
  );
}

// ─── MAIN UPLOAD PAGE ─────────────────────────────────────────────────────────
export default function CreatorUploadPage() {
  const router = useRouter();
  const [files,       setFiles]       = useState<MediaFile[]>([]);
  const [title,       setTitle]       = useState("");
  const [description, setDescription] = useState("");
  const [isLocked,    setIsLocked]    = useState(false);
  const [ppvPrice,    setPpvPrice]    = useState("");
  const [status,      setStatus]      = useState<"draft" | "published">("published");
  const [isPosting,   setIsPosting]   = useState(false);
  const [postError,   setPostError]   = useState("");
  const [posted,      setPosted]      = useState(false);

  // Revoke preview URLs when files are removed
  useEffect(() => {
    return () => { files.forEach((f) => URL.revokeObjectURL(f.previewUrl)); };
  }, []);

  const addFiles = useCallback((newFiles: File[]) => {
    const next = filesToMediaFiles(newFiles).slice(0, 10 - files.length);
    setFiles((prev) => [...prev, ...next]);
  }, [files.length]);

  const removeFile = useCallback((id: string) => {
    setFiles((prev) => {
      const f = prev.find((f) => f.id === id);
      if (f) URL.revokeObjectURL(f.previewUrl);
      return prev.filter((f) => f.id !== id);
    });
  }, []);

  const moveFile = useCallback((id: string, dir: -1 | 1) => {
    setFiles((prev) => {
      const idx  = prev.findIndex((f) => f.id === id);
      const next = [...prev];
      const dest = idx + dir;
      if (dest < 0 || dest >= next.length) return prev;
      [next[idx], next[dest]] = [next[dest], next[idx]];
      return next;
    });
  }, []);

  // ── Client-side video processing (replaces server-side ffmpeg) ──────────────
  // Extracts duration and captures a thumbnail frame using browser APIs.
  const extractVideoMeta = useCallback(
    (file: File): Promise<{ duration: number | null; thumbnailBlob: Blob | null }> => {
      return new Promise((resolve) => {
        const video = document.createElement("video");
        const url   = URL.createObjectURL(file);
        video.preload  = "metadata";
        video.muted    = true;
        video.playsInline = true;
        video.src      = url;

        video.addEventListener("loadedmetadata", () => {
          const duration = Math.round(video.duration) || null;
          // Seek to 1s or 10% through, whichever is smaller
          video.currentTime = Math.min(1, video.duration * 0.1);
        });

        video.addEventListener("seeked", () => {
          try {
            const canvas  = document.createElement("canvas");
            canvas.width  = 640;
            canvas.height = Math.round((video.videoHeight / video.videoWidth) * 640);
            const ctx     = canvas.getContext("2d");
            if (ctx) {
              ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
              canvas.toBlob(
                (blob) => {
                  URL.revokeObjectURL(url);
                  resolve({ duration: Math.round(video.duration) || null, thumbnailBlob: blob });
                },
                "image/jpeg",
                0.85
              );
            } else {
              URL.revokeObjectURL(url);
              resolve({ duration: Math.round(video.duration) || null, thumbnailBlob: null });
            }
          } catch {
            URL.revokeObjectURL(url);
            resolve({ duration: null, thumbnailBlob: null });
          }
        });

        video.addEventListener("error", () => {
          URL.revokeObjectURL(url);
          resolve({ duration: null, thumbnailBlob: null });
        });

        // Timeout fallback — some browsers don't fire seeked
        setTimeout(() => {
          URL.revokeObjectURL(url);
          resolve({ duration: null, thumbnailBlob: null });
        }, 10000);
      });
    },
    []
  );

  // Upload a single file to /api/upload
  const uploadFile = useCallback(async (mf: MediaFile): Promise<MediaFile> => {
    const form = new FormData();
    form.append("file", mf.file);
    form.append("type", mf.mediaType); // ← was missing, caused "null" in logs

    // ── For videos: extract duration + thumbnail client-side first ──
    if (mf.mediaType === "video") {
      const { duration, thumbnailBlob } = await extractVideoMeta(mf.file);
      if (duration != null) form.append("duration", String(duration));
      if (thumbnailBlob)    form.append("thumbnail", thumbnailBlob, "thumb.jpg");
    }

    // Use XHR for real upload progress events
    return new Promise((resolve) => {
      const xhr = new XMLHttpRequest();

      xhr.upload.addEventListener("progress", (e) => {
        if (e.lengthComputable) {
          const pct = Math.round((e.loaded / e.total) * 100);
          setFiles((prev) => prev.map((f) =>
            f.id === mf.id ? { ...f, uploadPct: pct } : f
          ));
        }
      });

      xhr.addEventListener("load", () => {
        try {
          const data = JSON.parse(xhr.responseText);
          if (xhr.status === 200) {
            const updated: MediaFile = {
              ...mf,
              uploadState:  "done",
              uploadPct:    100,
              mediaUrl:     data.url,          // ← API returns "url", not "mediaUrl"
              thumbnailUrl: data.thumbnailUrl ?? null,
              duration:     data.duration     ?? null,
            };
            setFiles((prev) => prev.map((f) => f.id === mf.id ? updated : f));
            resolve(updated);
          } else {
            const updated: MediaFile = { ...mf, uploadState: "error", error: data.error ?? "Upload failed" };
            setFiles((prev) => prev.map((f) => f.id === mf.id ? updated : f));
            resolve(updated);
          }
        } catch {
          const updated: MediaFile = { ...mf, uploadState: "error", error: "Server error" };
          setFiles((prev) => prev.map((f) => f.id === mf.id ? updated : f));
          resolve(updated);
        }
      });

      xhr.addEventListener("error", () => {
        const updated: MediaFile = { ...mf, uploadState: "error", error: "Network error" };
        setFiles((prev) => prev.map((f) => f.id === mf.id ? updated : f));
        resolve(updated);
      });

      xhr.open("POST", "/api/upload");
      xhr.send(form);

      // Mark as uploading
      setFiles((prev) => prev.map((f) =>
        f.id === mf.id ? { ...f, uploadState: "uploading", uploadPct: 0 } : f
      ));
    });
  }, [extractVideoMeta]);

  // Upload all pending files then create the post
  const handlePost = useCallback(async () => {
    if (!files.length) { setPostError("Add at least one file."); return; }
    if (!title.trim()) { setPostError("Title is required."); return; }
    setIsPosting(true);
    setPostError("");

    try {
      // Upload any files that haven't been uploaded yet
      const pending = files.filter((f) => f.uploadState !== "done");
      let current   = [...files];

      if (pending.length) {
        const results = await Promise.all(pending.map(uploadFile));
        current = files.map((f) => {
          const res = results.find((r) => r.id === f.id);
          return res ?? f;
        });
      }

      // Check for any failures
      const failed = current.filter((f) => f.uploadState === "error");
      if (failed.length) {
        setPostError(`${failed.length} file(s) failed to upload. Remove them and try again.`);
        setIsPosting(false);
        return;
      }

      // Build media items array
      const mediaItems = current.map((f) => ({
        mediaUrl:     f.mediaUrl!,
        thumbnailUrl: f.thumbnailUrl ?? null,
        duration:     f.duration     ?? null,
        mediaType:    f.mediaType,
      }));

      // Create the post
      const res = await fetch("/api/creator/posts", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title:       title.trim(),
          description: description.trim() || null,
          isLocked,
          ppvPrice:    isLocked && ppvPrice ? parseFloat(ppvPrice) : null,
          status,
          mediaItems,  // array of media
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setPostError(data.error ?? "Failed to create post");
        setIsPosting(false);
        return;
      }

      setPosted(true);
      setTimeout(() => router.push("/dashboard/creator/content"), 1800);

    } catch (e: any) {
      setPostError(e?.message ?? "Something went wrong");
      setIsPosting(false);
    }
  }, [files, title, description, isLocked, ppvPrice, status, uploadFile, router]);

  const allDone   = files.length > 0 && files.every((f) => f.uploadState === "done");
  const anyUploading = files.some((f) => f.uploadState === "uploading");

  if (posted) {
    return (
      <div className="flex flex-col items-center justify-center gap-5 py-32 text-center"
        style={{ fontFamily: "'Be Vietnam Pro', sans-serif" }}>
        <div className="size-20 rounded-2xl flex items-center justify-center text-4xl"
          style={{ background: "rgba(34,197,94,0.12)", border: "1px solid rgba(34,197,94,0.3)" }}>✓</div>
        <div>
          <p className="text-[20px] font-black" style={{ color: TEXT }}>Post Published!</p>
          <p className="text-[13px] mt-1" style={{ color: MUTED }}>Redirecting to your content…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-6 pb-12"
      style={{ fontFamily: "'Be Vietnam Pro', sans-serif", color: TEXT }}>

      {/* Header */}
      <div>
        <h1 className="text-[22px] font-black" style={{ color: TEXT }}>Upload Media</h1>
        <p className="text-[13px] mt-1" style={{ color: MUTED }}>
          Upload up to 10 photos or videos. Drag to reorder.
        </p>
      </div>

      {/* Drop zone */}
      {files.length < 10 && <DropZone onFiles={addFiles} />}

      {/* File grid */}
      {files.length > 0 && (
        <div className="rounded-[20px] border p-4 flex flex-col gap-4"
          style={{ background: CARD, borderColor: BORDER }}>

          <div className="flex items-center justify-between">
            <p className="text-[12px] font-black" style={{ color: MUTED }}>
              {files.length} file{files.length !== 1 ? "s" : ""} selected
              {files.length > 1 && (
                <span className="ml-1.5" style={{ color: "rgba(240,234,255,0.3)" }}>
                  · first file is the cover
                </span>
              )}
            </p>
            <button onClick={() => setFiles([])}
              className="text-[11px] font-bold transition-opacity hover:opacity-80"
              style={{ color: P, background: "none", border: "none", cursor: "pointer" }}>
              Remove all
            </button>
          </div>

          {/* Scrollable file row */}
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
            {files.map((mf, i) => (
              <FileTile
                key={mf.id}
                mf={mf}
                index={i}
                total={files.length}
                onRemove={() => removeFile(mf.id)}
                onMoveLeft={() => moveFile(mf.id, -1)}
                onMoveRight={() => moveFile(mf.id, 1)}
              />
            ))}
          </div>

          {/* File list */}
          <div className="flex flex-col gap-1.5">
            {files.map((mf, i) => (
              <div key={mf.id} className="flex items-center gap-3 px-3 py-2 rounded-xl"
                style={{ background: "rgba(255,255,255,0.03)" }}>
                <span className="text-[10px] font-black w-4 text-center" style={{ color: MUTED }}>{i + 1}</span>
                <div className="size-8 rounded-lg overflow-hidden flex-shrink-0">
                  {mf.mediaType === "image"
                    ? <img src={mf.previewUrl} className="size-full object-cover" alt="" />
                    : <div className="size-full flex items-center justify-center" style={{ background: "rgba(124,58,237,0.2)" }}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill={V}><path d="M8 5v14l11-7z"/></svg>
                      </div>
                  }
                </div>
                <p className="text-[11px] flex-1 truncate" style={{ color: "rgba(240,234,255,0.7)" }}>
                  {mf.file.name}
                </p>
                <span className="text-[10px]" style={{ color: MUTED }}>
                  {(mf.file.size / 1024 / 1024).toFixed(1)}MB
                </span>
                <div className="flex items-center gap-1.5">
                  {mf.uploadState === "idle"      && <span className="size-2 rounded-full bg-white/20" />}
                  {mf.uploadState === "uploading" && <span className="size-2 rounded-full animate-pulse" style={{ background: V }} />}
                  {mf.uploadState === "done"      && <span className="size-2 rounded-full bg-green-400" />}
                  {mf.uploadState === "error"     && <span className="size-2 rounded-full" style={{ background: P }} />}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Post details */}
      <div className="rounded-[20px] border p-5 flex flex-col gap-4"
        style={{ background: CARD, borderColor: BORDER }}>

        <p className="text-[11px] font-black uppercase tracking-widest" style={{ color: MUTED }}>Post Details</p>

        {/* Title */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-black uppercase tracking-widest" style={{ color: MUTED }}>
            Title <span style={{ color: P }}>*</span>
          </label>
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)}
            placeholder="Give your post a title…"
            className="w-full rounded-xl border px-4 py-3 text-[13px] outline-none"
            style={{ background: "rgba(255,255,255,0.04)", borderColor: BORDER, color: TEXT, fontFamily: "inherit" }} />
        </div>

        {/* Description */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <label className="text-[10px] font-black uppercase tracking-widest" style={{ color: MUTED }}>Caption</label>
            <span className="text-[10px]" style={{ color: "rgba(240,234,255,0.25)" }}>{description.length}/1000</span>
          </div>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)}
            placeholder="Write a caption…" rows={3} maxLength={1000}
            className="w-full rounded-xl border px-4 py-3 text-[13px] outline-none resize-none"
            style={{ background: "rgba(255,255,255,0.04)", borderColor: BORDER, color: TEXT, fontFamily: "inherit" }} />
        </div>

        {/* Lock + PPV */}
        <div className="flex flex-col gap-3 pt-1 border-t" style={{ borderColor: BORDER }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[13px] font-black" style={{ color: TEXT }}>Lock this post</p>
              <p className="text-[11px]" style={{ color: MUTED }}>Only subscribers can view it</p>
            </div>
            <button onClick={() => setIsLocked(!isLocked)}
              className="relative inline-flex items-center h-6 w-11 rounded-full transition-all duration-200"
              style={{ background: isLocked ? GRAD : "rgba(124,58,237,0.15)", border: `1px solid ${isLocked ? "transparent" : BORDER}` }}>
              <span className="inline-block size-4 rounded-full bg-white shadow-sm transition-transform duration-200"
                style={{ transform: isLocked ? "translateX(22px)" : "translateX(2px)" }} />
            </button>
          </div>

          {isLocked && (
            <div className="flex items-center gap-3">
              <span className="text-[13px] font-black" style={{ color: MUTED }}>$</span>
              <input type="number" min="0" step="0.01" value={ppvPrice}
                onChange={(e) => setPpvPrice(e.target.value)}
                placeholder="0.00 — leave blank for free to subs"
                className="flex-1 rounded-xl border px-3.5 py-2.5 text-[13px] outline-none"
                style={{ background: "rgba(255,255,255,0.04)", borderColor: BORDER, color: TEXT, fontFamily: "inherit" }} />
            </div>
          )}
        </div>

        {/* Draft / publish toggle */}
        <div className="flex items-center gap-3 pt-1 border-t" style={{ borderColor: BORDER }}>
          {(["published", "draft"] as const).map((s) => (
            <button key={s} onClick={() => setStatus(s)}
              className="flex-1 py-2.5 rounded-xl text-[12px] font-black capitalize transition-all"
              style={status === s
                ? { background: s === "published" ? GRAD : "rgba(124,58,237,0.15)", color: TEXT, boxShadow: s === "published" ? "0 4px 14px rgba(124,58,237,0.3)" : "none" }
                : { background: "rgba(255,255,255,0.03)", borderColor: BORDER, color: MUTED, border: `1px solid ${BORDER}` }}>
              {s === "published" ? "🚀 Publish" : "💾 Save Draft"}
            </button>
          ))}
        </div>
      </div>

      {/* Error */}
      {postError && (
        <div className="flex items-center gap-3 rounded-xl border px-4 py-3"
          style={{ background: "rgba(239,57,118,0.08)", borderColor: "rgba(239,57,118,0.3)" }}>
          <span>⚠️</span>
          <p className="text-[12px] font-bold flex-1" style={{ color: P }}>{postError}</p>
          <button onClick={() => setPostError("")} style={{ color: MUTED }}>✕</button>
        </div>
      )}

      {/* Submit */}
      <button onClick={handlePost}
        disabled={isPosting || anyUploading || !files.length || !title.trim()}
        className="w-full py-4 rounded-2xl text-[14px] font-black text-white transition-all flex items-center justify-center gap-2"
        style={{
          background:  isPosting || !files.length || !title.trim() ? "rgba(124,58,237,0.25)" : GRAD,
          boxShadow:   files.length && title.trim() ? "0 8px 28px rgba(124,58,237,0.4)" : "none",
          cursor:      isPosting || anyUploading || !files.length || !title.trim() ? "not-allowed" : "pointer",
          opacity:     isPosting || anyUploading ? 0.7 : 1,
        }}>
        {isPosting || anyUploading ? (
          <><svg className="animate-spin size-4" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="white" strokeWidth="4"/>
            <path className="opacity-75" fill="white" d="M4 12a8 8 0 018-8v8H4z"/>
          </svg>{anyUploading ? "Uploading…" : "Publishing…"}</>
        ) : status === "published" ? "Publish Post →" : "Save Draft"}
      </button>
    </div>
  );
}