require('dotenv').config({path: '.env.local'});
const { Client } = require('pg');
const client = new Client({ connectionString: process.env.NEON_DATABASE_URL });
client.connect().then(async () => {
  const reg = await client.query("SELECT Id, PaymentProofPath, Status, CreatedAt FROM Registrations ORDER BY CreatedAt DESC LIMIT 5");
  console.log('--- LATEST REGISTRATIONS ---');
  reg.rows.forEach(r => {
    console.log(`ID: ${r.id}, Status: ${r.status}, ProofLength: ${r.paymentproofpath ? r.paymentproofpath.length : 0}, Prefix: ${r.paymentproofpath ? r.paymentproofpath.substring(0, 50) : 'null'}`);
  });

  const pt = await client.query("SELECT RegistrationID, PaymentProofPath, Status, CreatedAt FROM PaymentTracking ORDER BY CreatedAt DESC LIMIT 5");
  console.log('--- LATEST PAYMENT TRACKING ---');
  pt.rows.forEach(r => {
    console.log(`RegID: ${r.registrationid}, Status: ${r.status}, ProofLength: ${r.paymentproofpath ? r.paymentproofpath.length : 0}, Prefix: ${r.paymentproofpath ? r.paymentproofpath.substring(0, 50) : 'null'}`);
  });
  client.end();
}).catch(console.error);
