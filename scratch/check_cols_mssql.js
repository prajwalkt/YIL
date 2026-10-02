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
  const r = await pool.request().query("SELECT TOP 1 * FROM TrainingCalendar");
  console.log(Object.keys(r.recordset[0]));
  process.exit(0);
}
check();
