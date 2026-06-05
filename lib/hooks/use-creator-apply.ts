"use client";

import { useState, useEffect, useCallback } from "react";
import type { ApplicationStatus } from "@/lib/types";

interface ApplicationData {
  id: string;
  status: ApplicationStatus;
  currentStep: number;
  [key: string]: any;
}

interface UseCreatorApplyReturn {
  application: ApplicationData | null;
  isLoading: boolean;
  isSaving: boolean;
  isSubmitting: boolean;
  error: string | null;
  missingFields: string[];
  saveStep: (data: Record<string, any>) => Promise<boolean>;
  submit: () => Promise<boolean>;
  uploadDocument: (field: string, file: File) => Promise<string | null>;
  refetch: () => Promise<void>;
  clearError: () => void;
}

export function useCreatorApply(): UseCreatorApplyReturn {
  const [application, setApplication] = useState<ApplicationData | null>(null);
  const [isLoading, setIsLoading]     = useState(true);
  const [isSaving, setIsSaving]       = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError]             = useState<string | null>(null);
  const [missingFields, setMissingFields] = useState<string[]>([]);

  const fetchApplication = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/creator/apply");
      if (!res.ok) throw new Error("Failed to load application");
      const data = await res.json();
      setApplication(data.application);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const saveStep = useCallback(async (data: Record<string, any>): Promise<boolean> => {
    setIsSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/creator/apply", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to save");
      setApplication((prev) => prev ? { ...prev, ...data } : prev);
      return true;
    } catch (e: any) {
      setError(e.message);
      return false;
    } finally {
      setIsSaving(false);
    }
  }, []);

  const submit = useCallback(async (): Promise<boolean> => {
    setIsSubmitting(true);
    setError(null);
    setMissingFields([]);
    try {
      const res = await fetch("/api/creator/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "submit" }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.fields) setMissingFields(data.fields);
        throw new Error(data.error ?? "Submission failed");
      }
      await fetchApplication();
      return true;
    } catch (e: any) {
      setError(e.message);
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }, [fetchApplication]);

  // Upload a document file — replace with your real storage (S3, Cloudflare R2, etc.)
  const uploadDocument = useCallback(async (field: string, file: File): Promise<string | null> => {
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("field", field);

      // Replace with your actual upload endpoint
      const res = await fetch("/api/creator/apply/upload", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error("Upload failed");
      const { url } = await res.json();

      // Save URL to application
      await saveStep({ [field]: url });
      return url;
    } catch (e: any) {
      setError(`Upload failed: ${e.message}`);
      return null;
    }
  }, [saveStep]);

  useEffect(() => { fetchApplication(); }, []);

  return {
    application, isLoading, isSaving, isSubmitting, error, missingFields,
    saveStep, submit, uploadDocument, refetch: fetchApplication, clearError: () => setError(null),
  };
}