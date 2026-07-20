import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest, requireRole } from '../../../../library/auth';
import { getConnection } from '../../../../library/db';

export async function GET(request: NextRequest) {
  const user = getUserFromRequest(request);
  if (!requireRole(user, 'ADMIN')) {
    return NextResponse.json({ success: false, message: 'Access denied' }, { status: 403 });
  }

  try {
    const pool = await getConnection();
    const result = await pool.request().query(`
      SELECT nl.LogID, nl.Type, nl.Channel, nl.Status, nl.ErrorMessage, nl.MessageContent, nl.CreatedAt, 
             u.FirstName, u.LastName, u.Email, u.Role, u.Phone 
      FROM NotificationLog nl
      LEFT JOIN LMS_Users u ON nl.UserID = u.UserID
      ORDER BY nl.CreatedAt DESC
    `);
    
    return NextResponse.json({ success: true, logs: result.recordset });
  } catch (e: any) {
    return NextResponse.json({ success: false, message: e.message }, { status: 500 });
  }
}
