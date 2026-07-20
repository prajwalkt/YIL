import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest, requireRole, sanitizeInput, sanitizeEmail, auditLog } from '../../../library/auth';
import { getConnection } from '../../../library/db';

// GET /api/trainer/students — list students enrolled in trainer's batches (with search/filter)
export async function GET(request: NextRequest) {
  const user = getUserFromRequest(request);
  if (!requireRole(user, 'TRAINER', 'ADMIN')) return NextResponse.json({ success: false, message: 'Access denied' }, { status: 403 });

  try {
    const pool = await getConnection();
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const calendarId = searchParams.get('calendarId') || '';
    const statusFilter = searchParams.get('status') || '';

    const req = pool.request();
    req.input('TrainerID', user!.userId);

    let query = `
      SELECT 
        e.EnrollmentID, e.Status as EnrollmentStatus, e.EnrolledAt, e.ProgressPercent,
        u.UserID, u.FirstName, u.LastName, u.Email, u.Phone, u.Organization, u.Country,
        tc.CalendarID, tc.Title as BatchTitle, tc.StartDate, tc.EndDate, tc.TrainingType, tc.Location,
        c.Title as CourseTitle, c.Code as CourseCode
      FROM Enrollments e
      JOIN LMS_Users u ON e.StudentID = u.UserID
      JOIN TrainingCalendar tc ON e.CalendarID = tc.CalendarID
      JOIN LMS_Courses c ON e.CourseID = c.CourseID
      WHERE tc.TrainerID = @TrainerID
    `;

    if (search) {
      req.input('Search', `%${search}%`);
      query += ` AND (u.FirstName LIKE @Search OR u.LastName LIKE @Search OR u.Email LIKE @Search OR u.Organization LIKE @Search)`;
    }
    if (calendarId) {
      req.input('CalendarID', Number(calendarId));
      query += ` AND e.CalendarID = @CalendarID`;
    }
    if (statusFilter) {
      req.input('StatusFilter', statusFilter);
      query += ` AND e.Status = @StatusFilter`;
    }

    query += ` ORDER BY tc.StartDate DESC, u.FirstName ASC`;
    const result = await req.query(query);

    return NextResponse.json({ success: true, students: result.recordset });
  } catch (e: any) {
    return NextResponse.json({ success: false, message: e.message }, { status: 500 });
  }
}

// POST /api/trainer/students — enroll a student into one of trainer's batches
export async function POST(request: NextRequest) {
  const user = getUserFromRequest(request);
  if (!requireRole(user, 'TRAINER', 'ADMIN')) return NextResponse.json({ success: false, message: 'Access denied' }, { status: 403 });
  const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';

  try {
    const body = await request.json();
    const { studentId, calendarId } = body;

    if (!studentId || !calendarId) {
      return NextResponse.json({ success: false, message: 'studentId and calendarId are required' }, { status: 400 });
    }

    const pool = await getConnection();

    // Verify this calendar entry belongs to this trainer
    const calResult = await pool.request()
      .input('CalendarID', Number(calendarId))
      .input('TrainerID', user!.userId)
      .query(`SELECT CalendarID, CourseID, MaxParticipants, CurrentEnrolled FROM TrainingCalendar WHERE CalendarID = @CalendarID AND TrainerID = @TrainerID`);

    if (calResult.recordset.length === 0) {
      return NextResponse.json({ success: false, message: 'Batch not found or not assigned to you' }, { status: 404 });
    }

    const batch = calResult.recordset[0];
    if (batch.CurrentEnrolled >= batch.MaxParticipants) {
      return NextResponse.json({ success: false, message: 'Batch is full — maximum participants reached' }, { status: 409 });
    }

    // Check if already enrolled
    const existingCheck = await pool.request()
      .input('StudentID', Number(studentId))
      .input('CalendarID', Number(calendarId))
      .query(`SELECT EnrollmentID FROM Enrollments WHERE StudentID = @StudentID AND CalendarID = @CalendarID`);

    if (existingCheck.recordset.length > 0) {
      return NextResponse.json({ success: false, message: 'Student is already enrolled in this batch' }, { status: 409 });
    }

    // Enroll
    await pool.request()
      .input('StudentID', Number(studentId))
      .input('CourseID', batch.CourseID)
      .input('CalendarID', Number(calendarId))
      .query(`
        INSERT INTO Enrollments (StudentID, CourseID, CalendarID, Status, ProgressPercent, EnrolledAt)
        VALUES (@StudentID, @CourseID, @CalendarID, 'ENROLLED', 0, GETDATE())
      `);

    // Update seat count
    await pool.request()
      .input('CalendarID', Number(calendarId))
      .query(`UPDATE TrainingCalendar SET CurrentEnrolled = CurrentEnrolled + 1 WHERE CalendarID = @CalendarID`);

    await auditLog(user!.userId, user!.email, 'STUDENT_ENROLLED', 'TRAINER', `Enrolled student ${studentId} into batch ${calendarId}`, ip);
    return NextResponse.json({ success: true, message: 'Student enrolled successfully' });
  } catch (e: any) {
    return NextResponse.json({ success: false, message: e.message }, { status: 500 });
  }
}

