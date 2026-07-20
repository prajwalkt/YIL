-- ============================================================
-- YTS LMS — Identity Fix Migration
-- Fixes the "same email = same account" problem by separating
-- user identity from registration context.
-- Run once against LMS_DB
-- ============================================================

USE LMS_DB;

-- 1. Track which LMS_Users record was linked when a registration was approved
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('Registrations') AND name = 'LinkedUserID')
BEGIN
    ALTER TABLE Registrations ADD LinkedUserID INT NULL;
    PRINT 'Added LinkedUserID to Registrations';
END

-- 2. Explicit registration type: SELF or ORGANIZATION
--    (replaces the unreliable graduation-year heuristic)
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('Registrations') AND name = 'RegistrationType')
BEGIN
    ALTER TABLE Registrations ADD RegistrationType NVARCHAR(20) NOT NULL DEFAULT 'SELF'
        CHECK (RegistrationType IN ('SELF', 'ORGANIZATION'));
    PRINT 'Added RegistrationType to Registrations';
END

-- 3. Store course access dates directly on Enrollments
--    so we can compute progress and show expiry warnings
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('Enrollments') AND name = 'AccessStartDate')
BEGIN
    ALTER TABLE Enrollments ADD AccessStartDate DATE NULL;
    PRINT 'Added AccessStartDate to Enrollments';
END

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('Enrollments') AND name = 'AccessEndDate')
BEGIN
    ALTER TABLE Enrollments ADD AccessEndDate DATE NULL;
    PRINT 'Added AccessEndDate to Enrollments';
END

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('Enrollments') AND name = 'DurationDays')
BEGIN
    ALTER TABLE Enrollments ADD DurationDays INT NULL;
    PRINT 'Added DurationDays to Enrollments';
END

-- 4. Store official duration in days on LMS_Courses
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('LMS_Courses') AND name = 'DurationDays')
BEGIN
    ALTER TABLE LMS_Courses ADD DurationDays INT NULL;
    PRINT 'Added DurationDays to LMS_Courses';
END

-- 5. AttendancePercentage on Enrollments (was computed in app layer; now persisted)
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('Enrollments') AND name = 'AttendancePercentage')
BEGIN
    ALTER TABLE Enrollments ADD AttendancePercentage FLOAT DEFAULT 0;
    PRINT 'Added AttendancePercentage to Enrollments';
END

PRINT '=== Identity Fix Migration Complete ===';
GO
