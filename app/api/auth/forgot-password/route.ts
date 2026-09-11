// app/api/auth/forgot-password/route.ts
// Secure token-based password reset flow

import { NextRequest, NextResponse } from 'next/server';
import { parseAndSanitizeBody } from '../../../library/validation';
import { sanitizeEmail, auditLog } from '../../../library/auth';
import { getConnection } from '../../../library/db';
import { sendEmail } from '../../../library/email';
import { checkRateLimit, getClientIP, RateLimits } from '../../../library/rateLimiter';
import crypto from 'crypto';

const TOKEN_EXPIRY_MINUTES = 30;

export async function POST(request: NextRequest) {
  const ip = getClientIP(request);
  
  // Rate limit: 3 requests per hour per IP
  const rateCheck = checkRateLimit({ ...RateLimits.PASSWORD_RESET, identifier: ip });
  if (!rateCheck.allowed) {
    return NextResponse.json({
      success: false,
      message: `Too many reset requests. Please try again in ${rateCheck.retryAfterSeconds} seconds.`,
    }, { status: 429 });
  }

  try {
    const body = await parseAndSanitizeBody(request);
    const email = sanitizeEmail(body.email || '');

    if (!email) {
      return NextResponse.json({ success: false, message: 'Email address is required' }, { status: 400 });
    }

    const pool = await getConnection();

    // Check if user exists — always return success to prevent email enumeration
    const result = await pool.request()
      .input('Email', email)
      .query(`SELECT UserID, FirstName, IsActive FROM LMS_Users WHERE Email = @Email`);

    // Always respond success to prevent user enumeration attacks
    const successResponse = NextResponse.json({
      success: true,
      message: 'If an account exists with this email, a reset link has been sent.',
    });

    if (result.recordset.length === 0 || !result.recordset[0].IsActive) {
      await auditLog(null, email, 'PASSWORD_RESET_REQUEST', 'AUTH', 'User not found or inactive', ip, 'FAILURE');
      return successResponse;
    }

    const user = result.recordset[0];

    // Generate cryptographically secure token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');
    const expiresAt = new Date(Date.now() + TOKEN_EXPIRY_MINUTES * 60 * 1000);

    // Store token hash in DB (not the raw token)
    try {
      await pool.request()
        .input('UserID', user.UserID)
        .input('TokenHash', tokenHash)
        .input('ExpiresAt', expiresAt)
        .input('IPAddress', ip)
        .query(`
          INSERT INTO PasswordResetTokens (UserID, TokenHash, CreatedAt, ExpiresAt, IsUsed, IPAddress)
          VALUES (@UserID, @TokenHash, GETDATE(), @ExpiresAt, 0, @IPAddress)
        `);
    } catch (err) {
      console.error('Error inserting into PasswordResetTokens:', err);
      return NextResponse.json({ success: false, message: 'An error occurred. Please try again.' }, { status: 500 });
    }

    const appUrl = process.env.APP_URL || 'http://localhost:3000';
    const resetUrl = `${appUrl}/reset-password?token=${resetToken}&email=${encodeURIComponent(email)}`;

    await sendEmail({
      to: email,
      subject: '🔐 Password Reset Request — YTS LMS',
      html: `
        <!DOCTYPE html>
        <html>
        <body style="font-family: Arial, sans-serif; background: #f4f4f4; padding: 20px;">
          <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
            <div style="background: linear-gradient(135deg, #004098, #0060cc); padding: 30px; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 22px;">Password Reset Request</h1>
            </div>
            <div style="padding: 30px;">
              <p>Hello <strong>${user.FirstName}</strong>,</p>
              <p>We received a request to reset your password. Click the button below to set a new password:</p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${resetUrl}" style="background: #004098; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; display: inline-block;">
                  Reset My Password
                </a>
              </div>
              <p style="color: #666; font-size: 13px;">This link will expire in <strong>${TOKEN_EXPIRY_MINUTES} minutes</strong>.</p>
              <p style="color: #666; font-size: 13px;">If you did not request this, please ignore this email. Your password will not be changed.</p>
              <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
              <p style="color: #999; font-size: 11px;">For security, never share this link with anyone. Yokogawa Training Services will never ask for your password.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    await auditLog(user.UserID, email, 'PASSWORD_RESET_REQUEST', 'AUTH', `Reset token issued, expires at ${expiresAt.toISOString()}`, ip, 'SUCCESS');
    return successResponse;

  } catch (error: any) {
    console.error('Forgot password error:', error);
    return NextResponse.json({ success: false, message: 'An error occurred. Please try again.' }, { status: 500 });
  }
}
