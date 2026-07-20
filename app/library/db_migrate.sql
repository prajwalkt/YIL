-- ============================================================
-- YTS LMS - Complete SQL Server Schema Migration
-- Server: 172.20.10.4:1433 | DB: LMS_DB
-- Run once to set up all new tables
-- ============================================================

USE LMS_DB;

-- ============================================================
-- USERS TABLE (LMS Role-Based Users)
-- ============================================================
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='LMS_Users' AND xtype='U')
BEGIN
    CREATE TABLE LMS_Users (
        UserID          INT IDENTITY(1,1) PRIMARY KEY,
        Email           NVARCHAR(255) NOT NULL UNIQUE,
        PasswordHash    NVARCHAR(512) NOT NULL,
        Role            NVARCHAR(20) NOT NULL CHECK (Role IN ('ADMIN','TRAINER','AFFILIATE','STUDENT','FINANCE','TM')),
        FirstName       NVARCHAR(100),
        LastName        NVARCHAR(100),
        Phone           NVARCHAR(30),
        Organization    NVARCHAR(200),
        Country         NVARCHAR(100),
        IsActive        BIT DEFAULT 1,
        IsApproved      BIT DEFAULT 0,
        MustChangePassword BIT DEFAULT 0,
        FailedLoginAttempts INT DEFAULT 0,
        LockoutUntil    DATETIME NULL,
        CreatedAt       DATETIME DEFAULT GETDATE(),
        LastLogin       DATETIME NULL,
        ProfilePicture  NVARCHAR(500) NULL,
        ResetToken      NVARCHAR(200) NULL,
        ResetTokenExpiry DATETIME NULL
    );
    PRINT 'Created LMS_Users';
END

-- ============================================================
-- TRAINER PROFILES
-- ============================================================
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='TrainerProfiles' AND xtype='U')
BEGIN
    CREATE TABLE TrainerProfiles (
        ProfileID       INT IDENTITY(1,1) PRIMARY KEY,
        UserID          INT NOT NULL FOREIGN KEY REFERENCES LMS_Users(UserID) ON DELETE CASCADE,
        EmployeeID      NVARCHAR(50),
        Department      NVARCHAR(100),
        Expertise       NVARCHAR(MAX),
        ExperienceYears INT DEFAULT 0,
        TrainerRating   FLOAT DEFAULT 0,
        Certifications  NVARCHAR(MAX),
        Biography       NVARCHAR(MAX),
        LinkedInURL     NVARCHAR(500),
        IsApproved      BIT DEFAULT 0,
        CreatedAt       DATETIME DEFAULT GETDATE(),
        UpdatedAt       DATETIME DEFAULT GETDATE()
    );
    PRINT 'Created TrainerProfiles';
END

-- ============================================================
-- LMS COURSES (extended from registration courses)
-- ============================================================
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='LMS_Courses' AND xtype='U')
BEGIN
    CREATE TABLE LMS_Courses (
        CourseID        INT IDENTITY(1,1) PRIMARY KEY,
        Title           NVARCHAR(300) NOT NULL,
        Code            NVARCHAR(50) UNIQUE,
        Description     NVARCHAR(MAX),
        Duration        NVARCHAR(50),
        FeeINR          DECIMAL(10,2) DEFAULT 0,
        FeeUSD          DECIMAL(10,2) DEFAULT 0,
        Mode            NVARCHAR(20) CHECK (Mode IN ('CILT','VILT','ELEARNING','SITE')),
        Status          NVARCHAR(20) DEFAULT 'ACTIVE' CHECK (Status IN ('ACTIVE','INACTIVE','DRAFT')),
        OpenDate        DATE NULL,
        CloseDate       DATE NULL,
        AgendaPDFPath   NVARCHAR(500),
        ThumbnailPath   NVARCHAR(500),
        MaxParticipants INT DEFAULT 20,
        Category        NVARCHAR(100),
        CreatedBy       INT NULL FOREIGN KEY REFERENCES LMS_Users(UserID),
        CreatedAt       DATETIME DEFAULT GETDATE(),
        UpdatedAt       DATETIME DEFAULT GETDATE()
    );
    PRINT 'Created LMS_Courses';
