import { NextRequest, NextResponse } from 'next/server';
import { parseAndSanitizeBody } from '../../../library/validation';
import { getUserFromRequest, requireRole, auditLog } from '../../../library/auth';
import { getConnection } from '../../../library/db';

export async function GET(request: NextRequest) {
  try {
    const pool = await getConnection();
    const result = await pool.query(`SELECT * FROM OrganizationBranding ORDER BY BrandID DESC LIMIT 1`);
    return NextResponse.json({ success: true, branding: result.recordset[0] || null });
  } catch (e: any) {
    return NextResponse.json({ success: false, message: process.env.NODE_ENV === 'development' ? e.message : 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const user = getUserFromRequest(request);
  if (!requireRole(user, 'ADMIN')) return NextResponse.json({ success: false, message: 'Access denied' }, { status: 403 });
  const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';

  try {
    const data = await parseAndSanitizeBody(request);
    const pool = await getConnection();

    await pool.query(`
        UPDATE OrganizationBranding 
        SET LogoPath = $1,
            PrimaryColor = $2,
            SecondaryColor = $3,
            Theme = $4,
            EmailBranding = $5,
            PortalBranding = $6,
            UpdatedAt = CURRENT_TIMESTAMP,
            UpdatedBy = $7
      `, [data.LogoPath || '/yokogawa_logo.png', data.PrimaryColor || '#005b9f', data.SecondaryColor || '#f2a900', data.Theme || 'light', data.EmailBranding || 'Yokogawa Training Services', data.PortalBranding || 'Yokogawa Training Services LMS', user!.userId]);

    await auditLog(user!.userId, user!.email, 'BRANDING_UPDATED', 'ADMIN', `Updated organization branding`, ip);
    return NextResponse.json({ success: true, message: 'Branding updated successfully' });
  } catch (e: any) {
    return NextResponse.json({ success: false, message: process.env.NODE_ENV === 'development' ? e.message : 'Internal Server Error' }, { status: 500 });
  }
}
