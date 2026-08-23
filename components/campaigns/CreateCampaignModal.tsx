"use client";

// components/campaigns/CreateCampaignModal.tsx
//
// Shared creation flow for both creators (making their own campaign) and
// agencies (making a campaign on behalf of a managed creator). The only
// difference is the `managedCreators` prop — pass it for agency use, omit
// it for creator self-service, and the form adapts automatically.

import { useState, useCallback } from "react";

const V      = "#7c3aed";
const P      = "#ef3976";
const GRAD   = `linear-gradient(135deg, ${V}, ${P})`;
const CARD   = "#1a1635";
const SURF   = "#13112b";
const BORDER = "rgba(124,58,237,0.18)";
const TEXT   = "#f0eaff";
const MUTED  = "rgba(240,234,255,0.45)";

interface ManagedCreator {
  creatorId: string;
  name:      string;
  username:  string;
  avatarUrl: string | null;
}

interface CreateCampaignModalProps {
  onClose:   () => void;
  onCreated: (campaign: any) => void;
  /** Pass this for agency use — lets them pick which managed creator the campaign is for.
   *  Omit entirely for a creator creating their own campaign. */
  managedCreators?: ManagedCreator[];
}

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
        {label}
        {required && <span style={{ color: P }}>*</span>}
      </label>
      {children}
      {hint && <p className="text-[10px]" style={{ color: "rgba(240,234,255,0.3)" }}>{hint}</p>}
    </div>
  );
}

// Default deadline: 30 days from now, formatted for <input type="date">
function defaultDeadline(): string {
  const d = new Date();
  d.setDate(d.getDate() + 30);
  return d.toISOString().slice(0, 10);
}

