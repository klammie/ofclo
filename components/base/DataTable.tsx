// components/ui/DataTable.tsx
"use client";

import type { ReactNode } from "react";

interface Column<T> {
  label:      string;
  accessor:   keyof T | ((row: T) => ReactNode);
  className?: string;
}

interface DataTableProps<T> {
  columns:      Column<T>[];
  rows:         T[];
  keyExtractor: (row: T, i: number) => string;
  accentColor?: string;
  emptyMessage?: string;
}

export function DataTable<T>({
  columns, rows, keyExtractor, accentColor = "#6366f1", emptyMessage = "No data yet.",
}: DataTableProps<T>) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr style={{ borderBottom: "1px solid #2a2a4a" }}>
            {columns.map(col => (
              <th
                key={col.label}
                className={`py-2.5 px-3 text-left text-[11px] font-semibold uppercase tracking-widest text-gray-500 ${col.className ?? ""}`}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="py-10 text-center text-gray-600">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            rows.map((row, i) => (
              <tr
                key={keyExtractor(row, i)}
                className="border-b border-white/5 hover:bg-white/3 transition-colors"
              >
                {columns.map(col => (
                  <td key={col.label} className={`py-3 px-3 text-gray-300 ${col.className ?? ""}`}>
                    {typeof col.accessor === "function"
                      ? col.accessor(row)
                      : (row[col.accessor] as ReactNode)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}