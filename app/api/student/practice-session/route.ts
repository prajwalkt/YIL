import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest, requireRole, auditLog } from '../../../library/auth';
import { getConnection } from '../../../library/db';
import { hyperVProvider } from '../../../library/hypervProvider';

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
    const activeSessionReq = await pool.query(`
        SELECT s.SessionID, s.StartedAt, s.ExpiresAt, s.Status, v.InstanceName as VMName, t.Name as TemplateName
        FROM VMSessions s
        JOIN VMInstances v ON s.VMID = v.VMID
        JOIN VMTemplates t ON v.TemplateID = t.TemplateID
        WHERE s.UserID = $1 AND s.CourseID = $2 AND s.Status = 'ACTIVE'
        ORDER BY s.StartedAt DESC
       LIMIT 1`, [user!.userId, courseId]);

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
    const enrollmentReq = await pool.query(`
        SELECT c.CourseID, c.Title, c.TemplateID
        FROM Enrollments e
        JOIN LMS_Courses c ON e.CourseID = c.CourseID
        WHERE e.StudentID = $1 AND e.CourseID = $2 AND e.Status != 'COMPLETED'
      `, [user!.userId, courseId]);

    if (enrollmentReq.recordset.length === 0) {
      return NextResponse.json({ success: false, message: 'You are not enrolled in this active course.' }, { status: 403 });
    }

    const course = enrollmentReq.recordset[0];
    if (!course.TemplateID) {
      return NextResponse.json({ success: false, message: 'No practice environment mapped for this course.' }, { status: 400 });
    }

    // 2. Check for existing active session
    const existingReq = await pool.query(`SELECT SessionID FROM VMSessions WHERE UserID = $1 AND CourseID = $2 AND Status = 'ACTIVE'`, [user!.userId, courseId]);
    if (existingReq.recordset.length > 0) {
      return NextResponse.json({ success: false, message: 'You already have an active session.' }, { status: 400 });
    }

    // 3. Find available VM or check limits
    // Lock the selection to prevent race conditions
    const txn = await pool.connect();
    await txn.query('BEGIN');

    try {
      const availVmReq = await txn.query(`
          SELECT VMID, InstanceName FROM VMInstances 
          WHERE TemplateID = $1 AND Status = 'AVAILABLE' 
          WITH (UPDLOCK, READPAST)
         LIMIT 1`, [course.TemplateID]);

      let vmToAssign = availVmReq.recordset.length > 0 ? availVmReq.recordset[0] : null;

      if (!vmToAssign) {
        // Check if we hit the limit
        const activeVmsReq = await txn.query(`SELECT COUNT(*) as activeCount FROM VMInstances WHERE TemplateID = $1 AND Status != 'AVAILABLE'`, [course.TemplateID]);
        
        if (activeVmsReq.recordset[0].activeCount >= MAX_TEST_VMS) {
          await txn.query('ROLLBACK');
          txn.release();
          return NextResponse.json({ success: false, message: 'All practice environments are currently in use. Please try again later.' }, { status: 503 });
        }
        
        // If we haven't hit the limit, in a real scenario we'd provision a new VM here. 
        // For testing, we expect the 5 VMs to be pre-created by the script.
        await txn.query('ROLLBACK');
        txn.release();
        return NextResponse.json({ success: false, message: 'No VMs available and provisioning is handled offline.' }, { status: 503 });
      }

      // Mark VM as IN_USE
      await txn.query(`UPDATE VMInstances SET Status = 'IN_USE', UpdatedAt = CURRENT_TIMESTAMP WHERE VMID = $1`, [vmToAssign.VMID]);

      // Create session
      const expiresAt = new Date();
      if (courseId == 21) {
        expiresAt.setMinutes(expiresAt.getMinutes() + 10); // 10 minutes for TEST course
      } else {
        expiresAt.setHours(expiresAt.getHours() + SESSION_DURATION_HOURS);
      }

      const sessionReq = await txn.query(`
          INSERT INTO VMSessions (VMID, UserID, CourseID, Status, StartedAt, ExpiresAt)
          VALUES ($1, $2, $3, 'ACTIVE', CURRENT_TIMESTAMP, $4)
          RETURNING SessionID
        `, [vmToAssign.VMID, user!.userId, courseId, expiresAt]);
      
      const sessionId = sessionReq.recordset[0].SessionID;

      await txn.query('COMMIT');
      txn.release();

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
      await txn.query('ROLLBACK');
      if (txn.release) txn.release();
      throw err;
    }

  } catch (e: any) {
    console.error('Practice Session POST error:', e);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}

async function handleSessionExpiry(pool: any, sessionId: number, vmName: string) {
  // Update session
  await pool.query(`UPDATE VMSessions SET Status = 'EXPIRED', EndedAt = CURRENT_TIMESTAMP WHERE SessionID = $1`, [sessionId]);
  
  // Stop and Reset VM asynchronously
  (async () => {
    try {
      await pool.query(`UPDATE VMInstances SET Status = 'STOPPING' WHERE InstanceName = $1`, [vmName]);
      await hyperVProvider.stopVM(vmName);
      
      await pool.query(`UPDATE VMInstances SET Status = 'RESETTING' WHERE InstanceName = $1`, [vmName]);
      const resetOk = await hyperVProvider.resetVM(vmName);
      
      if (resetOk) {
        await pool.query(`UPDATE VMInstances SET Status = 'AVAILABLE' WHERE InstanceName = $1`, [vmName]);
      } else {
        await pool.query(`UPDATE VMInstances SET Status = 'ERROR' WHERE InstanceName = $1`, [vmName]);
      }
    } catch (error) {
      console.error('Failed to reset VM after expiry', error);
      await pool.query(`UPDATE VMInstances SET Status = 'ERROR' WHERE InstanceName = $1`, [vmName]);
    }
  })();
}
