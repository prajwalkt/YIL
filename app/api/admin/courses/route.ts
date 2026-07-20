import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest, requireRole, sanitizeInput, auditLog } from '../../../library/auth';
import { getConnection } from '../../../library/db';

export async function GET(request: NextRequest) {
  const user = getUserFromRequest(request);
  if (!user) return NextResponse.json({ success: false, message: 'Auth required' }, { status: 401 });

  try {
    const pool = await getConnection();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const mode = searchParams.get('mode');
    const search = searchParams.get('search');

    let query = `SELECT * FROM LMS_Courses WHERE 1=1`;
    const inputs: Record<string, string> = {};

    if (status) { query += ` AND Status = @Status`; inputs['Status'] = status; }
    if (mode) { query += ` AND Mode = @Mode`; inputs['Mode'] = mode; }
    if (search) { query += ` AND (Title LIKE @Search OR Code LIKE @Search OR Category LIKE @Search)`; inputs['Search'] = `%${search}%`; }
    query += ` ORDER BY CreatedAt DESC`;

    const req = pool.request();
    Object.entries(inputs).forEach(([k, v]) => req.input(k, v));
    const result = await req.query(query);
    return NextResponse.json({ success: true, courses: result.recordset });
  } catch (e: any) {
    return NextResponse.json({ success: false, message: e.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const user = getUserFromRequest(request);
  if (!requireRole(user, 'ADMIN', 'TM')) return NextResponse.json({ success: false, message: 'Access denied' }, { status: 403 });
  const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';

  try {
    const body = await request.json();
    const { title, code, description, duration, feeINR, feeUSD, mode, status, openDate, closeDate, maxParticipants, category } = body;
    if (!title || !mode) return NextResponse.json({ success: false, message: 'Title and mode required' }, { status: 400 });

    const validModes = ['CILT','VILT','ELEARNING','SITE'];
    if (!validModes.includes(mode)) return NextResponse.json({ success: false, message: 'Invalid mode' }, { status: 400 });

    const pool = await getConnection();
    await pool.request()
      .input('Title', sanitizeInput(title)).input('Code', sanitizeInput(code || ''))
      .input('Description', sanitizeInput(description || '')).input('Duration', sanitizeInput(duration || ''))
      .input('FeeINR', Number(feeINR) || 0).input('FeeUSD', Number(feeUSD) || 0)
      .input('Mode', mode).input('Status', status || 'ACTIVE')
      .input('OpenDate', openDate || null).input('CloseDate', closeDate || null)
      .input('MaxParticipants', Number(maxParticipants) || 20)
      .input('Category', sanitizeInput(category || '')).input('CreatedBy', user!.userId)
      .query(`INSERT INTO LMS_Courses (Title,Code,Description,Duration,FeeINR,FeeUSD,Mode,Status,OpenDate,CloseDate,MaxParticipants,Category,CreatedBy) VALUES (@Title,@Code,@Description,@Duration,@FeeINR,@FeeUSD,@Mode,@Status,@OpenDate,@CloseDate,@MaxParticipants,@Category,@CreatedBy)`);

    await auditLog(user!.userId, user!.email, 'COURSE_CREATED', 'COURSES', `Created: ${title}`, ip);
    return NextResponse.json({ success: true, message: 'Course created' });
  } catch (e: any) {
    return NextResponse.json({ success: false, message: e.message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const user = getUserFromRequest(request);
  if (!requireRole(user, 'ADMIN', 'TM')) return NextResponse.json({ success: false, message: 'Access denied' }, { status: 403 });
  const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';

  try {
    const body = await request.json();
    const { courseId, title, code, description, duration, feeINR, feeUSD, mode, status, openDate, closeDate, maxParticipants, category } = body;
    if (!courseId) return NextResponse.json({ success: false, message: 'Course ID required' }, { status: 400 });

    const pool = await getConnection();
    await pool.request()
      .input('CourseID', Number(courseId)).input('Title', sanitizeInput(title || ''))
      .input('Code', sanitizeInput(code || '')).input('Description', sanitizeInput(description || ''))
      .input('Duration', sanitizeInput(duration || '')).input('FeeINR', Number(feeINR) || 0)
      .input('FeeUSD', Number(feeUSD) || 0).input('Mode', mode || 'CILT').input('Status', status || 'ACTIVE')
      .input('OpenDate', openDate || null).input('CloseDate', closeDate || null)
      .input('MaxParticipants', Number(maxParticipants) || 20).input('Category', sanitizeInput(category || ''))
      .query(`UPDATE LMS_Courses SET Title=@Title,Code=@Code,Description=@Description,Duration=@Duration,FeeINR=@FeeINR,FeeUSD=@FeeUSD,Mode=@Mode,Status=@Status,OpenDate=@OpenDate,CloseDate=@CloseDate,MaxParticipants=@MaxParticipants,Category=@Category,UpdatedAt=GETDATE() WHERE CourseID=@CourseID`);

    await auditLog(user!.userId, user!.email, 'COURSE_UPDATED', 'COURSES', `Updated course ${courseId}`, ip);
    return NextResponse.json({ success: true, message: 'Course updated' });
  } catch (e: any) {
    return NextResponse.json({ success: false, message: e.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const user = getUserFromRequest(request);
  if (!requireRole(user, 'ADMIN')) return NextResponse.json({ success: false, message: 'Access denied' }, { status: 403 });
  const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';

  try {
    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get('id');
    if (!courseId) return NextResponse.json({ success: false, message: 'Course ID required' }, { status: 400 });

    const pool = await getConnection();
    await pool.request().input('CourseID', Number(courseId)).query(`UPDATE LMS_Courses SET Status='INACTIVE',UpdatedAt=GETDATE() WHERE CourseID=@CourseID`);
    await auditLog(user!.userId, user!.email, 'COURSE_DELETED', 'COURSES', `Deactivated course ${courseId}`, ip);
    return NextResponse.json({ success: true, message: 'Course deactivated' });
  } catch (e: any) {
    return NextResponse.json({ success: false, message: e.message }, { status: 500 });
  }
}
