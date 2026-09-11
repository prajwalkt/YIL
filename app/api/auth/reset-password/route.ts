// app/api/auth/reset-password/route.ts
// Token validation and password reset

import { NextRequest, NextResponse } from 'next/server';
import { parseAndSanitizeBody } from '../../../library/validation';
import { sanitizeEmail, hashPassword, validatePasswordStrength, auditLog } from '../../../library/auth';
import { getConnection } from '../../../library/db';
import { checkRateLimit, getClientIP, RateLimits } from '../../../library/rateLimiter';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  const ip = getClientIP(request);

  // Rate limit
  const rateCheck = checkRateLimit({ ...RateLimits.PASSWORD_RESET, identifier: ip });
  if (!rateCheck.allowed) {
    return NextResponse.json({
      success: false,
      message: `Too many attempts. Try again in ${rateCheck.retryAfterSeconds} seconds.`,
    }, { status: 429 });
  }

  try {
    const body = await parseAndSanitizeBody(request);
    const { token, newPassword, confirmPassword } = body;
    const email = sanitizeEmail(body.email || '');

    if (!token || !email || !newPassword || !confirmPassword) {
      return NextResponse.json({ success: false, message: 'All fields are required' }, { status: 400 });
    }

    if (newPassword !== confirmPassword) {
      return NextResponse.json({ success: false, message: 'Passwords do not match' }, { status: 400 });
    }

    const strength = validatePasswordStrength(newPassword);
    if (!strength.valid) {
      return NextResponse.json({ success: false, message: strength.message }, { status: 400 });
    }

    // Hash the provided token to compare with DB
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    const pool = await getConnection();
    const result = await pool.request()
      .input('Email', email)
      .input('TokenHash', tokenHash)
      .query(`
        SELECT u.UserID, u.FirstName 
        FROM LMS_Users u
        JOIN PasswordResetTokens prt ON u.UserID = prt.UserID
        WHERE u.Email = @Email
          AND prt.TokenHash = @TokenHash
          AND prt.ExpiresAt > GETDATE()
          AND prt.IsUsed = 0
          AND u.IsActive = 1
      `);

    if (result.recordset.length === 0) {
      await auditLog(null, email, 'PASSWORD_RESET_FAILED', 'AUTH', 'Invalid or expired reset token', ip, 'FAILURE');
      return NextResponse.json({
        success: false,
        message: 'Invalid or expired reset link. Please request a new password reset.',
      }, { status: 400 });
    }

    const user = result.recordset[0];
    const newHash = await hashPassword(newPassword);

    // Update password and clear reset token
    await pool.request()
      .input('Hash', newHash)
      .input('UserID', user.UserID)
      .input('TokenHash', tokenHash)
      .query(`
        UPDATE LMS_Users
        SET PasswordHash = @Hash,
            MustChangePassword = 0,
            FailedLoginAttempts = 0,
            LockoutUntil = NULL
        WHERE UserID = @UserID;
        
        UPDATE PasswordResetTokens
        SET IsUsed = 1
        WHERE TokenHash = @TokenHash;
      `);

    await auditLog(user.UserID, email, 'PASSWORD_RESET_SUCCESS', 'AUTH', 'Password reset via email link', ip, 'SUCCESS');

    return NextResponse.json({
      success: true,
      message: 'Password reset successfully. You can now login with your new password.',
    });

  } catch (error: any) {
    console.error('Reset password error:', error);
    return NextResponse.json({ success: false, message: 'Password reset failed. Please try again.' }, { status: 500 });
  }
}
