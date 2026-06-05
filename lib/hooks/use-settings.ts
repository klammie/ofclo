"use client";

import { useState, useEffect, useCallback } from "react";
import type { UserSettings, SettingsTab, SaveResult } from "@/lib/types";

interface UseSettingsReturn {
  settings: UserSettings | null;
  isLoading: boolean;
  isSaving: boolean;
  savedTab: SettingsTab | null;
  error: string | null;
  save: (tab: SettingsTab, data: Partial<any>) => Promise<boolean>;
  refetch: () => Promise<void>;
  clearError: () => void;
}

const TAB_ENDPOINTS: Record<SettingsTab, string> = {
  profile:       "/api/user/settings/profile",
  account:       "/api/user/settings/account",
  privacy:       "/api/user/settings/privacy",
  notifications: "/api/user/settings/notifications",
  appearance:    "/api/user/settings/appearance",
  security:      "/api/user/settings/security",
};

export function useSettings(): UseSettingsReturn {
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving]   = useState(false);
  const [savedTab, setSavedTab]   = useState<SettingsTab | null>(null);
  const [error, setError]         = useState<string | null>(null);

  const fetchSettings = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/user/settings");
      if (!res.ok) throw new Error("Failed to load settings");
      setSettings(await res.json());
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const save = useCallback(async (tab: SettingsTab, data: Partial<any>): Promise<boolean> => {
    setIsSaving(true);
    setError(null);
    try {
      const res = await fetch(TAB_ENDPOINTS[tab], {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result: SaveResult = await res.json();
      if (!res.ok || !result.success) throw new Error(result.message ?? "Save failed");

      // Optimistically update local state
      setSettings((prev) => {
        if (!prev) return prev;
        return { ...prev, [tab]: { ...prev[tab as keyof UserSettings], ...data } };
      });

      setSavedTab(tab);
      setTimeout(() => setSavedTab(null), 2500);
      return true;
    } catch (e: any) {
      setError(e.message);
      return false;
    } finally {
      setIsSaving(false);
    }
  }, []);

  useEffect(() => { fetchSettings(); }, [fetchSettings]);

  return { settings, isLoading, isSaving, savedTab, error, save, refetch: fetchSettings, clearError: () => setError(null) };
}