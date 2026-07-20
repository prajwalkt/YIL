-- ============================================================
-- Final Enterprise Migration: Messages, Announcements, Settings, Materials, WaitingList
-- Run against LMS_DB
-- ============================================================

USE LMS_DB;

-- ============================================================
-- ATTENDANCE TABLE
-- ============================================================
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Attendance' AND xtype='U')
BEGIN
    CREATE TABLE Attendance (
        AttendanceID    INT IDENTITY(1,1) PRIMARY KEY,
        EnrollmentID    INT NOT NULL FOREIGN KEY REFERENCES Enrollments(EnrollmentID) ON DELETE CASCADE,
        CalendarID      INT NOT NULL FOREIGN KEY REFERENCES TrainingCalendar(CalendarID),
        SessionDate     DATE NOT NULL,
        Status          NVARCHAR(20) NOT NULL CHECK (Status IN ('PRESENT','ABSENT','LATE','EXCUSED')),
        MarkedBy        INT NULL FOREIGN KEY REFERENCES LMS_Users(UserID),
        CreatedAt       DATETIME DEFAULT GETDATE(),
        CONSTRAINT UQ_Attendance_Enrollment_Date UNIQUE(EnrollmentID, SessionDate)
    );
    PRINT 'Created Attendance';
END

-- ============================================================
-- MESSAGES TABLE
-- ============================================================
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Messages' AND xtype='U')
BEGIN
    CREATE TABLE Messages (
        MessageID       INT IDENTITY(1,1) PRIMARY KEY,
        SenderID        INT NOT NULL FOREIGN KEY REFERENCES LMS_Users(UserID),
        ReceiverID      INT NOT NULL FOREIGN KEY REFERENCES LMS_Users(UserID),
        Subject         NVARCHAR(300),
        Body            NVARCHAR(MAX) NOT NULL,
        IsRead          BIT DEFAULT 0,
        CreatedAt       DATETIME DEFAULT GETDATE(),
        ReadAt          DATETIME NULL
    );
    PRINT 'Created Messages';
END

-- ============================================================
-- ANNOUNCEMENTS TABLE
-- ============================================================
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Announcements' AND xtype='U')
BEGIN
    CREATE TABLE Announcements (
        AnnouncementID  INT IDENTITY(1,1) PRIMARY KEY,
        Title           NVARCHAR(300) NOT NULL,
        Body            NVARCHAR(MAX) NOT NULL,
        TargetAudience  NVARCHAR(50) DEFAULT 'ALL' CHECK (TargetAudience IN ('ALL','STUDENT','TRAINER','AFFILIATE','FINANCE','TM','ADMIN')),
        CreatedBy       INT NOT NULL FOREIGN KEY REFERENCES LMS_Users(UserID),
        IsActive        BIT DEFAULT 1,
        CreatedAt       DATETIME DEFAULT GETDATE()
    );
    PRINT 'Created Announcements';
END

-- ============================================================
-- SYSTEM SETTINGS TABLE (Verify existing or create)
-- ============================================================
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='SystemSettings' AND xtype='U')
BEGIN
    CREATE TABLE SystemSettings (
        SettingKey      NVARCHAR(100) PRIMARY KEY,
        SettingValue    NVARCHAR(MAX),
        Description     NVARCHAR(500),
        UpdatedAt       DATETIME DEFAULT GETDATE(),
        UpdatedBy       INT NULL FOREIGN KEY REFERENCES LMS_Users(UserID)
    );
    PRINT 'Created SystemSettings';
END

-- Insert Default Settings if not exists
IF NOT EXISTS (SELECT * FROM SystemSettings WHERE SettingKey = 'SMTP_HOST')
BEGIN
    INSERT INTO SystemSettings (SettingKey, SettingValue, Description) VALUES
    ('SMTP_HOST', 'smtp.yokogawa.com', 'SMTP Server Hostname'),
    ('SMTP_PORT', '587', 'SMTP Server Port'),
    ('SMTP_USER', 'no-reply@yts.yokogawa.com', 'SMTP Username'),
    ('ORG_NAME', 'Yokogawa Training Services', 'Organization Name'),
    ('THEME_COLOR', '#004098', 'Primary Theme Color'),
    ('TIMEZONE', 'Asia/Kolkata', 'System Default Timezone'),
    ('SESSION_TIMEOUT_MIN', '60', 'Session Timeout in Minutes');
    PRINT 'Seeded SystemSettings defaults';
END

-- ============================================================
-- COURSE MATERIALS TABLE
-- ============================================================
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='CourseMaterials' AND xtype='U')
BEGIN
    CREATE TABLE CourseMaterials (
        MaterialID      INT IDENTITY(1,1) PRIMARY KEY,
        CourseID        INT NOT NULL FOREIGN KEY REFERENCES LMS_Courses(CourseID) ON DELETE CASCADE,
        Title           NVARCHAR(300) NOT NULL,
        FileType        NVARCHAR(50) NOT NULL,
        FilePath        NVARCHAR(500) NOT NULL,
        UploadedBy      INT NOT NULL FOREIGN KEY REFERENCES LMS_Users(UserID),
        IsVisibleToStudent BIT DEFAULT 1,
        CreatedAt       DATETIME DEFAULT GETDATE()
    );
    PRINT 'Created CourseMaterials';
END

-- ============================================================
-- WAITING LIST TABLE
-- ============================================================
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='WaitingList' AND xtype='U')
BEGIN
    CREATE TABLE WaitingList (
        WaitListID      INT IDENTITY(1,1) PRIMARY KEY,
        CalendarID      INT NOT NULL FOREIGN KEY REFERENCES TrainingCalendar(CalendarID) ON DELETE CASCADE,
        StudentID       INT NOT NULL FOREIGN KEY REFERENCES LMS_Users(UserID),
        JoinedAt        DATETIME DEFAULT GETDATE(),
        Status          NVARCHAR(30) DEFAULT 'WAITING' CHECK (Status IN ('WAITING','PROMOTED','CANCELLED')),
        CONSTRAINT UQ_Waitlist_User_Calendar UNIQUE(StudentID, CalendarID)
    );
    PRINT 'Created WaitingList';
END

PRINT '=== Final Enterprise Migration Complete ===';
GO
