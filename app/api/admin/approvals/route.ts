import { NextRequest, NextResponse } from 'next/server';
import { parseAndSanitizeBody } from '../../../library/validation';
import { getUserFromRequest, requireRole, auditLog } from '../../../library/auth';
import { getConnection } from '../../../library/db';
import { sendEmail, sendApprovalEmail, sendWhatsApp } from '../../../library/email';
import { sendMultiChannelNotification } from '../../../library/notificationService';
import bcrypt from 'bcryptjs';
import { checkRateLimit, getClientIP, RateLimits } from '../../../library/rateLimiter';

export const dynamic = 'force-dynamic';

// ── Utility: Generate secure temporary password ──
function generateTempPassword(): string {
  const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const lower = 'abcdefghjkmnpqrstuvwxyz';
  const digits = '23456789';
  const special = '@#!%*?';
  const all = upper + lower + digits + special;
  let password = '';
  // Guarantee at least one of each type
  password += upper[Math.floor(Math.random() * upper.length)];
  password += lower[Math.floor(Math.random() * lower.length)];
  password += digits[Math.floor(Math.random() * digits.length)];
  password += special[Math.floor(Math.random() * special.length)];
  // Fill remaining 8 chars
  for (let i = 0; i < 8; i++) {
    password += all[Math.floor(Math.random() * all.length)];
  }
  // Shuffle
  return password.split('').sort(() => Math.random() - 0.5).join('');
}

