// components/admin/CreatorTable.tsx
"use client";

import { useTransition } from "react";
import { DataTable }  from "@/components/base/DataTable";
import { Badge }      from "@/components/base/Badge";
import type { AdminCreatorRow } from "@/lib/types";

interface CreatorTableProps {
  creators: AdminCreatorRow[];
}

export function CreatorTable({ creators }: CreatorTableProps) {
  const [isPending, startTransition] = useTransition();

  function handleSuspend(creatorId: string) {
    startTransition(async () => {
      await fetch(`/api/admin/creators/${creatorId}/suspend`, { method: "POST" });
      // Ideally call router.refresh() here via useRouter
    });
  }

  return (
    <DataTable
      rows={creators}
      keyExtractor={r => r.id}
      columns={[
        {
          label:    "Creator",
          accessor: row => (
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-indigo-500/20 text-indigo-400 font-black text-xs flex items-center justify-center shrink-0">
                {row.user.name.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <div className="text-white font-semibold text-sm">{row.user.name}</div>
                <div className="text-gray-500 text-xs">@{row.user.username}</div>
              </div>
            </div>
          ),
        },
        {
          label:    "Agency",
          accessor: row => (
            <span className="text-gray-400 text-sm">{row.agency?.name ?? "—"}</span>
          ),
        },
        {
          label:    "Revenue",
          accessor: row => (
            <span className="text-emerald-400 font-bold">
              ${Number(row.totalEarnings).toLocaleString()}
            </span>
          ),
        },
        {
          label:    "Subscribers",
          accessor: row => row.subscriberCount.toLocaleString(),
        },
        {
          label:    "Status",
          accessor: row => <Badge status={row.status} />,
        },
        {
          label:    "Verified",
          accessor: row => row.isVerified
            ? <Badge status="active" label="✓ Verified" />
            : <Badge status="pending" label="Unverified" />,
        },
        {
          label:    "Actions",
          accessor: row => (
            <div className="flex gap-2">
              <button className="px-2.5 py-1 text-[11px] font-bold rounded-md bg-indigo-500/15 text-indigo-400 border border-indigo-500/30 hover:bg-indigo-500/25 transition-colors">
                Edit
              </button>
              <button
                disabled={isPending}
                onClick={() => handleSuspend(row.id)}
                className="px-2.5 py-1 text-[11px] font-bold rounded-md bg-red-500/15 text-red-400 border border-red-500/30 hover:bg-red-500/25 transition-colors disabled:opacity-50"
              >
                Suspend
              </button>
            </div>
          ),
        },
      ]}
    />
  );
}