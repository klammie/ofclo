// app/api/upload/complete/route.ts
// Mark an upload as complete and optionally track in database

import { NextRequest, NextResponse } from "next/server";
import { assertRole } from "@/lib/auth/guard";
import { blobExists } from "@/lib/azure";
import { db } from "@/db";
import { mediaUploads } from "@/db/schema";

/**
 * POST /api/upload/complete
 * 
 * Called after a direct client-to-Azure upload via SAS token completes.
 * Verifies the upload succeeded and optionally tracks it in the database.
 * 
 * Request body:
 * {
 *   blobName: string;
 *   container: string;
 *   size: number;
 *   contentType: string;
 *   width?: number;
 *   height?: number;
 * }
 */
export async function POST(req: NextRequest) {
  const { session, error } = await assertRole(req, "creator", "admin");
  if (error) return error;
    if (!session) {
    return NextResponse.json({ error: "No session found" }, { status: 401 });
    }

  try {
    const body = await req.json() as {
      blobName:    string;
      container:   string;
      size:        number;
      contentType: string;
      width?:      number;
      height?:     number;
    };

    const { blobName, container, size, contentType, width, height } = body;

    // Validation
    if (!blobName || !container || !size || !contentType) {
      return NextResponse.json(
        { error: "blobName, container, size, and contentType are required" },
        { status: 400 }
      );
    }

    // Verify the blob actually exists in Azure
    const exists = await blobExists(container, blobName);
    if (!exists) {
      return NextResponse.json(
        { error: "Blob not found in Azure Storage" },
        { status: 404 }
      );
    }

    // Construct the public URL
    const url = `https://${process.env.AZURE_STORAGE_ACCOUNT_NAME}.blob.core.windows.net/${container}/${blobName}`;

    // Optional: Track upload in database for analytics/cleanup
    // This table is OPTIONAL - only if you want to track all uploads
    if (process.env.TRACK_MEDIA_UPLOADS === "true") {
      try {
                const { session, error } = await assertRole(req, "creator", "admin");
        if (error) return error;

        if (!session) {
        return NextResponse.json({ error: "No session found" }, { status: 401 });
        }

        await db.insert(mediaUploads).values({
        userId: session.user.id,
        blobName,
        container,
        url,
        contentType,
        size,
        width: width ?? null,
        height: height ?? null,
        isDeleted: false,
});
      } catch (dbError) {
        // If mediaUploads table doesn't exist, just log and continue
        console.warn("[Upload Complete] Failed to track upload in DB:", dbError);
      }
    }

    return NextResponse.json({
      success: true,
      url,
      blobName,
      container,
    });

  } catch (err) {
    console.error("[Upload Complete] Failed:", err);
    return NextResponse.json(
      { error: "Failed to verify upload" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/upload/complete?blobName=...&container=...
 * 
 * Check if an upload is complete (blob exists in Azure)
 */
export async function GET(req: NextRequest) {
    const { session, error } = await assertRole(req, "creator", "admin");
    if (error) return error;
    if (!session) {
    return NextResponse.json({ error: "No session found" }, { status: 401 });
    }

  try {
    const { searchParams } = new URL(req.url);
    const blobName = searchParams.get("blobName");
    const container = searchParams.get("container");

    if (!blobName || !container) {
      return NextResponse.json(
        { error: "blobName and container query params required" },
        { status: 400 }
      );
    }

    const exists = await blobExists(container, blobName);

    if (exists) {
      const url = `https://${process.env.AZURE_STORAGE_ACCOUNT_NAME}.blob.core.windows.net/${container}/${blobName}`;
      return NextResponse.json({
        complete: true,
        url,
        blobName,
        container,
      });
    } else {
      return NextResponse.json({
        complete: false,
        blobName,
        container,
      });
    }

  } catch (err) {
    console.error("[Upload Complete Check] Failed:", err);
    return NextResponse.json(
      { error: "Failed to check upload status" },
      { status: 500 }
    );
  }
}