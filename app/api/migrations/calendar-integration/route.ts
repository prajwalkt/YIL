import { NextResponse } from 'next/server';
import { getConnection } from '../../../library/db'; // Force recompile

export async function GET() {
  try {
    const pool = await getConnection();

    // Add PreferredStartDate and PreferredEndDate to Registrations
    await pool.query(`
      IF COL_LENGTH('Registrations', 'PreferredStartDate') IS NULL
      BEGIN
          ALTER TABLE Registrations ADD PreferredStartDate DATE NULL;
      END
      
      IF COL_LENGTH('Registrations', 'PreferredEndDate') IS NULL
      BEGIN
          ALTER TABLE Registrations ADD PreferredEndDate DATE NULL;
      END
    `);

    return NextResponse.json({ success: true, message: 'Calendar Integration Migration completed successfully.' });
  } catch (error: any) {
    console.error('Migration error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
