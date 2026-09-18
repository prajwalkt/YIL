import { NextRequest, NextResponse } from 'next/server';
import { parseAndSanitizeBody } from '../../../library/validation';
import { getUserFromRequest, requireRole, auditLog } from '../../../library/auth';
import { getConnection } from '../../../library/db';

export async function GET(request: NextRequest) {
  const user = getUserFromRequest(request);
  if (!requireRole(user, 'ADMIN')) return NextResponse.json({ success: false, message: 'Access denied' }, { status: 403 });

  try {
    const pool = await getConnection();
    const result = await pool.query(`SELECT SettingKey, SettingValue, Description FROM SystemSettings`);
    return NextResponse.json({ success: true, settings: result.recordset });
  } catch (e: any) {
    return NextResponse.json({ success: false, message: process.env.NODE_ENV === 'development' ? e.message : 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const user = getUserFromRequest(request);
  if (!requireRole(user, 'ADMIN')) return NextResponse.json({ success: false, message: 'Access denied' }, { status: 403 });
  const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';

  try {
    const { settings } = await parseAndSanitizeBody(request);
    if (!settings || typeof settings !== 'object') {
      return NextResponse.json({ success: false, message: 'Invalid payload' }, { status: 400 });
    }

    const pool = await getConnection();
    const transaction = pool.transaction();
    await transaction.begin();

    try {
      for (const key of Object.keys(settings)) {
        await transaction.query(`
            UPDATE SystemSettings 
            SET SettingValue = $1 
            WHERE SettingKey = $2
          `, [String(settings[key]), key]);
      }
      await transaction.commit();
      await auditLog(user!.userId, user!.email, 'SETTINGS_UPDATED', 'ADMIN', `Updated ${Object.keys(settings).length} settings`, ip);
      return NextResponse.json({ success: true, message: 'Settings updated successfully' });
    } catch (e) {
      await transaction.rollback();
      throw e;
    }
  } catch (e: any) {
    return NextResponse.json({ success: false, message: process.env.NODE_ENV === 'development' ? e.message : 'Internal Server Error' }, { status: 500 });
  }
}
