"use client";

// components/agency/ImpersonationBanner.tsx
//
// Shows a sticky banner at the top of the agency dashboard whenever the
// agency is actively impersonating a creator. Provides a clearly visible
// "Stop Impersonating" button so they can return to their own account.
//
// Usage (in your agency layout or AgencyDashboard):
//   import { ImpersonationBanner } from "@/components/agency/ImpersonationBanner";
//   <ImpersonationBanner creatorName="Jane Doe" />
//
// To detect if impersonation is active server-side:
//   import { cookies } from "next/headers";
//   const cookieStore = await cookies();
//   const impersonatingId = cookieStore.get("impersonating_user_id")?.value ?? null;
//
// Then conditionally render the banner and pass the creator's name:
//   {impersonatingId && <ImpersonationBanner creatorName={creatorName} />}

import { useState } from "react";
import { useRouter } from "next/navigation";

const P    = "#ef3976";
const GOLD = "#fbbf24";

interface ImpersonationBannerProps {
  /** Display name of the creator being impersonated — shown in the banner */
  creatorName?: string;
}

export function ImpersonationBanner({ creatorName }: ImpersonationBannerProps) {
  const router = useRouter();
  const [stopping, setStopping] = useState(false);

  async function handleStop() {
    setStopping(true);
    try {
      const res = await fetch("/api/agency/stop-impersonate", { method: "POST" });
      const data = await res.json();
      if (data.redirectTo) {
        router.push(data.redirectTo);
        router.refresh();
      }
    } catch {
      setStopping(false);
    }
  }

  return (
    <div
      className="w-full flex items-center justify-between gap-3 px-4 py-2.5 text-[12px] font-bold"
      style={{
        background:    "linear-gradient(135deg, rgba(251,191,36,0.15), rgba(239,57,118,0.12))",
        borderBottom:  "1px solid rgba(251,191,36,0.35)",
        fontFamily:    "'Be Vietnam Pro', sans-serif",
      }}
    >
      <div className="flex items-center gap-2">
        <span className="text-[15px]">👁️</span>
        <span style={{ color: GOLD }}>
          Impersonating{creatorName ? ` — acting as ` : ""}
          {creatorName && (
            <span className="font-black" style={{ color: "#fff" }}>{creatorName}</span>
          )}
        </span>
        <span className="hidden sm:inline text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
          style={{ background: "rgba(251,191,36,0.2)", color: GOLD }}>
          Agency Mode
        </span>
      </div>

      <button
        onClick={handleStop}
        disabled={stopping}
        className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-black transition-all hover:opacity-90 active:scale-[0.97] flex-shrink-0"
        style={{
          background: stopping ? "rgba(239,57,118,0.2)" : P,
          color:      "#fff",
          opacity:    stopping ? 0.7 : 1,
        }}
      >
        {stopping ? (
          <><svg className="animate-spin size-3" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="white" strokeWidth="4"/>
            <path className="opacity-75" fill="white" d="M4 12a8 8 0 018-8v8H4z"/>
          </svg>Stopping…</>
        ) : (
          <>✕ Stop Impersonating</>
        )}
      </button>
    </div>
  );
}