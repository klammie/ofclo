// lib/utils/file-validation.ts
// File type and size validation with FIXED video MIME types

export const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
] as const;

// FIXED: Use correct MIME types that browsers actually send
export const ALLOWED_VIDEO_TYPES = [
  'video/mp4',
  'video/quicktime',      // .mov files
  'video/x-msvideo',      // .avi files
  'video/webm',
  'video/x-matroska',     // .mkv files
  'video/mpeg',           // .mpeg files
] as const;

// Extension to MIME type mapping (for manual validation)
export const VIDEO_EXTENSIONS_TO_MIME: Record<string, string> = {
  '.mp4':  'video/mp4',
  '.mov':  'video/quicktime',
  '.avi':  'video/x-msvideo',
  '.webm': 'video/webm',
  '.mkv':  'video/x-matroska',
  '.mpeg': 'video/mpeg',
  '.mpg':  'video/mpeg',
};

export const MAX_IMAGE_SIZE = 10 * 1024 * 1024;  // 10MB
export const MAX_VIDEO_SIZE = 1024 * 1024 * 1024; // 1GB

export type FileValidationError = {
  field: string;
  message: string;
};

export function validateImageFile(file: File): FileValidationError | null {
  // Check file type
  if (!ALLOWED_IMAGE_TYPES.includes(file.type as any)) {
    return {
      field: 'type',
      message: `Invalid file type. Allowed: JPEG, PNG, WebP, GIF`,
    };
  }
  
  // Check file size
  if (file.size > MAX_IMAGE_SIZE) {
    return {
      field: 'size',
      message: `File too large. Max size: ${MAX_IMAGE_SIZE / 1024 / 1024}MB`,
    };
  }
  
  return null;
}

export function validateVideoFile(file: File): FileValidationError | null {
  // Get file extension
  const fileName = file.name.toLowerCase();
  const extension = fileName.substring(fileName.lastIndexOf('.'));
  
  // Check if extension is allowed
  const isValidExtension = Object.keys(VIDEO_EXTENSIONS_TO_MIME).includes(extension);
  
  // Check MIME type (browsers sometimes send incorrect MIME types)
  const isValidMimeType = ALLOWED_VIDEO_TYPES.includes(file.type as any);
  
  // Accept if either extension OR MIME type is valid
  if (!isValidExtension && !isValidMimeType) {
    return {
      field: 'type',
      message: `Invalid file type. Allowed: MP4, MOV, AVI, WebM, MKV (got: ${file.type}, extension: ${extension})`,
    };
  }
  
  // Check file size
  if (file.size > MAX_VIDEO_SIZE) {
    return {
      field: 'size',
      message: `File too large. Max size: ${MAX_VIDEO_SIZE / 1024 / 1024 / 1024}GB`,
    };
  }
  
  return null;
}

/**
 * Generate a safe blob name for Azure Storage
 * Format: userId_timestamp_random_sanitizedFilename
 */
export function generateBlobName(
  userId: string,
  originalName: string,
  prefix?: string
): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).slice(2, 9);
  
  // Get file extension
  const extension = originalName.substring(originalName.lastIndexOf('.')).toLowerCase();
  
  // Sanitize filename (remove special chars, keep extension)
  const baseName = originalName
    .substring(0, originalName.lastIndexOf('.'))
    .replace(/[^a-zA-Z0-9]/g, '-')
    .slice(0, 50);
  
  const blobName = `${userId}_${timestamp}_${random}_${baseName}${extension}`;
  
  return prefix ? `${prefix}/${blobName}` : blobName;
}

/**
 * Get accept attribute value for file input
 */
export function getImageAcceptString(): string {
  return ALLOWED_IMAGE_TYPES.join(',');
}

export function getVideoAcceptString(): string {
  // Return both MIME types and extensions for maximum compatibility
  const mimeTypes = ALLOWED_VIDEO_TYPES.join(',');
  const extensions = Object.keys(VIDEO_EXTENSIONS_TO_MIME).join(',');
  return `${mimeTypes},${extensions}`;
}

/**
 * Validate file before upload (with detailed error message)
 */
export function validateFile(file: File, type: 'image' | 'video'): { valid: boolean; error?: string } {
  if (type === 'image') {
    const error = validateImageFile(file);
    if (error) {
      return { valid: false, error: error.message };
    }
  } else {
    const error = validateVideoFile(file);
    if (error) {
      return { valid: false, error: error.message };
    }
  }
  
  return { valid: true };
}