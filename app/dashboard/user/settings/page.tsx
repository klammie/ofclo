import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import UserSettingsDashboard from "@/components/settings/UserSettingsDashboard";

export default async function SettingsPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) redirect("/login");

  return (
    <div className="w-full max-w-5xl mx-auto">
      <UserSettingsDashboard />
    </div>
  );
}