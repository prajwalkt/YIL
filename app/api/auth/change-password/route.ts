import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest, comparePassword, hashPassword, validatePasswordStrength, auditLog, signToken } from '../../../library/auth';
import { getConnection } from '../../../library/db';

export async function POST(request: NextRequest) {
  const user = getUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ success: false, message: 'Authentication required' }, { status: 401 });
  }

  const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';

  try {
    const body = await request.json();
    const { currentPassword, newPassword, confirmPassword } = body;

    if (!currentPassword || !newPassword || !confirmPassword) {
      return NextResponse.json({ success: false, message: 'All fields are required' }, { status: 400 });
    }

    if (newPassword !== confirmPassword) {
      return NextResponse.json({ success: false, message: 'New passwords do not match' }, { status: 400 });
    }

    const strength = validatePasswordStrength(newPassword);
    if (!strength.valid) {
      return NextResponse.json({ success: false, message: strength.message }, { status: 400 });
    }

    if (currentPassword === newPassword) {
      return NextResponse.json({ success: false, message: 'New password must be different from your current password' }, { status: 400 });
    }

    const pool = await getConnection();

    // Fetch current hash
    const result = await pool.request()
      .input('UserID', user.userId)
      .query(`SELECT PasswordHash, Role, FirstName, LastName, Email FROM LMS_Users WHERE UserID = @UserID`);

    if (result.recordset.length === 0) {
      return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
    }

    const dbUser = result.recordset[0];

    // Verify current password
    const isValid = await comparePassword(currentPassword, dbUser.PasswordHash);
    if (!isValid) {
      await auditLog(user.userId, user.email, 'CHANGE_PASSWORD_FAILED', 'AUTH', 'Wrong current password', ip, 'FAILURE');
      return NextResponse.json({ success: false, message: 'Current password is incorrect' }, { status: 400 });
    }

    // Hash and save new password
    const newHash = await hashPassword(newPassword);

    // Generate a new session token (invalidates other devices)
    const newToken = signToken({
      userId: user.userId,
      email: dbUser.Email,
      role: dbUser.Role,
      firstName: dbUser.FirstName,
      lastName: dbUser.LastName,
    });

    try {
      await pool.request()
        .input('Hash', newHash)
        .input('Token', newToken)
        .input('UserID', user.userId)
        .query(`UPDATE LMS_Users SET PasswordHash = @Hash, MustChangePassword = 0, ActiveSessionToken = @Token WHERE UserID = @UserID`);
    } catch {
      // Fallback if ActiveSessionToken column doesn't exist yet
      await pool.request()
        .input('Hash', newHash)
        .input('UserID', user.userId)
        .query(`UPDATE LMS_Users SET PasswordHash = @Hash, MustChangePassword = 0 WHERE UserID = @UserID`);
    }

    await auditLog(user.userId, user.email, 'CHANGE_PASSWORD_SUCCESS', 'AUTH', 'Password changed successfully', ip, 'SUCCESS');

    const response = NextResponse.json({
      success: true,
      message: 'Password changed successfully',
      token: newToken,
      redirectTo: getRedirectByRole(dbUser.Role),
    });

    // Update cookie
    response.cookies.set('auth_token', newToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 8 * 60 * 60,
      path: '/',
    });

    return response;
  } catch (e: any) {
    console.error('Change password error:', e);
    return NextResponse.json({ success: false, message: 'Failed to change password' }, { status: 500 });
  }
}

function getRedirectByRole(role: string): string {
  const redirects: Record<string, string> = {
    ADMIN: '/admin', TRAINER: '/trainer', AFFILIATE: '/affiliate',
    STUDENT: '/student', FINANCE: '/admin?view=finance', TM: '/admin?view=tm',
  };
  return redirects[role] || '/';
}
