// app/api/agency/stop-impersonate/route.ts
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    
    // Remove impersonation cookies
    cookieStore.delete("original_user_id");
    cookieStore.delete("impersonating_user_id");

    console.log(`[Agency] Stopped impersonating`);

    return NextResponse.json({ 
      success: true,
      redirectTo: "/dashboard/agency"
    });
  } catch (err) {
    console.error("[Stop Impersonate] Error:", err);
    return NextResponse.json({ error: "Failed to stop impersonation" }, { status: 500 });
  }
}