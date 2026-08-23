// components/agency/tabs/AgencyPostCreationModal.tsx
"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { MediaUploader, type UploadResult } from "@/components/upload/MediaUploader";
import { MediaPreview } from "@/components/upload/MediaPreview";

const V      = "#7c3aed";
const P      = "#ef3976";
const GRAD   = `linear-gradient(135deg, ${V}, ${P})`;
const CARD   = "#1a1635";
const SURF   = "#13112b";
const BORDER = "rgba(124,58,237,0.18)";
const TEXT   = "#f0eaff";
const MUTED  = "rgba(240,234,255,0.45)";

const inputStyle = {
  background:  "rgba(255,255,255,0.04)",
  borderColor: BORDER,
  color:       TEXT,
  fontFamily:  "inherit",
};

function Field({ label, required, hint, children }: {
  label: string; required?: boolean; hint?: string; children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[10px] font-black uppercase tracking-widest flex items-center gap-1" style={{ color: MUTED }}>
        {label}{required && <span style={{ color: P }}>*</span>}
      </label>
      {children}
      {hint && <p className="text-[10px]" style={{ color: "rgba(240,234,255,0.3)" }}>{hint}</p>}
    </div>
  );
}

function minDateString(daysAhead = 0) {
  const d = new Date();
  d.setDate(d.getDate() + daysAhead);
  return d.toISOString().slice(0, 10);
}

interface AgencyPostCreationModalProps {
  creatorId: string;
  creatorName: string;
  onClose: () => void;
  onCreated: () => void;
}

