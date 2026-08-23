"use client";

// components/agency/campaigns/AgencyCreateCampaignButton.tsx
//
// For AGENCIES creating a campaign on behalf of a managed creator. Fetches
// the agency's roster of creators when clicked, then passes them into
// CreateCampaignModal so the agency picks who the campaign is for.
//
// Usage (in agency dashboard):
//   import { AgencyCreateCampaignButton } from "@/components/agency/campaigns/AgencyCreateCampaignButton";
//   <AgencyCreateCampaignButton onCreated={() => router.refresh()} />

import { useState, useCallback } from "react";
import { CreateCampaignModal } from "@/components/campaigns/CreateCampaignModal";

const V    = "#7c3aed";
const P    = "#ef3976";
const GRAD = `linear-gradient(135deg, ${V}, ${P})`;
const MUTED = "rgba(240,234,255,0.45)";

interface ManagedCreator {
  creatorId: string;
  name:      string;
  username:  string;
  avatarUrl: string | null;
}

interface AgencyCreateCampaignButtonProps {
  onCreated?: (campaign: any) => void;
  variant?: "full" | "icon";
}

export function AgencyCreateCampaignButton({ onCreated, variant = "full" }: AgencyCreateCampaignButtonProps) {
  const [showModal, setShowModal] = useState(false);
  const [loading,   setLoading]   = useState(false);
  const [creators,  setCreators]  = useState<ManagedCreator[] | null>(null);
  const [error,     setError]     = useState("");

  const handleOpen = useCallback(async () => {
  setError("");
  setLoading(true);
  try {
    const res  = await fetch("/api/agency/creators");
    const data = await res.json();
    const list: ManagedCreator[] = (data.creators ?? []).map((c: any) => ({
      creatorId: c.creatorId ?? c.id,
      name:      c.name,
      username:  c.username,
      avatarUrl: c.avatarUrl ?? null,
    }));

    if (list.length === 0) {
      setError("Add a creator to your agency before creating a campaign");
      setLoading(false);
      return;
    }

    setCreators(list);
    setShowModal(true);
  } catch {
    setError("Failed to load your creators. Please try again.");
  } finally {
    setLoading(false);
  }
}, []);

  const handleCreated = (campaign: any) => {
    setShowModal(false);
    onCreated?.(campaign);
  };

  return (
    <>
      <div className="flex flex-col items-end gap-1.5">
        {variant === "full" ? (
          <button
            onClick={handleOpen}
            disabled={loading}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-[13px] font-black text-white transition-all hover:opacity-90 active:scale-[0.97]"
            style={{
              background: GRAD,
              boxShadow:  "0 4px 16px rgba(124,58,237,0.35)",
              fontFamily: "'Be Vietnam Pro', sans-serif",
              opacity:    loading ? 0.7 : 1,
            }}
          >
            {loading ? (
              <><svg className="animate-spin size-3.5" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="white" strokeWidth="4"/>
                <path className="opacity-75" fill="white" d="M4 12a8 8 0 018-8v8H4z"/>
              </svg>Loading…</>
            ) : "🎯 New Campaign"}
          </button>
        ) : (
          <button
            onClick={handleOpen}
            disabled={loading}
            className="size-10 rounded-xl flex items-center justify-center text-white transition-all hover:opacity-90 active:scale-[0.95]"
            style={{ background: GRAD, boxShadow: "0 4px 16px rgba(124,58,237,0.35)", opacity: loading ? 0.7 : 1 }}
            title="New Campaign"
          >
            🎯
          </button>
        )}

        {error && (
          <p className="text-[10px] font-bold" style={{ color: P, fontFamily: "'Be Vietnam Pro', sans-serif" }}>
            {error}
          </p>
        )}
      </div>

      {showModal && creators && (
        <CreateCampaignModal
          managedCreators={creators}
          onClose={() => setShowModal(false)}
          onCreated={handleCreated}
        />
      )}
    </>
  );
}