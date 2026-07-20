// app/library/rateLimiter.ts
// Production-ready in-memory rate limiter for Next.js API routes
// For multi-instance deployments, replace with Upstash Redis or similar.

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

// Separate maps per limit context
const stores = new Map<string, Map<string, RateLimitEntry>>();

function getStore(context: string): Map<string, RateLimitEntry> {
  if (!stores.has(context)) {
    stores.set(context, new Map());
  }
  return stores.get(context)!;
}

// Cleanup old entries every 5 minutes to prevent memory leaks
setInterval(() => {
  const now = Date.now();
  stores.forEach((store) => {
    store.forEach((entry, key) => {
      if (entry.resetAt < now) {
        store.delete(key);
      }
    });
  });
}, 5 * 60 * 1000);

export interface RateLimitOptions {
  /** Unique context name (e.g., 'login', 'register') */
  context: string;
  /** Identifier — typically IP address */
  identifier: string;
  /** Max requests allowed in the window */
  maxRequests: number;
  /** Window size in milliseconds */
  windowMs: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
  /** Human-readable time until reset */
  retryAfterSeconds: number;
}

export function checkRateLimit(options: RateLimitOptions): RateLimitResult {
  const { context, identifier, maxRequests, windowMs } = options;
  const store = getStore(context);
  const now = Date.now();
  const key = `${context}:${identifier}`;

  const existing = store.get(key);

  if (!existing || existing.resetAt < now) {
    // New window
    const resetAt = now + windowMs;
    store.set(key, { count: 1, resetAt });
    return {
      allowed: true,
      remaining: maxRequests - 1,
      resetAt,
      retryAfterSeconds: 0,
    };
  }

  // Increment
  existing.count += 1;
  store.set(key, existing);

  const allowed = existing.count <= maxRequests;
  return {
    allowed,
    remaining: Math.max(0, maxRequests - existing.count),
    resetAt: existing.resetAt,
    retryAfterSeconds: Math.ceil((existing.resetAt - now) / 1000),
  };
}

/** Rate limit presets for common scenarios */
export const RateLimits = {
  /** Login: 10 attempts per 15 minutes per IP */
  LOGIN: { context: 'login', maxRequests: 10, windowMs: 15 * 60 * 1000 },
  /** Registration: 5 submissions per hour per IP */
  REGISTER: { context: 'register', maxRequests: 5, windowMs: 60 * 60 * 1000 },
  /** Admin operations: 100 per minute */
  ADMIN_API: { context: 'admin_api', maxRequests: 100, windowMs: 60 * 1000 },
  /** General API: 200 per minute per IP */
  GENERAL_API: { context: 'general_api', maxRequests: 200, windowMs: 60 * 1000 },
  /** Password reset: 3 per hour */
  PASSWORD_RESET: { context: 'pwd_reset', maxRequests: 3, windowMs: 60 * 60 * 1000 },
};

/** 
 * Helper: Get IP from Next.js request
 * Extracts real IP respecting common proxy headers 
 */
export function getClientIP(request: Request): string {
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    // x-forwarded-for may contain comma-separated list; first is the client
    return forwardedFor.split(',')[0].trim();
  }
  return request.headers.get('x-real-ip') || '127.0.0.1';
}
