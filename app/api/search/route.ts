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
    const usersRes = await pool.query(`
      SELECT UserID as Id, FirstName + ' ' + LastName as Title, Email as Subtitle, 'User' as Type
      FROM LMS_Users 
      WHERE FirstName LIKE $1 OR LastName LIKE $2 OR Email LIKE $3
     LIMIT 10`, [qStr, qStr, qStr]);
    
    // Search Courses
    const coursesRes = await pool.query(`
      SELECT CourseID as Id, Title, Code as Subtitle, 'Course' as Type
      FROM LMS_Courses 
      WHERE Title LIKE $1 OR Code LIKE $2
     LIMIT 10`, [qStr, qStr]);
    
    // Search Invoices
    const invoicesRes = await pool.query(`
      SELECT InvoiceID as Id, InvoiceNo as Title, StudentName as Subtitle, 'Invoice' as Type
      FROM Invoices 
      WHERE InvoiceNo LIKE $1 OR StudentName LIKE $2 OR Organization LIKE $3
     LIMIT 10`, [qStr, qStr, qStr]);
    
    // Search Certificates
    const certsRes = await pool.query(`
      SELECT CertificateID as Id, CertificateNo as Title, ParticipantName as Subtitle, 'Certificate' as Type
      FROM Certificates
      WHERE CertificateNo LIKE $1 OR ParticipantName LIKE $2
     LIMIT 10`, [qStr, qStr]);

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
