import { NextRequest, NextResponse } from 'next/server';
import { parseAndSanitizeBody } from '../../../library/validation';
import { getUserFromRequest, requireRole, auditLog } from '../../../library/auth';
import { getConnection } from '../../../library/db';
import crypto from 'crypto';

export async function GET(request: NextRequest) {
  const user = getUserFromRequest(request);
  if (!user) return NextResponse.json({ success: false, message: 'Auth required' }, { status: 401 });

  try {
    const pool = await getConnection();
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId');

    let query = `SELECT c.*, u.FirstName + ' ' + u.LastName as StudentName, co.Title as CourseTitle FROM Certificates c LEFT JOIN LMS_Users u ON c.StudentID = u.UserID LEFT JOIN LMS_Courses co ON c.CourseID = co.CourseID WHERE 1=1`;
    const req = pool.request();

    if (user.role === 'STUDENT') {
      query += ` AND c.StudentID = @UserID`;
      req.input('UserID', user.userId);
    } else if (studentId) {
      query += ` AND c.StudentID = @StudentID`;
      req.input('StudentID', Number(studentId));
    }

    query += ` ORDER BY c.CreatedAt DESC`;
    const result = await req.query(query);
    return NextResponse.json({ success: true, certificates: result.recordset });
  } catch (e: any) {
    return NextResponse.json({ success: false, message: process.env.NODE_ENV === 'development' ? e.message : 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const user = getUserFromRequest(request);
  if (!requireRole(user, 'ADMIN', 'TM')) return NextResponse.json({ success: false, message: 'Access denied' }, { status: 403 });
  const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';

  try {
    const body = await parseAndSanitizeBody(request);
    const { studentId, courseId, participantName, courseName, trainerName, issueDate, validUntil } = body;

    if (!studentId || !courseId || !issueDate) {
      return NextResponse.json({ success: false, message: 'Student ID, Course ID, and Issue Date required' }, { status: 400 });
    }

    // Generate unique certificate number: YTS-2024-XXXXXX
    const year = new Date().getFullYear();
    const uniquePart = crypto.randomBytes(3).toString('hex').toUpperCase();
    const certNo = `YTS-${year}-${uniquePart}`;

    const pool = await getConnection();

    // Check if certificate already exists for this student+course
    const existing = await pool.query(`SELECT CertificateID FROM Certificates WHERE StudentID=$1 AND CourseID=$2`, [Number(studentId), Number(courseId)]);
    
    if (existing.recordset.length > 0) {
      return NextResponse.json({ success: false, message: 'Certificate already exists for this student and course' }, { status: 409 });
    }

    await pool.query(`INSERT INTO Certificates (CertificateNo,StudentID,CourseID,ParticipantName,CourseName,TrainerName,IssueDate,ValidUntil,IssuedBy) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`, [certNo, Number(studentId), Number(courseId), participantName || '', courseName || '', trainerName || '', issueDate, validUntil || null, user!.userId]);

    // Update enrollment status
    await pool.query(`UPDATE Enrollments SET Status='COMPLETED',ProgressPercent=100,CompletedAt=CURRENT_TIMESTAMP WHERE StudentID=$1 AND CourseID=$2`, [Number(studentId), Number(courseId)]);

    await auditLog(user!.userId, user!.email, 'CERTIFICATE_ISSUED', 'CERTIFICATES', `Issued ${certNo} to student ${studentId}`, ip);

    return NextResponse.json({ 
      success: true, 
      message: 'Certificate issued successfully',
      certificateNo: certNo
    });
  } catch (e: any) {
    return NextResponse.json({ success: false, message: process.env.NODE_ENV === 'development' ? e.message : 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const user = getUserFromRequest(request);
  if (!requireRole(user, 'ADMIN')) return NextResponse.json({ success: false, message: 'Access denied' }, { status: 403 });
  const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';

  try {
    const { searchParams } = new URL(request.url);
    const certId = searchParams.get('id');
    if (!certId) return NextResponse.json({ success: false, message: 'Certificate ID required' }, { status: 400 });

    const pool = await getConnection();
    await pool.query(`DELETE FROM Certificates WHERE CertificateID=$1`, [Number(certId)]);
    await auditLog(user!.userId, user!.email, 'CERTIFICATE_DELETED', 'CERTIFICATES', `Deleted certificate ${certId}`, ip);
    return NextResponse.json({ success: true, message: 'Certificate deleted' });
  } catch (e: any) {
    return NextResponse.json({ success: false, message: process.env.NODE_ENV === 'development' ? e.message : 'Internal Server Error' }, { status: 500 });
  }
}
