const { neon } = require('@neondatabase/serverless');
require('dotenv').config({ path: '.env.neon' });
const sql = neon(process.env.NEON_DATABASE_URL || process.env.DATABASE_URL);
async function run() {
  const result = await sql`SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'LMS_Courses'`;
  console.log(result);
}
run().catch(console.error);
