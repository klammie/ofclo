// app/dashboard/layout.tsx
import { requireAuth } from "@/lib/auth/guard";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { db } from "@/db";
import { profiles } from "@/db/schema";
import { eq } from "drizzle-orm";
import { DbUser } from "@/lib/types";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user } = await requireAuth();

  // Fetch extended profile
  const [profile] = await db.select().from(profiles).where(eq(profiles.id, user.id)).limit(1);

 const sessionUser: DbUser = {
  ...user,
  role: user.role as DbUser["role"], // cast to union type
  name: profile?.username ?? "",
  image: profile?.avatarUrl ?? user.image ?? "",
};

  return (
    <DashboardShell user={sessionUser}>
      {children}
    </DashboardShell>
  );
}