// lib/utils/media-processing.ts
// Image optimization with Sharp — SERVER ONLY

import sharp from 'sharp';

export type ImageFormat = 'jpeg' | 'png' | 'webp';

export type ProcessImageOptions = {
  maxWidth?:  number;
  maxHeight?: number;
  quality?:   number;
  format?:    ImageFormat;
};

/**
 * Process and optimize an image buffer
 * Automatically resizes, compresses, and converts format
 */
export async function processImage(
  buffer: Buffer,
  options: ProcessImageOptions = {}
): Promise<{ buffer: Buffer; contentType: string; width: number; height: number }> {
  const {
    maxWidth = 2048,
    maxHeight = 2048,
    quality = 85,
    format = 'webp',
  } = options;

  let pipeline = sharp(buffer);

  // Get original metadata
  const metadata = await pipeline.metadata();

  // Resize if necessary
  if (
    metadata.width && metadata.width > maxWidth ||
    metadata.height && metadata.height > maxHeight
  ) {
    pipeline = pipeline.resize(maxWidth, maxHeight, {
      fit: 'inside',
      withoutEnlargement: true,
    });
  }

  // Convert format and compress
  switch (format) {
    case 'jpeg':
      pipeline = pipeline.jpeg({ quality, mozjpeg: true });
      break;
    case 'png':
      pipeline = pipeline.png({ quality, compressionLevel: 9 });
      break;
    case 'webp':
      pipeline = pipeline.webp({ quality });
      break;
  }

  const processedBuffer = await pipeline.toBuffer();
  const finalMetadata = await sharp(processedBuffer).metadata();

  return {
    buffer: processedBuffer,
    contentType: `image/${format}`,
    width: finalMetadata.width!,
    height: finalMetadata.height!,
  };
}

/**
 * Generate a thumbnail from an image
 */
export async function generateThumbnail(
  buffer: Buffer,
  size: number = 300
): Promise<{ buffer: Buffer; contentType: string }> {
  const thumbnailBuffer = await sharp(buffer)
    .resize(size, size, {
      fit: 'cover',
      position: 'center',
    })
    .webp({ quality: 80 })
    .toBuffer();

  return {
    buffer: thumbnailBuffer,
    contentType: 'image/webp',
  };
}

/**
 * Extract first frame of a video as thumbnail
 * Requires ffmpeg installed on server
 */
export async function extractVideoThumbnail(
  videoPath: string,
  outputSize: number = 300
): Promise<Buffer> {
  // Note: This requires ffmpeg to be installed on the server
  // Implementation depends on your deployment environment
  throw new Error('Video thumbnail extraction not implemented yet');
}