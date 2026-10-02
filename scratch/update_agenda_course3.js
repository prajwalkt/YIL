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

async function runUpdate() {
  try {
    const pool = await sql.connect(config);
    console.log("Connected to DB");
    
    // Update Course ID 3 agenda
    console.log("Updating Course ID 3 agenda path...");
    const updateRes = await pool.request().query(`
      UPDATE LMS_Courses 
      SET AgendaPDFPath = '/agendas/centum-vp-fundamentals.pdf' 
      WHERE CourseID = 3;
    `);
    console.log("Rows updated:", updateRes.rowsAffected);
    
    process.exit(0);
  } catch (err) {
    console.error("Failed:", err);
    process.exit(1);
  }
}

runUpdate();
