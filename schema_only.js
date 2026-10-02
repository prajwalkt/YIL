require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

const pgPool = new Pool({
  connectionString: process.env.NEON_DATABASE_URL,
});

async function migrate() {
  console.log('Creating Schema in Postgres...');
  const schemaSql = `
    CREATE TABLE IF NOT EXISTS "LMS_Users" (
        "UserID" SERIAL PRIMARY KEY,
        "Email" VARCHAR(255) NOT NULL UNIQUE,
        "PasswordHash" VARCHAR(512) NOT NULL,
        "Role" VARCHAR(20) NOT NULL,
        "FirstName" VARCHAR(100),
        "LastName" VARCHAR(100),
        "Phone" VARCHAR(30),
        "Organization" VARCHAR(200),
        "Country" VARCHAR(100),
        "IsActive" BOOLEAN DEFAULT true,
        "IsApproved" BOOLEAN DEFAULT false,
        "MustChangePassword" BOOLEAN DEFAULT false,
        "FailedLoginAttempts" INT DEFAULT 0,
        "LockoutUntil" TIMESTAMP NULL,
        "CreatedAt" TIMESTAMP DEFAULT NOW(),
        "LastLogin" TIMESTAMP NULL,
        "ProfilePicture" VARCHAR(500) NULL,
        "ResetToken" VARCHAR(200) NULL,
        "ResetTokenExpiry" TIMESTAMP NULL
    );

    CREATE TABLE IF NOT EXISTS "TrainerProfiles" (
        "ProfileID" SERIAL PRIMARY KEY,
        "UserID" INT NOT NULL REFERENCES "LMS_Users"("UserID") ON DELETE CASCADE,
        "EmployeeID" VARCHAR(50),
        "Department" VARCHAR(100),
        "Expertise" TEXT,
        "ExperienceYears" INT DEFAULT 0,
        "TrainerRating" FLOAT DEFAULT 0,
        "Certifications" TEXT,
        "Biography" TEXT,
        "LinkedInURL" VARCHAR(500),
        "IsApproved" BOOLEAN DEFAULT false,
        "CreatedAt" TIMESTAMP DEFAULT NOW(),
        "UpdatedAt" TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS "LMS_Courses" (
        "CourseID" SERIAL PRIMARY KEY,
        "Title" VARCHAR(300) NOT NULL,
        "Code" VARCHAR(50) UNIQUE,
        "Description" TEXT,
        "Duration" VARCHAR(50),
        "FeeINR" DECIMAL(10,2) DEFAULT 0,
        "FeeUSD" DECIMAL(10,2) DEFAULT 0,
        "Mode" VARCHAR(20),
        "Status" VARCHAR(20) DEFAULT 'ACTIVE',
        "OpenDate" DATE NULL,
        "CloseDate" DATE NULL,
        "AgendaPDFPath" VARCHAR(500),
        "ThumbnailPath" VARCHAR(500),
        "MaxParticipants" INT DEFAULT 20,
        "Category" VARCHAR(100),
        "CreatedBy" INT NULL REFERENCES "LMS_Users"("UserID"),
        "CreatedAt" TIMESTAMP DEFAULT NOW(),
        "UpdatedAt" TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS "TrainingCalendar" (
        "CalendarID" SERIAL PRIMARY KEY,
        "CourseID" INT NULL REFERENCES "LMS_Courses"("CourseID"),
        "Title" VARCHAR(300) NOT NULL,
        "TrainingType" VARCHAR(20),
        "StartDate" DATE NOT NULL,
        "EndDate" DATE NOT NULL,
        "TrainerID" INT NULL REFERENCES "LMS_Users"("UserID"),
        "TrainerName" VARCHAR(200),
        "Location" VARCHAR(300),
        "MaxParticipants" INT DEFAULT 20,
        "CurrentEnrolled" INT DEFAULT 0,
        "Status" VARCHAR(20) DEFAULT 'SCHEDULED',
        "Notes" TEXT,
        "CreatedAt" TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS "Enrollments" (
        "EnrollmentID" SERIAL PRIMARY KEY,
        "StudentID" INT NOT NULL REFERENCES "LMS_Users"("UserID"),
        "CourseID" INT NOT NULL REFERENCES "LMS_Courses"("CourseID"),
        "RegistrationID" INT NULL,
        "EnrolledAt" TIMESTAMP DEFAULT NOW(),
        "Status" VARCHAR(30) DEFAULT 'ENROLLED',
        "ProgressPercent" INT DEFAULT 0,
        "CompletedAt" TIMESTAMP NULL,
        "CalendarID" INT NULL REFERENCES "TrainingCalendar"("CalendarID"),
        UNIQUE ("StudentID", "CourseID")
    );

    CREATE TABLE IF NOT EXISTS "Certificates" (
        "CertificateID" SERIAL PRIMARY KEY,
        "CertificateNo" VARCHAR(100) UNIQUE NOT NULL,
        "StudentID" INT NOT NULL REFERENCES "LMS_Users"("UserID"),
        "EnrollmentID" INT NULL REFERENCES "Enrollments"("EnrollmentID"),
        "CourseID" INT NOT NULL REFERENCES "LMS_Courses"("CourseID"),
        "ParticipantName" VARCHAR(200),
        "CourseName" VARCHAR(300),
        "TrainerName" VARCHAR(200),
        "IssueDate" DATE NOT NULL,
        "ValidUntil" DATE NULL,
        "PDFPath" VARCHAR(500),
        "IssuedBy" INT NULL REFERENCES "LMS_Users"("UserID"),
        "CreatedAt" TIMESTAMP DEFAULT NOW()
    );
    
    CREATE TABLE IF NOT EXISTS "LMS_Registrations" (
        "Id" SERIAL PRIMARY KEY,
        "Name" VARCHAR(200),
        "Email" VARCHAR(255),
        "Phone" VARCHAR(30),
        "Country" VARCHAR(100),
        "Organization" VARCHAR(200),
        "Designation" VARCHAR(200),
        "TrainingType" VARCHAR(50),
        "CourseId" INT,
        "CourseName" VARCHAR(300),
        "Amount" DECIMAL(10,2),
        "Currency" VARCHAR(10),
        "PaymentStatus" VARCHAR(50),
        "PaymentProofPath" VARCHAR(500),
        "AdminApproval" BOOLEAN DEFAULT false,
        "FinanceApproval" BOOLEAN DEFAULT false,
        "TMApproval" BOOLEAN DEFAULT false,
        "Status" VARCHAR(50),
        "CreatedAt" TIMESTAMP DEFAULT NOW(),
        "RejectionReason" TEXT
    );
  `;
  await pgPool.query(schemaSql);
  console.log('Schema created.');
  process.exit(0);
}

migrate().catch(console.error);
