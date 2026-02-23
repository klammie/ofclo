"use client";

import { useEffect, useState } from "react";
import { authClient } from "@/lib/auth/client";

type PermissionSpec = Record<string, string[]>;

interface PermissionGateProps {
  permission: PermissionSpec;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  loading?: React.ReactNode;
}

// Type guard for Data result
function isDataResult(
  result: unknown
): result is { success: boolean } {
  return typeof result === "object" && result !== null && "success" in result;
}

export function PermissionGate({
  permission,
  children,
  fallback = null,
  loading = null,
}: PermissionGateProps) {
  const { data: session } = authClient.useSession();
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  useEffect(() => {
    let mounted = true;

    async function checkPermission() {
      if (!session?.user) {
        if (mounted) setHasPermission(false);
        return;
      }

      try {
        const result = await authClient.admin.hasPermission({ permission });

        if (isDataResult(result)) {
          if (mounted) setHasPermission(result.success);
        } else {
          if (mounted) setHasPermission(false);
        }
      } catch {
        if (mounted) setHasPermission(false);
      }
    }

    checkPermission();

    return () => {
      mounted = false;
    };
  }, [session, permission]);

  if (!session?.user) return <>{fallback}</>;
  if (hasPermission === null) return <>{loading}</>;

  return hasPermission ? <>{children}</> : <>{fallback}</>;
}