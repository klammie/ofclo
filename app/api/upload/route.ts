// app/api/upload/route.ts
import { NextRequest, NextResponse } from "next/server";
import { assertRole } from "@/lib/auth/guard";
import { BlobServiceClient } from "@azure/storage-blob";

const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;

if (!connectionString) {
  console.error("⚠️ AZURE_STORAGE_CONNECTION_STRING is not set");
}

async function uploadBufferToAzure(
  buffer: Buffer,
  filename: string,
  contentType: string,
  container: string
): Promise<string> {
  const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString!);
  const containerClient   = blobServiceClient.getContainerClient(container);
  const blockBlobClient   = containerClient.getBlockBlobClient(filename);
  await blockBlobClient.uploadData(buffer, {
    blobHTTPHeaders: { blobContentType: contentType },
  });
  return blockBlobClient.url;
}

export async function POST(req: NextRequest) {
  const { session, error } = await assertRole(req, "creator", "agency");
  if (error) return error;

  try {
    if (!connectionString) {
      return NextResponse.json({ error: "Azure Storage not configured" }, { status: 500 });
    }

    const formData = await req.formData();
    const file     = formData.get("file") as File;
    const type     = formData.get("type") as string; // "image" or "video"
    const duration = formData.get("duration") as string | null;
    const thumb    = formData.get("thumbnail") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    console.log(`[Upload] Uploading ${type}: ${file.name} (${file.size} bytes)`);

    const timestamp     = Date.now();
    const randomString  = Math.random().toString(36).substring(7);
    const fileExtension = file.name.split(".").pop();
    const filename      = `${timestamp}-${randomString}.${fileExtension}`;

    const bytes  = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Upload main file
    const url = await uploadBufferToAzure(buffer, filename, file.type, "posts");

    let thumbnailUrl: string | undefined = undefined;
    if (thumb) {
      const thumbBytes  = await thumb.arrayBuffer();
      const thumbBuffer = Buffer.from(thumbBytes);
      const thumbFilename = `${timestamp}-${randomString}-thumb.jpg`;
      thumbnailUrl = await uploadBufferToAzure(
        thumbBuffer,
        thumbFilename,
        "image/jpeg",
        "thumbnails"
      );
    }

    return NextResponse.json({
      url,
      thumbnailUrl: thumbnailUrl ?? url,
      filename,
      type,
      size: file.size,
      duration: duration ? Number(duration) : null,
    });

  } catch (err) {
    console.error("[Upload] Error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Upload failed" },
      { status: 500 }
    );
  }
}
