// lib/azure/index.ts
// Azure Blob Storage client — SERVER ONLY

import {
  BlobServiceClient,
  StorageSharedKeyCredential,
  generateBlobSASQueryParameters,
  BlobSASPermissions,
  ContainerClient,
} from '@azure/storage-blob';

const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING!;
const accountName = process.env.AZURE_STORAGE_ACCOUNT_NAME!;

if (!connectionString) {
  throw new Error('AZURE_STORAGE_CONNECTION_STRING is not set');
}

// Singleton instance
let blobServiceClient: BlobServiceClient;

export function getBlobServiceClient(): BlobServiceClient {
  if (!blobServiceClient) {
    blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
  }
  return blobServiceClient;
}

export function getContainerClient(containerName: string): ContainerClient {
  const serviceClient = getBlobServiceClient();
  return serviceClient.getContainerClient(containerName);
}

export async function uploadBuffer(
  containerName: string,
  blobName: string,
  buffer: Buffer,
  contentType: string,
  metadata?: Record<string, string>
): Promise<string> {
  const containerClient = getContainerClient(containerName);
  const blockBlobClient = containerClient.getBlockBlobClient(blobName);

  await blockBlobClient.upload(buffer, buffer.length, {
    blobHTTPHeaders: { blobContentType: contentType },
    metadata,
  });

  return blockBlobClient.url;
}

export async function deleteBlob(
  containerName: string,
  blobName: string
): Promise<void> {
  const containerClient = getContainerClient(containerName);
  const blockBlobClient = containerClient.getBlockBlobClient(blobName);
  await blockBlobClient.delete();
}

export function getBlobUrl(containerName: string, blobName: string): string {
  return `https://${accountName}.blob.core.windows.net/${containerName}/${blobName}`;
}

export async function blobExists(
  containerName: string,
  blobName: string
): Promise<boolean> {
  try {
    const containerClient = getContainerClient(containerName);
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);
    return await blockBlobClient.exists();
  } catch {
    return false;
  }
}