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
      const limitCheck = await pool.query(`
          SELECT COUNT(*) as Count 
          FROM TrainingCalendar 
          WHERE (TrainingType = 'Offline Training' OR TrainingType = 'OFFLINE' OR TrainingType = 'SITE')
            AND DATEPART(iso_week, StartDate) = DATEPART(iso_week, CAST($1 AS DATE))
            AND YEAR(StartDate) = YEAR(CAST($2 AS DATE))
        `, [startDate, startDate]);
      if (limitCheck.recordset[0].Count >= 9) {
        return NextResponse.json({ success: false, message: 'Maximum 9 offline/site training slots allowed per week.' }, { status: 400 });
      }
    }

    if (trainerId || trainerName) {
      const lockCheck = await pool.query(`
          SELECT COUNT(*) as Count 
          FROM TrainingCalendar 
          WHERE (
            (TrainerID IS NOT NULL AND TrainerID = $1) 
            OR (TrainerName != '' AND TrainerName = $2)
          )
          AND (StartDate <= $3 AND EndDate >= $4)
        `, [trainerId || null, trainerName || '', endDate, startDate]);
      if (lockCheck.recordset[0].Count > 0) {
        return NextResponse.json({ success: false, message: 'Trainer is already booked for these dates (Calendar Lock).' }, { status: 400 });
      }
    }

    await pool.query(`INSERT INTO TrainingCalendar (CourseID,Title,TrainingType,StartDate,EndDate,TrainerID,TrainerName,Location,MaxParticipants,Notes) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`, [courseId || null, title, trainingType, startDate, endDate, trainerId || null, trainerName || '', location || '', Number(maxParticipants) || 20, notes || '']);

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
      await pool.query(`UPDATE TrainingCalendar SET TMConfirmed=1, TMConfirmedAt=CURRENT_TIMESTAMP, TMConfirmedBy=$1 WHERE CalendarID=$2`, [user!.userId, Number(calendarId)]);
      await auditLog(user!.userId, user!.email, 'CALENDAR_TM_CONFIRMED', 'CALENDAR', `TM confirmed slot ${calendarId}`, ip);
      return NextResponse.json({ success: true, message: 'Slot confirmed by Training Manager' });
    }

    // ── TM REOPEN: Unconfirm slot (TM only) ──
    if (action === 'TM_REOPEN') {
      if (!requireRole(user, 'TM')) return NextResponse.json({ success: false, message: 'Only TM can reopen slots' }, { status: 403 });
      await pool.query(`UPDATE TrainingCalendar SET TMConfirmed=0, TMConfirmedAt=NULL, TMConfirmedBy=NULL WHERE CalendarID=$1`, [Number(calendarId)]);
      await auditLog(user!.userId, user!.email, 'CALENDAR_TM_REOPENED', 'CALENDAR', `TM re-opened slot ${calendarId}`, ip);
      return NextResponse.json({ success: true, message: 'Slot re-opened by Training Manager' });
    }

    // ── CHANGE_SLOT: TM reassigns an enrollment to a different slot ──
    if (action === 'CHANGE_SLOT' && enrollmentId) {
      if (!requireRole(user, 'TM', 'ADMIN')) return NextResponse.json({ success: false, message: 'Only TM/Admin can change slots' }, { status: 403 });
      await pool.query(`UPDATE Enrollments SET CalendarID=$1 WHERE EnrollmentID=$2`, [Number(calendarId), Number(enrollmentId)]);
      await auditLog(user!.userId, user!.email, 'ENROLLMENT_SLOT_CHANGED', 'CALENDAR', `Enrollment ${enrollmentId} moved to slot ${calendarId}`, ip);
      return NextResponse.json({ success: true, message: 'Student slot updated' });
    }

    // ── Standard Edit ── Check if TMConfirmed (Admin cannot edit)
    if (user!.role === 'ADMIN') {
      const check = await pool.query(`SELECT COALESCE(TMConfirmed, 0) as TMConfirmed FROM TrainingCalendar WHERE CalendarID=$1`, [Number(calendarId)]);
      if (check.recordset.length > 0 && check.recordset[0].TMConfirmed === true) {
        return NextResponse.json({ success: false, message: 'This slot is confirmed by TM and cannot be edited by Admin. Contact the Training Manager to re-open it.' }, { status: 403 });
      }
    }

    await pool.query(`UPDATE TrainingCalendar SET Title=$1,TrainingType=$2,StartDate=$3,EndDate=$4,TrainerID=$5,TrainerName=$6,Location=$7,MaxParticipants=$8,Status=$9,Notes=$10 WHERE CalendarID=$11`, [title || '', trainingType, startDate, endDate, trainerId || null, trainerName || '', location || '', Number(maxParticipants) || 20, status || 'SCHEDULED', notes || '', Number(calendarId)]);

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
    await pool.query(`UPDATE TrainingCalendar SET Status='CANCELLED' WHERE CalendarID=$1`, [Number(calendarId)]);
    await auditLog(user!.userId, user!.email, 'CALENDAR_DELETED', 'CALENDAR', `Cancelled calendar ${calendarId}`, ip);
    return NextResponse.json({ success: true, message: 'Training cancelled' });
  } catch (e: any) {
    return NextResponse.json({ success: false, message: process.env.NODE_ENV === 'development' ? e.message : 'Internal Server Error' }, { status: 500 });
  }
}
