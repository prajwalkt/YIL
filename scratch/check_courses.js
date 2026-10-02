const sql = require('mssql');
require('dotenv').config({ path: '.env.local' });

const config = {
  user: process.env.MSSQL_DB_USER,
  password: process.env.MSSQL_DB_PASSWORD,
  server: process.env.MSSQL_DB_SERVER,
  database: process.env.MSSQL_DB_NAME,
  options: {
    encrypt: true,
    trustServerCertificate: true,
  },
};

async function queryCourses() {
  try {
    const pool = await sql.connect(config);
    const result = await pool.request().query(`
      SELECT CourseID, Title, Code, ManualURL 
      FROM LMS_Courses
    `);
    console.table(result.recordset);
    process.exit(0);
  } catch (err) {
    console.error("Query failed:", err);
    process.exit(1);
  }
}

queryCourses();
