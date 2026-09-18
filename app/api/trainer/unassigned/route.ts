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

    const values = [];

    if (user!.role === 'TRAINER') {
      values.push(Number(user!.userId));
      query += ` AND TrainerId = $1`;
    }

    query += ` ORDER BY AdminApprovedAt ASC, CreatedAt ASC`;

    const result = await pool.query(query, values);

    return NextResponse.json({ 
      success: true, 
      unassigned: result.recordset 
    });
  } catch (e: any) {
    console.error("Error in unassigned API:", e);
    return NextResponse.json({ success: false, message: process.env.NODE_ENV === 'development' ? e.message : 'Internal Server Error' }, { status: 500 });
  }
}
