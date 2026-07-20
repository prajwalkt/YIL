import { NextRequest, NextResponse } from 'next/server';
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
    const studentsResult = await pool.request()
      .input('CalendarID', calendarId)
      .query(`
        SELECT e.EnrollmentID, e.StudentID, u.FirstName, u.LastName, u.Email, e.AttendancePercentage
        FROM Enrollments e
        JOIN LMS_Users u ON e.StudentID = u.UserID
        WHERE e.CalendarID = @CalendarID AND e.Status != 'DROPPED'
      `);

    // Get all attendance records for this batch
    const attendanceResult = await pool.request()
      .input('CalendarID', calendarId)
      .query(`
        SELECT AttendanceID, EnrollmentID, SessionDate, Status 
        FROM Attendance 
        WHERE CalendarID = @CalendarID
        ORDER BY SessionDate ASC
      `);

    return NextResponse.json({ 
      success: true, 
      students: studentsResult.recordset,
      attendance: attendanceResult.recordset
    });
  } catch (e: any) {
    return NextResponse.json({ success: false, message: e.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const user = getUserFromRequest(request);
  if (!requireRole(user, 'TRAINER', 'ADMIN', 'TM')) return NextResponse.json({ success: false, message: 'Access denied' }, { status: 403 });
  const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';

  try {
    const { calendarId, sessionDate, records } = await request.json();
    if (!calendarId || !sessionDate || !records || !Array.isArray(records)) {
      return NextResponse.json({ success: false, message: 'Invalid payload' }, { status: 400 });
    }

    const pool = await getConnection();
    const transaction = pool.transaction();
    await transaction.begin();

    try {
      for (const rec of records) {
        // Delete existing record for this student on this date if it exists
        await transaction.request()
          .input('EnrollmentID', rec.enrollmentId)
          .input('SessionDate', sessionDate)
          .query(`DELETE FROM Attendance WHERE EnrollmentID = @EnrollmentID AND SessionDate = @SessionDate`);

        // Insert new record
        await transaction.request()
          .input('EnrollmentID', rec.enrollmentId)
          .input('CalendarID', calendarId)
          .input('SessionDate', sessionDate)
          .input('Status', rec.status)
          .input('MarkedBy', user!.userId)
          .query(`
            INSERT INTO Attendance (EnrollmentID, CalendarID, SessionDate, Status, MarkedBy)
            VALUES (@EnrollmentID, @CalendarID, @SessionDate, @Status, @MarkedBy)
          `);
      }

      // Recalculate AttendancePercentage for all affected students
      for (const rec of records) {
        await transaction.request()
          .input('EnrollmentID', rec.enrollmentId)
          .query(`
            UPDATE Enrollments 
            SET AttendancePercentage = (
              SELECT ISNULL(
                (CAST(SUM(CASE WHEN Status = 'PRESENT' THEN 1 ELSE 0 END) AS FLOAT) / COUNT(*)) * 100, 
                0
              )
              FROM Attendance 
              WHERE EnrollmentID = @EnrollmentID
            )
            WHERE EnrollmentID = @EnrollmentID
          `);
      }

      await transaction.commit();
      await auditLog(user!.userId, user!.email, 'ATTENDANCE_MARKED', 'TRAINING', `Marked attendance for Batch ${calendarId} on ${sessionDate}`, ip);
      return NextResponse.json({ success: true, message: 'Attendance saved successfully' });
    } catch (e) {
      await transaction.rollback();
      throw e;
    }
  } catch (e: any) {
    return NextResponse.json({ success: false, message: e.message }, { status: 500 });
  }
}
