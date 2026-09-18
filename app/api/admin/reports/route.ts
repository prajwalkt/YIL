import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest, requireRole } from '../../../library/auth';
import { getConnection } from '../../../library/db';

export async function GET(request: NextRequest) {
  const user = getUserFromRequest(request);
  if (!requireRole(user, 'ADMIN', 'TM', 'FINANCE')) {
    return NextResponse.json({ success: false, message: 'Access denied' }, { status: 403 });
  }

  try {
    const pool = await getConnection();
    const { searchParams } = new URL(request.url);

    // ── Filter Parameters (Phase I/J) ──
    const userType = searchParams.get('userType');       // STUDENT or AFFILIATE
    const courseFilter = searchParams.get('course');
    const trainingMode = searchParams.get('trainingMode');
    const statusFilter = searchParams.get('status');
    const year = searchParams.get('year');
    const month = searchParams.get('month');

    // ── Stats ──
    const stats = await pool.query(`
      SELECT
        (SELECT COUNT(*) FROM LMS_Users WHERE Role='STUDENT' AND IsActive=1) as TotalStudents,
        (SELECT COUNT(*) FROM LMS_Users WHERE Role='AFFILIATE' AND IsActive=1) as TotalAffiliates,
        (SELECT COUNT(*) FROM LMS_Users WHERE IsApproved=0) as PendingApprovals,
        (SELECT COUNT(*) FROM LMS_Courses WHERE Status='ACTIVE') as ActiveCourses,
        (SELECT COUNT(*) FROM Registrations) as TotalRegistrations,
        (SELECT COUNT(*) FROM Certificates) as CertificatesIssued,
        (SELECT COUNT(*) FROM TrainingCalendar WHERE StartDate >= CAST(CURRENT_TIMESTAMP AS DATE) AND StartDate <= DATEADD(MONTH,3,CAST(CURRENT_TIMESTAMP AS DATE))) as UpcomingTrainings,
        (SELECT COUNT(*) FROM TrainingEnquiries WHERE Status='OPEN') as OpenEnquiries,
        (SELECT COUNT(*) FROM PaymentTracking WHERE Status='PENDING') as PendingPayments,
        (SELECT COALESCE(SUM(Amount),0) FROM Invoices WHERE Status='PAID' AND MONTH(IssuedDate)=MONTH(CURRENT_TIMESTAMP) AND YEAR(IssuedDate)=YEAR(CURRENT_TIMESTAMP)) as MonthlyRevenue,
        (SELECT COUNT(*) FROM TrainingCalendar WHERE StartDate <= CAST(CURRENT_TIMESTAMP AS DATE) AND EndDate >= CAST(CURRENT_TIMESTAMP AS DATE)) as RunningBatches,
        (SELECT COUNT(*) FROM TrainingCalendar WHERE EndDate < CAST(CURRENT_TIMESTAMP AS DATE)) as CompletedBatches,
        (SELECT COUNT(*) FROM LMS_Users WHERE Role='TRAINER' AND IsActive=1) as TotalTrainers
    `);

    // ── Filtered Registrations (for Reports tab) ──
    const req2 = pool.request();
    let regQuery = `
      SELECT r.*, u.Role as UserRole
      FROM Registrations r
      LEFT JOIN LMS_Users u ON u.Email = r.Email
      WHERE 1=1
    `;

    if (userType) {
      if (userType === 'STUDENT') {
        regQuery += ` AND (r.SponsoredBy IS NULL OR r.SponsoredBy = 'Self')`;
      } else if (userType === 'AFFILIATE') {
        regQuery += ` AND r.SponsoredBy = 'Organization'`;
      }
    }
    if (courseFilter) {
      regQuery += ` AND r.Course LIKE @Course`;
      req2.input('Course', `%${courseFilter}%`);
    }
    if (trainingMode) {
      regQuery += ` AND r.TrainingMode = @TrainingMode`;
      req2.input('TrainingMode', trainingMode);
    }
    if (statusFilter) {
      regQuery += ` AND r.Status = @Status`;
      req2.input('Status', statusFilter);
    }
    if (year) {
      regQuery += ` AND YEAR(r.CreatedAt) = @Year`;
      req2.input('Year', Number(year));
    }
    if (month) {
      regQuery += ` AND MONTH(r.CreatedAt) = @Month`;
      req2.input('Month', Number(month));
    }

    regQuery += ` ORDER BY r.CreatedAt DESC`;
    const recentRegs = await req2.query(regQuery);

    // ── Monthly trend data ──
    const monthlyData = await pool.query(`
      SELECT 
        FORMAT(StartDate, 'MMM yyyy') as Month,
        COUNT(*) as Count,
        TrainingType
      FROM TrainingCalendar
      WHERE StartDate >= DATEADD(MONTH, -6, CURRENT_TIMESTAMP)
      GROUP BY FORMAT(StartDate, 'MMM yyyy'), TrainingType, YEAR(StartDate), MONTH(StartDate)
      ORDER BY YEAR(StartDate), MONTH(StartDate)
    `);

    // ── Recent audit logs ──
    const auditLogs = await pool.query(`
      SELECT * FROM AuditLog ORDER BY CreatedAt DESC
     LIMIT 20`);

    return NextResponse.json({
      success: true,
      stats: stats.recordset[0],
      recentRegistrations: recentRegs.recordset,
      monthlyData: monthlyData.recordset,
      auditLogs: auditLogs.recordset,
    });
  } catch (e: any) {
    console.error('Reports GET error:', e);
    return NextResponse.json({ success: false, message: process.env.NODE_ENV === 'development' ? e.message : 'Internal Server Error' }, { status: 500 });
  }
}
