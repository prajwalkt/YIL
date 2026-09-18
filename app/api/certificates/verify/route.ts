import { NextRequest, NextResponse } from 'next/server';
import { getConnection } from '../../../library/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const identifier = searchParams.get('certNo') || searchParams.get('no');
    
    if (!identifier) return NextResponse.json({ success: false, message: 'Certificate identifier required' }, { status: 400 });

    const pool = await getConnection();
    const result = await pool.query(`
        SELECT c.CertificateNo, c.ParticipantName, c.CourseName, c.TrainerName, c.IssueDate, c.ValidUntil, u.Organization
        FROM Certificates c
        LEFT JOIN LMS_Users u ON c.StudentID = u.UserID
        WHERE c.CertificateNo = $1 OR c.VerificationHash = $2
      `, [identifier, identifier]);
    
    if (result.recordset.length === 0) {
      return NextResponse.json({ success: false, message: 'Invalid certificate number' }, { status: 404 });
    }

    return NextResponse.json({ success: true, certificate: result.recordset[0] });

  } catch (e: any) {
    return NextResponse.json({ success: false, message: process.env.NODE_ENV === 'development' ? e.message : 'Internal Server Error' }, { status: 500 });
  }
}