export function AgencyPostCreationModal({
  creatorId,
  creatorName,
  onClose,
  onCreated,
}: AgencyPostCreationModalProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [title,       setTitle]       = useState("");
  const [description, setDescription] = useState("");
  const [mediaType,   setMediaType]   = useState<"image" | "video">("image");
  const [isLocked,    setIsLocked]    = useState(false);
  const [ppvPrice,    setPpvPrice]    = useState("");
  const [status,      setStatus]      = useState<"published" | "scheduled" | "draft">("published");
  const [schedDate,   setSchedDate]   = useState("");
  const [schedTime,   setSchedTime]   = useState("");

  const [uploadedMedia, setUploadedMedia] = useState<UploadResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  function handleUploadComplete(result: UploadResult) {
    setUploadedMedia(result);
    setMediaType(result.type);
    setError(null);
  }

  async function handleDeleteMedia() {
    if (!uploadedMedia) return;
    const res = await fetch("/api/upload/delete", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ blobName: uploadedMedia.blobName, container: uploadedMedia.container }),
    });
    if (res.ok) setUploadedMedia(null);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!uploadedMedia) { setError("Please upload media first"); return; }
    if (status === "scheduled" && !schedDate) { setError("Please select a date"); return; }
    if (status === "scheduled" && !schedTime) { setError("Please select a time"); return; }

    const scheduledFor = status === "scheduled"
      ? new Date(`${schedDate}T${schedTime}`).toISOString()
      : null;

    setError(null);
    startTransition(async () => {
      try {
        const res = await fetch("/api/agency/posts/create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            creatorId,
            title:        title || null,
            description:  description || null,
            mediaType,
            mediaUrl:     uploadedMedia.url,
            thumbnailUrl: uploadedMedia.thumbnailUrl,
            duration:     uploadedMedia.duration,
            isLocked,
            ppvPrice:     isLocked && ppvPrice ? parseFloat(ppvPrice) : null,
            status,
            scheduledFor,
          }),
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error ?? "Failed to create post");
        }

        router.refresh();
        onCreated();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to create post");
      }
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.88)", backdropFilter: "blur(12px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>

      <div className="w-full max-w-xl rounded-[24px] border overflow-hidden flex flex-col"
        style={{
          background:  CARD,
          borderColor: BORDER,
          boxShadow:   "0 24px 80px rgba(0,0,0,0.6)",
          maxHeight:   "92vh",
          fontFamily:  "'Be Vietnam Pro', sans-serif",
          animation:   "agencyPostPopIn 0.25s cubic-bezier(0.175,0.885,0.32,1.275)",
        }}>

        {/* Gradient bar */}
        <div className="h-1 flex-shrink-0" style={{ background: GRAD }} />

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b flex-shrink-0"
          style={{ borderColor: BORDER, background: SURF }}>
          <div>
            <h2 className="text-[15px] font-black" style={{ color: TEXT }}>Create Post</h2>
            <p className="text-[11px] mt-0.5" style={{ color: MUTED }}>
              Posting on behalf of <span style={{ color: V, fontWeight: 900 }}>{creatorName}</span>
            </p>
          </div>
          <button onClick={onClose}
            className="size-8 rounded-xl flex items-center justify-center"
            style={{ background: "rgba(255,255,255,0.05)", color: MUTED }}>✕</button>
        </div>

        {/* Scrollable content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 flex flex-col gap-4">

          {/* Media uploader */}
          {!uploadedMedia ? (
            <Field label="Media" required>
              <MediaUploader
                type="both"
                container="posts"
                generateThumbnail
                onUploadComplete={handleUploadComplete}
                onUploadError={setError}
                disabled={isPending}
              />
            </Field>
          ) : (
            <Field label="Media">
              <MediaPreview
                url={uploadedMedia.url}
                type={uploadedMedia.type}
                thumbnailUrl={uploadedMedia.thumbnailUrl}
                onDelete={handleDeleteMedia}
                className="w-full max-h-64 rounded-xl overflow-hidden"
              />
              {uploadedMedia.type === "video" && uploadedMedia.duration && (
                <p className="text-[10px] mt-1" style={{ color: MUTED }}>
                  ⏱ {Math.round(uploadedMedia.duration)}s
                </p>
              )}
            </Field>
          )}

          {/* Title */}
          <Field label="Title">
            <input value={title} onChange={(e) => setTitle(e.target.value)}
              placeholder="Give this post a title…"
              className="rounded-xl border px-3.5 py-2.5 text-[13px] outline-none w-full"
              style={inputStyle} />
          </Field>

          {/* Description */}
          <Field label="Caption">
            <textarea value={description} onChange={(e) => setDescription(e.target.value)}
              placeholder="Add a caption…" rows={3}
              className="rounded-xl border px-3.5 py-2.5 text-[13px] outline-none w-full resize-none"
              style={inputStyle} />
          </Field>

          {/* Lock toggle */}
          <div className="flex items-start gap-3 p-3.5 rounded-xl border"
            style={{ background: "rgba(255,255,255,0.02)", borderColor: BORDER }}>
            <button type="button" onClick={() => setIsLocked(!isLocked)}
              className="relative inline-flex items-center h-6 w-11 rounded-full mt-0.5 flex-shrink-0 transition-all"
              style={{ background: isLocked ? GRAD : "rgba(124,58,237,0.15)" }}>
              <span className="inline-block size-4 rounded-full bg-white shadow-sm transition-transform"
                style={{ transform: isLocked ? "translateX(22px)" : "translateX(2px)" }} />
            </button>
            <div>
              <p className="text-[12px] font-black" style={{ color: TEXT }}>🔒 Subscribers only</p>
              <p className="text-[10px] mt-0.5" style={{ color: MUTED }}>Only paid subscribers can view this post</p>
            </div>
          </div>

          {/* PPV price */}
          {isLocked && (
            <Field label="PPV Price (optional)" hint="Leave blank for regular subscriber content">
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[13px] font-black" style={{ color: MUTED }}>$</span>
                <input type="number" value={ppvPrice} onChange={(e) => setPpvPrice(e.target.value)}
                  placeholder="0.00" min="0" step="0.01"
                  className="w-full rounded-xl border pl-8 pr-3.5 py-2.5 text-[13px] outline-none"
                  style={inputStyle} />
              </div>
            </Field>
          )}

          {/* Publishing options */}
          <Field label="Publishing">
            <div className="flex flex-col gap-2">
              {(["published", "scheduled", "draft"] as const).map((s) => {
                const labels = {
                  published: { icon: "📤", title: "Publish Now",        sub: "Goes live immediately" },
                  scheduled: { icon: "📅", title: "Schedule for Later", sub: "Pick a date and time" },
                  draft:     { icon: "💾", title: "Save as Draft",      sub: "Finish and publish later" },
                };
                const l = labels[s];
                const active = status === s;
                return (
                  <button key={s} type="button" onClick={() => setStatus(s)}
                    className="flex items-start gap-3 rounded-xl border p-3 text-left transition-all"
                    style={active
                      ? { background: "rgba(124,58,237,0.1)", borderColor: V }
                      : { background: "rgba(255,255,255,0.02)", borderColor: BORDER }}>
                    <span className="text-[16px] mt-0.5">{l.icon}</span>
                    <div className="flex-1">
                      <p className="text-[12px] font-black" style={{ color: TEXT }}>{l.title}</p>
                      <p className="text-[10px] mt-0.5" style={{ color: MUTED }}>{l.sub}</p>
                    </div>
                    {active && <span className="text-[14px] flex-shrink-0 mt-0.5" style={{ color: V }}>✓</span>}
                  </button>
                );
              })}
            </div>
          </Field>

          {/* Schedule date/time */}
          {status === "scheduled" && (
            <div className="grid grid-cols-2 gap-3">
              <Field label="Date" required>
                <input type="date" value={schedDate} onChange={(e) => setSchedDate(e.target.value)}
                  min={minDateString(1)}
                  className="rounded-xl border px-3.5 py-2.5 text-[13px] outline-none w-full"
                  style={inputStyle} />
              </Field>
              <Field label="Time" required>
                <input type="time" value={schedTime} onChange={(e) => setSchedTime(e.target.value)}
                  className="rounded-xl border px-3.5 py-2.5 text-[13px] outline-none w-full"
                  style={inputStyle} />
              </Field>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="rounded-xl border px-4 py-3 flex items-center gap-2"
              style={{ background: "rgba(239,57,118,0.08)", borderColor: "rgba(239,57,118,0.3)" }}>
              <span>⚠️</span>
              <p className="text-[12px] font-bold flex-1" style={{ color: P }}>{error}</p>
              <button type="button" onClick={() => setError(null)} style={{ color: MUTED }}>✕</button>
            </div>
          )}
        </form>

        {/* Footer actions */}
        <div className="flex items-center gap-3 px-5 py-4 border-t flex-shrink-0"
          style={{ borderColor: BORDER }}>
          <button type="button" onClick={onClose}
            className="flex-1 py-2.5 rounded-xl text-[12px] font-black border transition-all"
            style={{ background: "transparent", borderColor: BORDER, color: MUTED }}>
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isPending || !uploadedMedia}
            className="flex-1 py-2.5 rounded-xl text-[12px] font-black text-white transition-all flex items-center justify-center gap-2"
            style={{
              background: isPending || !uploadedMedia ? "rgba(124,58,237,0.2)" : GRAD,
              boxShadow:  isPending || !uploadedMedia ? "none" : "0 4px 14px rgba(124,58,237,0.3)",
              opacity:    isPending ? 0.7 : 1,
              cursor:     !uploadedMedia ? "not-allowed" : "pointer",
            }}>
            {isPending ? (
              <><svg className="animate-spin size-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="white" strokeWidth="4"/>
                <path className="opacity-75" fill="white" d="M4 12a8 8 0 018-8v8H4z"/>
              </svg>
              {status === "scheduled" ? "Scheduling…" : status === "draft" ? "Saving…" : "Publishing…"}
              </>
            ) : status === "scheduled" ? "📅 Schedule Post"
              : status === "draft" ? "💾 Save Draft"
              : "📤 Publish Post"}
          </button>
        </div>
      </div>
      <style>{`@keyframes agencyPostPopIn{from{transform:scale(0.92);opacity:0}to{transform:scale(1);opacity:1}}`}</style>
    </div>
  );
}