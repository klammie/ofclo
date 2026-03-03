// lib/azure/sas.ts
// Generate SAS tokens for client-side uploads — SERVER ONLY

import {
  generateBlobSASQueryParameters,
  BlobSASPermissions,
  StorageSharedKeyCredential,
} from '@azure/storage-blob';

const accountName = process.env.AZURE_STORAGE_ACCOUNT_NAME!;
const accountKey = process.env.AZURE_STORAGE_ACCOUNT_KEY!;

if (!accountKey) {
  throw new Error('AZURE_STORAGE_ACCOUNT_KEY is required for SAS generation');
}

const sharedKeyCredential = new StorageSharedKeyCredential(
  accountName,
  accountKey
);

export type SasTokenResponse = {
  sasUrl: string;
  blobUrl: string;
  expiresAt: Date;
};

/**
 * Generate a SAS token URL for direct client-to-Azure upload
 * Used for large video files to bypass serverless function size limits
 */
export async function generateUploadSasToken(
  containerName: string,
  blobName: string,
  expiryMinutes: number = 60
): Promise<SasTokenResponse> {
  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + expiryMinutes);

  const sasToken = generateBlobSASQueryParameters(
    {
      containerName,
      blobName,
      permissions: BlobSASPermissions.parse('cw'), // create + write
      startsOn: new Date(),
      expiresOn: expiresAt,
    },
    sharedKeyCredential
  ).toString();

  const blobUrl = `https://${accountName}.blob.core.windows.net/${containerName}/${blobName}`;
  const sasUrl = `${blobUrl}?${sasToken}`;

  return { sasUrl, blobUrl, expiresAt };
}

/**
 * Generate a read-only SAS token for temporary access to private blobs
 */
export async function generateReadSasToken(
  containerName: string,
  blobName: string,
  expiryMinutes: number = 60
): Promise<string> {
  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + expiryMinutes);

  const sasToken = generateBlobSASQueryParameters(
    {
      containerName,
      blobName,
      permissions: BlobSASPermissions.parse('r'), // read only
      startsOn: new Date(),
      expiresOn: expiresAt,
    },
    sharedKeyCredential
  ).toString();

  return `https://${accountName}.blob.core.windows.net/${containerName}/${blobName}?${sasToken}`;
}