// PUT /api/trainer/students — update student enrollment (progress, status, attendance)
export async function PUT(request: NextRequest) {
  const user = getUserFromRequest(request);
  if (!requireRole(user, 'TRAINER', 'ADMIN')) return NextResponse.json({ success: false, message: 'Access denied' }, { status: 403 });
  const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';

  try {
    const body = await request.json();
    const { enrollmentId, progress, status } = body;

    if (!enrollmentId) {
      return NextResponse.json({ success: false, message: 'enrollmentId is required' }, { status: 400 });
    }

    const pool = await getConnection();

    // Verify this enrollment is within a trainer-owned batch
    const check = await pool.request()
      .input('EnrollmentID', Number(enrollmentId))
      .input('TrainerID', user!.userId)
      .query(`
        SELECT e.EnrollmentID FROM Enrollments e
        JOIN TrainingCalendar tc ON e.CalendarID = tc.CalendarID
        WHERE e.EnrollmentID = @EnrollmentID AND tc.TrainerID = @TrainerID
      `);

    if (check.recordset.length === 0) {
      return NextResponse.json({ success: false, message: 'Enrollment not found or access denied' }, { status: 404 });
    }

    const req = pool.request();
    req.input('EnrollmentID', Number(enrollmentId));
    let setParts: string[] = [];

    if (progress !== undefined) { req.input('Progress', Number(progress)); setParts.push('ProgressPercent = @Progress'); }
    if (status !== undefined) { req.input('Status', sanitizeInput(status)); setParts.push('Status = @Status'); }

    if (setParts.length === 0) {
      return NextResponse.json({ success: false, message: 'Nothing to update' }, { status: 400 });
    }

    await req.query(`UPDATE Enrollments SET ${setParts.join(', ')} WHERE EnrollmentID = @EnrollmentID`);
    await auditLog(user!.userId, user!.email, 'ENROLLMENT_UPDATED', 'TRAINER', `Updated enrollment ${enrollmentId}`, ip);

    return NextResponse.json({ success: true, message: 'Student record updated successfully' });
  } catch (e: any) {
    return NextResponse.json({ success: false, message: e.message }, { status: 500 });
  }
}

// DELETE /api/trainer/students — remove a student from a batch
export async function DELETE(request: NextRequest) {
  const user = getUserFromRequest(request);
  if (!requireRole(user, 'TRAINER', 'ADMIN')) return NextResponse.json({ success: false, message: 'Access denied' }, { status: 403 });
  const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';

  try {
    const { searchParams } = new URL(request.url);
    const enrollmentId = searchParams.get('enrollmentId');

    if (!enrollmentId) {
      return NextResponse.json({ success: false, message: 'enrollmentId is required' }, { status: 400 });
    }

    const pool = await getConnection();

    // Verify ownership
    const check = await pool.request()
      .input('EnrollmentID', Number(enrollmentId))
      .input('TrainerID', user!.userId)
      .query(`
        SELECT e.EnrollmentID, e.CalendarID FROM Enrollments e
        JOIN TrainingCalendar tc ON e.CalendarID = tc.CalendarID
        WHERE e.EnrollmentID = @EnrollmentID AND tc.TrainerID = @TrainerID
      `);

    if (check.recordset.length === 0) {
      return NextResponse.json({ success: false, message: 'Enrollment not found or access denied' }, { status: 404 });
    }

    const calendarId = check.recordset[0].CalendarID;

    await pool.request()
      .input('EnrollmentID', Number(enrollmentId))
      .query(`DELETE FROM Enrollments WHERE EnrollmentID = @EnrollmentID`);

    await pool.request()
      .input('CalendarID', Number(calendarId))
      .query(`UPDATE TrainingCalendar SET CurrentEnrolled = CASE WHEN CurrentEnrolled > 0 THEN CurrentEnrolled - 1 ELSE 0 END WHERE CalendarID = @CalendarID`);

    await auditLog(user!.userId, user!.email, 'STUDENT_REMOVED', 'TRAINER', `Removed enrollment ${enrollmentId}`, ip);
    return NextResponse.json({ success: true, message: 'Student removed from batch' });
  } catch (e: any) {
    return NextResponse.json({ success: false, message: e.message }, { status: 500 });
  }
}
