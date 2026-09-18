import { NextResponse } from 'next/server';
import { getConnection } from '../../library/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const pool = await getConnection();

    let result;
    try {
      // Primary query — uses TMConfirmed column (available after schema migration)
      result = await pool.query(`
        SELECT 
          tc.CalendarID,
          tc.Title,
          tc.TrainingType,
          tc.StartDate,
          tc.EndDate,
          COALESCE(tc.TrainerName, CONCAT(u.FirstName, ' ', u.LastName)) as TrainerName,
          tc.TrainerID,
          tc.Location,
          tc.MaxParticipants,
          tc.CurrentEnrolled as SeededEnrolled,
          COALESCE(r_agg.RegCount, 0) as RegistrationCount,
          tc.Status,
          COALESCE(tc.TMConfirmed, 0) as TMConfirmed,
          0 as HolidayFlag,
          CASE 
            WHEN tc.EndDate < CURRENT_TIMESTAMP THEN 'COMPLETED'
            WHEN tc.Status = 'COMPLETED' THEN 'COMPLETED'
            WHEN COALESCE(tc.TMConfirmed, 0) = 1 THEN 'CONFIRMED'
            ELSE 'OPEN'
          END as ColorStatus
        FROM TrainingCalendar tc
        LEFT JOIN LMS_Users u ON tc.TrainerID = u.UserID
        LEFT JOIN (
          SELECT SelectedSlotID, COUNT(*) as RegCount
          FROM Registrations
          WHERE Status NOT IN ('REJECTED', 'CANCELLED')
            AND SelectedSlotID IS NOT NULL
          GROUP BY SelectedSlotID
        ) r_agg ON tc.CalendarID = r_agg.SelectedSlotID
        WHERE tc.Status != 'CANCELLED'
        ORDER BY tc.StartDate ASC
      `);
    } catch (primaryErr: any) {
      try {
        // Fallback — simpler query without TMConfirmed
        result = await pool.query(`
          SELECT 
            tc.CalendarID, tc.Title, tc.TrainingType, tc.StartDate, tc.EndDate,
            COALESCE(tc.TrainerName, CONCAT(u.FirstName, ' ', u.LastName)) as TrainerName,
            tc.TrainerID, tc.Location, tc.MaxParticipants,
            tc.CurrentEnrolled as SeededEnrolled,
            COALESCE(r_agg.RegCount, 0) as RegistrationCount,
            tc.Status, 0 as TMConfirmed, 0 as HolidayFlag,
            CASE 
              WHEN tc.EndDate < CURRENT_TIMESTAMP THEN 'COMPLETED'
              WHEN tc.Status = 'COMPLETED' THEN 'COMPLETED'
              ELSE 'OPEN'
            END as ColorStatus
          FROM TrainingCalendar tc
          LEFT JOIN LMS_Users u ON tc.TrainerID = u.UserID
          LEFT JOIN (
            SELECT SelectedSlotID, COUNT(*) as RegCount
            FROM Registrations
            WHERE Status NOT IN ('REJECTED', 'CANCELLED')
              AND SelectedSlotID IS NOT NULL
            GROUP BY SelectedSlotID
          ) r_agg ON tc.CalendarID = r_agg.SelectedSlotID
          WHERE tc.Status != 'CANCELLED'
          ORDER BY tc.StartDate ASC
        `);
      } catch (fallbackErr: any) {
        throw new Error(`DB Query Failed. Primary: ${primaryErr?.message}. Fallback: ${fallbackErr?.message}`);
      }
    }

    // Post-process: use the higher of actual registration count vs seeded count
    // Ensures demo batches with pre-set CurrentEnrolled display realistic seat counts.
    const calendar = (result.recordset || []).map((row: any) => {
      const newRow = { ...row };
      for (const key in newRow) {
        if (typeof newRow[key] === 'bigint') {
          newRow[key] = Number(newRow[key]);
        }
      }
      return {
        ...newRow,
        RegistrationCount: Number(newRow.RegistrationCount) || 0,
        CurrentEnrolled: Math.max(Number(newRow.RegistrationCount) || 0, Number(newRow.SeededEnrolled) || 0),
      };
    });

    return NextResponse.json({ success: true, calendar });
  } catch (e: any) {
    console.error('CALENDAR API ERROR:', e);
    return NextResponse.json(
      { success: false, message: e.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
