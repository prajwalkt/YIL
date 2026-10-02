const sql = require('mssql');
require('dotenv').config({ path: '.env.local' });
async function check() {
  try {
    const pool = await sql.connect({
      user: process.env.MSSQL_DB_USER,
      password: process.env.MSSQL_DB_PASSWORD,
      server: process.env.MSSQL_DB_SERVER,
      database: process.env.MSSQL_DB_NAME,
      options: { encrypt: false, trustServerCertificate: true },
    });
    const res = await pool.request().query("SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'LMS_Users'");
    console.log("LMS_Users:", res.recordset.map(r => r.COLUMN_NAME).join(', '));
    process.exit(0);
  } catch(e) { console.error(e); process.exit(1); }
}
check();
