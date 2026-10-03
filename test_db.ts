import { getConnection } from './app/library/db';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

async function test() {
  const pool = await getConnection();
  const res = await pool.request().query('SELECT CalendarID, Title, TrainingType FROM TrainingCalendar WHERE CalendarID = 122');
  console.log(JSON.stringify(res.recordset[0]));
}
test().catch(console.error);
