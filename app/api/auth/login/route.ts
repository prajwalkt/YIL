import { NextRequest, NextResponse } from 'next/server';
import { 
  hashPassword, comparePassword, signToken, 
  sanitizeEmail, recordLoginAttempt, isAccountLocked, auditLog, validateRedirectUrl
} from '../../../library/auth';
import { getConnection } from '../../../library/db';
import { checkRateLimit, getClientIP, RateLimits } from '../../../library/rateLimiter';

// Roles exempt from single-device restriction
const MULTI_DEVICE_ROLES = ['ADMIN', 'FINANCE', 'TM', 'TRAINER'];

export async function POST(request: NextRequest) {
  const ip = getClientIP(request);
  const userAgent = request.headers.get('user-agent') || '';

  // ── Rate Limiting: 10 attempts per 15 minutes per IP ──
  const rateCheck = checkRateLimit({ ...RateLimits.LOGIN, identifier: ip });
  if (!rateCheck.allowed) {
    return NextResponse.json({
      success: false,
      message: `Too many login attempts. Please try again in ${rateCheck.retryAfterSeconds} seconds.`,
    }, {
      status: 429,
      headers: {
        'Retry-After': String(rateCheck.retryAfterSeconds),
        'X-RateLimit-Limit': String(RateLimits.LOGIN.maxRequests),
        'X-RateLimit-Remaining': String(rateCheck.remaining),
      },
    });
  }

  try {
    const body = await request.json();
    const email = sanitizeEmail(body.email || '');
    const password = body.password || '';

    if (!email || !password) {
      return NextResponse.json({ success: false, message: 'Email and password required' }, { status: 400 });
    }

    // Check lockout
    const locked = await isAccountLocked(email);
    if (locked) {
      await auditLog(null, email, 'LOGIN_BLOCKED', 'AUTH', 'Account locked', ip, 'FAILURE');
      return NextResponse.json({
        success: false,
        message: 'Account temporarily locked due to multiple failed attempts. Please wait 30 minutes or contact admin.',
      }, { status: 423 });
    }

    const pool = await getConnection();
    const result = await pool.request()
      .input('Email', email)
      .query(`
        SELECT UserID, Email, PasswordHash, Role, FirstName, LastName, IsActive, IsApproved, MustChangePassword
        FROM LMS_Users WHERE Email = @Email
      `);

    if (result.recordset.length === 0) {
      await recordLoginAttempt(email, false, ip, userAgent);
      await auditLog(null, email, 'LOGIN_FAILED', 'AUTH', 'User not found', ip, 'FAILURE');
      return NextResponse.json({ success: false, message: 'Invalid email or password' }, { status: 401 });
    }

    const user = result.recordset[0];

    if (!user.IsActive) {
      return NextResponse.json({ success: false, message: 'Account is disabled. Contact administrator.' }, { status: 403 });
    }

    if (!user.IsApproved) {
      return NextResponse.json({ success: false, message: 'Account pending approval. Contact administrator.' }, { status: 403 });
    }

    // Verify password — no hardcoded bypass allowed
    const passwordValid = await comparePassword(password, user.PasswordHash);

    if (!passwordValid) {
      await recordLoginAttempt(email, false, ip, userAgent);
      await auditLog(user.UserID, email, 'LOGIN_FAILED', 'AUTH', 'Wrong password', ip, 'FAILURE');
      return NextResponse.json({ success: false, message: 'Invalid email or password' }, { status: 401 });
    }

    await recordLoginAttempt(email, true, ip, userAgent);
    await auditLog(user.UserID, email, 'LOGIN_SUCCESS', 'AUTH', `Login from ${ip}`, ip, 'SUCCESS');

    const crypto = require('crypto');
    const sessionId = crypto.randomUUID();

    const token = signToken({
      userId: user.UserID,
      email: user.Email,
      role: user.Role,
      firstName: user.FirstName,
      lastName: user.LastName,
      sessionId,
    });

    try {
      // 1. Insert into LMS_Sessions
      await pool.request()
        .input('SessionID', sessionId)
        .input('UserID', user.UserID)
        .input('IPAddress', ip.substring(0, 50))
        .input('UserAgent', userAgent.substring(0, 500))
        .query(`
          INSERT INTO LMS_Sessions (SessionID, UserID, IPAddress, UserAgent, CreatedAt, ExpiresAt, IsActive)
          VALUES (@SessionID, @UserID, @IPAddress, @UserAgent, GETDATE(), DATEADD(hour, 8, GETDATE()), 1)
        `);

      // 2. Single Device Session Enforcement
      if (!MULTI_DEVICE_ROLES.includes(user.Role)) {
        await pool.request()
          .input('SessionID', sessionId)
          .input('UserID', user.UserID)
          .query(`UPDATE LMS_Users SET ActiveSessionToken = @SessionID WHERE UserID = @UserID`);
      }
    } catch (err) {
      console.warn('Session tracking error:', err);
    }

    const requiresPasswordChange = user.MustChangePassword === true || user.MustChangePassword === 1;

    const response = NextResponse.json({
      success: true,
      message: 'Login successful',
      user: {
        userId: user.UserID,
        email: user.Email,
        role: user.Role,
        firstName: user.FirstName,
        lastName: user.LastName,
      },
      token,
      requiresPasswordChange,
      redirectTo: requiresPasswordChange ? '/change-password' : getRedirectByRole(user.Role),
    });

    response.cookies.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 8 * 60 * 60,
      path: '/',
    });

    return response;
  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json({ success: false, message: 'Authentication service error' }, { status: 500 });
  }
}

function getRedirectByRole(role: string): string {
  const redirects: Record<string, string> = {
    ADMIN: '/admin',
    TRAINER: '/trainer',
    AFFILIATE: '/affiliate',
    STUDENT: '/student',
    FINANCE: '/admin?view=finance',
    TM: '/admin?view=tm',
  };
  return redirects[role] || '/';
}
