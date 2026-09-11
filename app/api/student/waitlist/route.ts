import { NextRequest, NextResponse } from 'next/server';
import { parseAndSanitizeBody } from '../../../library/validation';
import { getUserFromRequest } from '../../../library/auth';
import { getConnection } from '../../../library/db';

export async function GET(request: NextRequest) {
  const user = getUserFromRequest(request);
  if (!user) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

  try {
    const pool = await getConnection();
    const result = await pool.request()
      .input('UserID', user.userId)
      .query(`
        SELECT w.*, c.Title, c.StartDate, c.EndDate, c.Location
        FROM WaitingList w
        JOIN TrainingCalendar c ON w.CalendarID = c.CalendarID
        WHERE w.StudentID = @UserID
      `);
    return NextResponse.json({ success: true, waitlist: result.recordset });
  } catch (e: any) {
    return NextResponse.json({ success: false, message: process.env.NODE_ENV === 'development' ? e.message : 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const user = getUserFromRequest(request);
  if (!user) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

  try {
    const { calendarId } = await parseAndSanitizeBody(request);
    if (!calendarId) return NextResponse.json({ success: false, message: 'calendarId required' }, { status: 400 });

    const pool = await getConnection();
    
    // Check if batch is full
    const batchRes = await pool.request().input('CalendarID', calendarId).query(`SELECT MaxParticipants, CurrentEnrolled FROM TrainingCalendar WHERE CalendarID = @CalendarID`);
    if (batchRes.recordset.length === 0) return NextResponse.json({ success: false, message: 'Batch not found' }, { status: 404 });
    
    const batch = batchRes.recordset[0];
    if (batch.CurrentEnrolled < batch.MaxParticipants) {
      return NextResponse.json({ success: false, message: 'Batch has available seats. Please register normally.' }, { status: 400 });
    }

    // Check if already in waitlist or enrolled
    const checkRes = await pool.request()
      .input('CalendarID', calendarId)
      .input('UserID', user.userId)
      .query(`
        SELECT 1 FROM WaitingList WHERE CalendarID = @CalendarID AND StudentID = @UserID
        UNION
        SELECT 1 FROM Enrollments WHERE CalendarID = @CalendarID AND StudentID = @UserID AND Status != 'DROPPED'
      `);
      
    if (checkRes.recordset.length > 0) {
      return NextResponse.json({ success: false, message: 'Already enrolled or in waiting list' }, { status: 400 });
    }

    await pool.request()
      .input('CalendarID', calendarId)
      .input('UserID', user.userId)
      .query(`
        INSERT INTO WaitingList (CalendarID, StudentID) VALUES (@CalendarID, @UserID)
      `);

    return NextResponse.json({ success: true, message: 'Successfully joined the waiting list' });
  } catch (e: any) {
    return NextResponse.json({ success: false, message: process.env.NODE_ENV === 'development' ? e.message : 'Internal Server Error' }, { status: 500 });
  }
}
