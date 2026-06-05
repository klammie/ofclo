import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import AgencyFanPassDashboard from "@/components/agency/fan-pass/AgencyFanPassDashboard";

// TODO: add a proper agency role check against your agency membership table
async function assertAgencyRole(userId: string) {
  // e.g. check db.query.agencyMembers...
  return true;
}

export default async function AgencyFanPassPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) redirect("/login");

  const isAgency = await assertAgencyRole(session.user.id);
  if (!isAgency) redirect("/dashboard");

  return <AgencyFanPassDashboard />;
}