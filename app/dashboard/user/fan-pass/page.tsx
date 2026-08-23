// app/dashboard/user/fan-pass/page.tsx
// (Also works at app/dashboard/fans-pass/page.tsx — adjust path to match yours)

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import FanPassDash from "@/components/fan-pass/FanpassDash";
import { getFanPassPageData } from "@/lib/fan-pass-live.service";
import FansPassDashboard from "@/components/fan-pass/FanpassDashboard";



export default async function FansPassPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) redirect("/login");

  const params  = await searchParams;
  const data    = await getFanPassPageData(session.user.id);

  if (!data.season) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4"
        style={{ background: "#0d0d1a", fontFamily: "'Be Vietnam Pro', sans-serif" }}>
        <span className="text-5xl">🎟️</span>
        <h1 className="text-[22px] font-black text-white">No Active Season</h1>
        <p className="text-[13px] text-white/40 text-center max-w-xs">
          The agency hasn&apos;t started a Fan Pass season yet. Check back soon!
        </p>
      </div>
    );
  }

  return (
    <FanPassDash
      season={data.season}
      initialPassData={data.passData}
      initialRewards={data.rewards}
      initialDayConfig={data.dayConfig}
      initialMilestones={data.milestones}
      initialLeaderboard={data.leaderboard}
      defaultTab={params.tab}              // ← pass the tab param
      user={{
        id:    session.user.id,
        name:  session.user.name  ?? "Fan",
        image: session.user.image ?? null,
        isVip: false,
      }}
    />
  );
}

export const metadata = {
  title: "Fan Pass - Fanzluv",
  description: "Earn XP, unlock rewards, climb the leaderboard",
};