"use client";

import { useState, useEffect, useCallback } from "react";
import type {
  WalletBalance,
  Transactions,
  CoinPackage,
  DepositRequest,
  DepositResponse,
  WithdrawRequest,
  WithdrawResponse,
  BuyCoinsRequest,
  BuyCoinsResponse,
} from "@/lib/types";

interface UseWalletReturn {
  balance: WalletBalance | null;
  transactions: Transactions[];
  packages: CoinPackage[];
  isLoading: boolean;
  isActing: boolean;
  error: string | null;
  deposit: (req: DepositRequest) => Promise<DepositResponse | null>;
  withdraw: (req: WithdrawRequest) => Promise<WithdrawResponse | null>;
  buyCoins: (req: BuyCoinsRequest) => Promise<BuyCoinsResponse | null>;
  loadMoreTransactions: () => Promise<void>;
  hasMoreTransactions: boolean;
  refetch: () => Promise<void>;
  clearError: () => void;
}

export function useWallet(): UseWalletReturn {
  const [balance, setBalance]       = useState<WalletBalance | null>(null);
  const [transactions, setTxs]      = useState<Transactions[]>([]);
  const [packages, setPackages]     = useState<CoinPackage[]>([]);
  const [isLoading, setIsLoading]   = useState(true);
  const [isActing, setIsActing]     = useState(false);
  const [error, setError]           = useState<string | null>(null);
  const [txOffset, setTxOffset]     = useState(0);
  const [hasMore, setHasMore]       = useState(true);
  const TX_LIMIT = 20;

  const fetchWallet = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [walletRes, txRes] = await Promise.all([
        fetch("/api/wallet"),
        fetch(`/api/wallet?view=transactions&limit=${TX_LIMIT}&offset=0`),
      ]);
      if (!walletRes.ok) throw new Error("Failed to load wallet");
      const walletData = await walletRes.json();
      const txData = await txRes.json();
      setBalance(walletData.balance);
      setPackages(walletData.packages ?? []);
      setTxs(txData.transactions ?? []);
      setTxOffset(TX_LIMIT);
      setHasMore((txData.transactions ?? []).length === TX_LIMIT);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadMoreTransactions = useCallback(async () => {
    if (!hasMore || isActing) return;
    try {
      const res = await fetch(`/api/wallet?view=transactions&limit=${TX_LIMIT}&offset=${txOffset}`);
      const data = await res.json();
      const newTxs = data.transactions ?? [];
      setTxs(prev => [...prev, ...newTxs]);
      setTxOffset(prev => prev + TX_LIMIT);
      setHasMore(newTxs.length === TX_LIMIT);
    } catch {}
  }, [hasMore, isActing, txOffset]);

  const deposit = useCallback(async (req: DepositRequest): Promise<DepositResponse | null> => {
    setIsActing(true);
    setError(null);
    try {
      const res = await fetch("/api/wallet/deposit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(req),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      await fetchWallet();
      return data;
    } catch (e: any) {
      setError(e.message);
      return null;
    } finally {
      setIsActing(false);
    }
  }, [fetchWallet]);

  const withdraw = useCallback(async (req: WithdrawRequest): Promise<WithdrawResponse | null> => {
    setIsActing(true);
    setError(null);
    try {
      const res = await fetch("/api/wallet/withdraw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(req),
      });
      const data = await res.json();
      if (!res.ok) {
        const msgs: Record<string, string> = {
          INSUFFICIENT_FUNDS: "Insufficient balance for this withdrawal.",
          BELOW_MINIMUM: "Minimum withdrawal is $20.00.",
        };
        throw new Error(msgs[data.error] ?? data.error);
      }
      await fetchWallet();
      return data;
    } catch (e: any) {
      setError(e.message);
      return null;
    } finally {
      setIsActing(false);
    }
  }, [fetchWallet]);

  const buyCoins = useCallback(async (req: BuyCoinsRequest): Promise<BuyCoinsResponse | null> => {
    setIsActing(true);
    setError(null);
    try {
      const res = await fetch("/api/wallet/buy-coins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(req),
      });
      const data = await res.json();
      if (!res.ok) {
        const msgs: Record<string, string> = {
          INSUFFICIENT_FUNDS: "Not enough balance. Please deposit first.",
          INVALID_AMOUNT: "Invalid package selected.",
        };
        throw new Error(msgs[data.error] ?? data.error);
      }
      await fetchWallet();
      return data;
    } catch (e: any) {
      setError(e.message);
      return null;
    } finally {
      setIsActing(false);
    }
  }, [fetchWallet]);

  useEffect(() => { fetchWallet(); }, [fetchWallet]);

  return {
    balance, transactions, packages,
    isLoading, isActing, error,
    deposit, withdraw, buyCoins,
    loadMoreTransactions,
    hasMoreTransactions: hasMore,
    refetch: fetchWallet,
    clearError: () => setError(null),
  };
}