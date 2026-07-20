import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest, requireRole } from '../../../library/auth';
import { getConnection } from '../../../library/db';

export async function GET(request: NextRequest) {
  const user = getUserFromRequest(request);
  if (!requireRole(user, 'AFFILIATE')) return NextResponse.json({ success: false, message: 'Access denied' }, { status: 403 });

  try {
    const pool = await getConnection();
    const req = pool.request();
    req.input('AffiliateUserID', user!.userId);
    req.input('Country', user!.country || '');

    // Get regional students (using country matching as a proxy for region)
    // In a real app, this would use the AffiliateRegions table
    const studentsResult = await req.query(`
      SELECT UserID, FirstName, LastName, Email, Organization, CreatedAt 
      FROM LMS_Users 
      WHERE Role = 'STUDENT' AND (Country = @Country OR @Country = '')
      ORDER BY CreatedAt DESC
    `);

    // Get active courses for catalog
    const coursesResult = await req.query(`
      SELECT CourseID, Title, Code, Mode, Duration, FeeUSD, Status 
      FROM LMS_Courses 
      WHERE Status = 'ACTIVE'
    `);

    // Get invoices tied to this affiliate's students
    let invoices: any[] = [];
    try {
      const invoicesResult = await req.query(`
        SELECT i.* 
        FROM Invoices i
        JOIN LMS_Users u ON i.StudentName = u.FirstName + ' ' + u.LastName
        WHERE (u.Country = @Country OR @Country = '')
        ORDER BY i.IssuedDate DESC
      `);
      invoices = invoicesResult.recordset;
    } catch (e) {
      console.error("Invoices error in affiliate dashboard:", e);
    }

    return NextResponse.json({ 
      success: true, 
      students: studentsResult.recordset,
      courses: coursesResult.recordset,
      invoices: invoices
    });
  } catch (e: any) {
    return NextResponse.json({ success: false, message: e.message }, { status: 500 });
  }
}
