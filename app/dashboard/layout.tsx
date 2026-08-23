// app/dashboard/layout.tsx — SERVER COMPONENT (no "use client")
import { requireAuth } from "@/lib/auth/guard";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { db } from "@/db";
import { profiles, user as userTable } from "@/db/schema";
import { eq } from "drizzle-orm";
import { DbUser } from "@/lib/types";
import { getUserStatusXp } from "@/lib/status-xp.service";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user } = await requireAuth();

  const [profile] = await db.select().from(profiles).where(eq(profiles.id, user.id)).limit(1);
  const [userRow] = await db
  .select({ onboardingCompleted: userTable.onboardingCompleted })
  .from(userTable)
  .where(eq(userTable.id, user.id))
  .limit(1);

  // ✅ await is fine here — this is a server component
  const statusXp = await getUserStatusXp(user.id);

  const sessionUser: DbUser = {
    ...user,
    role: user.role as DbUser["role"],
    name: profile?.username ?? "",
    image: profile?.avatarUrl ?? user.image ?? "",
    onboardingCompleted:  userRow?.onboardingCompleted ?? false,
  };

  return (
    <DashboardShell user={sessionUser} statusXp={statusXp}>
      {children}
    </DashboardShell>
  );
}