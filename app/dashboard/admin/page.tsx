// app/dashboard/admin/page.tsx
// SERVER COMPONENT — uses requireRole("admin") instead of requireRole from next-auth

import { requireRole }       from "@/lib/auth/guard";
import { getAdminStats, getAdminCreators, getOpenReports, getPendingPayouts } from "@/lib/queries/admin";
import { StatCard }          from "@/components/base/StatCard";
import { SectionCard }       from "@/components/base/SectionCard";
import { CreatorTable }      from "@/components/admin/CreatorTable";
import { ReportQueue }       from "@/components/admin/ReportQueue";
import { PayoutTable }       from "@/components/admin/PayoutTable";

export default async function AdminDashboardPage() {
  // requireRole uses auth.api.getSession + checks user.role field
  // Redirects to /unauthorized if role !== "admin"
  const { user } = await requireRole("admin");

  const [stats, creators, reports, payouts] = await Promise.all([
    getAdminStats(),
    getAdminCreators(1, 5),
    getOpenReports(5),
    getPendingPayouts(),
  ]);

  const ACCENT = "#6366f1";

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {stats.map(s => <StatCard key={s.label} {...s} accentColor={ACCENT} />)}
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <div className="xl:col-span-2">
          <SectionCard title="Top Creators" action="View All" accentColor={ACCENT}>
            <CreatorTable creators={creators.creators} />
          </SectionCard>
        </div>
        <SectionCard title="Pending Reports" action="Review All" accentColor={ACCENT}>
          <ReportQueue reports={reports} />
        </SectionCard>
      </div>
      <SectionCard title="Payout Queue" action="Process All" accentColor={ACCENT}>
        <PayoutTable payouts={payouts} />
      </SectionCard>
    </div>
  );
}