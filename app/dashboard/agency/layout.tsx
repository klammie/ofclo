// app/dashboard/agency/layout.tsx
// Server component — reads the impersonation cookie and conditionally
// renders the ImpersonationBanner at the very top of every agency page.

import { cookies } from "next/headers";
import { db } from "@/db";
import { user, profiles } from "@/db/schema";
import { eq } from "drizzle-orm";
import { ImpersonationBanner } from "@/components/agency/ImpersonationBanner";

export default async function AgencyLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const impersonatingUserId = cookieStore.get("impersonating_user_id")?.value ?? null;

  // Look up the impersonated creator's name to show in the banner
  let creatorName: string | undefined;
  if (impersonatingUserId) {
    try {
      const [row] = await db
        .select({ name: user.name, username: profiles.username })
        .from(user)
        .leftJoin(profiles, eq(profiles.id, user.id))
        .where(eq(user.id, impersonatingUserId))
        .limit(1);
      creatorName = row?.name ?? row?.username ?? undefined;
    } catch {}
  }

  return (
    <div className="min-h-screen" style={{ background: "#0d0d1a" }}>
      {impersonatingUserId && (
        <ImpersonationBanner creatorName={creatorName} />
      )}
      {children}
    </div>
  );
}