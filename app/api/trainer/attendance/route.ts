import { NextRequest, NextResponse } from 'next/server';
import { parseAndSanitizeBody } from '../../../library/validation';
import { getUserFromRequest, requireRole, auditLog } from '../../../library/auth';
import { getConnection } from '../../../library/db';

export async function GET(request: NextRequest) {
  const user = getUserFromRequest(request);
  if (!requireRole(user, 'TRAINER', 'ADMIN', 'TM')) return NextResponse.json({ success: false, message: 'Access denied' }, { status: 403 });

  const url = new URL(request.url);
  const calendarId = url.searchParams.get('calendarId');
  if (!calendarId) return NextResponse.json({ success: false, message: 'calendarId is required' }, { status: 400 });

  try {
    const pool = await getConnection();
    
    // Get all students enrolled in this batch
    const studentsResult = await pool.query(`
        SELECT e.EnrollmentID, e.StudentID, u.FirstName, u.LastName, u.Email, e.AttendancePercentage
        FROM Enrollments e
        JOIN LMS_Users u ON e.StudentID = u.UserID
        WHERE e.CalendarID = $1 AND e.Status != 'DROPPED'
      `, [calendarId]);

    // Get all attendance records for this batch
    const attendanceResult = await pool.query(`
        SELECT AttendanceID, EnrollmentID, SessionDate, Status 
        FROM Attendance 
        WHERE CalendarID = $1
        ORDER BY SessionDate ASC
      `, [calendarId]);

    return NextResponse.json({ 
      success: true, 
      students: studentsResult.recordset,
      attendance: attendanceResult.recordset
    });
  } catch (e: any) {
    return NextResponse.json({ success: false, message: process.env.NODE_ENV === 'development' ? e.message : 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const user = getUserFromRequest(request);
  if (!requireRole(user, 'TRAINER', 'ADMIN', 'TM')) return NextResponse.json({ success: false, message: 'Access denied' }, { status: 403 });
  const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';

  try {
    const { calendarId, sessionDate, records } = await parseAndSanitizeBody(request);
    if (!calendarId || !sessionDate || !records || !Array.isArray(records)) {
      return NextResponse.json({ success: false, message: 'Invalid payload' }, { status: 400 });
    }

    const pool = await getConnection();
    const transaction = await pool.connect();
    await transaction.query('BEGIN');

    try {
      for (const rec of records) {
        // Delete existing record for this student on this date if it exists
        await transaction.query(`DELETE FROM Attendance WHERE EnrollmentID = $1 AND SessionDate = $2`, [rec.enrollmentId, sessionDate]);

        // Insert new record
        await transaction.query(`
            INSERT INTO Attendance (EnrollmentID, CalendarID, SessionDate, Status, MarkedBy)
            VALUES ($1, $2, $3, $4, $5)
          `, [rec.enrollmentId, calendarId, sessionDate, rec.status, user!.userId]);
      }

      // Recalculate AttendancePercentage for all affected students
      for (const rec of records) {
        await transaction.query(`
            UPDATE Enrollments 
            SET AttendancePercentage = (
              SELECT COALESCE(
                (CAST(SUM(CASE WHEN a.Status = 'PRESENT' THEN 1 ELSE 0 END) AS FLOAT) / NULLIF(c.Duration, 0)) * 100, 
                0
              )
              FROM Attendance a
              JOIN Enrollments e2 ON a.EnrollmentID = e2.EnrollmentID
              JOIN LMS_Courses c ON e2.CourseID = c.CourseID
              WHERE a.EnrollmentID = $1
            )
            WHERE EnrollmentID = $2
          `, [rec.enrollmentId, rec.enrollmentId]);
      }

      await transaction.query('COMMIT');
      transaction.release();
      await auditLog(user!.userId, user!.email, 'ATTENDANCE_MARKED', 'TRAINING', `Marked attendance for Batch ${calendarId} on ${sessionDate}`, ip);
      return NextResponse.json({ success: true, message: 'Attendance saved successfully' });
    } catch (e) {
      await transaction.query('ROLLBACK');
      if (transaction.release) transaction.release();
      throw e;
    }
  } catch (e: any) {
    return NextResponse.json({ success: false, message: process.env.NODE_ENV === 'development' ? e.message : 'Internal Server Error' }, { status: 500 });
  }
}
