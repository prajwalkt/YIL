require('dotenv').config({path: '.env.vercel'});
const { Client } = require('pg');
const client = new Client({ connectionString: process.env.NEON_DATABASE_URL });
client.connect().then(async () => {
  const res = await client.query("SELECT \"Id\", LEFT(\"PaymentProofPath\", 100) as proof_head, LENGTH(\"PaymentProofPath\") as proof_len FROM \"Registrations\" WHERE \"PaymentProofPath\" IS NOT NULL ORDER BY \"Id\" DESC LIMIT 5");
  console.log('Registrations:', res.rows);
  const pt = await client.query("SELECT \"RegistrationID\", LEFT(\"PaymentProofPath\", 100) as proof_head, LENGTH(\"PaymentProofPath\") as proof_len FROM \"PaymentTracking\" WHERE \"PaymentProofPath\" IS NOT NULL ORDER BY \"CreatedAt\" DESC LIMIT 5");
  console.log('PaymentTracking:', pt.rows);
  client.end();
}).catch(console.error);
