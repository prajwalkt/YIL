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

async function runUpdateAndVerify() {
  try {
    const pool = await sql.connect(config);
    console.log("Connected to DB");
    
    // Update Course ID 3
    console.log("Updating Course ID 3...");
    const updateRes = await pool.request().query(`
      UPDATE LMS_Courses 
      SET ManualURL = 'https://centumvpheyzinefixedv01.vercel.app/' 
      WHERE CourseID = 3;
    `);
    console.log("Rows updated:", updateRes.rowsAffected);
    
    // Verify
    console.log("Verifying specific courses...");
    const verifyRes = await pool.request().query(`
      SELECT CourseID, Title, Code, ManualURL 
      FROM LMS_Courses
      WHERE CourseID IN (1, 2, 3, 4, 19)
    `);
    console.table(verifyRes.recordset);
    
    process.exit(0);
  } catch (err) {
    console.error("Failed:", err);
    process.exit(1);
  }
}

runUpdateAndVerify();
