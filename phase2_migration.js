// phase2_migration.js
// Run: node phase2_migration.js
// Adds: ELearningContent, ELearningProgress tables + ActiveSessionToken column on LMS_Users

const sql = require('mssql');

const config = {
  user: 'sa',
  password: '4xg8i3h0rf265',
  server: '172.20.10.4',
  database: 'LMS_DB',
  port: 1433,
  options: { encrypt: false, trustServerCertificate: true },
};

async function migrate() {
  let pool;
  try {
    pool = await sql.connect(config);
    console.log('✅ Connected to database');

    // 1. Add ActiveSessionToken to LMS_Users
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('LMS_Users') AND name = 'ActiveSessionToken')
      BEGIN
        ALTER TABLE LMS_Users ADD ActiveSessionToken NVARCHAR(512) NULL;
        PRINT 'Added ActiveSessionToken to LMS_Users';
      END
    `);
    console.log('✅ LMS_Users.ActiveSessionToken column ensured');

    // 2. Add MustChangePassword to LMS_Users (may already exist)
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('LMS_Users') AND name = 'MustChangePassword')
      BEGIN
        ALTER TABLE LMS_Users ADD MustChangePassword BIT DEFAULT 0;
        PRINT 'Added MustChangePassword to LMS_Users';
      END
    `);
    console.log('✅ LMS_Users.MustChangePassword column ensured');

    // 3. Create ELearningContent table
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='ELearningContent' AND xtype='U')
      BEGIN
        CREATE TABLE ELearningContent (
          ContentID     INT IDENTITY(1,1) PRIMARY KEY,
          CourseID      INT NOT NULL FOREIGN KEY REFERENCES LMS_Courses(CourseID) ON DELETE CASCADE,
          Title         NVARCHAR(300) NOT NULL,
          ContentType   NVARCHAR(20) NOT NULL CHECK (ContentType IN ('VIDEO','PDF','DOCUMENT','LINK')),
          FilePath      NVARCHAR(500) NOT NULL,
          FileSize      BIGINT DEFAULT 0,
          DurationSec   INT DEFAULT 0,
          SortOrder     INT DEFAULT 0,
          IsRequired    BIT DEFAULT 1,
          ThumbnailPath NVARCHAR(500) NULL,
          Description   NVARCHAR(MAX) NULL,
          CreatedBy     INT NULL FOREIGN KEY REFERENCES LMS_Users(UserID),
          CreatedAt     DATETIME DEFAULT GETDATE(),
          UpdatedAt     DATETIME DEFAULT GETDATE()
        );
        PRINT 'Created ELearningContent table';
      END
    `);
    console.log('✅ ELearningContent table ensured');

    // 4. Create ELearningProgress table
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='ELearningProgress' AND xtype='U')
      BEGIN
        CREATE TABLE ELearningProgress (
          ProgressID    INT IDENTITY(1,1) PRIMARY KEY,
          UserID        INT NOT NULL FOREIGN KEY REFERENCES LMS_Users(UserID) ON DELETE CASCADE,
          ContentID     INT NOT NULL FOREIGN KEY REFERENCES ELearningContent(ContentID),
          EnrollmentID  INT NULL,
          WatchedSeconds INT DEFAULT 0,
          TotalSeconds  INT DEFAULT 0,
          IsCompleted   BIT DEFAULT 0,
          LastPosition  INT DEFAULT 0,
          CompletedAt   DATETIME NULL,
          UpdatedAt     DATETIME DEFAULT GETDATE(),
          CONSTRAINT UQ_ELearningProgress UNIQUE(UserID, ContentID)
        );
        PRINT 'Created ELearningProgress table';
      END
    `);
    console.log('✅ ELearningProgress table ensured');

    console.log('\n🎉 Phase 2 migration completed successfully!');
  } catch (err) {
    console.error('❌ Migration failed:', err);
    process.exit(1);
  } finally {
    if (pool) await pool.close();
  }
}

migrate();
