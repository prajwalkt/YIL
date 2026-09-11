import { NextResponse } from 'next/server';
import { getConnection } from '../../library/db';

export async function GET() {
  try {
    const pool = await getConnection();
    const res = await pool.request().query("SELECT TABLE_NAME, COLUMN_NAME, DATA_TYPE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME IN ('AssessmentResults', 'Feedback', 'Questions', 'Assessments')");
    return NextResponse.json(res.recordset);
  } catch (e: any) {
    return NextResponse.json({ error: e.message });
  }
}
