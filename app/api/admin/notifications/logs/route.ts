import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest, requireRole } from '../../../../library/auth';
import { getConnection } from '../../../../library/db';

export async function GET(request: NextRequest) {
  const user = getUserFromRequest(request);
  if (!requireRole(user, 'ADMIN')) {
    return NextResponse.json({ success: false, message: 'Access denied' }, { status: 403 });
  }

  try {
    const pool = await getConnection();

    // Detect whether the RegistrationID column exists in the live schema.
    // This makes the API resilient both before and after the migration is applied.
    const schemaCheck = await pool.request().query(`
      SELECT COUNT(*) AS cnt
      FROM sys.columns
      WHERE object_id = OBJECT_ID('NotificationLog') AND name = 'RegistrationID'
    `);
    const hasRegistrationID = schemaCheck.recordset[0].cnt > 0;

    let result;

    if (hasRegistrationID) {
      // Full query: three-tier COALESCE with direct Registrations link
      result = await pool.request().query(`
        SELECT
          nl.LogID,
          nl.Type,
          nl.Channel,
          nl.Status,
          nl.ErrorMessage,
          nl.MessageContent,
          nl.CreatedAt,
          nl.RegistrationID,
          -- Authoritative recipient name: log's stored name → direct reg link → identity name
          COALESCE(
            NULLIF(LTRIM(RTRIM(nl.RecipientName)), ''),
            r.Name,
            NULLIF(LTRIM(RTRIM(ISNULL(u.FirstName, '') + ' ' + ISNULL(u.LastName, ''))), '')
          ) AS RecipientName,
          u.FirstName,
          u.LastName,
          u.Email,
          u.Role,
          u.Phone
        FROM NotificationLog nl
        LEFT JOIN LMS_Users u ON nl.UserID = u.UserID
        LEFT JOIN Registrations r ON nl.RegistrationID = r.Id
        ORDER BY nl.CreatedAt DESC
      `);
    } else {
      // Fallback query: no RegistrationID column yet — use RecipientName + identity join
      result = await pool.request().query(`
        SELECT
          nl.LogID,
          nl.Type,
          nl.Channel,
          nl.Status,
          nl.ErrorMessage,
          nl.MessageContent,
          nl.CreatedAt,
          NULL AS RegistrationID,
          -- RecipientName stored in log takes priority; identity name is the fallback
          COALESCE(
            NULLIF(LTRIM(RTRIM(nl.RecipientName)), ''),
            NULLIF(LTRIM(RTRIM(ISNULL(u.FirstName, '') + ' ' + ISNULL(u.LastName, ''))), '')
          ) AS RecipientName,
          u.FirstName,
          u.LastName,
          u.Email,
          u.Role,
          u.Phone
        FROM NotificationLog nl
        LEFT JOIN LMS_Users u ON nl.UserID = u.UserID
        ORDER BY nl.CreatedAt DESC
      `);
    }

    return NextResponse.json({ success: true, logs: result.recordset });
  } catch (e: any) {
    return NextResponse.json({ success: false, message: process.env.NODE_ENV === 'development' ? e.message : 'Internal Server Error' }, { status: 500 });
  }
}
