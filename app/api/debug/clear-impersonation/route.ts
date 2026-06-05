// app/api/debug/clear-impersonation/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET() {
  const cookieStore = await cookies();
  
  const impersonatingCookie = cookieStore.get("impersonating_user_id");
  const originalCookie = cookieStore.get("original_user_id");
  
  if (impersonatingCookie) {
    cookieStore.delete("impersonating_user_id");
  }
  
  if (originalCookie) {
    cookieStore.delete("original_user_id");
  }
  
  return NextResponse.json({ 
    success: true,
    message: "Impersonation cookies cleared",
    hadImpersonatingCookie: !!impersonatingCookie,
    hadOriginalCookie: !!originalCookie,
  });
}