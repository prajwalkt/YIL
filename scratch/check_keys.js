require('dotenv').config({path: '.env.development.local'});
const { Client } = require('pg');
const client = new Client({ connectionString: process.env.NEON_DATABASE_URL });
client.connect().then(async () => {
  const res = await client.query("SELECT * FROM \"Registrations\" ORDER BY \"Id\" DESC LIMIT 1");
  console.log(Object.keys(res.rows[0]));
  client.end();
}).catch(console.error);
