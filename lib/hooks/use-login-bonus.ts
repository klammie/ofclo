"use client";

import { useState, useEffect, useCallback } from "react";
import type { LoginBonusData, ClaimResponse, ApiError } from "@/lib/types";

interface UseLoginBonusReturn {
  data: LoginBonusData | null;
  isLoading: boolean;
  isClaiming: boolean;
  error: string | null;
  claimResult: ClaimResponse | null;
  claim: () => Promise<void>;
  refetch: () => Promise<void>;
  msUntilNextClaim: number;
}

export function useLoginBonus(seasonId = 1): UseLoginBonusReturn {
  const [data, setData] = useState<LoginBonusData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isClaiming, setIsClaiming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [claimResult, setClaimResult] = useState<ClaimResponse | null>(null);
  const [msUntilNextClaim, setMsUntilNextClaim] = useState(0);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/login-bonus?seasonId=${seasonId}`);
      if (!res.ok) {
        const err: ApiError = await res.json();
        throw new Error(err.error);
      }
      const json: LoginBonusData = await res.json();
      setData(json);
      if (json.nextClaimAt) {
        setMsUntilNextClaim(
          Math.max(0, new Date(json.nextClaimAt).getTime() - Date.now())
        );
      }
    } catch (e: any) {
      setError(e.message ?? "Failed to load login bonus");
    } finally {
      setIsLoading(false);
    }
  }, [seasonId]);

  // Live countdown ticker
  useEffect(() => {
    if (!msUntilNextClaim) return;
    const interval = setInterval(() => {
      setMsUntilNextClaim((prev) => {
        const next = Math.max(0, prev - 1000);
        if (next === 0) clearInterval(interval);
        return next;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [msUntilNextClaim]);

  const claim = useCallback(async () => {
    if (isClaiming) return;
    setIsClaiming(true);
    setError(null);
    try {
      const res = await fetch("/api/login-bonus/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ seasonId }),
      });
      if (!res.ok) {
        const err: ApiError = await res.json();
        if (err.code === "ALREADY_CLAIMED") {
          await fetchData();
          return;
        }
        throw new Error(err.error);
      }
      const result: ClaimResponse = await res.json();
      setClaimResult(result);
      await fetchData();
    } catch (e: any) {
      setError(e.message ?? "Failed to claim reward");
    } finally {
      setIsClaiming(false);
    }
  }, [isClaiming, seasonId, fetchData]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, isLoading, isClaiming, error, claimResult, claim, refetch: fetchData, msUntilNextClaim };
}

export function formatCountdown(ms: number): string {
  if (ms <= 0) return "Available now";
  const totalSecs = Math.floor(ms / 1000);
  const h = Math.floor(totalSecs / 3600);
  const m = Math.floor((totalSecs % 3600) / 60);
  const s = totalSecs % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}