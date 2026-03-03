// app/api/upload/delete/route.ts
// Delete a blob from Azure Storage

import { NextRequest, NextResponse } from "next/server";
import { assertRole } from "@/lib/auth/guard";
import { deleteBlob } from "@/lib/azure";
import { db } from "@/db";
import { posts } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export async function DELETE(req: NextRequest) {
  const { session, error } = await assertRole(req, "creator", "admin");
  if (error) return error;

  try {
    const { blobName, container } = await req.json() as {
      blobName:  string;
      container: string;
    };

    if (!blobName || !container) {
      return NextResponse.json(
        { error: "blobName and container are required" },
        { status: 400 }
      );
    }

    // Security: Verify the user owns this blob
    // Extract user ID from blob name (format: userId_timestamp_random_filename)
    const blobUserId = blobName.split("_")[0];

    if (session.user.role !== "admin" && blobUserId !== session.user.id) {
      return NextResponse.json(
        { error: "Unauthorized to delete this file" },
        { status: 403 }
      );
    }

    // Delete from Azure
    await deleteBlob(container, blobName);

    // Optional: Also check if this blob is referenced in posts table
    // and clean up the reference
    const blobUrl = `https://${process.env.AZURE_STORAGE_ACCOUNT_NAME}.blob.core.windows.net/${container}/${blobName}`;
    
    await db
      .update(posts)
      .set({ mediaUrl: null, updatedAt: new Date() })
      .where(eq(posts.mediaUrl, blobUrl));

    return NextResponse.json({ success: true });

  } catch (err) {
    console.error("[Azure Delete] Deletion failed:", err);
    return NextResponse.json(
      { error: "Failed to delete file" },
      { status: 500 }
    );
  }
}