END

-- ============================================================
-- TRAINING CALENDAR
-- ============================================================
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='TrainingCalendar' AND xtype='U')
BEGIN
    CREATE TABLE TrainingCalendar (
        CalendarID      INT IDENTITY(1,1) PRIMARY KEY,
        CourseID        INT NULL FOREIGN KEY REFERENCES LMS_Courses(CourseID),
        Title           NVARCHAR(300) NOT NULL,
        TrainingType    NVARCHAR(20) CHECK (TrainingType IN ('CILT','VILT','ELEARNING','SITE')),
        StartDate       DATE NOT NULL,
        EndDate         DATE NOT NULL,
        TrainerID       INT NULL FOREIGN KEY REFERENCES LMS_Users(UserID),
        TrainerName     NVARCHAR(200),
        Location        NVARCHAR(300),
        MaxParticipants INT DEFAULT 20,
        CurrentEnrolled INT DEFAULT 0,
        Status          NVARCHAR(20) DEFAULT 'SCHEDULED',
        Notes           NVARCHAR(MAX),
        CreatedAt       DATETIME DEFAULT GETDATE()
    );
    PRINT 'Created TrainingCalendar';
END

-- ============================================================
-- ENROLLMENTS
-- ============================================================
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Enrollments' AND xtype='U')
BEGIN
    CREATE TABLE Enrollments (
        EnrollmentID    INT IDENTITY(1,1) PRIMARY KEY,
        StudentID       INT NOT NULL FOREIGN KEY REFERENCES LMS_Users(UserID),
        CourseID        INT NOT NULL FOREIGN KEY REFERENCES LMS_Courses(CourseID),
        RegistrationID  INT NULL,
        EnrolledAt      DATETIME DEFAULT GETDATE(),
        Status          NVARCHAR(30) DEFAULT 'ENROLLED' CHECK (Status IN ('ENROLLED','IN_PROGRESS','COMPLETED','DROPPED')),
        ProgressPercent INT DEFAULT 0,
        CompletedAt     DATETIME NULL,
        CalendarID      INT NULL FOREIGN KEY REFERENCES TrainingCalendar(CalendarID),
        CONSTRAINT UQ_Enrollment UNIQUE(StudentID, CourseID)
    );
    PRINT 'Created Enrollments';
END

-- ============================================================
-- CERTIFICATES
-- ============================================================
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Certificates' AND xtype='U')
BEGIN
    CREATE TABLE Certificates (
        CertificateID   INT IDENTITY(1,1) PRIMARY KEY,
        CertificateNo   NVARCHAR(100) UNIQUE NOT NULL,
        StudentID       INT NOT NULL FOREIGN KEY REFERENCES LMS_Users(UserID),
        EnrollmentID    INT NULL FOREIGN KEY REFERENCES Enrollments(EnrollmentID),
        CourseID        INT NOT NULL FOREIGN KEY REFERENCES LMS_Courses(CourseID),
        ParticipantName NVARCHAR(200),
        CourseName      NVARCHAR(300),
        TrainerName     NVARCHAR(200),
        IssueDate       DATE NOT NULL,
        ValidUntil      DATE NULL,
        PDFPath         NVARCHAR(500),
        IssuedBy        INT NULL FOREIGN KEY REFERENCES LMS_Users(UserID),
        CreatedAt       DATETIME DEFAULT GETDATE()
    );
    PRINT 'Created Certificates';
END

