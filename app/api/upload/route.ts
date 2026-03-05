// app/api/upload/route.ts
import { NextRequest, NextResponse } from "next/server";
import { assertRole } from "@/lib/auth/guard";
import { BlobServiceClient } from "@azure/storage-blob";

const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;

if (!connectionString) {
  console.error("⚠️  AZURE_STORAGE_CONNECTION_STRING is not set");
}

export async function POST(req: NextRequest) {
  const { session, error } = await assertRole(req, "creator", "agency");
  if (error) return error;

  try {
    if (!connectionString) {
      return NextResponse.json(
        { error: "Azure Storage not configured" },
        { status: 500 }
      );
    }

    const formData = await req.formData();
    const file = formData.get("file") as File;
    const type = formData.get("type") as string; // 'image' or 'video'

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    console.log(`[Upload] Uploading ${type} file: ${file.name} (${file.size} bytes)`);

    // Create unique filename
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(7);
    const fileExtension = file.name.split(".").pop();
    const filename = `${timestamp}-${randomString}.${fileExtension}`;

    // ✅ USE EXISTING CONTAINERS
    // Images go to 'post' container (same as regular posts)
    // Videos also go to 'post' container
    const containerName = "posts";

    // Initialize Azure Blob Service
    const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
    const containerClient = blobServiceClient.getContainerClient(containerName);

    // Get blob client
    const blockBlobClient = containerClient.getBlockBlobClient(filename);

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Upload to Azure with content type
    await blockBlobClient.uploadData(buffer, {
      blobHTTPHeaders: {
        blobContentType: file.type,
      },
    });

    const url = blockBlobClient.url;

    console.log(`[Upload] Successfully uploaded to: ${url}`);

    // For thumbnails (if video), use 'thumbnails' container
    let thumbnailUrl = url;

    if (type === "video") {
      // For now, use the video URL as thumbnail
      // Later you can generate a proper thumbnail and upload to 'thumbnails' container
      thumbnailUrl = url;
    }

    return NextResponse.json({
      url,
      thumbnailUrl,
      filename,
      type,
      size: file.size,
    });
  } catch (err) {
    console.error("[Upload] Error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Upload failed" },
      { status: 500 }
    );
  }
}

