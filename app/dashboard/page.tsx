// app/dashboard/page.tsx
import { requireAuth } from "@/lib/auth/guard";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const { user } = await requireAuth();

  if (user.role === "agency")   redirect("/dashboard/agency");
  if (user.role === "creator")  redirect("/dashboard/creator");
  redirect("/dashboard/user/feed");
}