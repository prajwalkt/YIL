require('dotenv').config({ path: '.env.neon' });
const { Pool } = require('@neondatabase/serverless');

const pool = new Pool({
  connectionString: process.env.NEON_DATABASE_URL,
});

async function run() {
  const sql = `
      SELECT "CourseID", "Code", "AgendaPDFPath" 
      FROM "LMS_Courses" 
      WHERE "Status" = 'ACTIVE' AND "AgendaPDFPath" IS NOT NULL
    `;
  
  try {
    const res = await pool.query(sql);
    console.log("ROWS WITH AGENDA:", res.rows.length);
    console.log("FIRST 5:", res.rows.slice(0, 5));
  } catch (e) {
    console.error("QUERY ERROR:", e);
  } finally {
    pool.end();
  }
}

run();
