import { getConnection } from './app/library/db';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

async function test() {
  const pool = await getConnection();
  const result = await pool.request().query(`SELECT * FROM LMS_Courses LIMIT 5`);
  console.log(JSON.stringify(result.recordset, null, 2));
}
test().catch(console.error);
