import { NextRequest, NextResponse } from 'next/server';
import { parseAndSanitizeBody } from '../../../library/validation';
import { getUserFromRequest, requireRole, auditLog } from '../../../library/auth';
import { getConnection } from '../../../library/db';

export async function GET(request: NextRequest) {
  const user = getUserFromRequest(request);
  if (!user) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  
  // Admins see all, others see active ones targeted at 'ALL' or their specific Role
  const url = new URL(request.url);
  const target = url.searchParams.get('target');

  try {
    const pool = await getConnection();
    let query = `
      SELECT a.*, u.FirstName + ' ' + u.LastName as CreatorName 
      FROM Announcements a 
      JOIN LMS_Users u ON a.CreatedBy = u.UserID 
    `;
    
    if (user.role === 'ADMIN') {
      if (target) query += ` WHERE a.TargetAudience = @Target `;
      query += ` ORDER BY a.CreatedAt DESC`;
      const req = pool.request();
      if (target) req.input('Target', target);
      const res = await req.query(query);
      return NextResponse.json({ success: true, announcements: res.recordset });
    } else {
      query += ` WHERE a.IsActive = 1 AND a.TargetAudience IN ('ALL', @UserRole) ORDER BY a.CreatedAt DESC`;
      const res = await pool.request().input('UserRole', user.role).query(query);
      return NextResponse.json({ success: true, announcements: res.recordset });
    }
  } catch (e: any) {
    return NextResponse.json({ success: false, message: process.env.NODE_ENV === 'development' ? e.message : 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const user = getUserFromRequest(request);
  if (!requireRole(user, 'ADMIN', 'TM')) return NextResponse.json({ success: false, message: 'Access denied' }, { status: 403 });
  const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';

  try {
    const { title, body, targetAudience } = await parseAndSanitizeBody(request);
    if (!title || !body) return NextResponse.json({ success: false, message: 'Title and body are required' }, { status: 400 });

    const pool = await getConnection();
    await pool.query(`
        INSERT INTO Announcements (Title, Body, TargetAudience, CreatedBy) 
        VALUES ($1, $2, $3, $4)
      `, [title, body, targetAudience || 'ALL', user!.userId]);
      
    await auditLog(user!.userId, user!.email, 'ANNOUNCEMENT_CREATED', 'COMMUNICATION', `Created announcement: ${title}`, ip);
    return NextResponse.json({ success: true, message: 'Announcement broadcasted successfully' });
  } catch (e: any) {
    return NextResponse.json({ success: false, message: process.env.NODE_ENV === 'development' ? e.message : 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const user = getUserFromRequest(request);
  if (!requireRole(user, 'ADMIN', 'TM')) return NextResponse.json({ success: false, message: 'Access denied' }, { status: 403 });
  
  const url = new URL(request.url);
  const id = url.searchParams.get('id');
  if (!id) return NextResponse.json({ success: false, message: 'Missing announcement ID' }, { status: 400 });

  try {
    const pool = await getConnection();
    await pool.query(`DELETE FROM Announcements WHERE AnnouncementID = $1`, [id]);
    return NextResponse.json({ success: true, message: 'Announcement deleted' });
  } catch (e: any) {
    return NextResponse.json({ success: false, message: process.env.NODE_ENV === 'development' ? e.message : 'Internal Server Error' }, { status: 500 });
  }
}
