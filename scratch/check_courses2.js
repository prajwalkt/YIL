const { neon } = require('@neondatabase/serverless');
require('dotenv').config({ path: '.env.neon' });
const sql = neon(process.env.NEON_DATABASE_URL || process.env.DATABASE_URL);
async function run() {
  const result = await sql`SELECT Code, Title, CourseCode FROM LMS_Courses WHERE Title LIKE '%CENTUM VP DCS Operation%'`;
  console.log(result);
}
run().catch(console.error);
