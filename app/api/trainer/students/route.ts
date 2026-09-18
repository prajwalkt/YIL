import { NextRequest, NextResponse } from 'next/server';
import { parseAndSanitizeBody } from '../../../library/validation';
import { getUserFromRequest, requireRole, sanitizeEmail, auditLog } from '../../../library/auth';
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

    const values: any[] = [user!.userId];
    let query = `
      SELECT 
        e.EnrollmentID, e.Status as EnrollmentStatus, e.EnrolledAt, e.ProgressPercent,
        u.UserID, u.FirstName, u.LastName, u.Email, u.Phone, u.Organization, u.Country,
        tc.CalendarID, tc.Title as BatchTitle, tc.StartDate, tc.EndDate, tc.TrainingType, tc.Location,
        c.CourseID, c.Title as CourseTitle, c.Code as CourseCode
      FROM Enrollments e
      JOIN LMS_Users u ON e.StudentID = u.UserID
      JOIN TrainingCalendar tc ON e.CalendarID = tc.CalendarID
      JOIN LMS_Courses c ON e.CourseID = c.CourseID
      WHERE tc.TrainerID = $1
    `;

    if (search) {
      values.push(`%${search}%`);
      query += ` AND (u.FirstName LIKE $${values.length} OR u.LastName LIKE $${values.length} OR u.Email LIKE $${values.length} OR u.Organization LIKE $${values.length})`;
    }
    if (calendarId) {
      values.push(Number(calendarId));
      query += ` AND e.CalendarID = $${values.length}`;
    }
    if (statusFilter) {
      values.push(statusFilter);
      query += ` AND e.Status = $${values.length}`;
    }

    query += ` ORDER BY tc.StartDate DESC, u.FirstName ASC`;
    const result = await pool.query(query, values);

    // Enrich with PDF links
    const enriched = await Promise.all(result.recordset.map(async (student: any) => {
      // Get Registration ID for Registration PDF
      const reg = await pool.query(`SELECT Id FROM Registrations WHERE LinkedUserID = $1 AND Course = $2 ORDER BY CreatedAt DESC LIMIT 1`, [student.UserID, student.CourseTitle]);
      
      const regId = reg.recordset.length > 0 ? reg.recordset[0].Id : null;
      const regPdf = regId ? `/uploads/registrations/Registration_${student.UserID}_${regId}.pdf` : null;

      // Get Assessment Result ID
      const ar = await pool.query(`
          SELECT ar.ResultID 
          FROM AssessmentResults ar
          JOIN Assessments a ON ar.AssessmentID = a.AssessmentID
          WHERE ar.StudentID = $1 AND a.CourseID = $2
          ORDER BY ar.AttemptedAt DESC
         LIMIT 1`, [student.UserID || 0, student.CourseID || 0]);
        
      const resultId = ar.recordset.length > 0 ? ar.recordset[0].ResultID : null;
      const assessPdf = resultId ? `/uploads/reports/Assessment_Result_${student.UserID}_${resultId}.pdf` : null;

      // Get Feedback Result
      const fb = await pool.query(`
          SELECT FeedbackID FROM Feedback 
          WHERE StudentID = $1 
            AND CourseName = $2
          ORDER BY SubmittedAt DESC
         LIMIT 1`, [student.UserID, student.CourseTitle || '']);
        
      const fbId = fb.recordset.length > 0 ? fb.recordset[0].FeedbackID : null;
      const fbPdf = fbId ? `/uploads/reports/Feedback_Result_${student.UserID}_${fbId}.pdf` : null;

      return {
        ...student,
        RegistrationPDF: regPdf,
        AssessmentPDF: assessPdf,
        FeedbackPDF: fbPdf,
        AssessmentResultID: resultId
      };
    }));

    return NextResponse.json({ success: true, students: enriched });
  } catch (e: any) {
    return NextResponse.json({ success: false, message: process.env.NODE_ENV === 'development' ? e.message : 'Internal Server Error' }, { status: 500 });
  }
}

