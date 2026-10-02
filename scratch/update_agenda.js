require('dotenv').config({ path: '.env.local' });
const sql = require('mssql');

async function run() {
  try {
    const pool = await sql.connect({
      user: process.env.MSSQL_DB_USER,
      password: process.env.MSSQL_DB_PASSWORD,
      server: process.env.MSSQL_DB_SERVER,
      database: process.env.MSSQL_DB_NAME,
      options: { encrypt: false, trustServerCertificate: true },
    });
    
    await pool.request().query("UPDATE LMS_Courses SET AgendaPDFPath = '/agendas/centum_vp_fundamentals_engineering.pdf' WHERE CourseID = 3");
    
    const res = await pool.request().query("SELECT CourseID, Title, AgendaPDFPath FROM LMS_Courses");
    console.log(res.recordset);
    process.exit(0);
  } catch(e) { console.error(e); process.exit(1); }
}
run();
