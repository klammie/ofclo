// components/admin/PayoutTable.tsx
"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { DataTable } from "@/components/base/DataTable";
import { Badge } from "@/components/base/Badge";
import type { PayoutWithCreator } from "@/lib/types";

interface PayoutTableProps {
  payouts: PayoutWithCreator[];
}

export function PayoutTable({ payouts }: PayoutTableProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [processing, setProcessing] = useState<Set<string>>(new Set());

  function handleInitiatePayout(payoutId: string, creatorId: string) {
    setProcessing(prev => new Set(prev).add(payoutId));
    
    startTransition(async () => {
      try {
        const res = await fetch("/api/admin/payouts/initiate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ creatorId }),
        });

        if (!res.ok) {
          const err = await res.json();
          alert(`Payout failed: ${err.error}`);
        } else {
          // Refresh the page to show updated status
          router.refresh();
        }
      } catch (err) {
        alert(err);
      } finally {
        setProcessing(prev => {
          const next = new Set(prev);
          next.delete(payoutId);
          return next;
        });
      }
    });
  }

  function handleBatchPayout() {
    if (!confirm(`Process ${payouts.length} pending payouts?`)) return;

    startTransition(async () => {
      await fetch("/api/admin/payouts/batch", { method: "POST" });
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Batch action button */}
      {payouts.length > 0 && (
        <div className="flex justify-end">
          <button
            onClick={handleBatchPayout}
            disabled={isPending}
            className="px-4 py-2 rounded-lg text-sm font-bold bg-indigo-500/20 text-indigo-400 border border-indigo-500/40 hover:bg-indigo-500/30 transition-colors disabled:opacity-50"
          >
            {isPending ? "Processing…" : `Process All (${payouts.length})`}
          </button>
        </div>
      )}

      <DataTable
        rows={payouts}
        keyExtractor={r => r.id}
        emptyMessage="No pending payouts"
        columns={[
          {
            label: "Creator",
            accessor: row => (
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-indigo-500/20 text-indigo-400 font-black text-xs flex items-center justify-center shrink-0">
                  {row.creator.user.displayName.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <div className="text-white font-semibold text-sm">
                    {row.creator.user.displayName}
                  </div>
                  <div className="text-gray-500 text-xs">
                    @{row.creator.user.username}
                  </div>
                </div>
              </div>
            ),
          },
          {
            label: "Gross Amount",
            accessor: row => (
              <span className="text-gray-300 font-mono text-sm">
                ${Number(row.grossAmount).toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
            ),
          },
          {
            label: "Platform Fee (20%)",
            accessor: row => (
              <span className="text-red-400 font-mono text-sm">
                -${Number(row.platformFee).toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
            ),
          },
          {
            label: "Net Payout",
            accessor: row => (
              <span className="text-emerald-400 font-bold font-mono text-sm">
                ${Number(row.netAmount).toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
            ),
          },
          {
            label: "Crypto",
            accessor: row => (
              <div className="text-xs">
                <div className="text-white font-semibold">{row.cryptoCurrency}</div>
                <div className="text-gray-500 font-mono text-[10px]">
                  {row.destinationAddress.slice(0, 6)}...{row.destinationAddress.slice(-4)}
                </div>
              </div>
            ),
          },
          {
            label: "Date",
            accessor: row => (
              <span className="text-gray-400 text-xs">
                {new Date(row.createdAt).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
            ),
          },
          {
            label: "Status",
            accessor: row => <Badge status={row.status} />,
          },
          {
            label: "Actions",
            accessor: row => {
              const isProcessing = processing.has(row.id);
              const canInitiate = row.status === "pending";

              if (!canInitiate) {
                return (
                  <span className="text-gray-600 text-xs">
                    {row.status === "sent" ? "✓ Completed" : "Processing…"}
                  </span>
                );
              }

              return (
                <button
                  disabled={isProcessing || isPending}
                  onClick={() => handleInitiatePayout(row.id, row.creatorId)}
                  className="px-3 py-1.5 text-[11px] font-bold rounded-md bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/25 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isProcessing ? "Sending…" : "Send via MaxelPay"}
                </button>
              );
            },
          },
        ]}
      />

      {/* Info footer */}
      <div
        className="p-4 rounded-xl text-xs"
        style={{
          background: "#f59e0b10",
          border: "1px solid #f59e0b20",
          color: "#f59e0b",
        }}
      >
        <div className="font-bold mb-1">💡 MaxelPay Crypto Payouts</div>
        <div className="text-yellow-400/70">
          Payouts are sent to creator&apos;s configured wallet address via MaxelPay.
          Supported networks: ERC20, BEP20, TRC20. Transactions are irreversible.
        </div>
      </div>
    </div>
  );
}