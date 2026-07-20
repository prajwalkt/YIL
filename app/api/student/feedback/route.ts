import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest, requireRole } from '../../../library/auth';
import { getConnection } from '../../../library/db';

// GET: Return pending feedback forms for enrolled courses
export async function GET(request: NextRequest) {
  const user = getUserFromRequest(request);
  if (!requireRole(user, 'STUDENT', 'AFFILIATE')) {
    return NextResponse.json({ success: false, message: 'Access denied' }, { status: 403 });
  }

  try {
    const pool = await getConnection();

    // Get enrolled courses
    const enrolled = await pool.request()
      .input('StudentID', user!.userId)
      .query(`
        SELECT e.CourseID, c.Title as CourseTitle, e.EnrollmentID,
               u.FirstName + ' ' + u.LastName as TrainerName, u.UserID as TrainerID,
               tc.StartDate, tc.EndDate
        FROM Enrollments e
        JOIN LMS_Courses c ON c.CourseID = e.CourseID
        LEFT JOIN TrainingCalendar tc ON tc.CalendarID = e.CalendarID
        LEFT JOIN LMS_Users u ON u.UserID = tc.TrainerID
        WHERE e.StudentID = @StudentID
          AND e.Status IN ('IN_PROGRESS', 'COMPLETED')
      `);

    // Check which courses already have feedback
    const submitted = await pool.request()
      .input('StudentID', user!.userId)
      .query(`SELECT CourseID FROM Feedback WHERE StudentID = @StudentID`);

    const submittedCourseIds = new Set(submitted.recordset.map((r: any) => r.CourseID));

    const pendingFeedback = enrolled.recordset.filter((e: any) => !submittedCourseIds.has(e.CourseID));
    const completedFeedback = enrolled.recordset.filter((e: any) => submittedCourseIds.has(e.CourseID));

    return NextResponse.json({
      success: true,
      pending: pendingFeedback,
      submitted: completedFeedback,
    });
  } catch (e: any) {
    return NextResponse.json({ success: false, message: e.message }, { status: 500 });
  }
}

// POST: Submit feedback for a course
export async function POST(request: NextRequest) {
  const user = getUserFromRequest(request);
  if (!requireRole(user, 'STUDENT', 'AFFILIATE')) {
    return NextResponse.json({ success: false, message: 'Access denied' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { courseId, courseName, trainerId, trainerName, overallScore, contentScore, trainerScore, facilityScore, remarks, trainingDate } = body;

    if (!courseId || !overallScore) {
      return NextResponse.json({ success: false, message: 'Course and overall score are required' }, { status: 400 });
    }

    const pool = await getConnection();

    // Check if feedback already submitted
    const existing = await pool.request()
      .input('StudentID', user!.userId)
      .input('CourseID', Number(courseId))
      .query(`SELECT * FROM Feedback WHERE StudentID = @StudentID AND CourseID = @CourseID`);

    if (existing.recordset.length > 0) {
      return NextResponse.json({ success: false, message: 'You have already submitted feedback for this course.' }, { status: 400 });
    }

    // Get student info
    const studentInfo = await pool.request()
      .input('UserID', user!.userId)
      .query(`SELECT FirstName + ' ' + LastName as FullName FROM LMS_Users WHERE UserID = @UserID`);

    const participantName = studentInfo.recordset[0]?.FullName || user!.email;

    await pool.request()
      .input('StudentID', user!.userId)
      .input('ParticipantName', participantName)
      .input('CourseID', Number(courseId))
      .input('CourseName', courseName || '')
      .input('TrainerID', trainerId || null)
      .input('TrainerName', trainerName || '')
      .input('OverallScore', Number(overallScore))
      .input('ContentScore', Number(contentScore) || Number(overallScore))
      .input('TrainerScore', Number(trainerScore) || Number(overallScore))
      .input('FacilityScore', Number(facilityScore) || Number(overallScore))
      .input('Remarks', remarks || '')
      .input('TrainingDate', trainingDate || null)
      .query(`
        INSERT INTO Feedback (StudentID, ParticipantName, CourseID, CourseName, TrainerID, TrainerName, OverallScore, ContentScore, TrainerScore, FacilityScore, Remarks, TrainingDate, SubmittedAt)
        VALUES (@StudentID, @ParticipantName, @CourseID, @CourseName, @TrainerID, @TrainerName, @OverallScore, @ContentScore, @TrainerScore, @FacilityScore, @Remarks, @TrainingDate, GETDATE())
      `);

    return NextResponse.json({ success: true, message: 'Feedback submitted successfully! Thank you.' });
  } catch (e: any) {
    return NextResponse.json({ success: false, message: e.message }, { status: 500 });
  }
}
