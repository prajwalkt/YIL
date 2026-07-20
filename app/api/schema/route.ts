import { NextResponse } from 'next/server';
import { getConnection } from '../../library/db';

export async function GET() {
  const pool = await getConnection();
  const tables = ['Registrations', 'Enrollments', 'LMS_Courses', 'TrainingCalendar', 'LMS_Users', 'InteractiveManuals', 'Assessments', 'Feedback'];
  
  let html = '';
  for (const table of tables) {
    try {
      const result = await pool.request().query(`
        SELECT COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH, IS_NULLABLE
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_NAME = '${table}'
      `);
      html += `<h2>${table}</h2><pre>${JSON.stringify(result.recordset, null, 2)}</pre>`;
    } catch(e) {}
  }
  return new NextResponse(html, { headers: { 'Content-Type': 'text/html' } });
}
