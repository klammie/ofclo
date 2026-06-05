// app/api/campaigns/[campaignId]/top-donors/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { campaignDonations, user, profiles } from "@/db/schema";
import { eq, sql } from "drizzle-orm";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ campaignId: string }> }
) {
  try {
    const { campaignId } = await params;

    const topDonors = await db.execute<{
      user_id: string;
      user_name: string;
      avatar_url: string | null;
      total_amount: string;
      donation_count: number;
      is_anonymous: boolean;
    }>(sql`
      SELECT 
        cd.user_id,
        u.name as user_name,
        p.avatar_url,
        SUM(cd.amount::decimal)::text as total_amount,
        COUNT(*)::int as donation_count,
        BOOL_OR(cd.is_anonymous) as is_anonymous
      FROM ${campaignDonations} cd
      JOIN ${user} u ON cd.user_id = u.id
      LEFT JOIN ${profiles} p ON u.id = p.id
      WHERE cd.campaign_id = ${campaignId}
      GROUP BY cd.user_id, u.name, p.avatar_url
      ORDER BY SUM(cd.amount::decimal) DESC
      LIMIT 10
    `);

    return NextResponse.json({ topDonors: topDonors.rows });
  } catch (err) {
    console.error("[Top Donors] Error:", err);
    return NextResponse.json(
      { error: "Failed to fetch top donors" },
      { status: 500 }
    );
  }
}