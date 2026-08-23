// app/dashboard/agency/creators/page.tsx
import { requireRole } from "@/lib/auth/guard";
import { db } from "@/db";
import { agencies, agencyCreators, creators, user, profiles } from "@/db/schema";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { AgencyCreatorsClient } from "@/components/agency/creators/AgencyCreatorsClient";

export default async function AgencyCreatorsPage() {
  const { user: agencyUser } = await requireRole("agency");

  const [agency] = await db
    .select()
    .from(agencies)
    .where(eq(agencies.userId, agencyUser.id))
    .limit(1);

  if (!agency) redirect("/dashboard/agency");

  // Pull every creator managed by this agency, with the same fields used
  // elsewhere (profile, subscriber/post counts, pricing).
  const rows = await db
    .select({
      creatorId:        creators.id,
      userId:           creators.userId,
      name:             user.name,
      username:         profiles.username,
      avatarUrl:        profiles.avatarUrl,
      isVerified:       creators.isVerified,
      subscriberCount:  creators.subscriberCount,
      postCount:        creators.postCount,
      standardPrice:    creators.standardPrice,
      vipPrice:         creators.vipPrice,
    })
    .from(agencyCreators)
    .innerJoin(creators, eq(creators.id, agencyCreators.creatorId))
    .innerJoin(user,     eq(user.id,     creators.userId))
    .leftJoin(profiles,  eq(profiles.id, creators.userId))
    .where(eq(agencyCreators.agencyId, agency.id));

  const creatorsList = rows.map((r) => ({
    creatorId:       r.creatorId,
    userId:          r.userId,
    name:            r.name,
    username:        r.username ?? r.name.toLowerCase().replace(/\s+/g, "_"),
    avatarUrl:       r.avatarUrl ?? null,
    isVerified:      r.isVerified ?? false,
    subscriberCount: r.subscriberCount ?? 0,
    postCount:       r.postCount ?? 0,
    standardPrice:   r.standardPrice != null ? Number(r.standardPrice) : null,
    vipPrice:        r.vipPrice != null ? Number(r.vipPrice) : null,
  }));

  return <AgencyCreatorsClient initialCreators={creatorsList} />;
}