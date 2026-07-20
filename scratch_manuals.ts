import { getConnection } from './app/library/db';

async function check() {
  const pool = await getConnection();
  try {
    const result = await pool.request().query(`
      SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'InteractiveManuals'
    `);
    console.log(result.recordset);
    
    if (result.recordset.length === 0) {
      await pool.request().query(`
        CREATE TABLE InteractiveManuals (
            ManualID INT IDENTITY(1,1) PRIMARY KEY,
            CourseID INT FOREIGN KEY REFERENCES LMS_Courses(CourseID),
            Title NVARCHAR(200),
            Description NVARCHAR(500),
            FilePath NVARCHAR(500),
            IsActive BIT DEFAULT 1,
            CreatedAt DATETIME DEFAULT GETDATE()
        )
      `);
      console.log("Table created.");
    } else {
      console.log("Table already exists.");
    }
  } catch (e: any) {
    console.log("Error:", e.message);
  }
  process.exit(0);
}

check();
