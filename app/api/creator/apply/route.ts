// app/api/creator/apply/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import {
  getOrCreateApplication,
  saveDraft,
  submitApplication,
} from "@/lib/creator-apply.service";

export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const app = await getOrCreateApplication(session.user.id);
    return NextResponse.json({ application: app });
  } catch (e) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  try {
    const result = await saveDraft(session.user.id, body);
    return NextResponse.json(result);
  } catch (e: any) {
    if (e.message === "APPLICATION_ALREADY_SUBMITTED") {
      return NextResponse.json({ error: "Application already submitted" }, { status: 409 });
    }
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  if (body.action !== "submit") return NextResponse.json({ error: "Invalid action" }, { status: 400 });

  try {
    const result = await submitApplication(session.user.id);
    return NextResponse.json(result);
  } catch (e: any) {
    if (e.message?.startsWith("MISSING_FIELDS:")) {
      const fields = e.message.replace("MISSING_FIELDS:", "").split("|");
      return NextResponse.json({ error: "Missing required fields", fields }, { status: 422 });
    }
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}