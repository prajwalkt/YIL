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
    const upcoming = searchParams.get('upcoming'); // next 3 months

    let query = `
      SELECT tc.*, c.Title as CourseTitle, c.Code as CourseCode,
             u.FirstName + ' ' + u.LastName as TrainerFullName
      FROM TrainingCalendar tc
      LEFT JOIN LMS_Courses c ON tc.CourseID = c.CourseID
      LEFT JOIN LMS_Users u ON tc.TrainerID = u.UserID
      WHERE 1=1
    `;

    if (upcoming === '1') {
      query += ` AND tc.StartDate >= CAST(GETDATE() AS DATE) AND tc.StartDate <= DATEADD(MONTH, 3, CAST(GETDATE() AS DATE))`;
    }
    query += ` ORDER BY tc.StartDate ASC`;

    const result = await pool.request().query(query);
    return NextResponse.json({ success: true, calendar: result.recordset });
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
    const { courseId, title, trainingType, startDate, endDate, trainerId, trainerName, location, maxParticipants, notes } = body;

    if (!title || !trainingType || !startDate || !endDate) {
      return NextResponse.json({ success: false, message: 'Title, type, start date, end date required' }, { status: 400 });
    }

    const pool = await getConnection();

    if (trainingType === 'Offline Training' || trainingType === 'OFFLINE' || trainingType === 'SITE') {
      const limitCheck = await pool.request()
        .input('StartDate', startDate)
        .query(`
          SELECT COUNT(*) as Count 
          FROM TrainingCalendar 
          WHERE (TrainingType = 'Offline Training' OR TrainingType = 'OFFLINE' OR TrainingType = 'SITE')
            AND DATEPART(iso_week, StartDate) = DATEPART(iso_week, CAST(@StartDate AS DATE))
            AND YEAR(StartDate) = YEAR(CAST(@StartDate AS DATE))
        `);
      if (limitCheck.recordset[0].Count >= 9) {
        return NextResponse.json({ success: false, message: 'Maximum 9 offline/site training slots allowed per week.' }, { status: 400 });
      }
    }

    if (trainerId || trainerName) {
      const lockCheck = await pool.request()
        .input('StartDate', startDate)
        .input('EndDate', endDate)
        .input('TrainerID', trainerId || null)
        .input('TrainerName', trainerName || '')
        .query(`
          SELECT COUNT(*) as Count 
          FROM TrainingCalendar 
          WHERE (
            (TrainerID IS NOT NULL AND TrainerID = @TrainerID) 
            OR (TrainerName != '' AND TrainerName = @TrainerName)
          )
          AND (StartDate <= @EndDate AND EndDate >= @StartDate)
        `);
      if (lockCheck.recordset[0].Count > 0) {
        return NextResponse.json({ success: false, message: 'Trainer is already booked for these dates (Calendar Lock).' }, { status: 400 });
      }
    }

    await pool.request()
      .input('CourseID', courseId || null).input('Title', title)
      .input('TrainingType', trainingType).input('StartDate', startDate).input('EndDate', endDate)
      .input('TrainerID', trainerId || null).input('TrainerName', trainerName || '')
      .input('Location', location || '').input('MaxParticipants', Number(maxParticipants) || 20)
      .input('Notes', notes || '')
      .query(`INSERT INTO TrainingCalendar (CourseID,Title,TrainingType,StartDate,EndDate,TrainerID,TrainerName,Location,MaxParticipants,Notes) VALUES (@CourseID,@Title,@TrainingType,@StartDate,@EndDate,@TrainerID,@TrainerName,@Location,@MaxParticipants,@Notes)`);

    await auditLog(user!.userId, user!.email, 'CALENDAR_CREATED', 'CALENDAR', `Created: ${title} on ${startDate}`, ip);
    return NextResponse.json({ success: true, message: 'Training scheduled' });
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
    const { calendarId, action, title, trainingType, startDate, endDate, trainerId, trainerName, location, maxParticipants, status, notes, enrollmentId } = body;
    if (!calendarId) return NextResponse.json({ success: false, message: 'Calendar ID required' }, { status: 400 });

    const pool = await getConnection();

    // ── TM CONFIRM: Lock the slot ──
    if (action === 'TM_CONFIRM') {
      if (!requireRole(user, 'TM', 'ADMIN')) return NextResponse.json({ success: false, message: 'Only TM can confirm slots' }, { status: 403 });
      await pool.request()
        .input('CalendarID', Number(calendarId))
        .input('ConfirmedBy', user!.userId)
        .query(`UPDATE TrainingCalendar SET TMConfirmed=1, TMConfirmedAt=GETDATE(), TMConfirmedBy=@ConfirmedBy WHERE CalendarID=@CalendarID`);
      await auditLog(user!.userId, user!.email, 'CALENDAR_TM_CONFIRMED', 'CALENDAR', `TM confirmed slot ${calendarId}`, ip);
      return NextResponse.json({ success: true, message: 'Slot confirmed by Training Manager' });
    }

    // ── TM REOPEN: Unconfirm slot (TM only) ──
    if (action === 'TM_REOPEN') {
      if (!requireRole(user, 'TM')) return NextResponse.json({ success: false, message: 'Only TM can reopen slots' }, { status: 403 });
      await pool.request()
        .input('CalendarID', Number(calendarId))
        .query(`UPDATE TrainingCalendar SET TMConfirmed=0, TMConfirmedAt=NULL, TMConfirmedBy=NULL WHERE CalendarID=@CalendarID`);
      await auditLog(user!.userId, user!.email, 'CALENDAR_TM_REOPENED', 'CALENDAR', `TM re-opened slot ${calendarId}`, ip);
      return NextResponse.json({ success: true, message: 'Slot re-opened by Training Manager' });
    }

    // ── CHANGE_SLOT: TM reassigns an enrollment to a different slot ──
    if (action === 'CHANGE_SLOT' && enrollmentId) {
      if (!requireRole(user, 'TM', 'ADMIN')) return NextResponse.json({ success: false, message: 'Only TM/Admin can change slots' }, { status: 403 });
      await pool.request()
        .input('CalendarID', Number(calendarId))
        .input('EnrollmentID', Number(enrollmentId))
        .query(`UPDATE Enrollments SET CalendarID=@CalendarID WHERE EnrollmentID=@EnrollmentID`);
      await auditLog(user!.userId, user!.email, 'ENROLLMENT_SLOT_CHANGED', 'CALENDAR', `Enrollment ${enrollmentId} moved to slot ${calendarId}`, ip);
      return NextResponse.json({ success: true, message: 'Student slot updated' });
    }

    // ── Standard Edit ── Check if TMConfirmed (Admin cannot edit)
    if (user!.role === 'ADMIN') {
      const check = await pool.request()
        .input('CalendarID', Number(calendarId))
        .query(`SELECT ISNULL(TMConfirmed, 0) as TMConfirmed FROM TrainingCalendar WHERE CalendarID=@CalendarID`);
      if (check.recordset.length > 0 && check.recordset[0].TMConfirmed === true) {
        return NextResponse.json({ success: false, message: 'This slot is confirmed by TM and cannot be edited by Admin. Contact the Training Manager to re-open it.' }, { status: 403 });
      }
    }

    await pool.request()
      .input('CalendarID', Number(calendarId)).input('Title', title || '')
      .input('TrainingType', trainingType).input('StartDate', startDate).input('EndDate', endDate)
      .input('TrainerID', trainerId || null).input('TrainerName', trainerName || '')
      .input('Location', location || '').input('MaxParticipants', Number(maxParticipants) || 20)
      .input('Status', status || 'SCHEDULED').input('Notes', notes || '')
      .query(`UPDATE TrainingCalendar SET Title=@Title,TrainingType=@TrainingType,StartDate=@StartDate,EndDate=@EndDate,TrainerID=@TrainerID,TrainerName=@TrainerName,Location=@Location,MaxParticipants=@MaxParticipants,Status=@Status,Notes=@Notes WHERE CalendarID=@CalendarID`);

    await auditLog(user!.userId, user!.email, 'CALENDAR_UPDATED', 'CALENDAR', `Updated calendar ${calendarId}`, ip);
    return NextResponse.json({ success: true, message: 'Calendar updated' });
  } catch (e: any) {
    return NextResponse.json({ success: false, message: process.env.NODE_ENV === 'development' ? e.message : 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const user = getUserFromRequest(request);
  if (!requireRole(user, 'ADMIN', 'TM')) return NextResponse.json({ success: false, message: 'Access denied' }, { status: 403 });
  const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';

  try {
    const { searchParams } = new URL(request.url);
    const calendarId = searchParams.get('id');
    if (!calendarId) return NextResponse.json({ success: false, message: 'Calendar ID required' }, { status: 400 });

    const pool = await getConnection();
    await pool.request().input('CalendarID', Number(calendarId)).query(`UPDATE TrainingCalendar SET Status='CANCELLED' WHERE CalendarID=@CalendarID`);
    await auditLog(user!.userId, user!.email, 'CALENDAR_DELETED', 'CALENDAR', `Cancelled calendar ${calendarId}`, ip);
    return NextResponse.json({ success: true, message: 'Training cancelled' });
  } catch (e: any) {
    return NextResponse.json({ success: false, message: process.env.NODE_ENV === 'development' ? e.message : 'Internal Server Error' }, { status: 500 });
  }
}