-- ============================================================
-- FEEDBACK
-- ============================================================
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Feedback' AND xtype='U')
BEGIN
    CREATE TABLE Feedback (
        FeedbackID      INT IDENTITY(1,1) PRIMARY KEY,
        StudentID       INT NULL FOREIGN KEY REFERENCES LMS_Users(UserID),
        ParticipantName NVARCHAR(200),
        CourseID        INT NULL FOREIGN KEY REFERENCES LMS_Courses(CourseID),
        CourseName      NVARCHAR(300),
        TrainerID       INT NULL FOREIGN KEY REFERENCES LMS_Users(UserID),
        TrainerName     NVARCHAR(200),
        OverallScore    INT CHECK (OverallScore BETWEEN 1 AND 10),
        ContentScore    INT CHECK (ContentScore BETWEEN 1 AND 10),
        TrainerScore    INT CHECK (TrainerScore BETWEEN 1 AND 10),
        FacilityScore   INT CHECK (FacilityScore BETWEEN 1 AND 10),
        Remarks         NVARCHAR(MAX),
        TrainingDate    DATE,
        SubmittedAt     DATETIME DEFAULT GETDATE()
    );
    PRINT 'Created Feedback';
END

-- ============================================================
-- ASSESSMENTS
-- ============================================================
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Assessments' AND xtype='U')
BEGIN
    CREATE TABLE Assessments (
        AssessmentID    INT IDENTITY(1,1) PRIMARY KEY,
        CourseID        INT NOT NULL FOREIGN KEY REFERENCES LMS_Courses(CourseID),
        Title           NVARCHAR(300),
        Description     NVARCHAR(MAX),
        TotalMarks      INT DEFAULT 100,
        PassMarks       INT DEFAULT 60,
        DurationMinutes INT DEFAULT 60,
        IsActive        BIT DEFAULT 1,
        CreatedAt       DATETIME DEFAULT GETDATE()
    );
    PRINT 'Created Assessments';
END

IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='AssessmentQuestions' AND xtype='U')
BEGIN
    CREATE TABLE AssessmentQuestions (
        QuestionID      INT IDENTITY(1,1) PRIMARY KEY,
        AssessmentID    INT NOT NULL FOREIGN KEY REFERENCES Assessments(AssessmentID) ON DELETE CASCADE,
        QuestionText    NVARCHAR(MAX),
        OptionA         NVARCHAR(500),
        OptionB         NVARCHAR(500),
        OptionC         NVARCHAR(500),
        OptionD         NVARCHAR(500),
        CorrectAnswer   NVARCHAR(1) CHECK (CorrectAnswer IN ('A','B','C','D')),
        Marks           INT DEFAULT 1
    );
    PRINT 'Created AssessmentQuestions';
END

IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='AssessmentResults' AND xtype='U')
BEGIN
    CREATE TABLE AssessmentResults (
        ResultID        INT IDENTITY(1,1) PRIMARY KEY,
        AssessmentID    INT NOT NULL FOREIGN KEY REFERENCES Assessments(AssessmentID),
        StudentID       INT NOT NULL FOREIGN KEY REFERENCES LMS_Users(UserID),
        Score           INT,
        TotalMarks      INT,
        Percentage      FLOAT,
        Passed          BIT,
        AttemptedAt     DATETIME DEFAULT GETDATE(),
        TimeTakenMins   INT
    );
    PRINT 'Created AssessmentResults';
END

-- ============================================================
-- TESTIMONIALS
-- ============================================================
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Testimonials' AND xtype='U')
BEGIN
    CREATE TABLE Testimonials (
        TestimonialID   INT IDENTITY(1,1) PRIMARY KEY,
        Name            NVARCHAR(200),
        Company         NVARCHAR(200),
        Designation     NVARCHAR(200),
        Feedback        NVARCHAR(MAX),
        Rating          INT DEFAULT 5 CHECK (Rating BETWEEN 1 AND 5),
        ImagePath       NVARCHAR(500),
        IsApproved      BIT DEFAULT 0,
        CreatedAt       DATETIME DEFAULT GETDATE()
    );
    PRINT 'Created Testimonials';
END

