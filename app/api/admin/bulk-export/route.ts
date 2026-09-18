import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest, auditLog } from '../../../library/auth';
import { getConnection } from '../../../library/db';
import * as XLSX from 'xlsx';

export async function GET(request: NextRequest) {
  const user = getUserFromRequest(request);
  if (!user || user.role !== 'ADMIN') return new NextResponse('Unauthorized', { status: 403 });

  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');

    if (!type) return new NextResponse('Type is required', { status: 400 });

    const pool = await getConnection();
    let data: any[] = [];

    if (type === 'users') {
      const res = await pool.query(`SELECT UserID, Email, Role, FirstName, LastName, Organization, Country, IsActive FROM LMS_Users`);
      data = res.recordset;
    } else if (type === 'courses') {
      const res = await pool.query(`SELECT CourseID, Title, Code, Duration, FeeUSD, Mode, Status, Category FROM LMS_Courses`);
      data = res.recordset;
    } else if (type === 'payments') {
      const res = await pool.query(`SELECT PaymentID, StudentName, CourseName, Amount, Currency, Status, PaidAt FROM PaymentTracking`);
      data = res.recordset;
    } else if (type === 'certificates') {
      const res = await pool.query(`SELECT CertificateNo, ParticipantName, CourseName, TrainerName, IssueDate FROM Certificates`);
      data = res.recordset;
    } else if (type === 'attendance') {
      const res = await pool.query(`
        SELECT a.AttendanceID, c.Title, u.FirstName + ' ' + u.LastName as StudentName, a.SessionDate, a.Status
        FROM Attendance a
        JOIN TrainingCalendar c ON a.CalendarID = c.CalendarID
        JOIN Enrollments e ON a.EnrollmentID = e.EnrollmentID
        JOIN LMS_Users u ON e.StudentID = u.UserID
      `);
      data = res.recordset;
    } else {
      return new NextResponse('Invalid export type', { status: 400 });
    }

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Export Data');

    const buf = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    await auditLog(user.userId, user.email, 'BULK_EXPORT', 'ADMIN', `Exported ${type}`, '0.0.0.0', 'SUCCESS');

    return new NextResponse(buf, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${type}_export_${new Date().toISOString().split('T')[0]}.xlsx"`,
      },
    });
  } catch (e: any) {
    console.error('Bulk Export Error:', e);
    return new NextResponse('Export failed', { status: 500 });
  }
}
