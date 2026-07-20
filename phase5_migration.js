const sql = require('mssql');
require('dotenv').config({ path: '.env.local' });

const config = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER,
  database: process.env.DB_NAME,
  options: { encrypt: false, trustServerCertificate: true },
};

async function migrate() {
  let pool;
  try {
    console.log("Connecting to database...");
    pool = await sql.connect(config);
    console.log("✅ Connected to database");

    // 1. ErrorLogs
    console.log("Creating ErrorLogs table...");
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='ErrorLogs' and xtype='U')
      CREATE TABLE ErrorLogs (
        LogID INT IDENTITY(1,1) PRIMARY KEY,
        Timestamp DATETIME DEFAULT GETDATE(),
        Module NVARCHAR(100),
        UserID INT NULL,
        ErrorMessage NVARCHAR(MAX),
        StackTrace NVARCHAR(MAX),
        Severity NVARCHAR(50),
        Status NVARCHAR(50) DEFAULT 'Open'
      )
    `);

    // 2. OrganizationBranding
    console.log("Creating OrganizationBranding table...");
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='OrganizationBranding' and xtype='U')
      CREATE TABLE OrganizationBranding (
        BrandID INT IDENTITY(1,1) PRIMARY KEY,
        LogoPath NVARCHAR(MAX),
        PrimaryColor NVARCHAR(50) DEFAULT '#005b9f',
        SecondaryColor NVARCHAR(50) DEFAULT '#f2a900',
        Theme NVARCHAR(50) DEFAULT 'light',
        EmailBranding NVARCHAR(MAX),
        PortalBranding NVARCHAR(MAX),
        UpdatedAt DATETIME DEFAULT GETDATE(),
        UpdatedBy INT NULL
      )
    `);

    // Seed default branding if not exists
    await pool.request().query(`
      IF NOT EXISTS (SELECT 1 FROM OrganizationBranding)
      BEGIN
        INSERT INTO OrganizationBranding (LogoPath, PrimaryColor, SecondaryColor, Theme, EmailBranding, PortalBranding)
        VALUES ('/yokogawa_logo.png', '#005b9f', '#f2a900', 'light', 'Yokogawa Training Services', 'Yokogawa Training Services LMS')
      END
    `);

    // 3. CourseMaterialVersions
    console.log("Creating CourseMaterialVersions table...");
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='CourseMaterialVersions' and xtype='U')
      CREATE TABLE CourseMaterialVersions (
        VersionID INT IDENTITY(1,1) PRIMARY KEY,
        MaterialID INT,
        FilePath NVARCHAR(MAX),
        VersionNumber INT,
        UploadedBy INT,
        UploadDate DATETIME DEFAULT GETDATE()
      )
    `);

    // 4. PasswordResetTokens
    console.log("Creating PasswordResetTokens table...");
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='PasswordResetTokens' and xtype='U')
      CREATE TABLE PasswordResetTokens (
        TokenID INT IDENTITY(1,1) PRIMARY KEY,
        UserID INT,
        TokenHash NVARCHAR(MAX),
        CreatedAt DATETIME DEFAULT GETDATE(),
        ExpiresAt DATETIME,
        IsUsed BIT DEFAULT 0,
        IPAddress NVARCHAR(100)
      )
    `);

    // 5. Add VerificationHash to Certificates
    console.log("Altering Certificates table...");
    await pool.request().query(`
      IF COL_LENGTH('Certificates', 'VerificationHash') IS NULL
      BEGIN
          ALTER TABLE Certificates ADD VerificationHash NVARCHAR(100) NULL
      END
    `);

    // Ensure Certificates VerificationHash gets populated for existing rows
    await pool.request().query(`
      UPDATE Certificates SET VerificationHash = NEWID() WHERE VerificationHash IS NULL
    `);

    // 6. Indexes for Performance
    console.log("Creating Indexes for Performance...");
    const indexes = [
      "CREATE INDEX IX_Sessions_UserID ON LMS_Sessions(UserID)",
      "CREATE INDEX IX_ErrorLogs_Timestamp ON ErrorLogs(Timestamp DESC)",
      "CREATE INDEX IX_PassTokens_Hash ON PasswordResetTokens(TokenHash)",
      "CREATE INDEX IX_Certificates_Hash ON Certificates(VerificationHash)",
      "CREATE INDEX IX_LMSUsers_Email ON LMS_Users(Email)",
      "CREATE INDEX IX_Enrollments_StudentCourse ON Enrollments(StudentID, CourseID)",
      "CREATE INDEX IX_Registrations_Status ON Registrations(Status)",
      "CREATE INDEX IX_Courses_Status ON LMS_Courses(Status)"
    ];

    for (let idx of indexes) {
      try {
        await pool.request().query(idx);
      } catch (e) {
        // Ignore if already exists (error 1913 or 2714)
      }
    }

    console.log("🎉 Phase 5 DB migration completed successfully!");
  } catch (err) {
    console.error("❌ Migration failed:", err);
  } finally {
    if (pool) pool.close();
  }
}

migrate();
