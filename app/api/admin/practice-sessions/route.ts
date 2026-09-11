import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest, requireRole } from '../../../library/auth';
import { getConnection } from '../../../library/db';

export async function GET(request: NextRequest) {
  const user = getUserFromRequest(request);
  if (!requireRole(user, 'ADMIN', 'TM')) return NextResponse.json({ success: false, message: 'Access denied' }, { status: 403 });

  try {
    const pool = await getConnection();
    const result = await pool.request().query(`
      SELECT 
        s.SessionID, s.StartedAt, s.ExpiresAt, s.Status,
        u.Email as UserEmail,
        c.Title as CourseTitle,
        v.InstanceName as VMName
      FROM VMSessions s
      JOIN LMS_Users u ON s.UserID = u.UserID
      JOIN LMS_Courses c ON s.CourseID = c.CourseID
      JOIN VMInstances v ON s.VMID = v.VMID
      WHERE s.Status = 'ACTIVE' OR s.Status = 'ERROR'
      ORDER BY s.StartedAt DESC
    `);
    
    return NextResponse.json({ success: true, sessions: result.recordset });
  } catch (e: any) {
    return NextResponse.json({ success: false, message: process.env.NODE_ENV === 'development' ? e.message : 'Internal Server Error' }, { status: 500 });
  }
}
