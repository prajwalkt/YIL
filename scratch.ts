import { getConnection } from './app/library/db';

async function run() {
  const pool = await getConnection();
  const tables = ['Registrations', 'Enrollments', 'LMS_Courses', 'TrainingCalendar', 'LMS_Users'];
  
  for (const table of tables) {
    const result = await pool.request().query(`
      SELECT COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH, IS_NULLABLE
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_NAME = '${table}'
    `);
    console.log(`\n--- ${table} ---`);
    console.table(result.recordset);
  }
  process.exit(0);
}

run().catch(console.error);
