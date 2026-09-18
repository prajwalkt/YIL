import { NextRequest, NextResponse } from 'next/server';
import { parseAndSanitizeBody } from '../../../library/validation';
import { getUserFromRequest, requireRole, auditLog } from '../../../library/auth';
import { getConnection } from '../../../library/db';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  const user = getUserFromRequest(request);
  if (!requireRole(user, 'TRAINER', 'ADMIN', 'TM')) {
    return NextResponse.json({ success: false, message: 'Access denied' }, { status: 403 });
  }
  const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';

  try {
    const { registrationId, calendarId } = await parseAndSanitizeBody(request);
    if (!registrationId || !calendarId) {
      return NextResponse.json({ success: false, message: 'Registration ID and Calendar ID are required' }, { status: 400 });
    }

    const pool = await getConnection();
    
    // 1. Get Registration Details
    const regCheck = await pool.query(`SELECT * FROM Registrations WHERE Id = $1 AND Status IN ('APPROVED', 'WAITING_BATCH')`, [registrationId]);
    
    if (regCheck.recordset.length === 0) {
      return NextResponse.json({ success: false, message: 'Registration not found or not approved' }, { status: 404 });
    }
    const reg = regCheck.recordset[0];

    // 2. Get Course ID from Course Title
    const courseCheck = await pool.query(`SELECT CourseID FROM LMS_Courses WHERE Title = $1`, [reg.Course]);
    const courseId = courseCheck.recordset.length > 0 ? courseCheck.recordset[0].CourseID : 0;

    if (courseId === 0) {
      return NextResponse.json({ success: false, message: 'Course mapping failed' }, { status: 400 });
    }

    // 3. Ensure student exists in LMS_Users
    const userCheck = await pool.query(`SELECT UserID FROM LMS_Users WHERE Email = $1`, [reg.Email]);
    let studentId = 0;
    if (userCheck.recordset.length === 0) {
      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash('Test@1234!', salt);
      const nameParts = reg.Name.split(' ');
      const fName = nameParts[0];
      const lName = nameParts.slice(1).join(' ');
      
      const insertUser = await pool.query(`
          INSERT INTO LMS_Users (FirstName, LastName, Email, Phone, PasswordHash, Role, Organization, Country, IsApproved, IsActive)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 1, 1)
          RETURNING UserID
        `, [fName, lName, reg.Email, reg.Phone || '', hash, 'STUDENT', reg.Organization || '', reg.Country || '']);
      studentId = insertUser.recordset[0].UserID;
    } else {
      studentId = userCheck.recordset[0].UserID;
    }

    // 4. Check Batch Capacity
    const calCheck = await pool.query(`SELECT CurrentEnrolled, MaxParticipants FROM TrainingCalendar WHERE CalendarID = $1`, [calendarId]);
    if (calCheck.recordset.length === 0) {
      return NextResponse.json({ success: false, message: 'Batch not found' }, { status: 404 });
    }
    const batch = calCheck.recordset[0];
    if (batch.CurrentEnrolled >= batch.MaxParticipants) {
      return NextResponse.json({ success: false, message: 'This batch is already at full capacity' }, { status: 400 });
    }

    // 5. Check if already enrolled in this exact batch
    const existingEnrollment = await pool.query(`SELECT EnrollmentID FROM Enrollments WHERE StudentID = $1 AND CalendarID = $2`, [studentId, calendarId]);
    
    if (existingEnrollment.recordset.length > 0) {
      return NextResponse.json({ success: false, message: 'Student is already enrolled in this batch' }, { status: 400 });
    }

    // 6. Execute Assignment Transaction
    // Insert Enrollment
    await pool.query(`
        INSERT INTO Enrollments (StudentID, CourseID, RegistrationID, CalendarID, Status)
        VALUES ($1, $2, $3, $4, 'ENROLLED')
      `, [studentId, courseId, reg.Id, calendarId]);
      
    // Increment Batch Enrollment Count
    await pool.query(`UPDATE TrainingCalendar SET CurrentEnrolled = COALESCE(CurrentEnrolled, 0) + 1 WHERE CalendarID = $1`, [calendarId]);
      
    // Update Registration Status
    await pool.query(`UPDATE Registrations SET Status = 'ENROLLED' WHERE Id = $1`, [reg.Id]);

    await auditLog(user!.userId, user!.email, 'BATCH_ASSIGNED', 'TRAINING', `Assigned Reg ${reg.Id} to Batch ${calendarId}`, ip);
    
    return NextResponse.json({ success: true, message: 'Student successfully assigned to batch' });
  } catch (e: any) {
    console.error("Error in assign-batch API:", e);
    return NextResponse.json({ success: false, message: process.env.NODE_ENV === 'development' ? e.message : 'Internal Server Error' }, { status: 500 });
  }
}
