import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest, requireRole } from '../../../library/auth';
import { getConnection } from '../../../library/db';
import { computeTimeBasedProgress } from '../../../library/courseDurations';

export async function GET(request: NextRequest) {
  const user = getUserFromRequest(request);
  if (!requireRole(user, 'STUDENT', 'AFFILIATE', 'ADMIN')) return NextResponse.json({ success: false, message: 'Access denied' }, { status: 403 });

  try {
    const pool = await getConnection();
    const req = pool.request();
    req.input('StudentID', user!.userId);

    // Get active enrollments
    const enrollmentsResult = await req.query(`
      SELECT e.*, c.Title as CourseTitle, ISNULL(r.TrainingMode, c.Mode) as Mode,
             tc.StartDate, tc.EndDate, tc.TrainerName, tc.Location, c.Duration as DurationDays,
             (SELECT COUNT(*) FROM Attendance a WHERE a.EnrollmentID = e.EnrollmentID AND a.Status = 'Present') as DaysAttended,
             (SELECT TOP 1 WatchedSeconds FROM ELearningProgress el WHERE el.EnrollmentID = e.EnrollmentID) as WatchedSeconds,
             (SELECT TOP 1 TotalSeconds FROM ELearningProgress el WHERE el.EnrollmentID = e.EnrollmentID) as TotalSeconds,
             r.OriginalStartDate, r.OriginalEndDate, r.FinalStartDate, r.FinalEndDate, r.DateApprovalStatus
      FROM Enrollments e
      JOIN LMS_Courses c ON e.CourseID = c.CourseID
      LEFT JOIN TrainingCalendar tc ON e.CalendarID = tc.CalendarID
      LEFT JOIN Registrations r ON e.RegistrationID = r.Id
      WHERE e.StudentID = @StudentID
      ORDER BY e.EnrolledAt DESC
    `);

    // Enrich enrollments with computed progress from actual attendance / elearning
    const enrollments = enrollmentsResult.recordset.map((enr: any) => {
      const isELearning = (enr.Mode || '').toLowerCase().includes('elearning') ||
                          (enr.Mode || '').toLowerCase().includes('e-learning') ||
                          (enr.Mode || '') === 'ELEARNING';

      const now = new Date();
      let accessExpired = false;
      let accessStarted = true;

      if (enr.EndDate) {
        const endD = new Date(enr.EndDate);
        endD.setHours(23, 59, 59, 999);
        accessExpired = now > endD;
      }
      if (enr.StartDate) {
        const startD = new Date(enr.StartDate);
        startD.setHours(0, 0, 0, 0);
        accessStarted = now >= startD;
      }

      let computedProgress = 0;
      if (isELearning) {
        if (enr.TotalSeconds > 0 && enr.WatchedSeconds) {
           computedProgress = Math.round((enr.WatchedSeconds / enr.TotalSeconds) * 100);
        } else {
           computedProgress = enr.ProgressPercent || 0;
        }
      } else {
         if (enr.DurationDays && enr.DurationDays > 0) {
            computedProgress = Math.min(100, Math.round(((enr.DaysAttended || 0) / enr.DurationDays) * 100));
         } else {
            computedProgress = 0;
         }
      }

      return {
        ...enr,
        ComputedProgress: computedProgress,
        AccessExpired: accessExpired,
        AccessStarted: accessStarted,
        IsELearning: isELearning,
      };
    });

    // Get certificates
    const certificatesResult = await pool.query(`
      SELECT CertificateID, CertificateNo, CourseName, TrainerName, IssueDate, ValidUntil 
      FROM Certificates 
      WHERE StudentID = $1
      ORDER BY IssueDate DESC
    `, [user!.userId]);

    // Get invoices tied to this student
    const invoicesResult = await pool.query(`
      SELECT InvoiceNo, CourseName, Amount, Currency, Status, IssuedDate, DueDate 
      FROM Invoices 
      WHERE StudentName = (SELECT FirstName + ' ' + LastName FROM LMS_Users WHERE UserID = $1)
      ORDER BY IssuedDate DESC
    `, [user!.userId]);

    // Available courses
    const catalogResult = await pool.query(`
      SELECT CourseID, Title, Code, Description, Mode, Duration, FeeUSD, FeeINR, Category 
      FROM LMS_Courses 
      WHERE Status = 'ACTIVE'
    `);

    return NextResponse.json({ 
      success: true, 
      enrollments,
      certificates: certificatesResult.recordset,
      invoices: invoicesResult.recordset,
      catalog: catalogResult.recordset
    });
  } catch (e: any) {
    return NextResponse.json({ success: false, message: process.env.NODE_ENV === 'development' ? e.message : 'Internal Server Error' }, { status: 500 });
  }
}
