require('dotenv').config({ path: '.env.neon' });
const { Pool } = require('@neondatabase/serverless');

const pool = new Pool({
  connectionString: process.env.NEON_DATABASE_URL,
});

async function run() {
  try {
    const res = await pool.query(`
      SELECT column_name, data_type, character_maximum_length 
      FROM information_schema.columns 
      WHERE table_name = 'PaymentTracking' AND column_name = 'PaymentProofPath';
    `);
    console.log("PaymentTracking Schema:", res.rows);
  } catch (e) {
    console.error("ERROR:", e);
  } finally {
    pool.end();
  }
}
run();
