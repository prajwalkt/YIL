require('dotenv').config({path: '.env.vercel'});
const { Client } = require('pg');
const client = new Client({ connectionString: process.env.NEON_DATABASE_URL });
client.connect().then(async () => {
  const res = await client.query("SELECT column_name, data_type, character_maximum_length FROM information_schema.columns WHERE table_name = 'Registrations' AND column_name = 'PaymentProofPath'");
  console.log('Registrations:', res.rows);
  const pt = await client.query("SELECT column_name, data_type, character_maximum_length FROM information_schema.columns WHERE table_name = 'PaymentTracking' AND column_name = 'PaymentProofPath'");
  console.log('PaymentTracking:', pt.rows);
  client.end();
}).catch(console.error);
