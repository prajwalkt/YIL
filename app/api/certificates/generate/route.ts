import { NextRequest, NextResponse } from 'next/server';
import { parseAndSanitizeBody } from '../../../library/validation';
import { getUserFromRequest, requireRole, auditLog } from '../../../library/auth';
import { getConnection } from '../../../library/db';

export async function POST(request: NextRequest) {
  const user = getUserFromRequest(request);
  if (!requireRole(user, 'ADMIN', 'TM')) return NextResponse.json({ success: false, message: 'Access denied' }, { status: 403 });

  try {
    const { enrollmentId } = await parseAndSanitizeBody(request);
    if (!enrollmentId) return NextResponse.json({ success: false, message: 'Missing enrollmentId' }, { status: 400 });

    const pool = await getConnection();
    
    // Validate completion criteria
    const enrollRes = await pool.query(`
      SELECT e.*, u.FirstName, u.LastName, u.Email, c.Title as CourseName, c.Mode
      FROM Enrollments e
      JOIN LMS_Users u ON e.StudentID = u.UserID
      JOIN LMS_Courses c ON e.CourseID = c.CourseID
      WHERE e.EnrollmentID = $1
    `, [enrollmentId]);
    
    if (enrollRes.recordset.length === 0) return NextResponse.json({ success: false, message: 'Enrollment not found' }, { status: 404 });
    const enrollment = enrollRes.recordset[0];
    
    // Check if certificate already exists
    const certCheck = await pool.query(`SELECT 1 FROM Certificates WHERE EnrollmentID = $1`, [enrollmentId]);
    if (certCheck.recordset.length > 0) return NextResponse.json({ success: false, message: 'Certificate already generated' }, { status: 400 });
    
    // Check if status is COMPLETED
    if (enrollment.Status !== 'COMPLETED') {
      return NextResponse.json({ success: false, message: 'Student has not completed the course yet.' }, { status: 400 });
    }

    // Generate Certificate
    const certNo = `YTS-CERT-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}-${enrollmentId}`;
    const issueDate = new Date().toISOString().split('T')[0];
    const pdfPath = `/uploads/certificates/${certNo}.pdf`; // Mock path, in real scenario generate PDF
    
    await pool.query(`
        INSERT INTO Certificates (CertificateNo, StudentID, EnrollmentID, CourseID, ParticipantName, CourseName, TrainerName, IssueDate, PDFPath, IssuedBy)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      `, [certNo, enrollment.StudentID, enrollmentId, enrollment.CourseID, `${enrollment.FirstName} ${enrollment.LastName}`, enrollment.CourseName, 'YTS Master Trainer', issueDate, pdfPath, user!.userId]);

    await auditLog(user!.userId, user!.email, 'CERTIFICATE_GENERATED', 'CERTIFICATES', `Generated cert ${certNo} for Enrollment ${enrollmentId}`, '127.0.0.1');

    return NextResponse.json({ success: true, message: 'Certificate generated successfully', certificateNo: certNo });
  } catch (e: any) {
    return NextResponse.json({ success: false, message: process.env.NODE_ENV === 'development' ? e.message : 'Internal Server Error' }, { status: 500 });
  }
}
