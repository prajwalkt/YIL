require('dotenv').config({ path: '.env.local' });
const sql = require('mssql');

async function run() {
  try {
    const config = {
      user: process.env.MSSQL_DB_USER,
      password: process.env.MSSQL_DB_PASSWORD,
      server: process.env.MSSQL_DB_SERVER,
      database: process.env.MSSQL_DB_NAME,
      options: { encrypt: false, trustServerCertificate: true }
    };
    await sql.connect(config);
    
    // Check User
    const userRes = await sql.query(`SELECT UserID, Email, Role, IsActive, MustChangePassword FROM LMS_Users WHERE Email = 'gapuser@example.com'`);
    console.log("USER:", userRes.recordset);

    if (userRes.recordset.length > 0) {
      const userId = userRes.recordset[0].UserID;
      // Check Enrollments
      const enrollRes = await sql.query(`
        SELECT e.EnrollmentID, c.Title, e.Status
        FROM Enrollments e
        JOIN LMS_Courses c ON e.CourseID = c.CourseID
        WHERE e.StudentID = ${userId}
      `);
      console.log("ENROLLMENTS:", enrollRes.recordset);
    }

  } catch(e) {
    console.error(e);
  } finally {
    process.exit();
  }
}
run();
