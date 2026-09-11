-- 01_verify_db_state.sql
-- Run this script to verify the current state of the LMS database.
-- It performs NO modifications.

USE LMS_DB;
GO

PRINT '--- 1. Current LMS_Courses Count ---';
SELECT COUNT(*) AS TotalCourses FROM LMS_Courses;
GO

PRINT '--- 2. Existing Courses (First 40) ---';
SELECT TOP 40 CourseID, Title, Code, Mode, Duration, Status 
FROM LMS_Courses 
ORDER BY CourseID;
GO

PRINT '--- 3. Checking for CourseID 21 (CENTUM VP TEST) ---';
SELECT * FROM LMS_Courses WHERE CourseID = 21;
GO

PRINT '--- 4. Checking for CourseModes table (if exists) ---';
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[CourseModes]') AND type in (N'U'))
BEGIN
    SELECT 'CourseModes table EXISTS' AS Status;
    SELECT TOP 10 * FROM CourseModes;
END
ELSE
BEGIN
    SELECT 'CourseModes table does NOT exist' AS Status;
END
GO

PRINT '--- 5. Checking Registration Schema for Custom Dates ---';
SELECT COLUMN_NAME, DATA_TYPE 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'Registrations' 
  AND COLUMN_NAME IN ('OriginalStartDate', 'OriginalEndDate', 'FinalStartDate', 'FinalEndDate', 'DateApprovalStatus');
GO

PRINT '--- 6. Training Calendar Count ---';
SELECT COUNT(*) AS TotalBatches FROM TrainingCalendar;
GO
