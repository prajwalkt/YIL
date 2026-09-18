import { NextRequest, NextResponse } from 'next/server';
import { getConnection } from '../../../library/db';
import { sanitizeEmail } from '../../../library/auth';

/**
 * GET /api/auth/check-email?email=...
 * Non-blocking UX helper: check if an email already has an LMS account.
 * Returns { exists: boolean } — does NOT expose any user data.
 * Rate-limiting is handled by the middleware.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const rawEmail = searchParams.get('email') || '';
  const email = sanitizeEmail(rawEmail);

  if (!email) {
    return NextResponse.json({ exists: false });
  }

  try {
    const pool = await getConnection();
    const result = await pool.query(`SELECT 1 FROM LMS_Users WHERE Email = $1`, [email]);

    return NextResponse.json({ exists: result.recordset.length > 0 });
  } catch {
    // On DB error, silently return false — the form continues normally
    return NextResponse.json({ exists: false });
  }
}
