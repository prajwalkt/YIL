import { NextResponse } from "next/server";
import { getConnection } from "../../library/db";

export async function GET() {
  try {
    const pool = await getConnection();
    const result = await pool.request().query('SELECT COUNT(*) as count FROM Registrations');
    const count = result.recordset[0].count;

    return NextResponse.json({
      count,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        count: 0,
        error: error.message,
      },
      {
        status: 500,
      }
    );
  }
}