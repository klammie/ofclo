// app/api/upload/image/route.ts
// Server-side image upload with optimization (for images <10MB)

import { NextRequest, NextResponse } from "next/server";
import { assertRole } from "@/lib/auth/guard";
import { uploadBuffer } from "@/lib/azure";
import { processImage, generateThumbnail } from "@/lib/utils/media-processing";
import {
  validateImageFile,
  generateBlobName,
  MAX_IMAGE_SIZE,
} from "@/lib/utils/file-validation";

export const runtime = "nodejs"; // Required for Sharp

export async function POST(req: NextRequest) {
  const { session, error } = await assertRole(req, "creator", "user");
  if (error) return error;

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const container = formData.get("container") as string | null;
    const generateThumb = formData.get("generateThumbnail") === "true";

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!container || !["posts", "avatars", "covers"].includes(container)) {
      return NextResponse.json(
        { error: "Invalid container" },
        { status: 400 }
      );
    }

    // Validate file
    const validationError = validateImageFile(file);
    if (validationError) {
      return NextResponse.json(
        { error: validationError.message },
        { status: 400 }
      );
    }

    // Convert File to Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Process and optimize image
    const { buffer: optimizedBuffer, contentType, width, height } =
      await processImage(buffer, {
        maxWidth: container === "avatars" ? 512 : 2048,
        maxHeight: container === "avatars" ? 512 : 2048,
        quality: 85,
        format: "webp",
      });

    // Generate blob names
    const mainBlobName = generateBlobName(session!.user.id, file.name);
    const containerName =
      process.env[`AZURE_CONTAINER_${container.toUpperCase()}`]!;

    // Upload optimized image
    const mainUrl = await uploadBuffer(
      containerName,
      mainBlobName,
      optimizedBuffer,
      contentType,
      {
        userId: session!.user.id,
        originalName: file.name,
        width: width.toString(),
        height: height.toString(),
      }
    );

    // Generate and upload thumbnail if requested
    let thumbnailUrl: string | undefined;
    if (generateThumb) {
      const { buffer: thumbBuffer, contentType: thumbType } =
        await generateThumbnail(optimizedBuffer, 300);

      const thumbBlobName = `thumb_${mainBlobName}`;
      const thumbContainer = process.env.AZURE_CONTAINER_THUMBNAILS!;

      thumbnailUrl = await uploadBuffer(
        thumbContainer,
        thumbBlobName,
        thumbBuffer,
        thumbType,
        { userId: session!.user.id, parentBlob: mainBlobName }
      );
    }

    return NextResponse.json({
      success: true,
      url: mainUrl,
      thumbnailUrl,
      blobName: mainBlobName,
      container: containerName,
      width,
      height,
      size: optimizedBuffer.length,
    });
  } catch (err) {
    console.error("[Azure Upload] Image upload failed:", err);
    return NextResponse.json(
      { error: "Upload failed. Please try again." },
      { status: 500 }
    );
  }
}

// ✅ New App Router config export
export const maxBodySize = MAX_IMAGE_SIZE;