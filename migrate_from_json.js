require('dotenv').config({ path: '.env.local' });
const fs = require('fs');
const { neon } = require('@neondatabase/serverless');

const sql = neon(process.env.NEON_DATABASE_URL);

async function migrate() {
  console.log('Creating Schema in Postgres via Neon Serverless...');
    const schemaSql = `
    DROP TABLE IF EXISTS LMS_Registrations CASCADE;
    DROP TABLE IF EXISTS Certificates CASCADE;
    DROP TABLE IF EXISTS Enrollments CASCADE;
    DROP TABLE IF EXISTS TrainingCalendar CASCADE;
    DROP TABLE IF EXISTS LMS_Courses CASCADE;
    DROP TABLE IF EXISTS TrainerProfiles CASCADE;
    DROP TABLE IF EXISTS LMS_Users CASCADE;

    CREATE TABLE IF NOT EXISTS LMS_Users (
        UserID SERIAL PRIMARY KEY,
        Email VARCHAR(255) NOT NULL UNIQUE,
        PasswordHash VARCHAR(512) NOT NULL,
        Role VARCHAR(20) NOT NULL,
        FirstName VARCHAR(100),
        LastName VARCHAR(100),
        Phone VARCHAR(30),
        Organization VARCHAR(200),
        Country VARCHAR(100),
        IsActive BOOLEAN DEFAULT true,
        IsApproved BOOLEAN DEFAULT false,
        MustChangePassword BOOLEAN DEFAULT false,
        FailedLoginAttempts INT DEFAULT 0,
        LockoutUntil TIMESTAMP NULL,
        CreatedAt TIMESTAMP DEFAULT NOW(),
        LastLogin TIMESTAMP NULL,
        ProfilePicture VARCHAR(500) NULL,
        ResetToken VARCHAR(200) NULL,
        ResetTokenExpiry TIMESTAMP NULL,
        ActiveSessionToken VARCHAR(500) NULL
    );

    CREATE TABLE IF NOT EXISTS TrainerProfiles (
        ProfileID SERIAL PRIMARY KEY,
        UserID INT NOT NULL REFERENCES LMS_Users(UserID) ON DELETE CASCADE,
        EmployeeID VARCHAR(50),
        Department VARCHAR(100),
        Expertise TEXT,
        ExperienceYears INT DEFAULT 0,
        TrainerRating FLOAT DEFAULT 0,
        Certifications TEXT,
        Biography TEXT,
        LinkedInURL VARCHAR(500),
        IsApproved BOOLEAN DEFAULT false,
        CreatedAt TIMESTAMP DEFAULT NOW(),
        UpdatedAt TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS LMS_Courses (
        CourseID SERIAL PRIMARY KEY,
        Title VARCHAR(300) NOT NULL,
        Code VARCHAR(50) UNIQUE,
        Description TEXT,
        Duration VARCHAR(50),
        FeeINR DECIMAL(10,2) DEFAULT 0,
        FeeUSD DECIMAL(10,2) DEFAULT 0,
        Mode VARCHAR(20),
        Status VARCHAR(20) DEFAULT 'ACTIVE',
        OpenDate DATE NULL,
        CloseDate DATE NULL,
        AgendaPDFPath VARCHAR(500),
        ThumbnailPath VARCHAR(500),
        MaxParticipants INT DEFAULT 20,
        Category VARCHAR(100),
        CreatedBy INT NULL REFERENCES LMS_Users(UserID),
        CreatedAt TIMESTAMP DEFAULT NOW(),
        UpdatedAt TIMESTAMP DEFAULT NOW(),
        DurationDays INT DEFAULT 0,
        TemplateID INT NULL
    );

    CREATE TABLE IF NOT EXISTS TrainingCalendar (
        CalendarID SERIAL PRIMARY KEY,
        CourseID INT NULL REFERENCES LMS_Courses(CourseID),
        Title VARCHAR(300) NOT NULL,
        TrainingType VARCHAR(20),
        StartDate DATE NOT NULL,
        EndDate DATE NOT NULL,
        TrainerID INT NULL REFERENCES LMS_Users(UserID),
        TrainerName VARCHAR(200),
        Location VARCHAR(300),
        MaxParticipants INT DEFAULT 20,
        CurrentEnrolled INT DEFAULT 0,
        Status VARCHAR(20) DEFAULT 'SCHEDULED',
        Notes TEXT,
        HolidayFlag BOOLEAN,
        TMConfirmed BOOLEAN,
        TMConfirmedAt TIMESTAMP,
        TMConfirmedBy INT,
        CreatedAt TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS Enrollments (
        EnrollmentID SERIAL PRIMARY KEY,
        StudentID INT NOT NULL REFERENCES LMS_Users(UserID),
        CourseID INT NOT NULL REFERENCES LMS_Courses(CourseID),
        RegistrationID INT NULL,
        EnrolledAt TIMESTAMP DEFAULT NOW(),
        Status VARCHAR(30) DEFAULT 'ENROLLED',
        ProgressPercent INT DEFAULT 0,
        AttendancePercentage INT DEFAULT 0,
        AccessStartDate TIMESTAMP NULL,
        AccessEndDate TIMESTAMP NULL,
        CompletedAt TIMESTAMP NULL,
        CalendarID INT NULL REFERENCES TrainingCalendar(CalendarID),
        DurationDays INT DEFAULT 0,
        UNIQUE (StudentID, CourseID)
    );

    CREATE TABLE IF NOT EXISTS Certificates (
        CertificateID SERIAL PRIMARY KEY,
        CertificateNo VARCHAR(100) UNIQUE NOT NULL,
        StudentID INT NOT NULL REFERENCES LMS_Users(UserID),
        EnrollmentID INT NULL REFERENCES Enrollments(EnrollmentID),
        CourseID INT NOT NULL REFERENCES LMS_Courses(CourseID),
        ParticipantName VARCHAR(200),
        CourseName VARCHAR(300),
        TrainerName VARCHAR(200),
        IssueDate DATE NOT NULL,
        ValidUntil DATE NULL,
        PDFPath VARCHAR(500),
        IssuedBy INT NULL REFERENCES LMS_Users(UserID),
        CreatedAt TIMESTAMP DEFAULT NOW()
    );
    
    CREATE TABLE IF NOT EXISTS Registrations (
        Id SERIAL PRIMARY KEY,
        Name VARCHAR(200),
        Email VARCHAR(255),
        Phone VARCHAR(30),
        Organization VARCHAR(200),
        Country VARCHAR(100),
        GraduationYear VARCHAR(20),
        Course VARCHAR(300),
        TrainingMode VARCHAR(50),
        SponsoredBy VARCHAR(100),
        SpecialInstructions TEXT,
        PaymentProofPath VARCHAR(500),
        Status VARCHAR(50),
        FinanceApprovedBy VARCHAR(255),
        FinanceApprovedAt TIMESTAMP,
        TMApprovedBy VARCHAR(255),
        TMApprovedAt TIMESTAMP,
        AdminApprovedBy VARCHAR(255),
        AdminApprovedAt TIMESTAMP,
        CreatedAt TIMESTAMP DEFAULT NOW(),
        ApprovalRemarks TEXT,
        LinkedUserID INT,
        RegistrationType VARCHAR(50),
        SelectedSlotID INT,
        PreferredStartDate DATE,
        PreferredEndDate DATE,
        OriginalStartDate DATE,
        OriginalEndDate DATE,
        FinalStartDate DATE,
        FinalEndDate DATE,
        DateApprovalStatus VARCHAR(50),
        TMReviewedBy VARCHAR(255),
        TMReviewDate TIMESTAMP,
        TMRemarks TEXT,
        TrainerId INT
    );
  `;
  
  // Neon serverless driver doesn't support multiple statements well, so we split them
  const stmts = schemaSql.split(';').filter(s => s.trim().length > 0);
  for (const stmt of stmts) {
    await sql.query(stmt);
  }
  
  console.log('Schema created.');

  // Import data from lms_db_backup.json
  const data = JSON.parse(fs.readFileSync('lms_db_backup.json', 'utf8'));
  
  // Define tables in order to respect FKs
  const tables = ['LMS_Users', 'TrainerProfiles', 'LMS_Courses', 'TrainingCalendar', 'Enrollments', 'Certificates', 'Registrations'];

  for (const table of tables) {
    const rows = data[table] || [];
    if (rows.length === 0) continue;

    console.log(`Inserting ${rows.length} rows into ${table}...`);
    const keys = Object.keys(rows[0]);
    
    for (const row of rows) {
      const values = keys.map(k => row[k]);
      const placeholders = keys.map((_, i) => `$${i+1}`).join(', ');
      
      const insertSql = `
        INSERT INTO ${table} (${keys.join(', ')})
        VALUES (${placeholders})
        ON CONFLICT DO NOTHING
      `;
      
      try {
        await sql.query(insertSql, values);
      } catch (e) {
        console.error(`Failed to insert into ${table}`, e.message);
      }
    }
    
    const pkColumn = keys[0];
    await sql.query(`SELECT setval('${table}_${pkColumn}_seq', COALESCE((SELECT MAX(${pkColumn}) FROM ${table}) + 1, 1), false)`).catch(() => {});
  }
  
  console.log('Migration successfully completed over HTTPS.');
}

migrate().catch(console.error);
