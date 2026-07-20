import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest, requireRole, auditLog } from '../../../library/auth';
import { getConnection } from '../../../library/db';

export async function POST(request: NextRequest) {
  const user = getUserFromRequest(request);
  if (!requireRole(user, 'TRAINER', 'ADMIN', 'TM')) {
    return NextResponse.json({ success: false, message: 'Access denied' }, { status: 403 });
  }
  const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';

  try {
    const { registrationId, calendarId } = await request.json();
    if (!registrationId || !calendarId) {
      return NextResponse.json({ success: false, message: 'Registration ID and Calendar ID are required' }, { status: 400 });
    }

    const pool = await getConnection();
    
    // 1. Get Registration Details
    const regCheck = await pool.request()
      .input('RegID', registrationId)
      .query(`SELECT * FROM Registrations WHERE Id = @RegID AND Status IN ('APPROVED', 'WAITING_BATCH')`);
    
    if (regCheck.recordset.length === 0) {
      return NextResponse.json({ success: false, message: 'Registration not found or not approved' }, { status: 404 });
    }
    const reg = regCheck.recordset[0];

    // 2. Get Course ID from Course Title
    const courseCheck = await pool.request().input('CourseTitle', reg.Course).query(`SELECT CourseID FROM LMS_Courses WHERE Title = @CourseTitle`);
    const courseId = courseCheck.recordset.length > 0 ? courseCheck.recordset[0].CourseID : 0;

    if (courseId === 0) {
      return NextResponse.json({ success: false, message: 'Course mapping failed' }, { status: 400 });
    }

    // 3. Ensure student exists in LMS_Users
    const userCheck = await pool.request().input('Email', reg.Email).query(`SELECT UserID FROM LMS_Users WHERE Email = @Email`);
    let studentId = 0;
    if (userCheck.recordset.length === 0) {
      const salt = await require('bcryptjs').genSalt(10);
      const hash = await require('bcryptjs').hash('Test@1234!', salt);
      const nameParts = reg.Name.split(' ');
      const fName = nameParts[0];
      const lName = nameParts.slice(1).join(' ');
      
      const insertUser = await pool.request()
        .input('FirstName', fName)
        .input('LastName', lName)
        .input('Email', reg.Email)
        .input('Phone', reg.Phone || '')
        .input('PasswordHash', hash)
        .input('Role', 'STUDENT')
        .input('Organization', reg.Organization || '')
        .input('Country', reg.Country || '')
        .query(`
          INSERT INTO LMS_Users (FirstName, LastName, Email, Phone, PasswordHash, Role, Organization, Country, IsApproved, IsActive)
          OUTPUT INSERTED.UserID
          VALUES (@FirstName, @LastName, @Email, @Phone, @PasswordHash, @Role, @Organization, @Country, 1, 1)
        `);
      studentId = insertUser.recordset[0].UserID;
    } else {
      studentId = userCheck.recordset[0].UserID;
    }

    // 4. Check Batch Capacity
    const calCheck = await pool.request().input('CalendarID', calendarId).query(`SELECT CurrentEnrolled, MaxParticipants FROM TrainingCalendar WHERE CalendarID = @CalendarID`);
    if (calCheck.recordset.length === 0) {
      return NextResponse.json({ success: false, message: 'Batch not found' }, { status: 404 });
    }
    const batch = calCheck.recordset[0];
    if (batch.CurrentEnrolled >= batch.MaxParticipants) {
      return NextResponse.json({ success: false, message: 'This batch is already at full capacity' }, { status: 400 });
    }

    // 5. Check if already enrolled in this exact batch
    const existingEnrollment = await pool.request()
      .input('StudentID', studentId)
      .input('CalendarID', calendarId)
      .query(`SELECT EnrollmentID FROM Enrollments WHERE StudentID = @StudentID AND CalendarID = @CalendarID`);
    
    if (existingEnrollment.recordset.length > 0) {
      return NextResponse.json({ success: false, message: 'Student is already enrolled in this batch' }, { status: 400 });
    }

    // 6. Execute Assignment Transaction
    // Insert Enrollment
    await pool.request()
      .input('StudentID', studentId)
      .input('CourseID', courseId)
      .input('RegistrationID', reg.Id)
      .input('CalendarID', calendarId)
      .query(`
        INSERT INTO Enrollments (StudentID, CourseID, RegistrationID, CalendarID, Status)
        VALUES (@StudentID, @CourseID, @RegistrationID, @CalendarID, 'ENROLLED')
      `);
      
    // Increment Batch Enrollment Count
    await pool.request()
      .input('CalendarID', calendarId)
      .query(`UPDATE TrainingCalendar SET CurrentEnrolled = ISNULL(CurrentEnrolled, 0) + 1 WHERE CalendarID = @CalendarID`);
      
    // Update Registration Status
    await pool.request()
      .input('RegID', reg.Id)
      .query(`UPDATE Registrations SET Status = 'ENROLLED' WHERE Id = @RegID`);

    await auditLog(user!.userId, user!.email, 'BATCH_ASSIGNED', 'TRAINING', `Assigned Reg ${reg.Id} to Batch ${calendarId}`, ip);
    
    return NextResponse.json({ success: true, message: 'Student successfully assigned to batch' });
  } catch (e: any) {
    console.error("Error in assign-batch API:", e);
    return NextResponse.json({ success: false, message: e.message }, { status: 500 });
  }
}
