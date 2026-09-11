import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest, requireRole, auditLog } from '../../../library/auth';
import { getConnection } from '../../../library/db';
import { hyperVProvider } from '../../../library/hypervProvider';
import sql from 'mssql';

// Configuration
const MAX_TEST_VMS = 5;
const SESSION_DURATION_HOURS = 4; // Practice sessions are e.g. 4 hours max per seating

export async function GET(request: NextRequest) {
  const user = getUserFromRequest(request);
  if (!requireRole(user, 'STUDENT', 'AFFILIATE')) return NextResponse.json({ success: false, message: 'Access denied' }, { status: 403 });

  try {
    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get('courseId');
    if (!courseId) return NextResponse.json({ success: false, message: 'Course ID required' }, { status: 400 });

    const pool = await getConnection();

    // Check for an existing active session
    const activeSessionReq = await pool.request()
      .input('UserId', user!.userId)
      .input('CourseId', courseId)
      .query(`
        SELECT top 1 s.SessionID, s.StartedAt, s.ExpiresAt, s.Status, v.InstanceName as VMName, t.Name as TemplateName
        FROM VMSessions s
        JOIN VMInstances v ON s.VMID = v.VMID
        JOIN VMTemplates t ON v.TemplateID = t.TemplateID
        WHERE s.UserID = @UserId AND s.CourseID = @CourseId AND s.Status = 'ACTIVE'
        ORDER BY s.StartedAt DESC
      `);

    if (activeSessionReq.recordset.length > 0) {
      const session = activeSessionReq.recordset[0];
      const expiresAt = new Date(session.ExpiresAt);
      const now = new Date();

      if (now > expiresAt) {
        // Session expired, clean up
        await handleSessionExpiry(pool, session.SessionID, session.VMName);
        return NextResponse.json({ success: true, session: null, message: 'Session expired' });
      }

      return NextResponse.json({ 
        success: true, 
        session: {
          sessionId: session.SessionID,
          vmName: session.VMName,
          templateName: session.TemplateName,
          startedAt: session.StartedAt,
          expiresAt: session.ExpiresAt,
          status: session.Status
        } 
      });
    }

    return NextResponse.json({ success: true, session: null });
  } catch (e: any) {
    console.error('Practice Session GET error:', e);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const user = getUserFromRequest(request);
  if (!requireRole(user, 'STUDENT', 'AFFILIATE')) return NextResponse.json({ success: false, message: 'Access denied' }, { status: 403 });

  try {
    const body = await request.json();
    const courseId = body.courseId;
    if (!courseId) return NextResponse.json({ success: false, message: 'Course ID required' }, { status: 400 });

    const pool = await getConnection();

    // 1. Verify user is enrolled and course is active
    const enrollmentReq = await pool.request()
      .input('UserId', user!.userId)
      .input('CourseId', courseId)
      .query(`
        SELECT c.CourseID, c.Title, c.TemplateID
        FROM Enrollments e
        JOIN LMS_Courses c ON e.CourseID = c.CourseID
        WHERE e.StudentID = @UserId AND e.CourseID = @CourseId AND e.Status != 'COMPLETED'
      `);

    if (enrollmentReq.recordset.length === 0) {
      return NextResponse.json({ success: false, message: 'You are not enrolled in this active course.' }, { status: 403 });
    }

    const course = enrollmentReq.recordset[0];
    if (!course.TemplateID) {
      return NextResponse.json({ success: false, message: 'No practice environment mapped for this course.' }, { status: 400 });
    }

    // 2. Check for existing active session
    const existingReq = await pool.request()
      .input('UserId', user!.userId)
      .input('CourseId', courseId)
      .query(`SELECT SessionID FROM VMSessions WHERE UserID = @UserId AND CourseID = @CourseId AND Status = 'ACTIVE'`);
    if (existingReq.recordset.length > 0) {
      return NextResponse.json({ success: false, message: 'You already have an active session.' }, { status: 400 });
    }

    // 3. Find available VM or check limits
    // Lock the selection to prevent race conditions
    const txn = new sql.Transaction(pool);
    await txn.begin();

    try {
      const availVmReq = await txn.request()
        .input('TemplateId', course.TemplateID)
        .query(`
          SELECT top 1 VMID, InstanceName FROM VMInstances 
          WHERE TemplateID = @TemplateId AND Status = 'AVAILABLE' 
          WITH (UPDLOCK, READPAST)
        `);

      let vmToAssign = availVmReq.recordset.length > 0 ? availVmReq.recordset[0] : null;

      if (!vmToAssign) {
        // Check if we hit the limit
        const activeVmsReq = await txn.request()
          .input('TemplateId', course.TemplateID)
          .query(`SELECT COUNT(*) as activeCount FROM VMInstances WHERE TemplateID = @TemplateId AND Status != 'AVAILABLE'`);
        
        if (activeVmsReq.recordset[0].activeCount >= MAX_TEST_VMS) {
          await txn.rollback();
          return NextResponse.json({ success: false, message: 'All practice environments are currently in use. Please try again later.' }, { status: 503 });
        }
        
        // If we haven't hit the limit, in a real scenario we'd provision a new VM here. 
        // For testing, we expect the 5 VMs to be pre-created by the script.
        await txn.rollback();
        return NextResponse.json({ success: false, message: 'No VMs available and provisioning is handled offline.' }, { status: 503 });
      }

      // Mark VM as IN_USE
      await txn.request()
        .input('VmId', vmToAssign.VMID)
        .query(`UPDATE VMInstances SET Status = 'IN_USE', UpdatedAt = GETDATE() WHERE VMID = @VmId`);

      // Create session
      const expiresAt = new Date();
      if (courseId == 21) {
        expiresAt.setMinutes(expiresAt.getMinutes() + 10); // 10 minutes for TEST course
      } else {
        expiresAt.setHours(expiresAt.getHours() + SESSION_DURATION_HOURS);
      }

      const sessionReq = await txn.request()
        .input('VmId', vmToAssign.VMID)
        .input('UserId', user!.userId)
        .input('CourseId', courseId)
        .input('ExpiresAt', expiresAt)
        .query(`
          INSERT INTO VMSessions (VMID, UserID, CourseID, Status, StartedAt, ExpiresAt)
          OUTPUT INSERTED.SessionID
          VALUES (@VmId, @UserId, @CourseId, 'ACTIVE', GETDATE(), @ExpiresAt)
        `);
      
      const sessionId = sessionReq.recordset[0].SessionID;

      await txn.commit();

      // Start the VM via Provider (non-blocking for UI, but could await)
      hyperVProvider.startVM(vmToAssign.InstanceName).catch(err => console.error('Failed to start VM', err));

      await auditLog(user!.userId, user!.email, 'SESSION_STARTED', 'PRACTICE', `Started session ${sessionId} on ${vmToAssign.InstanceName}`, request.headers.get('x-forwarded-for') || '127.0.0.1');

      return NextResponse.json({ 
        success: true, 
        session: {
          sessionId,
          vmName: vmToAssign.InstanceName,
          startedAt: new Date(),
          expiresAt,
          status: 'ACTIVE'
        } 
      });

    } catch (err) {
      await txn.rollback();
      throw err;
    }

  } catch (e: any) {
    console.error('Practice Session POST error:', e);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}

async function handleSessionExpiry(pool: sql.ConnectionPool, sessionId: number, vmName: string) {
  // Update session
  await pool.request()
    .input('SessionId', sessionId)
    .query(`UPDATE VMSessions SET Status = 'EXPIRED', EndedAt = GETDATE() WHERE SessionID = @SessionId`);
  
  // Stop and Reset VM asynchronously
  (async () => {
    try {
      await pool.request().input('VmName', vmName).query(`UPDATE VMInstances SET Status = 'STOPPING' WHERE InstanceName = @VmName`);
      await hyperVProvider.stopVM(vmName);
      
      await pool.request().input('VmName', vmName).query(`UPDATE VMInstances SET Status = 'RESETTING' WHERE InstanceName = @VmName`);
      const resetOk = await hyperVProvider.resetVM(vmName);
      
      if (resetOk) {
        await pool.request().input('VmName', vmName).query(`UPDATE VMInstances SET Status = 'AVAILABLE' WHERE InstanceName = @VmName`);
      } else {
        await pool.request().input('VmName', vmName).query(`UPDATE VMInstances SET Status = 'ERROR' WHERE InstanceName = @VmName`);
      }
    } catch (error) {
      console.error('Failed to reset VM after expiry', error);
      await pool.request().input('VmName', vmName).query(`UPDATE VMInstances SET Status = 'ERROR' WHERE InstanceName = @VmName`);
    }
  })();
}
