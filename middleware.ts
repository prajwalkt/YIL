import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyTokenEdge } from './app/library/auth-edge';

// Route → required roles mapping
// NOTE: More specific routes must come BEFORE broader ones in this object,
// because the proxy checks via startsWith — first match wins.
const PROTECTED_ROUTES: Record<string, string[]> = {
  // ── Admin sub-routes (Finance/TM need access to specific endpoints) ──
  '/api/admin/approvals':   ['ADMIN', 'FINANCE', 'TM'],
  '/api/admin/date-approvals': ['ADMIN', 'FINANCE', 'TM'],
  '/api/admin/reports':     ['ADMIN', 'FINANCE', 'TM'],
  '/api/admin/calendar':    ['ADMIN', 'TM', 'TRAINER'],
  // ── Broad admin lock (all other /api/admin/* = ADMIN only) ──
  '/api/admin':             ['ADMIN'],
  // ── Portal APIs ──
  '/api/trainer':           ['TRAINER', 'ADMIN'],
  '/api/student':           ['STUDENT', 'ADMIN', 'AFFILIATE'],
  '/api/certificates':      ['ADMIN', 'TRAINER', 'STUDENT', 'AFFILIATE'],
  // ── Pages ──
  '/admin':                 ['ADMIN', 'FINANCE', 'TM'],
  '/trainer':               ['TRAINER', 'ADMIN'],
  '/affiliate':             ['AFFILIATE', 'ADMIN'],
  '/student':               ['STUDENT', 'ADMIN'],
};

// Rate limiting store (in-memory, per edge runtime)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ip: string, limit = 60, windowMs = 60000): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + windowMs });
    return true;
  }
  
  if (entry.count >= limit) return false;
  entry.count++;
  return true;
}

function checkAuthRateLimit(ip: string): boolean {
  return checkRateLimit(`auth:${ip}`, 10, 60000); // 10 auth attempts per minute
}

export default async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '127.0.0.1';
  const ipKey = ip.split(',')[0].trim();

  const nonce = btoa(crypto.randomUUID());
  
  const isDev = process.env.NODE_ENV === 'development';
  const scriptSrc = isDev 
    ? `script-src 'self' 'nonce-${nonce}' 'unsafe-eval'`
    : `script-src 'self' 'unsafe-inline' 'unsafe-eval'`;
  
  const isLocalhost = request.nextUrl.hostname === 'localhost' || request.nextUrl.hostname === '127.0.0.1';

  const cspDirectives = [
    "default-src 'self'",
    scriptSrc,
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: blob: https://drive.google.com https://lh3.googleusercontent.com",
    "connect-src 'self'",
    "frame-src 'self'",
    "frame-ancestors 'none'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'"
  ];

  if (!isLocalhost) {
    cspDirectives.push("upgrade-insecure-requests");
  }

  const cspHeader = cspDirectives.join('; ');

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-nonce', nonce);
  requestHeaders.set('Content-Security-Policy', cspHeader);

  // ── Force HTTPS in Production ──
  if (process.env.NODE_ENV === 'production' && !isLocalhost) {
    const proto = request.headers.get('x-forwarded-proto');
    if (proto && proto !== 'https') {
      const secureUrl = new URL(request.url);
      secureUrl.protocol = 'https:';
      return NextResponse.redirect(secureUrl, 301);
    }
  }

  // ── Apply Security Headers to all responses ──
  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
  
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), magnetometer=(), gyroscope=(), accelerometer=()');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
  response.headers.set('Content-Security-Policy', cspHeader);

  // ── Rate limiting on API routes ──
  if (pathname.startsWith('/api/')) {
    // Stricter rate limit on auth routes
    if (
      pathname.startsWith('/api/auth/login') ||
      pathname.startsWith('/api/auth/register') ||
      pathname.startsWith('/api/auth/forgot-password') ||
      pathname.startsWith('/api/auth/reset-password')
    ) {
      if (!checkAuthRateLimit(ipKey)) {
        return new NextResponse(
          JSON.stringify({ success: false, message: 'Too many attempts. Please wait before trying again.' }),
          { status: 429, headers: { 'Content-Type': 'application/json', 'Retry-After': '60' } }
        );
      }
    } else {
      if (!checkRateLimit(ipKey, 100, 60000)) {
        return new NextResponse(
          JSON.stringify({ success: false, message: 'Rate limit exceeded.' }),
          { status: 429, headers: { 'Content-Type': 'application/json' } }
        );
      }
    }
  }

  // ── Open Redirect Prevention for login redirect param ──
  if (pathname === '/login' || pathname === '/staff-login') {
    const redirect = request.nextUrl.searchParams.get('redirect');
    if (redirect) {
      // Block absolute URLs, protocol-relative URLs, and data: URIs
      if (
        redirect.startsWith('http') ||
        redirect.startsWith('//') ||
        redirect.includes(':') ||
        !redirect.startsWith('/')
      ) {
        const cleanUrl = request.nextUrl.clone();
        cleanUrl.searchParams.delete('redirect');
        return NextResponse.redirect(cleanUrl);
      }
    }
  }

  // ── RBAC Route Protection ──
  for (const [route, allowedRoles] of Object.entries(PROTECTED_ROUTES)) {
    if (pathname.startsWith(route)) {
      const token = request.cookies.get('auth_token')?.value ||
        request.headers.get('Authorization')?.replace('Bearer ', '');
      
      if (!token) {
        if (pathname.startsWith('/api/')) {
          return new NextResponse(
            JSON.stringify({ success: false, message: 'Authentication required' }),
            { status: 401, headers: { 'Content-Type': 'application/json' } }
          );
        }
        const loginUrl = new URL('/login', request.url);
        loginUrl.searchParams.set('redirect', pathname);
        return NextResponse.redirect(loginUrl);
      }
      
      const payload = await verifyTokenEdge(token);
      if (!payload) {
        if (pathname.startsWith('/api/')) {
          return new NextResponse(
            JSON.stringify({ success: false, message: 'Invalid or expired token' }),
            { status: 401, headers: { 'Content-Type': 'application/json' } }
          );
        }
        const loginUrl = new URL('/login', request.url);
        loginUrl.searchParams.set('redirect', pathname);
        return NextResponse.redirect(loginUrl);
      }
      
      if (payload.mustChangePassword && !pathname.startsWith('/change-password') && !pathname.startsWith('/api/auth/')) {
        if (pathname.startsWith('/api/')) {
          return new NextResponse(
            JSON.stringify({ success: false, message: 'Password change required', requiresPasswordChange: true }),
            { status: 403, headers: { 'Content-Type': 'application/json' } }
          );
        }
        return NextResponse.redirect(new URL('/change-password', request.url));
      }
      
      if (!allowedRoles.includes(payload.role)) {
        if (pathname.startsWith('/api/')) {
          return new NextResponse(
            JSON.stringify({ success: false, message: 'Access denied: insufficient permissions' }),
            { status: 403, headers: { 'Content-Type': 'application/json' } }
          );
        }
        return NextResponse.redirect(new URL('/unauthorized', request.url));
      }
      
      // Inject user info into headers for downstream use
      response.headers.set('x-user-id', String(payload.userId));
      response.headers.set('x-user-role', payload.role);
      response.headers.set('x-user-email', payload.email);
      break;
    }
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|public|galleryImages).*)',
  ],
};
