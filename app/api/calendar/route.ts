import { NextResponse } from 'next/server';
import { getConnection } from '../../library/db';

export async function GET() {
  try {
    const pool = await getConnection();

    // Try to use the CalendarColorView; fall back to base table if view doesn't exist
    let result;
    try {
      result = await pool.request().query(`
        SELECT 
          tc.CalendarID,
          tc.Title,
          tc.TrainingType,
          tc.StartDate,
          tc.EndDate,
          tc.TrainerName,
          tc.Location,
          tc.MaxParticipants,
          tc.CurrentEnrolled,
          tc.Status,
          ISNULL(tc.TMConfirmed, 0) as TMConfirmed,
          CASE 
            WHEN tc.EndDate < CAST(GETDATE() AS DATE) THEN 'COMPLETED'
            WHEN ISNULL(tc.TMConfirmed, 0) = 1 THEN 'CONFIRMED'
            WHEN EXISTS (
              SELECT 1 FROM Registrations r 
              WHERE r.SelectedSlotID = tc.CalendarID 
                AND r.Status IN ('FINANCE_APPROVED', 'TM_APPROVED')
            ) THEN 'APPROVAL_ONGOING'
            WHEN EXISTS (
              SELECT 1 FROM Registrations r 
              WHERE r.SelectedSlotID = tc.CalendarID 
                AND r.Status = 'PENDING'
            ) THEN 'PAYMENT_PENDING'
            ELSE 'OPEN'
          END as ColorStatus
        FROM TrainingCalendar tc
        WHERE tc.Status != 'CANCELLED'
        ORDER BY tc.StartDate ASC
      `);
    } catch {
      // Fallback if TMConfirmed column doesn't exist yet (pre-migration)
      result = await pool.request().query(`
        SELECT 
          CalendarID, Title, TrainingType, StartDate, EndDate,
          TrainerName, Location, MaxParticipants, CurrentEnrolled, Status,
          0 as TMConfirmed,
          CASE 
            WHEN EndDate < CAST(GETDATE() AS DATE) THEN 'COMPLETED'
            ELSE 'OPEN'
          END as ColorStatus
        FROM TrainingCalendar
        WHERE Status != 'CANCELLED'
        ORDER BY StartDate ASC
      `);
    }

    return NextResponse.json({ success: true, calendar: result.recordset });
  } catch (e: any) {
    return NextResponse.json({ success: false, message: e.message }, { status: 500 });
  }
}
