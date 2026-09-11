import DOMPurify from 'isomorphic-dompurify';
import { NextRequest } from 'next/server';

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export function hasMaliciousPayload(input: string): boolean {
  if (typeof input !== 'string') return false;
  
  // SQL Injection patterns
  if (/(\bOR\b|\bAND\b)\s+['"]?[a-zA-Z0-9]+['"]?\s*=\s*['"]?[a-zA-Z0-9]+['"]?/i.test(input)) return true;
  if (/(--|\/\*|\*\/|xp_cmdshell)/i.test(input)) return true;
  
  // XSS & HTML Injection patterns
  if (/<script\b/i.test(input)) return true;
  if (/<[^>]+(onerror|onload|javascript:)/i.test(input)) return true;
  if (/<\/?(h1|h2|h3|h4|h5|h6|b|i|u|strong|em|div|span|p|a|img|table|tr|td|th|ul|ol|li)\b[^>]*>/i.test(input)) return true;
  
  // Command Injection patterns
  if (/(&&|\|\||;|`|\bdir\b\s*$)/i.test(input)) return true;
  
  return false;
}

/**
 * Sanitizes HTML by stripping all tags and dangerous attributes.
 * This completely prevents XSS and HTML injection.
 */
export function sanitizeHtml(input: string): string {
  if (!input) return input;
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: [], // Strip all HTML tags
    ALLOWED_ATTR: [],
  }).trim();
}

/**
 * Strips dangerous shell metacharacters to prevent Command Injection.
 * Note: The application does not use exec/spawn natively, but this provides defense-in-depth.
 */
export function sanitizeCommand(input: string): string {
  if (!input) return input;
  // Strip shell metacharacters: ; & | ` $ ( ) > < \n
  return input.replace(/[;&|`$()>\\<\n]/g, '').trim();
}

/**
 * Strips common SQL injection substrings to prevent payload storage.
 * Note: DB uses parameterized queries, this just prevents malicious strings from being accepted.
 */
export function sanitizeSql(input: string): string {
  if (!input) return input;
  let sanitized = input;
  // Strip typical SQLi attack patterns like ' OR ', ' AND ', '--', '/*', '*/', 'xp_cmdshell'
  sanitized = sanitized.replace(/(\bOR\b|\bAND\b)\s+['"]?[a-zA-Z0-9]+['"]?\s*=\s*['"]?[a-zA-Z0-9]+['"]?/gi, '');
  sanitized = sanitized.replace(/(--|\/\*|\*\/|xp_cmdshell|;)/gi, '');
  return sanitized.trim();
}

/**
 * Applies all comprehensive sanitizations for any string input.
 */
export function sanitizeString(input: string): string {
  if (typeof input !== 'string') return input;
  let sanitized = sanitizeHtml(input);
  sanitized = sanitizeCommand(sanitized);
  sanitized = sanitizeSql(sanitized);
  return sanitized;
}

/**
 * Recursively walks through any JSON object/array and sanitizes all string values.
 */
export function sanitizeObject(obj: any): any {
  if (obj === null || obj === undefined) {
    return obj;
  }
  
  if (typeof obj === 'string') {
    if (hasMaliciousPayload(obj)) {
      throw new ValidationError('MALICIOUS_PAYLOAD_DETECTED');
    }
    return sanitizeString(obj);
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item));
  }
  
  if (typeof obj === 'object') {
    const sanitizedObj: any = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        // Skip sanitizing password fields to prevent mutating valid passwords
        if (key.toLowerCase().includes('password')) {
          sanitizedObj[key] = obj[key];
        } else {
          sanitizedObj[key] = sanitizeObject(obj[key]);
        }
      }
    }
    return sanitizedObj;
  }
  
  return obj; // Return numbers, booleans, etc. as-is
}

/**
 * Extracts the JSON body from a NextRequest and fully sanitizes it.
 * Replaces: `const body = await request.json();`
 */
export async function parseAndSanitizeBody(request: NextRequest): Promise<any> {
  try {
    const body = await request.json();
    return sanitizeObject(body);
  } catch (error: any) {
    if (error.name === 'ValidationError') {
      throw error;
    }
    return {};
  }
}

/**
 * Extracts the FormData from a NextRequest and sanitizes all string values.
 * Leaves File objects intact for uploads.
 * Replaces: `const formData = await request.formData();`
 */
export async function parseAndSanitizeFormData(request: NextRequest): Promise<FormData> {
  try {
    const formData = await request.formData();
    const sanitizedFormData = new FormData();
    
    for (const [key, value] of formData.entries()) {
      if (typeof value === 'string') {
        if (key.toLowerCase().includes('password')) {
          sanitizedFormData.append(key, value);
        } else {
          if (hasMaliciousPayload(value)) {
            throw new ValidationError('MALICIOUS_PAYLOAD_DETECTED');
          }
          sanitizedFormData.append(key, sanitizeString(value) as any);
        }
      } else {
        // value is a File object, leave it untouched
        sanitizedFormData.append(key, value as any);
      }
    }
    
    return sanitizedFormData;
  } catch (error: any) {
    if (error.name === 'ValidationError') {
      throw error;
    }
    return new FormData();
  }
}
