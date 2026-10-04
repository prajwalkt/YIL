import { NextRequest, NextResponse } from 'next/server';
import { getConnection } from '../../../library/db';
import { getUserFromRequest, requireRole } from '../../../library/auth';

export async function GET(request: NextRequest) {
  const user = getUserFromRequest(request);
  if (!requireRole(user, 'TRAINER')) {
    return NextResponse.json({ success: false, message: 'Access denied' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const enrollmentId = searchParams.get('enrollmentId');

  if (!enrollmentId) {
    return NextResponse.json({ success: false, message: 'Missing enrollmentId' }, { status: 400 });
  }

  try {
    const pool = await getConnection();
    
    // Get student ID and course ID from enrollment
    const enrollment = await pool.request()
      .input('EnrollmentID', Number(enrollmentId))
      .query(`SELECT StudentID, CourseID FROM Enrollments WHERE EnrollmentID = @EnrollmentID`);
      
    if (enrollment.recordset.length === 0) {
      return NextResponse.json({ success: false, message: 'Enrollment not found' }, { status: 404 });
    }
    
    const { StudentID, CourseID } = enrollment.recordset[0];

    // Get feedback
    const feedback = await pool.request()
      .input('StudentID', StudentID)
      .input('CourseID', CourseID)
      .query(`SELECT * FROM Feedback WHERE StudentID = @StudentID AND CourseID = @CourseID`);

    if (feedback.recordset.length === 0) {
      return NextResponse.json({ success: false, message: 'No feedback found for this enrollment' }, { status: 404 });
    }

    return NextResponse.json({ success: true, feedback: feedback.recordset[0] });
  } catch (e: any) {
    return NextResponse.json({ success: false, message: e.message }, { status: 500 });
  }
}
