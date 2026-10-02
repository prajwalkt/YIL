const { neon } = require('@neondatabase/serverless');
require('dotenv').config({ path: '.env.neon' });
const sql = neon(process.env.NEON_DATABASE_URL || process.env.DATABASE_URL);
async function run() {
  const result = await sql`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'`;
  console.log(result);
}
run().catch(console.error);