-- ============================================================
-- INVOICES
-- ============================================================
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Invoices' AND xtype='U')
BEGIN
    CREATE TABLE Invoices (
        InvoiceID       INT IDENTITY(1,1) PRIMARY KEY,
        InvoiceNo       NVARCHAR(100) UNIQUE,
        RegistrationID  INT NULL,
        StudentName     NVARCHAR(200),
        Organization    NVARCHAR(200),
        CourseName      NVARCHAR(300),
        Amount          DECIMAL(10,2),
        Currency        NVARCHAR(10) DEFAULT 'INR',
        PDFPath         NVARCHAR(500),
        Status          NVARCHAR(30) DEFAULT 'PENDING' CHECK (Status IN ('PENDING','PAID','OVERDUE','CANCELLED')),
        IssuedDate      DATE DEFAULT CAST(GETDATE() AS DATE),
        DueDate         DATE,
        PaidDate        DATE NULL,
        Notes           NVARCHAR(MAX),
        CreatedAt       DATETIME DEFAULT GETDATE()
    );
    PRINT 'Created Invoices';
END

-- ============================================================
-- NOTIFICATIONS CONFIG
-- ============================================================
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='NotificationConfig' AND xtype='U')
BEGIN
    CREATE TABLE NotificationConfig (
        ConfigID        INT IDENTITY(1,1) PRIMARY KEY,
        TriggerEvent    NVARCHAR(100) NOT NULL,
        EmailEnabled    BIT DEFAULT 1,
        WhatsAppEnabled BIT DEFAULT 0,
        EmailTemplate   NVARCHAR(MAX),
        WhatsAppTemplate NVARCHAR(MAX),
        IsActive        BIT DEFAULT 1,
        UpdatedAt       DATETIME DEFAULT GETDATE()
    );
    PRINT 'Created NotificationConfig';
END

-- ============================================================
-- AUDIT LOG (Security)
-- ============================================================
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='AuditLog' AND xtype='U')
BEGIN
    CREATE TABLE AuditLog (
        LogID           INT IDENTITY(1,1) PRIMARY KEY,
        UserID          INT NULL,
        UserEmail       NVARCHAR(255),
        Action          NVARCHAR(200) NOT NULL,
        Module          NVARCHAR(100),
        Details         NVARCHAR(MAX),
        IPAddress       NVARCHAR(50),
        UserAgent       NVARCHAR(500),
        Status          NVARCHAR(20) DEFAULT 'SUCCESS',
        CreatedAt       DATETIME DEFAULT GETDATE()
    );
    PRINT 'Created AuditLog';
END

-- ============================================================
-- LOGIN ATTEMPTS (Security - Brute Force Tracking)
-- ============================================================
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='LoginAttempts' AND xtype='U')
BEGIN
    CREATE TABLE LoginAttempts (
        AttemptID       INT IDENTITY(1,1) PRIMARY KEY,
        Email           NVARCHAR(255),
        IPAddress       NVARCHAR(50),
        Success         BIT DEFAULT 0,
        AttemptedAt     DATETIME DEFAULT GETDATE(),
        UserAgent       NVARCHAR(500)
    );
    PRINT 'Created LoginAttempts';
END

-- ============================================================
-- TRAINING ENQUIRIES
-- ============================================================
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='TrainingEnquiries' AND xtype='U')
BEGIN
    CREATE TABLE TrainingEnquiries (
        EnquiryID       INT IDENTITY(1,1) PRIMARY KEY,
        Name            NVARCHAR(200) NOT NULL,
        Email           NVARCHAR(255) NOT NULL,
        Phone           NVARCHAR(30),
        Organization    NVARCHAR(200),
        Country         NVARCHAR(100),
        CourseInterest  NVARCHAR(300),
        Message         NVARCHAR(MAX),
        Status          NVARCHAR(30) DEFAULT 'OPEN' CHECK (Status IN ('OPEN','IN_PROGRESS','RESOLVED','CLOSED')),
        AssignedTo      INT NULL FOREIGN KEY REFERENCES LMS_Users(UserID),
        Response        NVARCHAR(MAX),
        CreatedAt       DATETIME DEFAULT GETDATE(),
        UpdatedAt       DATETIME DEFAULT GETDATE()
    );
    PRINT 'Created TrainingEnquiries';
END

