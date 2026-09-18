import { NextRequest, NextResponse } from 'next/server';
import { parseAndSanitizeBody } from '../../../library/validation';
import { 
  hashPassword, comparePassword, signToken, 
  sanitizeEmail, recordLoginAttempt, isAccountLocked, auditLog
} from '../../../library/auth';
import { getConnection } from '../../../library/db';
import jwt from 'jsonwebtoken';
import { randomUUID } from 'crypto';
import { getClientIP } from '../../../library/rateLimiter';

// Roles exempt from single-device restriction
const MULTI_DEVICE_ROLES = ['ADMIN', 'FINANCE', 'TM', 'TRAINER'];

export async function POST(request: NextRequest) {
  const ip = getClientIP(request);
  const userAgent = request.headers.get('user-agent') || '';

  // ── Rate Limiting is handled globally via middleware.ts ──

  try {
    const body = await parseAndSanitizeBody(request);
    
    // DEBUG LOG
    console.log(`[LOGIN_DEBUG_TOP] raw_email="${body.email}" raw_password_len=${body.password?.length} captcha="${body.captchaText}" token="${request.cookies.get('captcha_token')?.value ? 'present' : 'missing'}"`);

    const email = sanitizeEmail(body.email || '');
    const password = body.password || '';

    const captchaText = body.captchaText || '';
    const captchaToken = request.cookies.get('captcha_token')?.value;

    if (!email || !password) {
      return NextResponse.json({ success: false, message: 'Email and password required' }, { status: 400 });
    }

    if (!captchaText) {
      await auditLog(null, email, 'LOGIN_FAILED', 'AUTH', 'Missing CAPTCHA text', ip, 'FAILURE');
      return NextResponse.json({ success: false, message: 'Missing security verification. Please complete the CAPTCHA.' }, { status: 403 });
    }

    if (!captchaToken) {
      await auditLog(null, email, 'LOGIN_FAILED', 'AUTH', 'Missing or expired CAPTCHA session', ip, 'FAILURE');
      return NextResponse.json({ success: false, message: 'CAPTCHA session expired. Please load a new image and try again.' }, { status: 403 });
    }

    try {
      const JWT_SECRET = process.env.JWT_SECRET || 'yts-lms-dev-only-secret-change-in-production-32chars';
      const decoded = jwt.verify(captchaToken, JWT_SECRET) as { captcha: string };
      
      if (!decoded || !decoded.captcha || decoded.captcha.toLowerCase() !== captchaText.toLowerCase()) {
        await auditLog(null, email, 'LOGIN_FAILED', 'AUTH', 'Invalid CAPTCHA', ip, 'FAILURE');
        const errResp = NextResponse.json({ success: false, message: 'Invalid CAPTCHA code. Please try again.' }, { status: 403 });
        errResp.cookies.delete('captcha_token'); // Prevent reuse
        return errResp;
      }
    } catch (e) {
      await auditLog(null, email, 'LOGIN_FAILED', 'AUTH', 'Invalid CAPTCHA token signature', ip, 'FAILURE');
      const errResp = NextResponse.json({ success: false, message: 'Invalid or expired CAPTCHA session. Please reload.' }, { status: 403 });
      errResp.cookies.delete('captcha_token');
      return errResp;
    }


    const pool = await getConnection();

    // Check lockout
    const locked = await isAccountLocked(email);
    if (locked) {
      await auditLog(null, email, 'LOGIN_BLOCKED', 'AUTH', 'Account locked', ip, 'FAILURE');
      const res = NextResponse.json({
        success: false,
        message: 'Account temporarily locked due to multiple failed attempts. Please wait 30 minutes or contact admin.',
      }, { status: 423 });
      res.cookies.delete('captcha_token');
      return res;
    }

    const result = await pool.query(`
        SELECT UserID, Email, PasswordHash, Role, FirstName, LastName, IsActive, IsApproved, MustChangePassword
        FROM LMS_Users WHERE Email = $1
      `, [email]);

    if (result.recordset.length === 0) {
      await recordLoginAttempt(email, false, ip, userAgent);
      await auditLog(null, email, 'LOGIN_FAILED', 'AUTH', 'User not found', ip, 'FAILURE');
      const res = NextResponse.json({ success: false, message: 'Invalid email or password' }, { status: 401 });
      res.cookies.delete('captcha_token');
      return res;
    }

    const user = result.recordset[0];

    if (!user.IsActive) {
      const res = NextResponse.json({ success: false, message: 'Account is disabled. Contact administrator.' }, { status: 403 });
      res.cookies.delete('captcha_token');
      return res;
    }

    if (!user.IsApproved) {
      const res = NextResponse.json({ success: false, message: 'Account pending approval. Contact administrator.' }, { status: 403 });
      res.cookies.delete('captcha_token');
      return res;
    }

    // Verify password — no hardcoded bypass allowed
    const passwordValid = await comparePassword(password, user.PasswordHash);

    if (!passwordValid) {
      await recordLoginAttempt(email, false, ip, userAgent);
      await auditLog(user.UserID, email, 'LOGIN_FAILED', 'AUTH', 'Wrong password', ip, 'FAILURE');
      const res = NextResponse.json({ success: false, message: 'Invalid email or password' }, { status: 401 });
      res.cookies.delete('captcha_token');
      return res;
    }

    await recordLoginAttempt(email, true, ip, userAgent);
    await auditLog(user.UserID, email, 'LOGIN_SUCCESS', 'AUTH', `Login from ${ip}`, ip, 'SUCCESS');

    const sessionId = randomUUID();
    const requiresPasswordChange = user.MustChangePassword === true || user.MustChangePassword === 1;

    const token = signToken({
      userId: user.UserID,
      email: user.Email,
      role: user.Role,
      firstName: user.FirstName,
      lastName: user.LastName,
      sessionId,
      mustChangePassword: requiresPasswordChange,
    });

    try {
      // 1. Insert into LMS_Sessions
      await pool.query(`
          INSERT INTO LMS_Sessions (SessionID, UserID, IPAddress, UserAgent, ExpiresAt)
          VALUES ($1, $2, $3, $4, DATEADD(hour, 8, CURRENT_TIMESTAMP))
        `, [sessionId, user.UserID, ip, userAgent.substring(0, 200)]);
    } catch (err) {
      console.warn('Session tracking error:', err);
    }



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
      secure: request.headers.get('x-forwarded-proto') === 'https' || request.nextUrl.protocol === 'https:',
      sameSite: 'strict',
      maxAge: 8 * 60 * 60,
      path: '/',
    });

    return response;
  } catch (error: any) {
    console.error('Login error:', error);
    
    if (error.name === 'ValidationError' && error.message === 'MALICIOUS_PAYLOAD_DETECTED') {
      return NextResponse.json({
        success: false,
        message: 'Invalid input detected: request rejected for security reasons.',
      }, { status: 400 });
    }

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