// POST /api/trainer/students — enroll a student into one of trainer's batches
export async function POST(request: NextRequest) {
  const user = getUserFromRequest(request);
  if (!requireRole(user, 'TRAINER', 'ADMIN')) return NextResponse.json({ success: false, message: 'Access denied' }, { status: 403 });
  const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';

  try {
    const body = await parseAndSanitizeBody(request);
    const { studentId, calendarId } = body;

    if (!studentId || !calendarId) {
      return NextResponse.json({ success: false, message: 'studentId and calendarId are required' }, { status: 400 });
    }

    const pool = await getConnection();

    // Verify this calendar entry belongs to this trainer
    const calResult = await pool.query(`SELECT CalendarID, CourseID, MaxParticipants, CurrentEnrolled FROM TrainingCalendar WHERE CalendarID = $1 AND TrainerID = $2`, [Number(calendarId), user!.userId]);

    if (calResult.recordset.length === 0) {
      return NextResponse.json({ success: false, message: 'Batch not found or not assigned to you' }, { status: 404 });
    }

    const batch = calResult.recordset[0];
    if (batch.CurrentEnrolled >= batch.MaxParticipants) {
      return NextResponse.json({ success: false, message: 'Batch is full — maximum participants reached' }, { status: 409 });
    }

    // Check if already enrolled
    const existingCheck = await pool.query(`SELECT EnrollmentID FROM Enrollments WHERE StudentID = $1 AND CalendarID = $2`, [Number(studentId), Number(calendarId)]);

    if (existingCheck.recordset.length > 0) {
      return NextResponse.json({ success: false, message: 'Student is already enrolled in this batch' }, { status: 409 });
    }

    // Enroll
    await pool.query(`
        INSERT INTO Enrollments (StudentID, CourseID, CalendarID, Status, ProgressPercent, EnrolledAt)
        VALUES ($1, $2, $3, 'ENROLLED', 0, CURRENT_TIMESTAMP)
      `, [Number(studentId), batch.CourseID, Number(calendarId)]);

    // Update seat count
    await pool.query(`UPDATE TrainingCalendar SET CurrentEnrolled = CurrentEnrolled + 1 WHERE CalendarID = $1`, [Number(calendarId)]);

    await auditLog(user!.userId, user!.email, 'STUDENT_ENROLLED', 'TRAINER', `Enrolled student ${studentId} into batch ${calendarId}`, ip);
    return NextResponse.json({ success: true, message: 'Student enrolled successfully' });
  } catch (e: any) {
    return NextResponse.json({ success: false, message: process.env.NODE_ENV === 'development' ? e.message : 'Internal Server Error' }, { status: 500 });
  }
}

// PUT /api/trainer/students — update student enrollment (progress, status, attendance)
export async function PUT(request: NextRequest) {
  const user = getUserFromRequest(request);
  if (!requireRole(user, 'TRAINER', 'ADMIN')) return NextResponse.json({ success: false, message: 'Access denied' }, { status: 403 });
  const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';

  try {
    const body = await parseAndSanitizeBody(request);
    const { enrollmentId, progress, status } = body;

    if (!enrollmentId) {
      return NextResponse.json({ success: false, message: 'enrollmentId is required' }, { status: 400 });
    }

    const pool = await getConnection();

    // Verify this enrollment is within a trainer-owned batch
    const check = await pool.query(`
        SELECT e.EnrollmentID FROM Enrollments e
        JOIN TrainingCalendar tc ON e.CalendarID = tc.CalendarID
        WHERE e.EnrollmentID = $1 AND tc.TrainerID = $2
      `, [Number(enrollmentId), user!.userId]);

    if (check.recordset.length === 0) {
      return NextResponse.json({ success: false, message: 'Enrollment not found or access denied' }, { status: 404 });
    }

    const values: any[] = [Number(enrollmentId)];
    let setParts: string[] = [];

    if (progress !== undefined) { 
      values.push(Number(progress));
      setParts.push(`ProgressPercent = $${values.length}`); 
    }
    if (status !== undefined) { 
      values.push(status);
      setParts.push(`Status = $${values.length}`); 
    }

    if (setParts.length === 0) {
      return NextResponse.json({ success: false, message: 'Nothing to update' }, { status: 400 });
    }

    await pool.query(`UPDATE Enrollments SET ${setParts.join(', ')} WHERE EnrollmentID = $1`, values);
    await auditLog(user!.userId, user!.email, 'ENROLLMENT_UPDATED', 'TRAINER', `Updated enrollment ${enrollmentId}`, ip);

    return NextResponse.json({ success: true, message: 'Student record updated successfully' });
  } catch (e: any) {
    return NextResponse.json({ success: false, message: process.env.NODE_ENV === 'development' ? e.message : 'Internal Server Error' }, { status: 500 });
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
    const check = await pool.query(`
        SELECT e.EnrollmentID, e.CalendarID FROM Enrollments e
        JOIN TrainingCalendar tc ON e.CalendarID = tc.CalendarID
        WHERE e.EnrollmentID = $1 AND tc.TrainerID = $2
      `, [Number(enrollmentId), user!.userId]);

    if (check.recordset.length === 0) {
      return NextResponse.json({ success: false, message: 'Enrollment not found or access denied' }, { status: 404 });
    }

    const calendarId = check.recordset[0].CalendarID;

    await pool.query(`DELETE FROM Enrollments WHERE EnrollmentID = $1`, [Number(enrollmentId)]);

    await pool.query(`UPDATE TrainingCalendar SET CurrentEnrolled = CASE WHEN CurrentEnrolled > 0 THEN CurrentEnrolled - 1 ELSE 0 END WHERE CalendarID = $1`, [Number(calendarId)]);

    await auditLog(user!.userId, user!.email, 'STUDENT_REMOVED', 'TRAINER', `Removed enrollment ${enrollmentId}`, ip);
    return NextResponse.json({ success: true, message: 'Student removed from batch' });
  } catch (e: any) {
    return NextResponse.json({ success: false, message: process.env.NODE_ENV === 'development' ? e.message : 'Internal Server Error' }, { status: 500 });
  }
}