-- ============================================================
-- AFFILIATE REGIONS
-- ============================================================
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='AffiliateRegions' AND xtype='U')
BEGIN
    CREATE TABLE AffiliateRegions (
        RegionID        INT IDENTITY(1,1) PRIMARY KEY,
        AffiliateID     INT NOT NULL FOREIGN KEY REFERENCES LMS_Users(UserID),
        Country         NVARCHAR(100),
        Region          NVARCHAR(200),
        CreatedAt       DATETIME DEFAULT GETDATE()
    );
    PRINT 'Created AffiliateRegions';
END

-- ============================================================
-- SESSIONS (Server-side session management)
-- ============================================================
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='LMS_Sessions' AND xtype='U')
BEGIN
    CREATE TABLE LMS_Sessions (
        SessionID       NVARCHAR(200) PRIMARY KEY,
        UserID          INT NOT NULL FOREIGN KEY REFERENCES LMS_Users(UserID),
        IPAddress       NVARCHAR(50),
        UserAgent       NVARCHAR(500),
        CreatedAt       DATETIME DEFAULT GETDATE(),
        ExpiresAt       DATETIME NOT NULL,
        IsActive        BIT DEFAULT 1
    );
    PRINT 'Created LMS_Sessions';
END

-- ============================================================
-- PAYMENT TRACKING (extended)
-- ============================================================
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='PaymentTracking' AND xtype='U')
BEGIN
    CREATE TABLE PaymentTracking (
        PaymentID       INT IDENTITY(1,1) PRIMARY KEY,
        RegistrationID  INT NULL,
        StudentName     NVARCHAR(200),
        CourseName      NVARCHAR(300),
        Amount          DECIMAL(10,2),
        Currency        NVARCHAR(10) DEFAULT 'INR',
        TransactionID   NVARCHAR(200),
        PaymentMethod   NVARCHAR(50),
        PaymentProofPath NVARCHAR(500),
        Status          NVARCHAR(30) DEFAULT 'PENDING' CHECK (Status IN ('PENDING','VERIFIED','REJECTED')),
        VerifiedBy      INT NULL FOREIGN KEY REFERENCES LMS_Users(UserID),
        VerifiedAt      DATETIME NULL,
        PaidAt          DATETIME NULL,
        CreatedAt       DATETIME DEFAULT GETDATE()
    );
    PRINT 'Created PaymentTracking';
END

-- ============================================================
-- Seed: Default Admin User (password: YTS@Admin2024!)
-- Password hash = bcrypt of YTS@Admin2024!
-- ============================================================
IF NOT EXISTS (SELECT * FROM LMS_Users WHERE Email = 'admin@yts.yokogawa.com')
BEGIN
    INSERT INTO LMS_Users (Email, PasswordHash, Role, FirstName, LastName, IsActive, IsApproved)
    VALUES (
        'admin@yts.yokogawa.com',
        '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TdxlOGVdGsRNJKEuX4mZBqGb9GkS', -- placeholder, set via app
        'ADMIN',
        'YTS',
        'Administrator',
        1,
        1
    );
    PRINT 'Seeded default admin user';
END

-- ============================================================
-- Seed: Notification triggers
-- ============================================================
IF NOT EXISTS (SELECT * FROM NotificationConfig WHERE TriggerEvent = 'REGISTRATION')
BEGIN
    INSERT INTO NotificationConfig (TriggerEvent, EmailEnabled, EmailTemplate) VALUES
    ('REGISTRATION', 1, 'Thank you {{name}} for registering for {{course}}. Your registration ID is {{reg_id}}.'),
    ('PAYMENT_VERIFIED', 1, 'Dear {{name}}, your payment for {{course}} has been verified.'),
    ('APPROVAL_FINANCE', 1, 'Dear {{name}}, your registration has been approved by Finance.'),
    ('APPROVAL_TM', 1, 'Dear {{name}}, your registration has been approved by Training Manager.'),
    ('ACCOUNT_CREATED', 1, 'Dear {{name}}, your student account has been created. Login: {{email}}'),
    ('CERTIFICATE_ISSUED', 1, 'Congratulations {{name}}! Your certificate for {{course}} is ready for download.');
    PRINT 'Seeded notification config';
END

PRINT '=== YTS LMS Schema Migration Complete ===';
GO
