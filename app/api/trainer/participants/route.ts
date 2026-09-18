import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest, requireRole } from '../../../library/auth';
import { getConnection } from '../../../library/db';

export async function GET(request: NextRequest) {
  const user = getUserFromRequest(request);
  if (!requireRole(user, 'TRAINER')) return NextResponse.json({ success: false, message: 'Access denied' }, { status: 403 });

  try {
    const pool = await getConnection();
    const values = [user!.userId];
    const { searchParams } = new URL(request.url);
    const calendarId = searchParams.get('calendarId');
    let query = `
      SELECT e.*, u.FirstName, u.LastName, u.Email, u.Organization, u.Phone,
             tc.Title as CalendarTitle, tc.StartDate, tc.EndDate
      FROM Enrollments e
      JOIN LMS_Users u ON e.StudentID = u.UserID
      JOIN TrainingCalendar tc ON e.CalendarID = tc.CalendarID
      WHERE tc.TrainerID = $1
    `;

    if (calendarId) {
      values.push(Number(calendarId));
      query += ` AND e.CalendarID = $${values.length}`;
    }

    query += ` ORDER BY tc.StartDate DESC, u.FirstName ASC`;

    const result = await pool.query(query, values);

    return NextResponse.json({ success: true, participants: result.recordset });
  } catch (e: any) {
    return NextResponse.json({ success: false, message: process.env.NODE_ENV === 'development' ? e.message : 'Internal Server Error' }, { status: 500 });
  }
}
