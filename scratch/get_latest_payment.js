require('dotenv').config({ path: '.env.neon' });
const { Pool } = require('@neondatabase/serverless');
const pool = new Pool({ connectionString: process.env.NEON_DATABASE_URL });

async function run() {
  try {
    const res = await pool.query(`SELECT "Id", "PaymentProofPath" FROM "Registrations" WHERE "PaymentProofPath" IS NOT NULL ORDER BY "Id" DESC LIMIT 1`);
    if (res.rowCount > 0) {
      console.log(`LATEST REGISTRATION ID: ${res.rows[0].Id}`);
    } else {
      console.log(`NO REGISTRATION WITH PROOF FOUND.`);
    }
  } catch(e) {
    console.error(e);
  } finally {
    pool.end();
  }
}
run();
