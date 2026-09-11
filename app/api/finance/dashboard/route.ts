import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest, requireRole } from '../../../library/auth';
import { getConnection } from '../../../library/db';

export async function GET(request: NextRequest) {
  const user = getUserFromRequest(request);
  if (!requireRole(user, 'ADMIN', 'FINANCE', 'TM')) {
    return NextResponse.json({ success: false, message: 'Access denied' }, { status: 403 });
  }

  try {
    const pool = await getConnection();

    // ── KPI Stats ──
    const stats = await pool.request().query(`
      SELECT
        (SELECT ISNULL(SUM(Amount), 0) FROM PaymentTracking WHERE Status = 'VERIFIED') as TotalRevenue,
        (SELECT ISNULL(SUM(Amount), 0) FROM PaymentTracking WHERE Status = 'VERIFIED' AND MONTH(PaidAt) = MONTH(GETDATE()) AND YEAR(PaidAt) = YEAR(GETDATE())) as MonthlyRevenue,
        (SELECT COUNT(*) FROM PaymentTracking WHERE Status = 'PENDING') as PendingPaymentsCount,
        (SELECT ISNULL(SUM(Amount), 0) FROM PaymentTracking WHERE Status = 'PENDING') as PendingPaymentsAmount,
        (SELECT COUNT(*) FROM PaymentTracking WHERE Status = 'VERIFIED') as VerifiedPayments,
        (SELECT COUNT(*) FROM PaymentTracking) as TotalPayments,
        (SELECT COUNT(*) FROM Invoices WHERE Status = 'PAID') as PaidInvoices,
        (SELECT COUNT(*) FROM Invoices WHERE Status = 'PENDING') as PendingInvoices,
        (SELECT COUNT(*) FROM Invoices WHERE Status = 'OVERDUE') as OverdueInvoices,
        (SELECT COUNT(*) FROM Registrations WHERE Status = 'PENDING') as PendingApprovals,
        (SELECT COUNT(*) FROM Registrations WHERE Status = 'FINANCE_APPROVED') as FinanceApproved,
        (SELECT COUNT(*) FROM Registrations WHERE Status = 'APPROVED') as FullyApproved
    `);

    // ── Monthly Revenue Trend (last 6 months) ──
    const monthlyTrend = await pool.request().query(`
      SELECT 
        FORMAT(PaidAt, 'MMM yyyy') as Month,
        YEAR(PaidAt) as Yr,
        MONTH(PaidAt) as Mo,
        ISNULL(SUM(Amount), 0) as Revenue,
        COUNT(*) as Transactions
      FROM PaymentTracking
      WHERE Status = 'VERIFIED'
        AND PaidAt >= DATEADD(MONTH, -6, GETDATE())
      GROUP BY FORMAT(PaidAt, 'MMM yyyy'), YEAR(PaidAt), MONTH(PaidAt)
      ORDER BY Yr, Mo
    `);

    // ── Recent Payments ──
    const recentPayments = await pool.request().query(`
      SELECT TOP 20
        pt.*,
        r.Name as StudentName,
        r.Course as CourseName,
        r.Email as StudentEmail
      FROM PaymentTracking pt
      LEFT JOIN Registrations r ON pt.RegistrationID = r.Id
      ORDER BY pt.CreatedAt DESC
    `);

    // ── Payment Method Breakdown ──
    const methodBreakdown = await pool.request().query(`
      SELECT 
        ISNULL(PaymentMethod, 'Unknown') as Method,
        COUNT(*) as Count,
        ISNULL(SUM(Amount), 0) as Total
      FROM PaymentTracking
      WHERE Status = 'VERIFIED'
      GROUP BY PaymentMethod
    `);

    // ── Pending Approval List for Finance ──
    const pendingList = await pool.request().query(`
      SELECT TOP 50
        r.Id, r.Name, r.Email, r.Course, r.TrainingMode, r.Status, r.CreatedAt,
        pt.TransactionID, pt.PaymentProofPath, pt.Amount, pt.PaymentMethod, pt.Status as PaymentStatus
      FROM Registrations r
      LEFT JOIN (
        SELECT RegistrationID, TransactionID, PaymentProofPath, Amount, PaymentMethod, Status,
               ROW_NUMBER() OVER(PARTITION BY RegistrationID ORDER BY CreatedAt DESC) as rn
        FROM PaymentTracking
      ) pt ON r.Id = pt.RegistrationID AND pt.rn = 1
      WHERE r.Status = 'PENDING'
      ORDER BY r.CreatedAt DESC
    `);

    return NextResponse.json({
      success: true,
      stats: stats.recordset[0],
      monthlyTrend: monthlyTrend.recordset,
      recentPayments: recentPayments.recordset,
      methodBreakdown: methodBreakdown.recordset,
      pendingList: pendingList.recordset,
    });
  } catch (e: any) {
    console.error('Finance dashboard error:', e);
    return NextResponse.json({ success: false, message: process.env.NODE_ENV === 'development' ? e.message : 'Internal Server Error' }, { status: 500 });
  }
}
