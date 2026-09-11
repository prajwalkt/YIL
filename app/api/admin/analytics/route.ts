import { NextRequest, NextResponse } from 'next/server';
import { getConnection } from '../../../library/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const country = searchParams.get('country') || 'ALL';
    const course = searchParams.get('course') || 'ALL';
    const range = searchParams.get('range') || 'ALL';
    
    // Convert range to date logic
    let dateFilter = '';
    if (range === 'Today') {
      dateFilter = "AND CAST(CreatedAt AS DATE) = CAST(GETDATE() AS DATE)";
    } else if (range === 'Weekly') {
      dateFilter = "AND CreatedAt >= DATEADD(day, -7, GETDATE())";
    } else if (range === 'Monthly') {
      dateFilter = "AND CreatedAt >= DATEADD(month, -1, GETDATE())";
    } else if (range === 'Yearly') {
      dateFilter = "AND CreatedAt >= DATEADD(year, -1, GETDATE())";
    }

    const countryFilter = country !== 'ALL' ? `AND Country = '${country}'` : '';
    const courseFilter = course !== 'ALL' ? `AND Course = '${course}'` : '';
    const courseFilterName = course !== 'ALL' ? `AND CourseName = '${course}'` : '';
    const courseFilterTitle = course !== 'ALL' ? `AND Title = '${course}'` : '';

    const pool = await getConnection();

    // Today's KPIs
    const todayKpis = await pool.request().query(`
      SELECT 
        (SELECT COUNT(*) FROM Registrations WHERE CAST(CreatedAt AS DATE) = CAST(GETDATE() AS DATE)) as TodayRegistrations,
        (SELECT SUM(Amount) FROM Invoices WHERE Status = 'PAID' AND CAST(PaidDate AS DATE) = CAST(GETDATE() AS DATE)) as TodayRevenue,
        (SELECT COUNT(*) FROM Attendance WHERE SessionDate = CAST(GETDATE() AS DATE) AND Status = 'PRESENT') as TodayAttendance,
        (SELECT COUNT(*) FROM Certificates WHERE IssueDate = CAST(GETDATE() AS DATE)) as TodayCertificates,
        (SELECT COUNT(*) FROM TrainingCalendar WHERE CAST(GETDATE() AS DATE) BETWEEN StartDate AND EndDate AND Status != 'CANCELLED') as TodayRunningBatches,
        (SELECT COUNT(*) FROM Invoices WHERE Status = 'PENDING') as PendingPayments,
        (SELECT COUNT(*) FROM Registrations WHERE Status IN ('PENDING', 'WAITING_APPROVAL')) as PendingApprovals
    `);

    // Registrations over time (last 6 months)
    const trends = await pool.request().query(`
      SELECT 
        FORMAT(CreatedAt, 'MMM yyyy') as Month,
        COUNT(*) as Registrations
      FROM Registrations
      WHERE CreatedAt >= DATEADD(month, -5, GETDATE())
      ${countryFilter} ${courseFilter}
      GROUP BY FORMAT(CreatedAt, 'MMM yyyy'), YEAR(CreatedAt), MONTH(CreatedAt)
      ORDER BY YEAR(CreatedAt), MONTH(CreatedAt)
    `);

    // Course Popularity (Pie Chart)
    const popularity = await pool.request().query(`
      SELECT TOP 5 Course as name, COUNT(*) as value
      FROM Registrations
      WHERE 1=1 ${countryFilter} ${dateFilter}
      GROUP BY Course
      ORDER BY value DESC
    `);

    // Revenue by Country (Bar Chart)
    const revenue = await pool.request().query(`
      SELECT r.Country as name, SUM(i.Amount) as value
      FROM Invoices i
      JOIN Registrations r ON i.RegistrationID = r.Id
      WHERE i.Status = 'PAID'
      ${countryFilter} ${courseFilter}
      GROUP BY r.Country
      ORDER BY value DESC
    `);

    return NextResponse.json({
      success: true,
      kpis: {
        todayRegistrations: todayKpis.recordset[0].TodayRegistrations || 0,
        todayRevenue: todayKpis.recordset[0].TodayRevenue || 0,
        todayAttendance: todayKpis.recordset[0].TodayAttendance || 0,
        todayCertificates: todayKpis.recordset[0].TodayCertificates || 0,
        todayRunningBatches: todayKpis.recordset[0].TodayRunningBatches || 0,
        pendingPayments: todayKpis.recordset[0].PendingPayments || 0,
        pendingApprovals: todayKpis.recordset[0].PendingApprovals || 0,
      },
      charts: {
        trends: trends.recordset,
        popularity: popularity.recordset,
        revenue: revenue.recordset,
      }
    });

  } catch (error: any) {
    console.error('Analytics API Error:', error);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}
