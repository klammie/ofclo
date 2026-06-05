"use client";

import { useState, useEffect, useCallback } from "react";
import type { ShopItem, PurchaseResponse, ApiPurchaseError } from "@/lib/types";

interface UseShopReturn {
  items: ShopItem[];
  coins: number;
  isLoading: boolean;
  isPurchasing: string | null;
  lastPurchase: PurchaseResponse | null;
  error: string | null;
  purchase: (itemId: string, currency?: "coins" | "real") => Promise<void>;
  refetch: () => Promise<void>;
}

export function useShop(): UseShopReturn {
  const [items, setItems]               = useState<ShopItem[]>([]);
  const [coins, setCoins]               = useState(0);
  const [isLoading, setIsLoading]       = useState(true);
  const [isPurchasing, setIsPurchasing] = useState<string | null>(null);
  const [lastPurchase, setLastPurchase] = useState<PurchaseResponse | null>(null);
  const [error, setError]               = useState<string | null>(null);

  const fetchShop = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/shop");
      if (!res.ok) throw new Error("Failed to load shop");
      const data = await res.json();
      setItems(data.items);
      setCoins(data.coins);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const purchase = useCallback(async (itemId: string, currency: "coins" | "real" = "coins") => {
    if (isPurchasing) return;
    setIsPurchasing(itemId);
    setError(null);
    try {
      const res = await fetch("/api/shop/purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId, currency }),
      });
      const data = await res.json();
      if (!res.ok) {
        const err = data as ApiPurchaseError;
        const messages: Record<string, string> = {
          INSUFFICIENT_COINS: "Not enough coins for this item.",
          ALREADY_OWNED:      "You already own this item.",
          OUT_OF_STOCK:       "This item is out of stock.",
        };
        throw new Error(messages[err.code] ?? err.error);
      }
      const result = data as PurchaseResponse;
      setLastPurchase(result);
      setCoins(result.newCoinBalance);
      setItems(prev => prev.map(item =>
        item.id === itemId
          ? { ...item, owned: true, quantity: (item.quantity ?? 0) + 1 }
          : item
      ));
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsPurchasing(null);
    }
  }, [isPurchasing]);

  useEffect(() => { fetchShop(); }, [fetchShop]);

  // ── Fix: return fetchShop as refetch (was referencing non-existent names) ──
  return { items, coins, isLoading, isPurchasing, lastPurchase, error, purchase, refetch: fetchShop };
}