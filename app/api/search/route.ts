import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest, requireRole } from '../../library/auth';
import { getConnection } from '../../library/db';

export async function GET(request: NextRequest) {
  const user = getUserFromRequest(request);
  if (!requireRole(user, 'ADMIN', 'TM', 'FINANCE')) return NextResponse.json({ success: false, message: 'Access denied' }, { status: 403 });

  const url = new URL(request.url);
  const query = url.searchParams.get('q');
  
  if (!query || query.length < 2) {
    return NextResponse.json({ success: true, results: { users: [], courses: [], invoices: [] } });
  }

  try {
    const pool = await getConnection();
    const qStr = `%${query}%`;
    
    // Search Users
    const usersRes = await pool.request().input('Q', qStr).query(`
      SELECT TOP 10 UserID as Id, FirstName + ' ' + LastName as Title, Email as Subtitle, 'User' as Type
      FROM LMS_Users 
      WHERE FirstName LIKE @Q OR LastName LIKE @Q OR Email LIKE @Q
    `);
    
    // Search Courses
    const coursesRes = await pool.request().input('Q', qStr).query(`
      SELECT TOP 10 CourseID as Id, Title, Code as Subtitle, 'Course' as Type
      FROM LMS_Courses 
      WHERE Title LIKE @Q OR Code LIKE @Q
    `);
    
    // Search Invoices
    const invoicesRes = await pool.request().input('Q', qStr).query(`
      SELECT TOP 10 InvoiceID as Id, InvoiceNo as Title, StudentName as Subtitle, 'Invoice' as Type
      FROM Invoices 
      WHERE InvoiceNo LIKE @Q OR StudentName LIKE @Q OR Organization LIKE @Q
    `);
    
    // Search Certificates
    const certsRes = await pool.request().input('Q', qStr).query(`
      SELECT TOP 10 CertificateID as Id, CertificateNo as Title, ParticipantName as Subtitle, 'Certificate' as Type
      FROM Certificates
      WHERE CertificateNo LIKE @Q OR ParticipantName LIKE @Q
    `);

    const results = [
      ...usersRes.recordset,
      ...coursesRes.recordset,
      ...invoicesRes.recordset,
      ...certsRes.recordset
    ];

    return NextResponse.json({ success: true, results });
  } catch (e: any) {
    return NextResponse.json({ success: false, message: process.env.NODE_ENV === 'development' ? e.message : 'Internal Server Error' }, { status: 500 });
  }
}
