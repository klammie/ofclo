// components/admin/ReportQueue.tsx
"use client";

import { useTransition } from "react";
import { Badge } from "@/components/base/Badge";
import type { ReportWithDetails } from "@/lib/types";

interface ReportQueueProps {
  reports: ReportWithDetails[];
}

export function ReportQueue({ reports }: ReportQueueProps) {
  const [isPending, startTransition] = useTransition();

  function handle(reportId: string, action: "resolve" | "dismiss" | "remove_content") {
    startTransition(async () => {
      await fetch(`/api/admin/reports/${reportId}/${action}`, { method: "POST" });
    });
  }

  return (
    <div className="flex flex-col divide-y divide-white/5">
      {reports.map(r => (
        <div key={r.id} className="py-3.5 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-white font-semibold text-sm">
              {r.type.replace(/_/g, " ")}
            </div>
            <div className="text-gray-500 text-xs mt-0.5">
              {r.reportedCreator?.user.displayName
                ? `Creator: ${r.reportedCreator.user.displayName}`
                : r.reportedPost?.title
                  ? `Post: "${r.reportedPost.title}"`
                  : "Platform report"
              } · {new Date(r.createdAt).toLocaleDateString()}
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Badge status={r.status} />
            <button
              disabled={isPending}
              onClick={() => handle(r.id, "resolve")}
              className="px-2 py-1 text-[10px] font-bold rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
            >
              Resolve
            </button>
            <button
              disabled={isPending}
              onClick={() => handle(r.id, "remove_content")}
              className="px-2 py-1 text-[10px] font-bold rounded bg-red-500/15 text-red-400 border border-red-500/30"
            >
              Remove
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}