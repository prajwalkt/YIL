import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest, requireRole, auditLog } from '../../../library/auth';
import { getConnection } from '../../../library/db';
import { sendEmail, sendApprovalEmail, sendWhatsApp } from '../../../library/email';
import { sendMultiChannelNotification } from '../../../library/notificationService';
import { checkRateLimit, getClientIP, RateLimits } from '../../../library/rateLimiter';

// ── Utility: Generate secure temporary password ──
function generateTempPassword(): string {
  const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const lower = 'abcdefghjkmnpqrstuvwxyz';
  const digits = '23456789';
  const special = '@#$!%*?&';
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
    return NextResponse.json({ success: false, message: 'Too many requests. Please slow down.' }, { status: 429 });
  }

  try {
    const body = await request.json();
    const { registrationId, action, remarks } = body;

    if (!registrationId || !action) {
      return NextResponse.json({ success: false, message: 'Missing parameters' }, { status: 400 });
    }

    const pool = await getConnection();
    const regResult = await pool.request().input('Id', Number(registrationId)).query(`SELECT * FROM Registrations WHERE Id = @Id`);

    if (regResult.recordset.length === 0) {
      return NextResponse.json({ success: false, message: 'Registration not found' }, { status: 404 });
    }

    const reg = regResult.recordset[0];
    let newStatus = reg.Status;
    let query = `UPDATE Registrations SET Status = @NewStatus`;

    const req = pool.request();
    req.input('Id', Number(registrationId));
    req.input('ActionBy', user!.email);
    req.input('Remarks', remarks || '');

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
      } else if (reg.Status === 'WAITING_BATCH' && (user!.role === 'ADMIN' || user!.role === 'TM')) {
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
      let tempPassword = '';
      let isNewAccount = false;

      if (userCheck.recordset.length === 0) {
        // ── CREATE new user account ──
        isNewAccount = true;
        tempPassword = generateTempPassword();
        const bcrypt = require('bcryptjs');
        const hash = await bcrypt.hash(tempPassword, 12);
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
      } else {
        // ── EXISTING user: reuse account WITHOUT resetting their password ──
        // This preserves the existing student experience for repeat registrations.
        studentId = userCheck.recordset[0].UserID;
        isNewAccount = false;
        // Ensure account is active and approved (may have been deactivated)
        await pool.request()
          .input('UserID', studentId)
          .query(`UPDATE LMS_Users SET IsApproved = 1, IsActive = 1 WHERE UserID = @UserID`);
        // No password reset — existing users keep their current password.
        // A "new course approved" notification is sent below.
      }

      // ── Link the approved registration back to the user record ──
      await pool.request()
        .input('UserID', studentId)
        .input('RegId', reg.Id)
        .query(`UPDATE Registrations SET LinkedUserID = @UserID WHERE Id = @RegId`);

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

      if (courseCheck.recordset.length > 0) {
        const courseId = courseCheck.recordset[0].CourseID;
        try {
          // Use MERGE to avoid duplicate-enrollment errors while still updating access dates
          await pool.request()
            .input('StudentID', studentId)
            .input('CourseID', courseId)
            .input('RegistrationID', reg.Id)
            .input('AccessStart', accessStart)
            .input('AccessEnd', accessEnd)
            .input('Duration', durationDays)
            .query(`
              MERGE Enrollments AS target
              USING (SELECT @StudentID AS StudentID, @CourseID AS CourseID) AS source
              ON target.StudentID = source.StudentID AND target.CourseID = source.CourseID
              WHEN MATCHED THEN
                UPDATE SET
                  RegistrationID = @RegistrationID,
                  AccessStartDate = @AccessStart,
                  AccessEndDate = @AccessEnd,
                  DurationDays = @Duration,
                  Status = 'ENROLLED'
              WHEN NOT MATCHED THEN
                INSERT (StudentID, CourseID, RegistrationID, Status, ProgressPercent, AccessStartDate, AccessEndDate, DurationDays)
                VALUES (@StudentID, @CourseID, @RegistrationID, 'ENROLLED', 0, @AccessStart, @AccessEnd, @Duration);
            `);
        } catch (enrollErr) {
          console.warn('Enrollment upsert warning:', enrollErr);
        }
      }

      // ── Send Multi-Channel Notification ──
      const appUrl = process.env.APP_URL || 'http://localhost:3000';
      const portalPath = userRole === 'AFFILIATE' ? '/affiliate' : '/student';
      const loginUrl = `${appUrl}/login`;
      const portalUrl = `${appUrl}${portalPath}`;

      let htmlBody: string;
      let textBody: string;

      if (isNewAccount) {
        htmlBody = `
          <h3>🎉 Registration Approved!</h3>
          <p>Dear ${reg.Name}, your registration for <strong>${reg.Course}</strong> has been approved.</p>
          <p><strong>Training Mode:</strong> ${reg.TrainingMode || 'N/A'}</p>
          <p><strong>Access Period:</strong> ${accessStart} to ${accessEnd} (${durationDays} days)</p>
          <hr/>
          <p><strong>Your Portal:</strong> <a href="${portalUrl}">${portalUrl}</a> (${userRole === 'AFFILIATE' ? 'Affiliate Portal' : 'Student Portal'})</p>
          <p><strong>Login URL:</strong> <a href="${loginUrl}">${loginUrl}</a></p>
          <p><strong>Username:</strong> ${reg.Email}</p>
          <p><strong>Temporary Password:</strong> ${tempPassword}</p>
          <p><em>Please change your password on first login.</em></p>
        `;
        textBody = `Hi ${reg.Name}, your registration for ${reg.Course} (${reg.TrainingMode || 'N/A'}) is approved! Access: ${accessStart} to ${accessEnd}. Login at ${loginUrl} with username: ${reg.Email} and temporary password: ${tempPassword}. Please change your password on first login.`;
      } else {
        // Returning student — do NOT send password; just confirm course approval
        htmlBody = `
          <h3>✅ New Course Approved!</h3>
          <p>Dear ${reg.Name}, your registration for <strong>${reg.Course}</strong> has been approved and added to your existing account.</p>
          <p><strong>Training Mode:</strong> ${reg.TrainingMode || 'N/A'}</p>
          <p><strong>Access Period:</strong> ${accessStart} to ${accessEnd} (${durationDays} days)</p>
          <hr/>
          <p>Log in with your existing credentials at <a href="${loginUrl}">${loginUrl}</a> to access your new course.</p>
          <p><strong>Portal:</strong> <a href="${portalUrl}">${portalUrl}</a></p>
          <p>If you have forgotten your password, use the "Forgot Password" link on the login page.</p>
        `;
        textBody = `Hi ${reg.Name}, your registration for ${reg.Course} (${reg.TrainingMode || 'N/A'}) has been approved. Access: ${accessStart} to ${accessEnd}. Log in at ${loginUrl} with your existing credentials.`;
      }

      await sendMultiChannelNotification({
        userId: studentId,
        email: reg.Email,
        phone: reg.Phone,
        type: 'ACCOUNT_ACTIVATION',
        subject: isNewAccount ? '✅ Registration Approved — Your YTS Account is Ready' : '✅ New Course Approved — YTS Training Services',
        html: htmlBody,
        text: textBody,
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
