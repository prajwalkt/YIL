import { NextRequest, NextResponse } from 'next/server';
import { parseAndSanitizeBody } from '../../../library/validation';
import { getUserFromRequest, requireRole, auditLog } from '../../../library/auth';
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
    return NextResponse.json({ success: false, message: process.env.NODE_ENV === 'development' ? e.message : 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const user = getUserFromRequest(request);
  if (!requireRole(user, 'ADMIN', 'TM')) return NextResponse.json({ success: false, message: 'Access denied' }, { status: 403 });
  const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';

  try {
    const body = await parseAndSanitizeBody(request);
    const { title, code, description, duration, feeINR, feeUSD, mode, status, openDate, closeDate, maxParticipants, category, templateId } = body;
    if (!title || !mode) return NextResponse.json({ success: false, message: 'Title and mode required' }, { status: 400 });

    const validModes = ['CILT','VILT','ELEARNING','SITE'];
    if (!validModes.includes(mode)) return NextResponse.json({ success: false, message: 'Invalid mode' }, { status: 400 });

    const pool = await getConnection();
    await pool.request()
      .input('Title', title).input('Code', code || '')
      .input('Description', description || '').input('Duration', duration || '')
      .input('FeeINR', Number(feeINR) || 0).input('FeeUSD', Number(feeUSD) || 0)
      .input('Mode', mode).input('Status', status || 'ACTIVE')
      .input('OpenDate', openDate || null).input('CloseDate', closeDate || null)
      .input('MaxParticipants', Number(maxParticipants) || 20)
      .input('Category', category || '').input('CreatedBy', user!.userId)
      .input('TemplateID', templateId ? Number(templateId) : null)
      .query(`INSERT INTO LMS_Courses (Title,Code,Description,Duration,FeeINR,FeeUSD,Mode,Status,OpenDate,CloseDate,MaxParticipants,Category,CreatedBy,TemplateID) VALUES (@Title,@Code,@Description,@Duration,@FeeINR,@FeeUSD,@Mode,@Status,@OpenDate,@CloseDate,@MaxParticipants,@Category,@CreatedBy,@TemplateID)`);

    await auditLog(user!.userId, user!.email, 'COURSE_CREATED', 'COURSES', `Created: ${title}`, ip);
    return NextResponse.json({ success: true, message: 'Course created' });
  } catch (e: any) {
    return NextResponse.json({ success: false, message: process.env.NODE_ENV === 'development' ? e.message : 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const user = getUserFromRequest(request);
  if (!requireRole(user, 'ADMIN', 'TM')) return NextResponse.json({ success: false, message: 'Access denied' }, { status: 403 });
  const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';

  try {
    const body = await parseAndSanitizeBody(request);
    const { courseId, title, code, description, duration, feeINR, feeUSD, mode, status, openDate, closeDate, maxParticipants, category, templateId } = body;
    if (!courseId) return NextResponse.json({ success: false, message: 'Course ID required' }, { status: 400 });

    const pool = await getConnection();
    await pool.request()
      .input('CourseID', Number(courseId)).input('Title', title || '')
      .input('Code', code || '').input('Description', description || '')
      .input('Duration', duration || '').input('FeeINR', Number(feeINR) || 0)
      .input('FeeUSD', Number(feeUSD) || 0).input('Mode', mode || 'CILT').input('Status', status || 'ACTIVE')
      .input('OpenDate', openDate || null).input('CloseDate', closeDate || null)
      .input('MaxParticipants', Number(maxParticipants) || 20).input('Category', category || '')
      .input('TemplateID', templateId ? Number(templateId) : null)
      .query(`UPDATE LMS_Courses SET Title=@Title,Code=@Code,Description=@Description,Duration=@Duration,FeeINR=@FeeINR,FeeUSD=@FeeUSD,Mode=@Mode,Status=@Status,OpenDate=@OpenDate,CloseDate=@CloseDate,MaxParticipants=@MaxParticipants,Category=@Category,TemplateID=@TemplateID,UpdatedAt=GETDATE() WHERE CourseID=@CourseID`);

    await auditLog(user!.userId, user!.email, 'COURSE_UPDATED', 'COURSES', `Updated course ${courseId}`, ip);
    return NextResponse.json({ success: true, message: 'Course updated' });
  } catch (e: any) {
    return NextResponse.json({ success: false, message: process.env.NODE_ENV === 'development' ? e.message : 'Internal Server Error' }, { status: 500 });
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
    return NextResponse.json({ success: false, message: process.env.NODE_ENV === 'development' ? e.message : 'Internal Server Error' }, { status: 500 });
  }
}
