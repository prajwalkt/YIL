import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest, requireRole } from '../../../library/auth';
import { getConnection } from '../../../library/db';

export async function GET(request: NextRequest) {
  const user = getUserFromRequest(request);
  if (!user || (user.role !== 'TM' && user.role !== 'ADMIN')) return NextResponse.json({ success: false, message: 'Access denied' }, { status: 403 });

  try {
    const pool = await getConnection();
    
    // Fetch registrations that have a SelectedSlotID (meaning they requested a specific batch)
    const query = `
      SELECT 
        r.Id AS RegistrationID,
        r.Name AS ParticipantName,
        r.RegistrationType,
        r.Course,
        r.TrainingMode,
        r.Status AS RegistrationStatus,
        r.SelectedSlotID,
        c.StartDate,
        c.EndDate,
        c.TMConfirmed,
        c.Status AS CalendarStatus,
        c.TrainerID,
        u.FirstName + ' ' + u.LastName AS TrainerName
      FROM Registrations r
      INNER JOIN TrainingCalendar c ON r.SelectedSlotID = c.CalendarID
      LEFT JOIN LMS_Users u ON c.TrainerID = u.UserID
      WHERE r.Status IN ('FINANCE_APPROVED', 'WAITING_BATCH', 'TM_APPROVED', 'APPROVED')
      ORDER BY r.CreatedAt DESC
    `;

    const result = await pool.request().query(query);

    return NextResponse.json({ success: true, requestedDates: result.recordset });
  } catch (e: any) {
    console.error('Requested Dates GET error:', e);
    return NextResponse.json({ success: false, message: 'Failed to fetch requested dates' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const user = getUserFromRequest(request);
  if (!user || (user.role !== 'TM' && user.role !== 'ADMIN')) return NextResponse.json({ success: false, message: 'Access denied' }, { status: 403 });

  try {
    const { calendarId, action, trainerId, registrationId, newCalendarId } = await request.json();
    if (action !== 'modify_date' && !calendarId) return NextResponse.json({ success: false, message: 'calendarId required' }, { status: 400 });

    const pool = await getConnection();

    if (action === 'approve') {
      const query = `
        UPDATE TrainingCalendar
        SET TMConfirmed = 1, TMConfirmedAt = GETDATE(), TMConfirmedBy = @userId, Status = 'CONFIRMED'
        WHERE CalendarID = @calendarId
      `;
      await pool.request()
        .input('userId', user.userId)
        .input('calendarId', calendarId)
        .query(query);
      
      return NextResponse.json({ success: true, message: 'Calendar date finalized' });
    } else if (action === 'assign_trainer') {
      const query = `
        UPDATE TrainingCalendar
        SET TrainerID = @trainerId
        WHERE CalendarID = @calendarId
      `;
      await pool.request()
        .input('trainerId', trainerId)
        .input('calendarId', calendarId)
        .query(query);
      return NextResponse.json({ success: true, message: 'Trainer assigned' });
    } else if (action === 'modify_date') {
      if (!registrationId || !newCalendarId) return NextResponse.json({ success: false, message: 'Missing parameters' }, { status: 400 });
      
      const query = `
        UPDATE Registrations
        SET SelectedSlotID = @newCalendarId
        WHERE Id = @registrationId
      `;
      await pool.request()
        .input('newCalendarId', newCalendarId)
        .input('registrationId', registrationId)
        .query(query);
        
      return NextResponse.json({ success: true, message: 'Requested date modified' });
    }

    return NextResponse.json({ success: false, message: 'Invalid action' }, { status: 400 });
  } catch (e: any) {
    console.error('Requested Dates POST error:', e);
    return NextResponse.json({ success: false, message: 'Failed to update calendar' }, { status: 500 });
  }
}
