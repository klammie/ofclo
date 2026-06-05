// app/dashboard/agency/page.tsx

import { requireRole } from "@/lib/auth/guard";
import { getAgencyDashboardData } from "@/lib/queries/agency";
import { AgencyDashboard } from "@/components/agency/AgencyDashboard";

// ✅ Async logic stays inside try/catch
export default async function AgencyDashboardPage() {
  console.log("[Agency Page] ========== PAGE LOAD START ==========");

  let data;

  try {
    console.log("[Agency Page] Calling requireRole('agency')...");
    const authResult = await requireRole("agency");
    console.log("[Agency Page] ✅ Auth successful:", {
      userId: authResult.user.id,
      role: authResult.user.role,
      isImpersonating: authResult.isImpersonating,
    });

    console.log("[Agency Page] Fetching agency data...");
    data = await getAgencyDashboardData(authResult.user.id);
    console.log("[Agency Page] ✅ Data fetched successfully");
  } catch (error: any) {
    console.error("[Agency Page] ❌ ERROR:", error.message);
    console.error("[Agency Page] Stack:", error.stack);
    // ✅ Throwing here lets Next.js handle it with its error boundary
    throw error;
  }

  console.log("[Agency Page] ========== RENDERING PAGE ==========");
  return (
    <div className="min-h-screen bg-linear-to-br from-gray-900 via-black to-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        <AgencyDashboard data={data} />
      </div>
    </div>
  );
}

export const metadata = {
  title: "Agency Dashboard - FanVault",
  description: "Manage your creators",
};