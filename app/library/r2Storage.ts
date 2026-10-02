import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { createPresignedPost } from "@aws-sdk/s3-presigned-post";
import fs from "fs";
import path from "path";

// Initialize S3 client for Cloudflare R2
export const s3Client = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || "",
  },
});

const BUCKET_NAME = process.env.R2_BUCKET_NAME || "";

/**
 * Upload a file buffer directly to R2
 */
export async function uploadToR2(key: string, buffer: Buffer, mimeType: string): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    Body: buffer,
    ContentType: mimeType,
  });
  
  await s3Client.send(command);
  return key;
}

/**
 * Get a presigned URL for the browser to download/view the file securely
 */
export async function getPresignedDownloadUrl(key: string, expiresIn = 3600): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  });
  return await getSignedUrl(s3Client, command, { expiresIn });
}

/**
 * Get a presigned POST URL for the browser to upload large files directly
 */
export async function getPresignedUploadPost(key: string, mimeType: string, maxSizeBytes = 500 * 1024 * 1024) {
  return await createPresignedPost(s3Client, {
    Bucket: BUCKET_NAME,
    Key: key,
    Conditions: [
      ["content-length-range", 0, maxSizeBytes], // up to maxSizeBytes
      ["eq", "$Content-Type", mimeType],
    ],
    Fields: {
      "Content-Type": mimeType,
    },
    Expires: 3600, // 1 hour
  });
}

/**
 * Fetch a file stream from R2 (useful for proxying or server-side reading)
 */
export async function getFileStreamFromR2(key: string) {
  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  });
  const response = await s3Client.send(command);
  return response.Body;
}

/**
 * Delete a file from R2
 */
export async function deleteFromR2(key: string): Promise<void> {
  const command = new DeleteObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  });
  await s3Client.send(command);
}

/**
 * Legacy path handler. Checks if a path is a local file, Google Drive ID, or R2 Key.
 * Returns the resolved physical path/URL or stream.
 */
export async function resolveFileAccess(filePathOrId: string) {
  if (!filePathOrId) return { type: "unknown" };
  
  // If it starts with /uploads/ or /templates/ or /manuals/, it's likely a local file
  if (filePathOrId.startsWith("/uploads/") || filePathOrId.startsWith("/templates/") || filePathOrId.startsWith("/manuals/")) {
    const localPath = path.join(process.cwd(), "public", filePathOrId.replace(/^\//, ""));
    if (fs.existsSync(localPath)) {
      return { type: "local", path: localPath };
    }
  }
  
  // If it contains "drive.google.com" or is a pure alphanumeric ID with typical lengths, it might be GDrive
  if (filePathOrId.includes("drive.google.com") || (filePathOrId.length > 20 && !filePathOrId.includes("/") && !filePathOrId.includes("."))) {
    return { type: "gdrive", id: filePathOrId };
  }

  // Otherwise, assume it's an R2 key
  return { type: "r2", key: filePathOrId };
}
