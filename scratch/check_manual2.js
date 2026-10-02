const sql = require('mssql');
const config = {
  user: 'sa',
  password: '4xg8i3h0rf265',
  server: '172.20.10.4',
  database: 'LMS_DB',
  options: { encrypt: true, trustServerCertificate: true }
};
async function check() {
  const pool = await sql.connect(config);
  const r = await pool.request().query("SELECT Title, ManualURL FROM LMS_Courses");
  console.log(r.recordset);
  process.exit(0);
}
check();
