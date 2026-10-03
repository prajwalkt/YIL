import { getConnection } from './app/library/db';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

async function test() {
  const pool = await getConnection();
  const result = await pool.request().query(`
      SELECT 
        CourseID as id,
        Title as name, 
        Code as code, 
        COALESCE(DurationDays, 3) as days, 
        AgendaPDFPath as agendaPath 
      FROM LMS_Courses 
      WHERE Status = 'ACTIVE' 
      ORDER BY 
        CASE WHEN CourseID = 3 THEN 0 ELSE 1 END ASC,
        Title ASC
  `);
  console.log(JSON.stringify(result.recordset[0]));
}
test().catch(console.error);
