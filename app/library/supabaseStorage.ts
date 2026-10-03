import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Initialize Supabase client
// The env var has been set to the dashboard URL (https://supabase.com/dashboard/project/<ref>)
// in some environments; the client needs the API URL (https://<ref>.supabase.co).
function resolveSupabaseUrl(raw: string): string {
  const m = raw.match(/supabase\.com\/dashboard\/project\/([a-z0-9]+)/i);
  return m ? `https://${m[1]}.supabase.co` : raw.replace(/\/+$/, '');
}
const supabaseUrl = resolveSupabaseUrl(process.env.NEXT_PUBLIC_SUPABASE_URL || '');
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseKey);
const BUCKET_NAME = 'lms-storage';

/**
 * Upload a file buffer directly to Supabase Storage
 */
export async function uploadToSupabase(key: string, buffer: Buffer, mimeType: string): Promise<string> {
  const { data, error } = await supabase
    .storage
    .from(BUCKET_NAME)
    .upload(key, buffer, {
      contentType: mimeType,
      upsert: true
    });

  if (error) {
    throw new Error(`Supabase upload error: ${error.message}`);
  }
  return key;
}

/**
 * Get a public URL for the browser to download/view the file securely
 */
export async function getSupabaseUrl(key: string): Promise<string> {
  // If the bucket is public, this works directly. If private, we can use createSignedUrl
  const { data } = supabase.storage.from(BUCKET_NAME).getPublicUrl(key);
  return data.publicUrl;
}

export async function getPresignedDownloadUrl(key: string, expiresIn = 3600): Promise<string> {
    const { data, error } = await supabase.storage.from(BUCKET_NAME).createSignedUrl(key, expiresIn);
    if (error) throw error;
    return data.signedUrl;
}

/**
 * Fetch a file stream or buffer from Supabase (useful for proxying)
 */
export async function getFileStreamFromSupabase(key: string) {
  const { data, error } = await supabase.storage.from(BUCKET_NAME).download(key);
  if (error) throw error;
  return data.arrayBuffer(); // Returns ArrayBuffer, you can convert to Buffer in the route
}

/**
 * Delete a file from Supabase
 */
export async function deleteFromSupabase(key: string): Promise<void> {
  const { error } = await supabase.storage.from(BUCKET_NAME).remove([key]);
  if (error) throw error;
}

/**
 * Legacy path handler. Checks if a path is a local file, Google Drive ID, or Supabase Key.
 * Returns the resolved physical path/URL or stream.
 */
export async function resolveFileAccess(filePathOrId: string) {
  if (!filePathOrId) return { type: "unknown" };
  
  if (filePathOrId.startsWith("/uploads/") || filePathOrId.startsWith("/templates/") || filePathOrId.startsWith("/manuals/")) {
    const localPath = path.join(process.cwd(), "public", filePathOrId.replace(/^\//, ""));
    if (fs.existsSync(localPath)) {
      return { type: "local", path: localPath };
    }
  }
  
  if (filePathOrId.includes("drive.google.com") || (filePathOrId.length > 20 && !filePathOrId.includes("/") && !filePathOrId.includes("."))) {
    return { type: "gdrive", id: filePathOrId };
  }

  return { type: "supabase", key: filePathOrId };
}