export function CreateCampaignModal({ onClose, onCreated, managedCreators }: CreateCampaignModalProps) {
  const isAgencyMode = !!managedCreators && managedCreators.length > 0;

  const [step,    setStep]    = useState(1);
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState("");

  // Form state
  const [selectedCreatorId, setSelectedCreatorId] = useState(managedCreators?.[0]?.creatorId ?? "");
  const [title,         setTitle]         = useState("");
  const [description,   setDescription]   = useState("");
  const [coverImageUrl, setCoverImageUrl] = useState("");
  const [goalAmount,    setGoalAmount]    = useState("");
  const [deadline,      setDeadline]      = useState(defaultDeadline());
  const [publishNow,    setPublishNow]    = useState(true);

  const totalSteps = isAgencyMode ? 3 : 2; // agency gets an extra "pick creator" step

  const step1Valid = !isAgencyMode || !!selectedCreatorId;
  const detailsValid = title.trim().length > 0 && description.trim().length > 0;
  const goalValid = !!goalAmount && Number(goalAmount) > 0 && !!deadline;

  const handleSubmit = useCallback(async () => {
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/campaigns/create", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          creatorId:     isAgencyMode ? selectedCreatorId : undefined,
          title:         title.trim(),
          description:   description.trim(),
          coverImageUrl: coverImageUrl.trim() || undefined,
          goalAmount:    Number(goalAmount),
          deadline:      new Date(deadline).toISOString(),
          publishNow,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to create campaign");
        setSaving(false);
        return;
      }
      onCreated(data.campaign);
    } catch (e: any) {
      setError(e?.message ?? "Something went wrong");
      setSaving(false);
    }
  }, [isAgencyMode, selectedCreatorId, title, description, coverImageUrl, goalAmount, deadline, publishNow, onCreated]);

  const selectedCreator = managedCreators?.find((c) => c.creatorId === selectedCreatorId);

  // Step layout: agency = [Creator, Details, Goal & Review], creator = [Details, Goal & Review]
  const currentLogicalStep = isAgencyMode ? step : step + 1; // shift so messaging below stays simple

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.88)", backdropFilter: "blur(12px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>

      <div className="w-full max-w-lg rounded-[24px] border overflow-hidden flex flex-col"
        style={{
          background:  CARD,
          borderColor: BORDER,
          boxShadow:   "0 24px 80px rgba(0,0,0,0.6)",
          maxHeight:   "92vh",
          animation:   "campaignPopIn 0.25s cubic-bezier(0.175,0.885,0.32,1.275)",
        }}>

        <div className="h-1 flex-shrink-0" style={{ background: GRAD }} />

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b flex-shrink-0"
          style={{ borderColor: BORDER, background: SURF }}>
          <div>
            <h2 className="text-[15px] font-black" style={{ color: TEXT }}>
              🎯 New Campaign
            </h2>
            <p className="text-[11px] mt-0.5" style={{ color: MUTED }}>
              {isAgencyMode ? "Create a crowdfunding campaign for a creator" : "Set a goal and start raising funds"}
            </p>
          </div>
          <button onClick={onClose}
            className="size-8 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: "rgba(255,255,255,0.05)", color: MUTED }}>✕</button>
        </div>

        {/* Step indicator */}
        <div className="px-5 py-3 border-b flex items-center gap-1.5 flex-shrink-0" style={{ borderColor: BORDER, background: SURF }}>
          {Array.from({ length: totalSteps }, (_, i) => i + 1).map((s) => (
            <div key={s} className="flex-1 h-1 rounded-full transition-all"
              style={{ background: s <= step ? GRAD : "rgba(124,58,237,0.12)" }} />
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-4">

          {/* ── Step: pick creator (agency mode only) ── */}
          {isAgencyMode && step === 1 && (
            <>
              <div>
                <h3 className="text-[14px] font-black" style={{ color: TEXT }}>Which creator is this for?</h3>
                <p className="text-[11px] mt-0.5" style={{ color: MUTED }}>Select a creator from your managed roster</p>
              </div>
              <div className="flex flex-col gap-2">
                {managedCreators!.map((c) => (
                  <button key={c.creatorId} onClick={() => setSelectedCreatorId(c.creatorId)}
                    className="flex items-center gap-3 rounded-2xl border p-3 text-left transition-all"
                    style={selectedCreatorId === c.creatorId
                      ? { background: "rgba(124,58,237,0.12)", borderColor: V }
                      : { background: "rgba(255,255,255,0.02)", borderColor: BORDER }}>
                    <div className="size-10 rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center font-black text-white text-[14px]"
                      style={{ background: c.avatarUrl ? "transparent" : GRAD }}>
                      {c.avatarUrl ? <img src={c.avatarUrl} className="size-full object-cover" alt="" /> : c.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-black truncate" style={{ color: TEXT }}>{c.name}</p>
                      <p className="text-[11px]" style={{ color: MUTED }}>@{c.username}</p>
                    </div>
                    {selectedCreatorId === c.creatorId && (
                      <span className="text-[16px] flex-shrink-0" style={{ color: V }}>✓</span>
                    )}
                  </button>
                ))}
              </div>
            </>
          )}

          {/* ── Step: campaign details ── */}
          {((isAgencyMode && step === 2) || (!isAgencyMode && step === 1)) && (
            <>
              <div>
                <h3 className="text-[14px] font-black" style={{ color: TEXT }}>Campaign Details</h3>
                <p className="text-[11px] mt-0.5" style={{ color: MUTED }}>
                  {isAgencyMode ? `For ${selectedCreator?.name ?? "this creator"}` : "Tell fans what you're raising funds for"}
                </p>
              </div>

              <Field label="Campaign Title" required>
                <input value={title} onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. New Studio Setup, Tour Fund, Album Production"
                  maxLength={80}
                  className="rounded-xl border px-3.5 py-2.5 text-[13px] outline-none w-full" style={inputStyle} />
              </Field>

              <Field label="Description" required hint="Explain what the funds will be used for">
                <textarea value={description} onChange={(e) => setDescription(e.target.value)}
                  placeholder="Share the story behind this campaign…" rows={4} maxLength={1000}
                  className="rounded-xl border px-3.5 py-2.5 text-[13px] outline-none w-full resize-none" style={inputStyle} />
              </Field>

              <Field label="Cover Image URL" hint="Optional — a banner image for the campaign page">
                <input value={coverImageUrl} onChange={(e) => setCoverImageUrl(e.target.value)}
                  placeholder="https://…/cover.jpg"
                  className="rounded-xl border px-3.5 py-2.5 text-[13px] outline-none w-full" style={inputStyle} />
              </Field>
            </>
          )}

          {/* ── Step: goal & review ── */}
          {((isAgencyMode && step === 3) || (!isAgencyMode && step === 2)) && (
            <>
              <div>
                <h3 className="text-[14px] font-black" style={{ color: TEXT }}>Goal & Review</h3>
                <p className="text-[11px] mt-0.5" style={{ color: MUTED }}>Set your funding goal and deadline</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Goal Amount" required>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[13px] font-black" style={{ color: MUTED }}>$</span>
                    <input type="number" value={goalAmount} onChange={(e) => setGoalAmount(e.target.value)}
                      placeholder="5000" min="1" step="1"
                      className="w-full rounded-xl border pl-8 pr-3.5 py-2.5 text-[13px] outline-none" style={inputStyle} />
                  </div>
                </Field>

                <Field label="Deadline" required>
                  <input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)}
                    min={new Date(Date.now() + 86400000).toISOString().slice(0, 10)}
                    className="w-full rounded-xl border px-3.5 py-2.5 text-[13px] outline-none" style={inputStyle} />
                </Field>
              </div>

              {/* Publish toggle */}
              <div className="flex items-start gap-3 p-3.5 rounded-xl border"
                style={{ background: "rgba(255,255,255,0.02)", borderColor: BORDER }}>
                <button onClick={() => setPublishNow(!publishNow)}
                  className="relative inline-flex items-center h-6 w-11 rounded-full mt-0.5 flex-shrink-0 transition-all"
                  style={{ background: publishNow ? GRAD : "rgba(124,58,237,0.15)" }}>
                  <span className="inline-block size-4 rounded-full bg-white shadow-sm transition-transform"
                    style={{ transform: publishNow ? "translateX(22px)" : "translateX(2px)" }} />
                </button>
                <div>
                  <p className="text-[12px] font-black" style={{ color: TEXT }}>
                    {publishNow ? "Publish immediately" : "Save as draft"}
                  </p>
                  <p className="text-[10px] mt-0.5" style={{ color: MUTED }}>
                    {publishNow ? "Fans can pledge as soon as this is created" : "You can publish it later from your campaigns dashboard"}
                  </p>
                </div>
              </div>

              {/* Review summary */}
              <div className="rounded-[16px] border p-4 flex flex-col gap-3" style={{ background: "rgba(255,255,255,0.02)", borderColor: BORDER }}>
                <p className="text-[9px] font-black uppercase tracking-widest" style={{ color: MUTED }}>Summary</p>
                {isAgencyMode && selectedCreator && (
                  <div className="flex items-center gap-2">
                    <span className="text-[11px]" style={{ color: MUTED }}>For:</span>
                    <span className="text-[12px] font-black" style={{ color: TEXT }}>{selectedCreator.name}</span>
                  </div>
                )}
                <div>
                  <p className="text-[14px] font-black" style={{ color: TEXT }}>{title || "Untitled campaign"}</p>
                  <p className="text-[11px] mt-1 line-clamp-2" style={{ color: MUTED }}>{description || "No description"}</p>
                </div>
                <div className="flex gap-6">
                  <div>
                    <p className="text-[9px] font-bold uppercase" style={{ color: MUTED }}>Goal</p>
                    <p className="text-[15px] font-black" style={{ color: TEXT }}>
                      ${goalAmount ? Number(goalAmount).toLocaleString() : "0"}
                    </p>
                  </div>
                  <div>
                    <p className="text-[9px] font-bold uppercase" style={{ color: MUTED }}>Deadline</p>
                    <p className="text-[15px] font-black" style={{ color: TEXT }}>
                      {deadline ? new Date(deadline).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "–"}
                    </p>
                  </div>
                </div>
              </div>

              {error && (
                <div className="rounded-xl border px-4 py-3 flex items-center gap-2"
                  style={{ background: "rgba(239,57,118,0.08)", borderColor: "rgba(239,57,118,0.3)" }}>
                  <span>⚠️</span>
                  <p className="text-[12px] font-bold flex-1" style={{ color: P }}>{error}</p>
                  <button onClick={() => setError("")} style={{ color: MUTED }}>✕</button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Nav buttons */}
        <div className="flex items-center gap-3 px-5 py-4 border-t flex-shrink-0" style={{ borderColor: BORDER }}>
          {step === 1 ? (
            <button onClick={onClose}
              className="flex-1 py-2.5 rounded-xl text-[12px] font-black border transition-all"
              style={{ background: "transparent", borderColor: BORDER, color: MUTED }}>
              Cancel
            </button>
          ) : (
            <button onClick={() => { setError(""); setStep((s) => s - 1); }}
              className="flex-1 py-2.5 rounded-xl text-[12px] font-black border transition-all"
              style={{ background: "transparent", borderColor: BORDER, color: MUTED }}>
              ← Back
            </button>
          )}

          <div className="flex-shrink-0 text-[10px] font-bold" style={{ color: MUTED }}>
            {step} / {totalSteps}
          </div>

          {step < totalSteps ? (
            <button
              onClick={() => {
                const valid = step === 1 ? step1Valid : (isAgencyMode ? detailsValid : detailsValid);
                if (!valid) { setError("Please fill in all required fields"); return; }
                setError("");
                setStep((s) => s + 1);
              }}
              className="flex-1 py-2.5 rounded-xl text-[12px] font-black text-white transition-all"
              style={{ background: GRAD, boxShadow: "0 4px 14px rgba(124,58,237,0.3)" }}>
              Continue →
            </button>
          ) : (
            <button onClick={handleSubmit} disabled={saving || !goalValid}
              className="flex-1 py-2.5 rounded-xl text-[12px] font-black text-white transition-all flex items-center justify-center gap-2"
              style={{
                background: saving || !goalValid ? "rgba(124,58,237,0.25)" : GRAD,
                boxShadow:  saving || !goalValid ? "none" : "0 4px 14px rgba(124,58,237,0.3)",
                opacity:    saving ? 0.7 : 1,
                cursor:     !goalValid ? "not-allowed" : "pointer",
              }}>
              {saving ? (
                <><svg className="animate-spin size-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="white" strokeWidth="4"/>
                  <path className="opacity-75" fill="white" d="M4 12a8 8 0 018-8v8H4z"/>
                </svg>Creating…</>
              ) : "🎯 Create Campaign"}
            </button>
          )}
        </div>
      </div>
      <style>{`@keyframes campaignPopIn{from{transform:scale(0.92);opacity:0}to{transform:scale(1);opacity:1}}`}</style>
    </div>
  );
}