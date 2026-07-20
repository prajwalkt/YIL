import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest, requireRole } from '../../../library/auth';
import { getConnection } from '../../../library/db';

export async function GET(request: NextRequest) {
  const user = getUserFromRequest(request);
  if (!requireRole(user, 'TRAINER')) return NextResponse.json({ success: false, message: 'Access denied' }, { status: 403 });

  try {
    const pool = await getConnection();
    const req = pool.request();
    req.input('TrainerUserID', user!.userId);
    
    const { searchParams } = new URL(request.url);
    const calendarId = searchParams.get('calendarId');

    let query = `
      SELECT e.*, u.FirstName, u.LastName, u.Email, u.Organization, u.Phone,
             tc.Title as CalendarTitle, tc.StartDate, tc.EndDate
      FROM Enrollments e
      JOIN LMS_Users u ON e.StudentID = u.UserID
      JOIN TrainingCalendar tc ON e.CalendarID = tc.CalendarID
      WHERE tc.TrainerID = @TrainerUserID
    `;

    if (calendarId) {
      query += ` AND e.CalendarID = @CalendarID`;
      req.input('CalendarID', Number(calendarId));
    }

    query += ` ORDER BY tc.StartDate DESC, u.FirstName ASC`;

    const result = await req.query(query);

    return NextResponse.json({ success: true, participants: result.recordset });
  } catch (e: any) {
    return NextResponse.json({ success: false, message: e.message }, { status: 500 });
  }
}
