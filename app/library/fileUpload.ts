// app/library/fileUpload.ts
// Production-ready file upload security validation utilities

import path from 'path';
import { randomUUID } from 'crypto';

// ──────────────────────────────────────────────
// Dangerous file extension blocklist
// ──────────────────────────────────────────────
const DANGEROUS_EXTENSIONS = new Set([
  '.exe', '.bat', '.cmd', '.com', '.pif', '.scr', '.vbs', '.vbe',
  '.js', '.jse', '.wsf', '.wsh', '.msi', '.msc', '.dll', '.sys',
  '.drv', '.cpl', '.inf', '.reg', '.ps1', '.sh', '.bash', '.zsh',
  '.py', '.rb', '.pl', '.php', '.php3', '.php4', '.php5', '.phtml',
  '.asp', '.aspx', '.ascx', '.asmx', '.ashx', '.axd', '.cshtml',
  '.cer', '.crt', '.p12', '.pfx', '.key', '.pem',
]);

// ──────────────────────────────────────────────
// Allowed MIME types per category
// ──────────────────────────────────────────────
export const ALLOWED_MIME_TYPES = {
  IMAGE: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
  PDF: ['application/pdf'],
  VIDEO: ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo', 'video/x-matroska'],
  DOCUMENT: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ],
  PAYMENT_PROOF: ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'],
};

// ──────────────────────────────────────────────
// File magic bytes for MIME verification
// ──────────────────────────────────────────────
const MAGIC_BYTES: Record<string, string[]> = {
  'image/jpeg': ['ffd8ff'],
  'image/png': ['89504e47'],
  'image/gif': ['47494638'],
  'image/webp': ['52494646'],
  'application/pdf': ['25504446'],
  'video/mp4': ['00000018', '00000020', '66747970'],
};

export function verifyMimeByMagic(buffer: Buffer, declaredMime: string): boolean {
  const knownMagic = MAGIC_BYTES[declaredMime];
  if (!knownMagic) return true; // If we don't have magic bytes for this type, trust declaration

  const hex = buffer.slice(0, 8).toString('hex').toLowerCase();
  return knownMagic.some(magic => hex.startsWith(magic));
}

// ──────────────────────────────────────────────
// Main validation function
// ──────────────────────────────────────────────
export interface FileValidationOptions {
  allowedMimeTypes: string[];
  maxSizeBytes: number;
  allowedExtensions?: string[];
}

export interface FileValidationResult {
  valid: boolean;
  error?: string;
}

export async function validateUploadedFile(
  file: File,
  options: FileValidationOptions
): Promise<FileValidationResult> {
  const fileName = file.name.toLowerCase();
  
  // 1. Reject files with dangerous extensions anywhere in the name (e.g. test.exe.jpg)
  const parts = fileName.split('.');
  if (parts.length > 2) {
    for (let i = 1; i < parts.length; i++) {
      if (DANGEROUS_EXTENSIONS.has('.' + parts[i])) {
        return { valid: false, error: 'Invalid or unsupported file type.' };
      }
    }
  }

  const ext = parts.length > 1 ? '.' + parts[parts.length - 1] : '';

  // 2. Reject if it directly has a dangerous extension
  if (DANGEROUS_EXTENSIONS.has(ext)) {
    return { valid: false, error: 'Invalid or unsupported file type.' };
  }

  // 3. Strict Whitelist of Extensions
  if (options.allowedExtensions && options.allowedExtensions.length > 0) {
    if (!options.allowedExtensions.includes(ext)) {
      return { valid: false, error: 'Invalid or unsupported file type.' };
    }
  }

  // 4. Validate MIME type declaration against allowlist
  const declaredMime = file.type.toLowerCase();
  if (!options.allowedMimeTypes.includes(declaredMime)) {
    return { valid: false, error: 'Invalid or unsupported file type.' };
  }

  // 5. File size limits and empty checks
  if (file.size === 0) {
    return { valid: false, error: 'Empty file is not allowed' };
  }
  if (file.size > options.maxSizeBytes) {
    const limitMB = (options.maxSizeBytes / (1024 * 1024)).toFixed(0);
    return { valid: false, error: `File size exceeds ${limitMB}MB limit` };
  }

  // 6. Magic Bytes Verification (Do not trust Content-Type header)
  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const isMagicValid = verifyMimeByMagic(buffer, declaredMime);
    if (!isMagicValid) {
      return { valid: false, error: 'Invalid or unsupported file type.' };
    }
  } catch (e) {
    return { valid: false, error: 'Failed to verify file contents.' };
  }

  return { valid: true };
}

// ──────────────────────────────────────────────
// Safe filename generator
// ──────────────────────────────────────────────
export function generateSafeFilename(originalName: string, prefix?: string): string {
  const ext = path.extname(originalName).toLowerCase();
  const safePrefix = prefix ? prefix.replace(/[^a-zA-Z0-9_-]/g, '_') : 'upload';
  return `${safePrefix}_${randomUUID()}${ext}`;
}
