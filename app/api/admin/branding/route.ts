import { NextRequest, NextResponse } from 'next/server';
import { parseAndSanitizeBody } from '../../../library/validation';
import { getUserFromRequest, requireRole, auditLog } from '../../../library/auth';
import { getConnection } from '../../../library/db';

export async function GET(request: NextRequest) {
  try {
    const pool = await getConnection();
    const result = await pool.request().query('SELECT TOP 1 * FROM OrganizationBranding ORDER BY BrandID DESC');
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

    await pool.request()
      .input('LogoPath', data.LogoPath || '/yokogawa_logo.png')
      .input('PrimaryColor', data.PrimaryColor || '#005b9f')
      .input('SecondaryColor', data.SecondaryColor || '#f2a900')
      .input('Theme', data.Theme || 'light')
      .input('EmailBranding', data.EmailBranding || 'Yokogawa Training Services')
      .input('PortalBranding', data.PortalBranding || 'Yokogawa Training Services LMS')
      .input('UpdatedBy', user!.userId)
      .query(`
        UPDATE OrganizationBranding 
        SET LogoPath = @LogoPath,
            PrimaryColor = @PrimaryColor,
            SecondaryColor = @SecondaryColor,
            Theme = @Theme,
            EmailBranding = @EmailBranding,
            PortalBranding = @PortalBranding,
            UpdatedAt = GETDATE(),
            UpdatedBy = @UpdatedBy
      `);

    await auditLog(user!.userId, user!.email, 'BRANDING_UPDATED', 'ADMIN', `Updated organization branding`, ip);
    return NextResponse.json({ success: true, message: 'Branding updated successfully' });
  } catch (e: any) {
    return NextResponse.json({ success: false, message: process.env.NODE_ENV === 'development' ? e.message : 'Internal Server Error' }, { status: 500 });
  }
}
