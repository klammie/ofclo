// app/api/upload/sas-token/route.ts
// Generate SAS token for direct client-to-Azure upload (large files)

import { NextRequest, NextResponse } from "next/server";
import { assertRole } from "@/lib/auth/guard";
import { generateUploadSasToken } from "@/lib/azure/sas";
import { generateBlobName } from "@/lib/utils/file-validation";

export async function POST(req: NextRequest) {
  // Only creators can upload media
  const { session, error } = await assertRole(req, "creator");
  if (error) return error;

  try {
    const { fileName, fileType, container } = await req.json() as {
      fileName:  string;
      fileType:  string;
      container: "posts" | "covers" | "avatars";
    };

    if (!fileName || !fileType || !container) {
      return NextResponse.json(
        { error: "fileName, fileType, and container are required" },
        { status: 400 }
      );
    }

    // Generate unique blob name
    const blobName = generateBlobName(session.user.id, fileName);
    const containerName = process.env[`AZURE_CONTAINER_${container.toUpperCase()}`]!;

    // Generate SAS token with 60min expiry
    const { sasUrl, blobUrl, expiresAt } = await generateUploadSasToken(
      containerName,
      blobName,
      60
    );

    return NextResponse.json({
      sasUrl,
      blobUrl,
      blobName,
      container: containerName,
      expiresAt: expiresAt.toISOString(),
    });

  } catch (err) {
    console.error("[Azure SAS] Token generation failed:", err);
    return NextResponse.json(
      { error: "Failed to generate upload token" },
      { status: 500 }
    );
  }
}