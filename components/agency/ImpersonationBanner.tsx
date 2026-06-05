// components/agency/ImpersonationBanner.tsx
"use client";

import { useState } from "react";

interface ImpersonationBannerProps {
  currentUserName: string;
  originalUserName: string;
}

export function ImpersonationBanner({ currentUserName, originalUserName }: ImpersonationBannerProps) {
  const [isStopping, setIsStopping] = useState(false);

  async function handleStopImpersonate() {
    setIsStopping(true);
    try {
      const response = await fetch("/api/agency/stop-impersonate", {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Failed to stop impersonation");
      }

      const data = await response.json();
      
      // Redirect back to agency dashboard
      window.location.href = data.redirectTo || "/dashboard/agency";
    } catch (error) {
      console.error("Stop impersonate error:", error);
      alert("Failed to stop impersonation");
      setIsStopping(false);
    }
  }

  return (
    <div className="bg-yellow-500/20 border border-yellow-500/50 rounded-lg p-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <span className="text-2xl">👤</span>
        <div>
          <div className="text-yellow-400 font-bold">
            Impersonating: {currentUserName}
          </div>
          <div className="text-yellow-300 text-sm">
            Agency: {originalUserName}
          </div>
        </div>
      </div>
      <button
        onClick={handleStopImpersonate}
        disabled={isStopping}
        className="px-4 py-2 rounded-lg bg-yellow-500 text-black font-semibold hover:bg-yellow-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isStopping ? "Stopping..." : "Stop Impersonating"}
      </button>
    </div>
  );
}