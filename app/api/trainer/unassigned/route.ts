import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest, requireRole } from '../../../library/auth';
import { getConnection } from '../../../library/db';

export async function GET(request: NextRequest) {
  const user = getUserFromRequest(request);
  if (!requireRole(user, 'TRAINER', 'ADMIN', 'TM')) {
    return NextResponse.json({ success: false, message: 'Access denied' }, { status: 403 });
  }

  try {
    const pool = await getConnection();
    
    // Fetch registrations that are APPROVED but not yet enrolled
    // Technically, Status = 'APPROVED' means it's approved and waiting for batch.
    // If we kept 'WAITING_BATCH', we might include that too.
    let query = `
      SELECT Id, Name, Email, Organization, Course, CreatedAt, AdminApprovedAt, Status, PreferredStartDate, PreferredEndDate, TrainingMode
      FROM Registrations 
      WHERE Status IN ('APPROVED', 'WAITING_BATCH')
    `;

    if (user!.role === 'TRAINER') {
      query += ` AND TrainerId = @UserId`;
    }

    query += ` ORDER BY AdminApprovedAt ASC, CreatedAt ASC`;

    const req = pool.request();
    if (user!.role === 'TRAINER') {
      req.input('UserId', Number(user!.userId));
    }

    const result = await req.query(query);

    return NextResponse.json({ 
      success: true, 
      unassigned: result.recordset 
    });
  } catch (e: any) {
    console.error("Error in unassigned API:", e);
    return NextResponse.json({ success: false, message: process.env.NODE_ENV === 'development' ? e.message : 'Internal Server Error' }, { status: 500 });
  }
}
