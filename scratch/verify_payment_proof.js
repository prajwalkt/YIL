require('dotenv').config({ path: '.env.neon' });
const { Pool } = require('@neondatabase/serverless');
const pool = new Pool({ connectionString: process.env.NEON_DATABASE_URL });

async function run() {
  try {
    const res = await pool.query(`SELECT "PaymentProofPath" FROM "Registrations" WHERE "Id" = 117`);
    const paymentProofPath = res.rows[0].PaymentProofPath;
    
    console.log("Retrieved proof path length:", paymentProofPath.length);
    if (paymentProofPath.startsWith('data:')) {
      const matches = paymentProofPath.match(/^data:([^;]+);base64,(.+)$/);
      if (matches) {
        const mimeType = matches[1];
        const base64Data = matches[2];
        const buffer = Buffer.from(base64Data, 'base64');
        console.log("MIME Type:", mimeType);
        console.log("Buffer Length:", buffer.length);
        console.log("Magic Bytes (hex):", buffer.slice(0, 4).toString('hex'));
      }
    }
  } catch(e) {
    console.error(e);
  } finally {
    pool.end();
  }
}
run();
