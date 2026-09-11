-- 02_migrate_schema.sql
-- Idempotent MSSQL schema migration for CourseModes and Date Approvals

USE LMS_DB;
GO

PRINT '--- 1. Creating CourseModes Table ---';
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[CourseModes]') AND type in (N'U'))
BEGIN
    CREATE TABLE CourseModes (
        CourseID INT NOT NULL FOREIGN KEY REFERENCES LMS_Courses(CourseID) ON DELETE CASCADE,
        TrainingMode VARCHAR(50) NOT NULL,
        CONSTRAINT PK_CourseModes PRIMARY KEY (CourseID, TrainingMode),
        CONSTRAINT CHK_TrainingMode CHECK (TrainingMode IN ('CILT', 'VILT', 'SITE', 'ELEARNING'))
    );
    PRINT 'Created CourseModes table.';
END
ELSE
BEGIN
    PRINT 'CourseModes table already exists.';
END
GO

PRINT '--- 2. Updating Registrations Table with Date Audit Columns ---';

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Registrations]') AND name = 'OriginalStartDate')
BEGIN
    ALTER TABLE Registrations ADD OriginalStartDate DATE NULL;
    PRINT 'Added OriginalStartDate column.';
END

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Registrations]') AND name = 'OriginalEndDate')
BEGIN
    ALTER TABLE Registrations ADD OriginalEndDate DATE NULL;
    PRINT 'Added OriginalEndDate column.';
END

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Registrations]') AND name = 'FinalStartDate')
BEGIN
    ALTER TABLE Registrations ADD FinalStartDate DATE NULL;
    PRINT 'Added FinalStartDate column.';
END

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Registrations]') AND name = 'FinalEndDate')
BEGIN
    ALTER TABLE Registrations ADD FinalEndDate DATE NULL;
    PRINT 'Added FinalEndDate column.';
END

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Registrations]') AND name = 'DateApprovalStatus')
BEGIN
    ALTER TABLE Registrations ADD DateApprovalStatus VARCHAR(30) DEFAULT 'NOT_REQUESTED';
    PRINT 'Added DateApprovalStatus column.';
END

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Registrations]') AND name = 'TMReviewedBy')
BEGIN
    ALTER TABLE Registrations ADD TMReviewedBy INT NULL;
    PRINT 'Added TMReviewedBy column.';
END

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Registrations]') AND name = 'TMReviewDate')
BEGIN
    ALTER TABLE Registrations ADD TMReviewDate DATETIME NULL;
    PRINT 'Added TMReviewDate column.';
END

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[Registrations]') AND name = 'TMRemarks')
BEGIN
    ALTER TABLE Registrations ADD TMRemarks NVARCHAR(MAX) NULL;
    PRINT 'Added TMRemarks column.';
END
GO
