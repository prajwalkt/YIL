import { NextResponse } from 'next/server';
import { getConnection } from '../../library/db';

export async function GET() {
  try {
    const pool = await getConnection();
    const result = await pool.request().query('SELECT COUNT(*) as count FROM Registrations');
    const count = result.recordset[0].count;

    console.log(`✅ Success! Pulled count from Database.`);
    return NextResponse.json({ count });

  } catch (error: any) {
    console.error("Detailed DB Error:", error.message);
    return NextResponse.json({ count: 0, error: error.message }, { status: 500 });
  }
}