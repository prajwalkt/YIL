import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest, auditLog } from '../../../library/auth';
import { getConnection } from '../../../library/db';

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';
  const user = getUserFromRequest(request);
  
  if (user) {
    await auditLog(user.userId, user.email, 'LOGOUT', 'AUTH', 'User logged out', ip, 'SUCCESS');
    
    // Invalidate session in DB
    if (user.sessionId) {
      try {

        const pool = await getConnection();
        await pool.query(`
            UPDATE LMS_Sessions SET IsActive = 0 WHERE SessionID = $1;
            UPDATE LMS_Users SET ActiveSessionToken = NULL WHERE UserID = $2 AND ActiveSessionToken = $3;
          `, [user.sessionId, user.userId, user.sessionId]);
      } catch (err) {
        console.warn('Failed to invalidate session:', err);
      }
    }
  }

  const response = NextResponse.json({ success: true, message: 'Logged out successfully' });
  
  // Clear auth cookie
  response.cookies.set('auth_token', '', {
    httpOnly: true,
    secure: request.headers.get('x-forwarded-proto') === 'https' || request.nextUrl.protocol === 'https:',
    sameSite: 'strict',
    maxAge: 0,
    path: '/',
    expires: new Date(0),
  });

  return response;
}

export async function GET(request: NextRequest) {
  return POST(request);
}