export async function GET(request: NextRequest) {
  const user = getUserFromRequest(request);
  if (!requireRole(user, 'ADMIN', 'FINANCE', 'TM')) return NextResponse.json({ success: false, message: 'Access denied' }, { status: 403 });

  // Rate limit: manual testing threshold for GET /api/admin/approvals
  const rateCheck = checkRateLimit({ context: 'admin_approvals_get', identifier: String(user!.userId), maxRequests: 5, windowMs: 10 * 1000 });
  if (!rateCheck.allowed) {
    return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 });
  }

  try {
    const pool = await getConnection();
    const req = pool.request();
    let query = `
      SELECT r.*, pt.TransactionID
      FROM Registrations r
      LEFT JOIN (
        SELECT RegistrationID, TransactionID,
               ROW_NUMBER() OVER(PARTITION BY RegistrationID ORDER BY CreatedAt DESC) as rn
        FROM PaymentTracking
      ) pt ON r.Id = pt.RegistrationID AND pt.rn = 1
      WHERE 1=1
    `;

    if (user!.role === 'FINANCE') {
      query += ` AND r.Status = 'PENDING'`;
    } else if (user!.role === 'TM') {
      query += ` AND r.Status IN ('FINANCE_APPROVED', 'WAITING_BATCH')`;
    } else if (user!.role === 'ADMIN') {
      query += ` AND r.Status IN ('TM_APPROVED', 'WAITING_BATCH')`;
    }

    query += ` ORDER BY r.CreatedAt DESC`;

    const result = await req.query(query);

    // Enrich with full payment data (proof path, method)
    const registrations = result.recordset;
    const enriched = await Promise.all(registrations.map(async (reg: any) => {
      const pt = await pool.request()
        .input('RegID', reg.Id)
        .query(`SELECT TOP 1 TransactionID, PaymentProofPath, PaymentMethod, Status as PaymentStatus, CreatedAt as PaidAt FROM PaymentTracking WHERE RegistrationID = @RegID ORDER BY CreatedAt DESC`);
      if (pt.recordset.length > 0) {
        return { ...reg, ...pt.recordset[0] };
      }
      return reg;
    }));

    return NextResponse.json({ success: true, registrations: enriched });
  } catch (e: any) {
    console.error('Approvals GET error:', e);
    return NextResponse.json({ success: false, message: 'Failed to fetch registrations' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const user = getUserFromRequest(request);
  if (!requireRole(user, 'ADMIN', 'FINANCE', 'TM')) return NextResponse.json({ success: false, message: 'Access denied' }, { status: 403 });
  const ip = getClientIP(request);

  // Rate limit: admin operations
  const rateCheck = checkRateLimit({ ...RateLimits.ADMIN_API, identifier: `${user!.userId}:approvals` });
  if (!rateCheck.allowed) {
    return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 });
  }

  try {
    const body = await parseAndSanitizeBody(request);
    let { registrationId, action, remarks, selectedSlotId, confirmRequestedDates, trainerId } = body;

    if (!registrationId || !action) {
      return NextResponse.json({ success: false, message: 'Missing parameters' }, { status: 400 });
    }

    const pool = await getConnection();
    const regResult = await pool.request().input('Id', Number(registrationId)).query(`SELECT * FROM Registrations WHERE Id = @Id`);

    if (regResult.recordset.length === 0) {
      return NextResponse.json({ success: false, message: 'Registration not found' }, { status: 404 });
    }

    const reg = regResult.recordset[0];
    selectedSlotId = selectedSlotId || reg.SelectedSlotID;

    if (action === 'APPROVE' && confirmRequestedDates && reg.PreferredStartDate && reg.PreferredEndDate) {
      // Find course ID
      const courseCheck = await pool.request().input('CourseTitle', reg.Course).query(`SELECT CourseID FROM LMS_Courses WHERE Title = @CourseTitle`);
      let cId = courseCheck.recordset.length > 0 ? courseCheck.recordset[0].CourseID : null;

      // Create confirmed TrainingCalendar batch
      const newCal = await pool.request()
        .input('CourseID', cId)
        .input('Title', reg.Course)
        .input('TrainingMode', reg.TrainingMode)
        .input('StartDate', reg.PreferredStartDate)
        .input('EndDate', reg.PreferredEndDate)
        .input('MaxParticipants', 20)
        .input('TMConfirmedBy', user!.userId)
        .input('TrainerID', trainerId ? Number(trainerId) : null)
        .query(`
          INSERT INTO TrainingCalendar 
          (CourseID, Title, TrainingType, StartDate, EndDate, Status, TMConfirmed, TMConfirmedAt, TMConfirmedBy, MaxParticipants, CurrentEnrolled, TrainerID)
          OUTPUT INSERTED.CalendarID
          VALUES (@CourseID, @Title, @TrainingMode, @StartDate, @EndDate, 'SCHEDULED', 1, GETDATE(), @TMConfirmedBy, @MaxParticipants, 0, @TrainerID)
        `);
      selectedSlotId = newCal.recordset[0].CalendarID;
    } else if (action === 'APPROVE' && selectedSlotId && (user!.role === 'TM' || user!.role === 'ADMIN')) {
      // If TM or Admin approves and a batch is selected, mark that batch as confirmed
      await pool.request()
        .input('SlotID', Number(selectedSlotId))
        .input('TMConfirmedBy', user!.userId)
        .query(`
          UPDATE TrainingCalendar 
          SET TMConfirmed = 1, TMConfirmedAt = GETDATE(), TMConfirmedBy = @TMConfirmedBy 
          WHERE CalendarID = @SlotID
        `);
    }

    let newStatus = reg.Status;
    const req = pool.request();
    req.input('Id', Number(registrationId));
    req.input('ActionBy', user!.email);
    req.input('Remarks', remarks || '');
    if (selectedSlotId) req.input('SelectedSlotID', Number(selectedSlotId));

    let query = '';
    if (selectedSlotId) {
      query = `UPDATE Registrations SET SelectedSlotID = @SelectedSlotID, Status = @NewStatus`;
    } else {
      query = `UPDATE Registrations SET Status = @NewStatus`;
    }
    if (trainerId) {
      req.input('TrainerId', Number(trainerId));
      query += `, TrainerId = @TrainerId`;
    }

    if (action === 'APPROVE') {
      if (reg.Status === 'PENDING' && user!.role === 'FINANCE') {
        newStatus = 'FINANCE_APPROVED';
        query += `, FinanceApprovedBy = @ActionBy, FinanceApprovedAt = GETDATE(), ApprovalRemarks = @Remarks`;
      } else if (reg.Status === 'FINANCE_APPROVED' && user!.role === 'TM') {
        newStatus = 'TM_APPROVED';
        query += `, TMApprovedBy = @ActionBy, TMApprovedAt = GETDATE(), ApprovalRemarks = @Remarks`;
      } else if (reg.Status === 'TM_APPROVED' && user!.role === 'ADMIN') {
        newStatus = 'APPROVED';
        query += `, AdminApprovedBy = @ActionBy, AdminApprovedAt = GETDATE(), ApprovalRemarks = @Remarks`;
      } else if (reg.Status === 'WAITING_BATCH' && user!.role === 'TM') {
        newStatus = 'TM_APPROVED';
        query += `, TMApprovedBy = @ActionBy, TMApprovedAt = GETDATE(), ApprovalRemarks = @Remarks`;
      } else if (reg.Status === 'WAITING_BATCH' && user!.role === 'ADMIN') {
        newStatus = 'APPROVED';
        query += `, AdminApprovedBy = @ActionBy, AdminApprovedAt = GETDATE(), ApprovalRemarks = @Remarks`;
      } else if (reg.Status === 'FINANCE_APPROVED' && user!.role === 'ADMIN') {
        newStatus = 'APPROVED';
        query += `, AdminApprovedBy = @ActionBy, AdminApprovedAt = GETDATE(), ApprovalRemarks = @Remarks`;
      } else {
        return NextResponse.json({ success: false, message: 'Invalid state transition for your role' }, { status: 400 });
      }
    } else if (action === 'REJECT') {
      if (user!.role === 'FINANCE') {
        newStatus = 'FINANCE_REJECTED';
        query += `, FinanceApprovedBy = @ActionBy, FinanceApprovedAt = GETDATE(), ApprovalRemarks = @Remarks`;
      } else if (user!.role === 'TM') {
        newStatus = 'TM_REJECTED';
        query += `, TMApprovedBy = @ActionBy, TMApprovedAt = GETDATE(), ApprovalRemarks = @Remarks`;
      } else if (user!.role === 'ADMIN') {
        newStatus = 'REJECTED';
        query += `, AdminApprovedBy = @ActionBy, AdminApprovedAt = GETDATE(), ApprovalRemarks = @Remarks`;
      }
    }

    query += ` WHERE Id = @Id`;
    req.input('NewStatus', newStatus);
    await req.query(query);

    // ── Email Notifications ──
    if (newStatus === 'FINANCE_APPROVED') {
      const tmUsers = await pool.request().query(`SELECT Email FROM LMS_Users WHERE Role='TM' AND IsActive=1`);
      for (const t of tmUsers.recordset) {
        await sendEmail({
          to: t.Email,
          subject: `Pending TM Approval — ${reg.Name}`,
          html: `<p>Finance has approved the registration for <strong>${reg.Name}</strong> (${reg.Course}). It is now pending your approval.</p>`,
        });
      }
    } else if (newStatus === 'TM_APPROVED') {
      const adminUsers = await pool.request().query(`SELECT Email FROM LMS_Users WHERE Role='ADMIN' AND IsActive=1`);
      for (const a of adminUsers.recordset) {
        await sendEmail({
          to: a.Email,
          subject: `Pending Admin Approval — ${reg.Name}`,
          html: `<p>Training Manager has approved the registration for <strong>${reg.Name}</strong> (${reg.Course}). It is now pending final Admin approval.</p>`,
        });
      }
    } else if (newStatus === 'APPROVED') {
      const { getCourseDurationDays } = await import('../../../library/courseDurations');

      // ── Determine role from explicit RegistrationType field ──
      // SELF registration → STUDENT
      // ORGANIZATION registration → AFFILIATE
      const registrationType = (reg.RegistrationType || reg.SponsoredBy || 'SELF').toUpperCase();
      const userRole = registrationType === 'ORGANIZATION' ? 'AFFILIATE' : 'STUDENT';

      // ── Find existing user by email ──
      const userCheck = await pool.request()
        .input('Email', reg.Email)
        .query(`SELECT UserID, Role, IsActive FROM LMS_Users WHERE Email = @Email`);

      let studentId = 0;
      const tempPassword = generateTempPassword();

      const hash = await bcrypt.hash(tempPassword, 12);
      const isNewAccount = userCheck.recordset.length === 0;

      if (isNewAccount) {
        // ── CREATE new user account ──
        console.log(`[APPROVALS] Email ${reg.Email} not found in LMS_Users. Creating BRAND NEW user account.`);
        const nameParts = (reg.Name || '').split(' ');
        const fName = nameParts[0] || '';
        const lName = nameParts.slice(1).join(' ') || '';

        const insertUser = await pool.request()
          .input('FirstName', fName)
          .input('LastName', lName)
          .input('Email', reg.Email)
          .input('Phone', reg.Phone || '')
          .input('PasswordHash', hash)
          .input('Role', userRole)
          .input('Organization', reg.Organization || '')
          .input('Country', reg.Country || '')
          .query(`
            INSERT INTO LMS_Users (FirstName, LastName, Email, Phone, PasswordHash, Role, Organization, Country, IsApproved, IsActive, MustChangePassword)
            OUTPUT INSERTED.UserID
            VALUES (@FirstName, @LastName, @Email, @Phone, @PasswordHash, @Role, @Organization, @Country, 1, 1, 1)
          `);
        studentId = insertUser.recordset[0].UserID;
        console.log(`[APPROVALS] Successfully created new user ${reg.Email} with UserID ${studentId}.`);

        // Insert welcome message with temporary password into Notification Centre
        await pool.request()
          .input('SenderID', user!.userId)
          .input('ReceiverID', studentId)
          .input('Subject', 'Your YTS Account is Ready')
          .input('Body', `Welcome to Yokogawa Training Services! Your account has been created successfully.\n\nUsername: ${reg.Email}\nTemporary Password: ${tempPassword}\n\nPlease login and change your password immediately.`)
          .query(`
            INSERT INTO Messages (SenderID, ReceiverID, Subject, Body)
            VALUES (@SenderID, @ReceiverID, @Subject, @Body)
          `);
      } else {
        // ── EXISTING user: force password reset and update latest identity ──
        studentId = userCheck.recordset[0].UserID;
        console.log(`[APPROVALS] Email ${reg.Email} ALREADY EXISTS in LMS_Users. Updating identity and resetting password for UserID ${studentId}.`);
        
        const nameParts = (reg.Name || '').split(' ');
        const fName = nameParts[0] || '';
        const lName = nameParts.slice(1).join(' ') || '';

        await pool.request()
          .input('UserID', studentId)
          .input('PasswordHash', hash)
          .input('Role', userRole)
          .input('FirstName', fName)
          .input('LastName', lName)
          .input('Organization', reg.Organization || '')
          .input('Country', reg.Country || '')
          .input('Phone', reg.Phone || '')
          .query(`
            UPDATE LMS_Users 
            SET 
              IsApproved = 1, 
              IsActive = 1, 
              PasswordHash = @PasswordHash, 
              MustChangePassword = 1, 
              Role = @Role,
              FirstName = @FirstName,
              LastName = @LastName,
              Organization = @Organization,
              Country = @Country,
              Phone = @Phone
            WHERE UserID = @UserID
          `);
      }

      // ── Link the approved registration back to the user record ──
      await pool.request()
        .input('UserID', studentId)
        .input('RegId', reg.Id)
        .query(`UPDATE Registrations SET LinkedUserID = @UserID WHERE Id = @RegId`);

      // ── PDF GENERATION MOVED BELOW DATES ──

      // ── Compute course access dates from calendar or today ──
      const durationDays = getCourseDurationDays(reg.Course);
      let accessStart: string | null = null;
      let accessEnd: string | null = null;

      if (reg.SelectedSlotID) {
        // Try to get actual training calendar dates
        const slotResult = await pool.request()
          .input('CalendarID', reg.SelectedSlotID)
          .query(`SELECT TOP 1 StartDate, EndDate FROM TrainingCalendar WHERE CalendarID = @CalendarID`);
        if (slotResult.recordset.length > 0) {
          accessStart = slotResult.recordset[0].StartDate;
          // Use the larger of: calendar EndDate or StartDate + durationDays
          const calEnd = new Date(slotResult.recordset[0].EndDate);
          const computedEnd = new Date(slotResult.recordset[0].StartDate);
          computedEnd.setDate(computedEnd.getDate() + durationDays);
          accessEnd = (computedEnd > calEnd ? computedEnd : calEnd).toISOString().split('T')[0];
        }
      }
      // Fallback: access starts today
      if (!accessStart) {
        const today = new Date();
        const end = new Date();
        end.setDate(today.getDate() + durationDays);
        accessStart = today.toISOString().split('T')[0];
        accessEnd = end.toISOString().split('T')[0];
      }

      // ── Auto-enroll into course ──
      const courseCheck = await pool.request()
        .input('CourseTitle', reg.Course)
        .query(`SELECT CourseID FROM LMS_Courses WHERE Title = @CourseTitle`);

      let courseId = 0;
      if (courseCheck.recordset.length > 0) {
        courseId = courseCheck.recordset[0].CourseID;
      } else {
        // Dynamically create missing course
        const code = reg.Course.substring(0, 4).toUpperCase() + Math.floor(Math.random() * 1000);
        const insertCourse = await pool.request()
          .input('Title', reg.Course)
          .input('Code', code)
          .input('Mode', reg.TrainingMode || 'Offline Training')
          .input('Duration', durationDays)
          .query(`
            INSERT INTO LMS_Courses (Title, Code, Description, Mode, Duration, FeeUSD, FeeINR, Category, Status)
            OUTPUT INSERTED.CourseID
            VALUES (@Title, @Code, 'Dynamically created course', @Mode, @Duration, 0, 0, 'General', 'ACTIVE')
          `);
        courseId = insertCourse.recordset[0].CourseID;
        console.log(`[APPROVALS] Dynamically created course '${reg.Course}' with ID ${courseId}`);
      }

      try {
        // Use MERGE to avoid duplicate-enrollment errors while still updating access dates
        await pool.request()
          .input('StudentID', studentId)
          .input('CourseID', courseId)
          .input('RegistrationID', reg.Id)
          .input('AccessStart', accessStart)
          .input('AccessEnd', accessEnd)
          .input('Duration', durationDays)
          .input('CalendarID', reg.SelectedSlotID ? Number(reg.SelectedSlotID) : null)
          .query(`
            MERGE Enrollments AS target
            USING (SELECT @StudentID AS StudentID, @CourseID AS CourseID) AS source
            ON target.StudentID = source.StudentID AND target.CourseID = source.CourseID
            WHEN MATCHED THEN
              UPDATE SET
                RegistrationID = @RegistrationID,
                AccessStartDate = @AccessStart,
                AccessEndDate = @AccessEnd,
                Duration = @Duration,
                CalendarID = @CalendarID,
                Status = 'ACTIVE'
            WHEN NOT MATCHED THEN
              INSERT (StudentID, CourseID, RegistrationID, AccessStartDate, AccessEndDate, Duration, CalendarID, Status, Progress)
              VALUES (@StudentID, @CourseID, @RegistrationID, @AccessStart, @AccessEnd, @Duration, @CalendarID, 'ACTIVE', 0);
          `);
      } catch (err) {
        console.warn(`[APPROVALS] Merge failed, likely already enrolled. Skipping MERGE:`, err);
      }
      
      // ── Find Trainer Name & Email ──
      let trainerName = '';
      let trainerEmail = '';
      if (trainerId || reg.TrainerId) {
        const tId = trainerId || reg.TrainerId;
        const tResult = await pool.request().input('TID', Number(tId)).query(`SELECT FirstName, LastName, Email FROM LMS_Users WHERE UserID = @TID`);
        if (tResult.recordset.length > 0) {
          trainerName = `${tResult.recordset[0].FirstName} ${tResult.recordset[0].LastName}`;
          trainerEmail = tResult.recordset[0].Email;
        }
      }

      // ── Generate Registration PDF ──
      const { generateRegistrationPDF } = await import('../../../library/pdfGenerator');
      const pdfPath = await generateRegistrationPDF({
        regId: reg.Id,
        userId: studentId,
        name: reg.Name,
        email: reg.Email,
        course: reg.Course,
        trainingMode: reg.TrainingMode || 'CILT',
        date: new Date().toLocaleDateString(),
        finalStartDate: accessStart ?? undefined,
        finalEndDate: accessEnd ?? undefined,
        trainerName: trainerName,
        status: newStatus
      });

      // ── Email to Trainer ──
      if (trainerEmail) {
        await sendEmail({
          to: trainerEmail,
          subject: `New Training Assignment: ${reg.Course}`,
          html: `<p>Dear ${trainerName},</p>
                 <p>You have been assigned to conduct a training for <strong>${reg.Course}</strong>.</p>
                 <p>Student: ${reg.Name} (${reg.Email})</p>
                 <p>Dates: ${accessStart} to ${accessEnd}</p>
                 <p>Please find the generated PDF attached.</p>`,
          attachments: [
            {
              filename: `Registration_${reg.Id}.pdf`,
              path: pdfPath
            }
          ]
        });
        console.log(`[APPROVALS] Emailed PDF to Trainer ${trainerEmail}`);
      }

      // ── Send Multi-Channel Notification ──
      const appUrl = process.env.APP_URL || 'http://localhost:3000';
      const portalPath = userRole === 'AFFILIATE' ? '/affiliate' : '/student';
      const loginUrl = `${appUrl}/login`;
      const portalUrl = `${appUrl}${portalPath}`;

      const subject = isNewAccount 
        ? '✅ Registration Approved — Your YTS Account is Ready' 
        : '✅ New Course Approved — Password Reset Required';

      const htmlBody = `
        <h3>🎉 Registration Approved!</h3>
        <p>Dear ${reg.Name}, your registration for <strong>${reg.Course}</strong> has been approved.</p>
        <p><strong>Training Mode:</strong> ${reg.TrainingMode || 'N/A'}</p>
        <p><strong>Access Period:</strong> ${accessStart} to ${accessEnd} (${durationDays} days)</p>
        <hr/>
        <p><strong>Your Portal:</strong> <a href="${portalUrl}">${portalUrl}</a> (${userRole === 'AFFILIATE' ? 'Affiliate Portal' : 'Student Portal'})</p>
        <p><strong>Login URL:</strong> <a href="${loginUrl}">${loginUrl}</a></p>
        <p><strong>Username:</strong> ${reg.Email}</p>
        <p><strong>Temporary Password:</strong> ${tempPassword}</p>
        <p><em>Please log in using the temporary password above. You will be required to change your password immediately upon your first login.</em></p>
      `;
      
      const textBody = `Hi ${reg.Name}, your registration for ${reg.Course} (${reg.TrainingMode || 'N/A'}) is approved! Access: ${accessStart} to ${accessEnd}. Login at ${loginUrl} with username: ${reg.Email} and temporary password: ${tempPassword}. You must change your password on first login.`;

      await sendMultiChannelNotification({
        userId: studentId,
        registrationId: reg.Id,
        email: reg.Email,
        phone: reg.Phone,
        type: 'ACCOUNT_ACTIVATION',
        subject: subject,
        html: htmlBody,
        text: textBody,
        recipientName: reg.Name,
      });

    } else if (newStatus.includes('REJECTED')) {
      await sendEmail({
        to: reg.Email,
        subject: `Registration Not Approved — ${reg.Course}`,
        html: `<p>Dear ${reg.Name},</p><p>We regret to inform you that your registration for <strong>${reg.Course}</strong> has been rejected at this time.</p><p>Remarks: ${remarks || 'None'}</p><p>Please contact YTS for further assistance.</p>`,
      });
    }

    await auditLog(user!.userId, user!.email, `REGISTRATION_${action}`, 'APPROVALS', `Registration ${registrationId} ${action}D by ${user!.role}`, ip);
    return NextResponse.json({ success: true, message: `Registration ${action.toLowerCase()}d successfully` });
  } catch (e: any) {
    console.error('Approvals PUT error:', e);
    return NextResponse.json({ success: false, message: 'Operation failed. Please try again.' }, { status: 500 });
  }
}
