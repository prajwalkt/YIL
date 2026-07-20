const sql = require('mssql');

const config = {
  user: 'sa',
  password: '4xg8i3h0rf265',
  server: '172.20.10.4',
  database: 'LMS_DB',
  options: {
    encrypt: false,
    trustServerCertificate: true,
  },
};

async function run() {
  try {
    const pool = await sql.connect(config);
    
    // Create SystemSettings
    console.log("Creating SystemSettings...");
    await pool.request().query(`
    IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='SystemSettings' and xtype='U')
    CREATE TABLE SystemSettings (
        SettingKey VARCHAR(100) PRIMARY KEY,
        SettingValue NVARCHAR(MAX),
        Description NVARCHAR(255)
    )
    `);

    // Default Settings
    console.log("Inserting Default Settings...");
    await pool.request().query("IF NOT EXISTS (SELECT 1 FROM SystemSettings WHERE SettingKey='MinAttendance') INSERT INTO SystemSettings (SettingKey, SettingValue, Description) VALUES ('MinAttendance', '75', 'Minimum attendance percentage required for certificate')");
    await pool.request().query("IF NOT EXISTS (SELECT 1 FROM SystemSettings WHERE SettingKey='PassMarks') INSERT INTO SystemSettings (SettingKey, SettingValue, Description) VALUES ('PassMarks', '60', 'Minimum passing marks percentage required for certificate')");
    await pool.request().query("IF NOT EXISTS (SELECT 1 FROM SystemSettings WHERE SettingKey='DefaultBatchCapacity') INSERT INTO SystemSettings (SettingKey, SettingValue, Description) VALUES ('DefaultBatchCapacity', '20', 'Default max participants for a new batch')");

    // Create Attendance
    console.log("Creating Attendance...");
    await pool.request().query(`
    IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Attendance' and xtype='U')
    CREATE TABLE Attendance (
        AttendanceID INT IDENTITY(1,1) PRIMARY KEY,
        EnrollmentID INT NOT NULL,
        CalendarID INT NOT NULL,
        SessionDate DATE NOT NULL,
        Status VARCHAR(20) NOT NULL,
        MarkedBy INT,
        CreatedAt DATETIME DEFAULT GETDATE()
    )
    `);

    // Modify Enrollments
    console.log("Adding AttendancePercentage to Enrollments...");
    await pool.request().query(`
    IF COL_LENGTH('Enrollments', 'AttendancePercentage') IS NULL
    BEGIN
        ALTER TABLE Enrollments ADD AttendancePercentage FLOAT DEFAULT 0;
    END
    `);

    console.log("Migration successful.");
    pool.close();
  } catch (err) {
    console.error("Error:", err);
  }
}
run();
