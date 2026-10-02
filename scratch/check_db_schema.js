const sql = require('mssql');
require('dotenv').config({ path: '.env.local' });
async function check() {
  try {
    const pool = await sql.connect({
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      server: 'localhost', // Hardcode localhost to avoid undefined
      database: process.env.DB_NAME,
      options: { encrypt: false, trustServerCertificate: true },
    });
    const res = await pool.request().query("SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Registrations'");
    console.log("Registrations:", res.recordset.map(r => r.COLUMN_NAME).join(', '));
    const res2 = await pool.request().query("SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'LMS_Users'");
    console.log("LMS_Users:", res2.recordset.map(r => r.COLUMN_NAME).join(', '));
    process.exit(0);
  } catch(e) { console.error(e); process.exit(1); }
}
check();
