const sql = require('mssql');
require('dotenv').config({ path: '.env.local' });

const config = {
  user: process.env.MSSQL_DB_USER || "sa",
  password: process.env.MSSQL_DB_PASSWORD || "4xg8i3h0rf265",
  server: process.env.MSSQL_DB_SERVER || "172.20.10.4",
  database: process.env.MSSQL_DB_NAME || "LMS_DB",
  options: { encrypt: false, trustServerCertificate: true },
};

async function run() {
  try {
    const pool = await sql.connect(config);
    const result = await pool.request().query("SELECT CourseID, Code, Title, AgendaPDFPath FROM LMS_Courses");
    console.log("ALL COURSES:");
    for (let r of result.recordset.slice(0, 10)) {
      console.log(`${r.CourseID} - ${r.Code}: ${r.Title} - Path: ${r.AgendaPDFPath}`);
    }
    pool.close();
  } catch(e) {
    console.error(e);
  }
}
run();
