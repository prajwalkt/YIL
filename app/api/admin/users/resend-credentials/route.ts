import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest, requireRole, auditLog } from '../../../../library/auth';
import { getConnection } from '../../../../library/db';
import { sendMultiChannelNotification } from '../../../../library/notificationService';
import bcrypt from 'bcryptjs';

// ── Utility: Generate secure temporary password ──
function generateTempPassword(): string {
  const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const lower = 'abcdefghjkmnpqrstuvwxyz';
  const digits = '23456789';
  const special = '@#$!%*?&';
  let password = '';
  password += upper[Math.floor(Math.random() * upper.length)];
  password += lower[Math.floor(Math.random() * lower.length)];
  password += digits[Math.floor(Math.random() * digits.length)];
  password += special[Math.floor(Math.random() * special.length)];
  for (let i = 0; i < 8; i++) {
    const all = upper + lower + digits + special;
    password += all[Math.floor(Math.random() * all.length)];
  }
  return password.split('').sort(() => 0.5 - Math.random()).join('');
}

export async function POST(request: NextRequest) {
  const adminUser = getUserFromRequest(request);
  if (!requireRole(adminUser, 'ADMIN')) {
    return NextResponse.json({ success: false, message: 'Access denied' }, { status: 403 });
  }

  const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';

  try {
    const { userId } = await request.json();
    if (!userId) {
      return NextResponse.json({ success: false, message: 'User ID required' }, { status: 400 });
    }

    const pool = await getConnection();
    const userResult = await pool.request().input('UserID', userId).query(`
      SELECT UserID, Email, FirstName, LastName, Phone FROM LMS_Users WHERE UserID = @UserID
    `);

    if (userResult.recordset.length === 0) {
      return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
    }

    const targetUser = userResult.recordset[0];
    const tempPassword = generateTempPassword();
    const hash = await bcrypt.hash(tempPassword, 12);

    // Update the database to store the new hash and enforce a password change
    await pool.request()
      .input('Hash', hash)
      .input('UserID', userId)
      .query(`
        UPDATE LMS_Users 
        SET PasswordHash = @Hash, 
            MustChangePassword = 1, 
            IsActive = 1 
        WHERE UserID = @UserID
      `);

    // Prepare content for multi-channel notification
    const loginUrl = process.env.APP_URL || 'http://localhost:3000/login';
    const fullName = `${targetUser.FirstName} ${targetUser.LastName}`.trim();
    
    const htmlBody = `
      <h3>Login Credentials Reset</h3>
      <p>Dear ${fullName},</p>
      <p>An administrator has reset your YTS Portal login credentials.</p>
      <p><strong>Portal URL:</strong> ${loginUrl}</p>
      <p><strong>Username:</strong> ${targetUser.Email}</p>
      <p><strong>Temporary Password:</strong> ${tempPassword}</p>
      <p><em>⚠️ You will be required to change your password on your next login.</em></p>
    `;
    const textBody = `Hi ${fullName}, your YTS Portal credentials have been reset. Login at ${loginUrl} with username ${targetUser.Email} and temporary password: ${tempPassword}. You must change your password upon logging in.`;

    await sendMultiChannelNotification({
      userId: targetUser.UserID,
      email: targetUser.Email,
      phone: targetUser.Phone,
      type: 'RESEND_CREDENTIALS',
      subject: '🔐 Your YTS Account Credentials Have Been Reset',
      html: htmlBody,
      text: textBody,
    });

    await auditLog(adminUser!.userId, adminUser!.email, 'RESEND_CREDENTIALS', 'USERS', `Resent credentials to user ${userId}`, ip);

    return NextResponse.json({ success: true, message: 'Credentials reset and resent successfully via configured channels' });
  } catch (e: any) {
    console.error('Resend credentials failed:', e);
    return NextResponse.json({ success: false, message: e.message }, { status: 500 });
  }
}
