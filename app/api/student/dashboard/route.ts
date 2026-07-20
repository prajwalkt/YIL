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

    // Get active enrollments with access dates
    const enrollmentsResult = await req.query(`
      SELECT e.*, c.Title as CourseTitle, ISNULL(r.TrainingMode, c.Mode) as Mode,
             tc.StartDate, tc.EndDate, tc.TrainerName, tc.Location,
             e.AccessStartDate, e.AccessEndDate, e.DurationDays
      FROM Enrollments e
      JOIN LMS_Courses c ON e.CourseID = c.CourseID
      LEFT JOIN TrainingCalendar tc ON e.CalendarID = tc.CalendarID
      LEFT JOIN Registrations r ON e.RegistrationID = r.Id
      WHERE e.StudentID = @StudentID
      ORDER BY e.EnrolledAt DESC
    `);

    // Enrich enrollments with computed progress for non-E-Learning modes
    const enrollments = enrollmentsResult.recordset.map((enr: any) => {
      const isELearning = (enr.Mode || '').toLowerCase().includes('elearning') ||
                          (enr.Mode || '').toLowerCase().includes('e-learning') ||
                          (enr.Mode || '') === 'ELEARNING';

      const accessExpired = enr.AccessEndDate
        ? new Date() > new Date(enr.AccessEndDate)
        : false;

      const computedProgress = (!isELearning && enr.AccessStartDate && enr.AccessEndDate)
        ? computeTimeBasedProgress(enr.AccessStartDate, enr.AccessEndDate)
        : (enr.ProgressPercent || 0);

      return {
        ...enr,
        ComputedProgress: computedProgress,
        AccessExpired: accessExpired,
        IsELearning: isELearning,
      };
    });

    // Get certificates
    const certificatesResult = await pool.request().input('StudentID', user!.userId).query(`
      SELECT CertificateID, CertificateNo, CourseName, TrainerName, IssueDate, ValidUntil 
      FROM Certificates 
      WHERE StudentID = @StudentID
      ORDER BY IssueDate DESC
    `);

    // Get invoices tied to this student
    const invoicesResult = await pool.request().input('StudentID', user!.userId).query(`
      SELECT InvoiceNo, CourseName, Amount, Currency, Status, IssuedDate, DueDate 
      FROM Invoices 
      WHERE StudentName = (SELECT FirstName + ' ' + LastName FROM LMS_Users WHERE UserID = @StudentID)
      ORDER BY IssuedDate DESC
    `);

    // Available courses
    const catalogResult = await pool.request().query(`
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
    return NextResponse.json({ success: false, message: e.message }, { status: 500 });
  }
}
