import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest, requireRole } from '../../../../library/auth';
import { getConnection } from '../../../../library/db';

export async function GET(request: NextRequest) {
  const user = getUserFromRequest(request);
  if (!requireRole(user, 'ADMIN', 'TM')) return NextResponse.json({ success: false, message: 'Access denied' }, { status: 403 });

  try {
    const pool = await getConnection();
    const result = await pool.query(`SELECT TemplateID, Name, Description FROM VMTemplates ORDER BY Name ASC`);
    return NextResponse.json({ success: true, templates: result.recordset });
  } catch (e: any) {
    return NextResponse.json({ success: false, message: process.env.NODE_ENV === 'development' ? e.message : 'Internal Server Error' }, { status: 500 });
  }
}
