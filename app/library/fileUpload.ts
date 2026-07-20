// app/library/fileUpload.ts
// Production-ready file upload security validation utilities

import path from 'path';

// ──────────────────────────────────────────────
// Dangerous file extension blocklist
// ──────────────────────────────────────────────
const BLOCKED_EXTENSIONS = new Set([
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

export function validateUploadedFile(
  file: File,
  options: FileValidationOptions
): FileValidationResult {
  const ext = path.extname(file.name).toLowerCase();
  const mime = file.type.toLowerCase();

  // 1. Block dangerous extensions
  if (BLOCKED_EXTENSIONS.has(ext)) {
    return { valid: false, error: `File type '${ext}' is not allowed for security reasons` };
  }

  // 2. Validate extension if allowedExtensions provided
  if (options.allowedExtensions && options.allowedExtensions.length > 0) {
    if (!options.allowedExtensions.includes(ext)) {
      return {
        valid: false,
        error: `Invalid file extension. Allowed: ${options.allowedExtensions.join(', ')}`,
      };
    }
  }

  // 3. Validate MIME type against allowlist
  if (!options.allowedMimeTypes.includes(mime)) {
    return {
      valid: false,
      error: `File type '${mime}' is not allowed. Allowed: ${options.allowedMimeTypes.join(', ')}`,
    };
  }

  // 4. File size limit
  if (file.size > options.maxSizeBytes) {
    const limitMB = (options.maxSizeBytes / (1024 * 1024)).toFixed(0);
    return { valid: false, error: `File size exceeds ${limitMB}MB limit` };
  }

  // 5. Reject empty files
  if (file.size === 0) {
    return { valid: false, error: 'Empty file is not allowed' };
  }

  return { valid: true };
}

// ──────────────────────────────────────────────
// Safe filename generator
// ──────────────────────────────────────────────
export function generateSafeFilename(originalName: string, prefix?: string): string {
  const ext = path.extname(originalName).toLowerCase();
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 10);
  const safePrefix = prefix ? prefix.replace(/[^a-zA-Z0-9_-]/g, '_') : 'upload';
  return `${safePrefix}_${timestamp}_${random}${ext}`;
}
