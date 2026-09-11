-- 03_seed_courses.sql
-- Idempotent seeding script for 32 historical courses + CENTUM VP TEST
USE LMS_DB;
GO

DECLARE @CurrentCourseID INT;


PRINT '--- Seeding VPOP ---';
IF NOT EXISTS (SELECT 1 FROM LMS_Courses WHERE Code = 'VPOP')
BEGIN
    INSERT INTO LMS_Courses (Title, Code, Duration, Status, Mode)
    VALUES ('CENTUM VP DCS Operation', 'VPOP', '3 Days', 'ACTIVE', 'CILT');
    SET @CurrentCourseID = SCOPE_IDENTITY();
END
ELSE
BEGIN
    SELECT @CurrentCourseID = CourseID FROM LMS_Courses WHERE Code = 'VPOP';
END

IF NOT EXISTS (SELECT 1 FROM CourseModes WHERE CourseID = @CurrentCourseID AND TrainingMode = 'CILT')
    INSERT INTO CourseModes (CourseID, TrainingMode) VALUES (@CurrentCourseID, 'CILT');

IF NOT EXISTS (SELECT 1 FROM CourseModes WHERE CourseID = @CurrentCourseID AND TrainingMode = 'VILT')
    INSERT INTO CourseModes (CourseID, TrainingMode) VALUES (@CurrentCourseID, 'VILT');

PRINT '--- Seeding VPFD ---';
IF NOT EXISTS (SELECT 1 FROM LMS_Courses WHERE Code = 'VPFD')
BEGIN
    INSERT INTO LMS_Courses (Title, Code, Duration, Status, Mode)
    VALUES ('CENTUM VP DCS Fundamentals', 'VPFD', '5 Days', 'ACTIVE', 'CILT');
    SET @CurrentCourseID = SCOPE_IDENTITY();
END
ELSE
BEGIN
    SELECT @CurrentCourseID = CourseID FROM LMS_Courses WHERE Code = 'VPFD';
END

IF NOT EXISTS (SELECT 1 FROM CourseModes WHERE CourseID = @CurrentCourseID AND TrainingMode = 'CILT')
    INSERT INTO CourseModes (CourseID, TrainingMode) VALUES (@CurrentCourseID, 'CILT');

IF NOT EXISTS (SELECT 1 FROM CourseModes WHERE CourseID = @CurrentCourseID AND TrainingMode = 'VILT')
    INSERT INTO CourseModes (CourseID, TrainingMode) VALUES (@CurrentCourseID, 'VILT');

PRINT '--- Seeding VPEG ---';
IF NOT EXISTS (SELECT 1 FROM LMS_Courses WHERE Code = 'VPEG')
BEGIN
    INSERT INTO LMS_Courses (Title, Code, Duration, Status, Mode)
    VALUES ('CENTUM VP DCS Engineering', 'VPEG', '5 Days', 'ACTIVE', 'CILT');
    SET @CurrentCourseID = SCOPE_IDENTITY();
END
ELSE
BEGIN
    SELECT @CurrentCourseID = CourseID FROM LMS_Courses WHERE Code = 'VPEG';
END

IF NOT EXISTS (SELECT 1 FROM CourseModes WHERE CourseID = @CurrentCourseID AND TrainingMode = 'CILT')
    INSERT INTO CourseModes (CourseID, TrainingMode) VALUES (@CurrentCourseID, 'CILT');

IF NOT EXISTS (SELECT 1 FROM CourseModes WHERE CourseID = @CurrentCourseID AND TrainingMode = 'VILT')
    INSERT INTO CourseModes (CourseID, TrainingMode) VALUES (@CurrentCourseID, 'VILT');

PRINT '--- Seeding VPFE ---';
IF NOT EXISTS (SELECT 1 FROM LMS_Courses WHERE Code = 'VPFE')
BEGIN
    INSERT INTO LMS_Courses (Title, Code, Duration, Status, Mode)
    VALUES ('CENTUM VP DCS Fundamentals & Engineering', 'VPFE', '5 Days', 'ACTIVE', 'CILT');
    SET @CurrentCourseID = SCOPE_IDENTITY();
END
ELSE
BEGIN
    SELECT @CurrentCourseID = CourseID FROM LMS_Courses WHERE Code = 'VPFE';
END

IF NOT EXISTS (SELECT 1 FROM CourseModes WHERE CourseID = @CurrentCourseID AND TrainingMode = 'CILT')
    INSERT INTO CourseModes (CourseID, TrainingMode) VALUES (@CurrentCourseID, 'CILT');

IF NOT EXISTS (SELECT 1 FROM CourseModes WHERE CourseID = @CurrentCourseID AND TrainingMode = 'VILT')
    INSERT INTO CourseModes (CourseID, TrainingMode) VALUES (@CurrentCourseID, 'VILT');

PRINT '--- Seeding VPEM ---';
IF NOT EXISTS (SELECT 1 FROM LMS_Courses WHERE Code = 'VPEM')
BEGIN
    INSERT INTO LMS_Courses (Title, Code, Duration, Status, Mode)
    VALUES ('CENTUM VP DCS Engineering & Maintenance', 'VPEM', '10 Days', 'ACTIVE', 'CILT');
    SET @CurrentCourseID = SCOPE_IDENTITY();
END
ELSE
BEGIN
    SELECT @CurrentCourseID = CourseID FROM LMS_Courses WHERE Code = 'VPEM';
END

IF NOT EXISTS (SELECT 1 FROM CourseModes WHERE CourseID = @CurrentCourseID AND TrainingMode = 'CILT')
    INSERT INTO CourseModes (CourseID, TrainingMode) VALUES (@CurrentCourseID, 'CILT');

IF NOT EXISTS (SELECT 1 FROM CourseModes WHERE CourseID = @CurrentCourseID AND TrainingMode = 'VILT')
    INSERT INTO CourseModes (CourseID, TrainingMode) VALUES (@CurrentCourseID, 'VILT');

PRINT '--- Seeding VPMN ---';
IF NOT EXISTS (SELECT 1 FROM LMS_Courses WHERE Code = 'VPMN')
BEGIN
    INSERT INTO LMS_Courses (Title, Code, Duration, Status, Mode)
    VALUES ('CENTUM VP DCS Maintenance', 'VPMN', '3 Days', 'ACTIVE', 'CILT');
    SET @CurrentCourseID = SCOPE_IDENTITY();
END
ELSE
BEGIN
    SELECT @CurrentCourseID = CourseID FROM LMS_Courses WHERE Code = 'VPMN';
END

IF NOT EXISTS (SELECT 1 FROM CourseModes WHERE CourseID = @CurrentCourseID AND TrainingMode = 'CILT')
    INSERT INTO CourseModes (CourseID, TrainingMode) VALUES (@CurrentCourseID, 'CILT');

IF NOT EXISTS (SELECT 1 FROM CourseModes WHERE CourseID = @CurrentCourseID AND TrainingMode = 'VILT')
    INSERT INTO CourseModes (CourseID, TrainingMode) VALUES (@CurrentCourseID, 'VILT');

PRINT '--- Seeding VPAE ---';
IF NOT EXISTS (SELECT 1 FROM LMS_Courses WHERE Code = 'VPAE')
BEGIN
    INSERT INTO LMS_Courses (Title, Code, Duration, Status, Mode)
    VALUES ('CENTUM VP DCS Advanced Engineering', 'VPAE', '5 Days', 'ACTIVE', 'CILT');
    SET @CurrentCourseID = SCOPE_IDENTITY();
END
ELSE
BEGIN
    SELECT @CurrentCourseID = CourseID FROM LMS_Courses WHERE Code = 'VPAE';
END

IF NOT EXISTS (SELECT 1 FROM CourseModes WHERE CourseID = @CurrentCourseID AND TrainingMode = 'CILT')
    INSERT INTO CourseModes (CourseID, TrainingMode) VALUES (@CurrentCourseID, 'CILT');

IF NOT EXISTS (SELECT 1 FROM CourseModes WHERE CourseID = @CurrentCourseID AND TrainingMode = 'VILT')
    INSERT INTO CourseModes (CourseID, TrainingMode) VALUES (@CurrentCourseID, 'VILT');

PRINT '--- Seeding VBEG ---';
IF NOT EXISTS (SELECT 1 FROM LMS_Courses WHERE Code = 'VBEG')
BEGIN
    INSERT INTO LMS_Courses (Title, Code, Duration, Status, Mode)
    VALUES ('CENTUM VP DCS Batch Engineering', 'VBEG', '5 Days', 'ACTIVE', 'CILT');
    SET @CurrentCourseID = SCOPE_IDENTITY();
END
ELSE
BEGIN
    SELECT @CurrentCourseID = CourseID FROM LMS_Courses WHERE Code = 'VBEG';
END

IF NOT EXISTS (SELECT 1 FROM CourseModes WHERE CourseID = @CurrentCourseID AND TrainingMode = 'CILT')
    INSERT INTO CourseModes (CourseID, TrainingMode) VALUES (@CurrentCourseID, 'CILT');

IF NOT EXISTS (SELECT 1 FROM CourseModes WHERE CourseID = @CurrentCourseID AND TrainingMode = 'VILT')
    INSERT INTO CourseModes (CourseID, TrainingMode) VALUES (@CurrentCourseID, 'VILT');

PRINT '--- Seeding VPAD ---';
IF NOT EXISTS (SELECT 1 FROM LMS_Courses WHERE Code = 'VPAD')
BEGIN
    INSERT INTO LMS_Courses (Title, Code, Duration, Status, Mode)
    VALUES ('CENTUM VP DCS AD Suite Engineering', 'VPAD', '5 Days', 'ACTIVE', 'CILT');
    SET @CurrentCourseID = SCOPE_IDENTITY();
END
ELSE
BEGIN
    SELECT @CurrentCourseID = CourseID FROM LMS_Courses WHERE Code = 'VPAD';
END

IF NOT EXISTS (SELECT 1 FROM CourseModes WHERE CourseID = @CurrentCourseID AND TrainingMode = 'CILT')
    INSERT INTO CourseModes (CourseID, TrainingMode) VALUES (@CurrentCourseID, 'CILT');

IF NOT EXISTS (SELECT 1 FROM CourseModes WHERE CourseID = @CurrentCourseID AND TrainingMode = 'VILT')
    INSERT INTO CourseModes (CourseID, TrainingMode) VALUES (@CurrentCourseID, 'VILT');

PRINT '--- Seeding CAMS ---';
IF NOT EXISTS (SELECT 1 FROM LMS_Courses WHERE Code = 'CAMS')
BEGIN
    INSERT INTO LMS_Courses (Title, Code, Duration, Status, Mode)
    VALUES ('Consolidated Alarm Management System', 'CAMS', '2 Days', 'ACTIVE', 'CILT');
    SET @CurrentCourseID = SCOPE_IDENTITY();
END
ELSE
BEGIN
    SELECT @CurrentCourseID = CourseID FROM LMS_Courses WHERE Code = 'CAMS';
END

IF NOT EXISTS (SELECT 1 FROM CourseModes WHERE CourseID = @CurrentCourseID AND TrainingMode = 'CILT')
    INSERT INTO CourseModes (CourseID, TrainingMode) VALUES (@CurrentCourseID, 'CILT');

IF NOT EXISTS (SELECT 1 FROM CourseModes WHERE CourseID = @CurrentCourseID AND TrainingMode = 'VILT')
    INSERT INTO CourseModes (CourseID, TrainingMode) VALUES (@CurrentCourseID, 'VILT');

PRINT '--- Seeding SEBL ---';
IF NOT EXISTS (SELECT 1 FROM LMS_Courses WHERE Code = 'SEBL')
BEGIN
    INSERT INTO LMS_Courses (Title, Code, Duration, Status, Mode)
    VALUES ('SEBOL Programming', 'SEBL', '3 Days', 'ACTIVE', 'CILT');
    SET @CurrentCourseID = SCOPE_IDENTITY();
END
ELSE
BEGIN
    SELECT @CurrentCourseID = CourseID FROM LMS_Courses WHERE Code = 'SEBL';
END

IF NOT EXISTS (SELECT 1 FROM CourseModes WHERE CourseID = @CurrentCourseID AND TrainingMode = 'CILT')
    INSERT INTO CourseModes (CourseID, TrainingMode) VALUES (@CurrentCourseID, 'CILT');

IF NOT EXISTS (SELECT 1 FROM CourseModes WHERE CourseID = @CurrentCourseID AND TrainingMode = 'VILT')
    INSERT INTO CourseModes (CourseID, TrainingMode) VALUES (@CurrentCourseID, 'VILT');

PRINT '--- Seeding STFT ---';
IF NOT EXISTS (SELECT 1 FROM LMS_Courses WHERE Code = 'STFT')
BEGIN
    INSERT INTO LMS_Courses (Title, Code, Duration, Status, Mode)
    VALUES ('STARDOM NCS with FAST/TOOLS SCADA', 'STFT', '5 Days', 'ACTIVE', 'CILT');
    SET @CurrentCourseID = SCOPE_IDENTITY();
END
ELSE
BEGIN
    SELECT @CurrentCourseID = CourseID FROM LMS_Courses WHERE Code = 'STFT';
END

IF NOT EXISTS (SELECT 1 FROM CourseModes WHERE CourseID = @CurrentCourseID AND TrainingMode = 'CILT')
    INSERT INTO CourseModes (CourseID, TrainingMode) VALUES (@CurrentCourseID, 'CILT');

IF NOT EXISTS (SELECT 1 FROM CourseModes WHERE CourseID = @CurrentCourseID AND TrainingMode = 'VILT')
    INSERT INTO CourseModes (CourseID, TrainingMode) VALUES (@CurrentCourseID, 'VILT');

PRINT '--- Seeding STCI ---';
IF NOT EXISTS (SELECT 1 FROM LMS_Courses WHERE Code = 'STCI')
BEGIN
    INSERT INTO LMS_Courses (Title, Code, Duration, Status, Mode)
    VALUES ('STARDOM NCS with CI Server', 'STCI', '5 Days', 'ACTIVE', 'CILT');
    SET @CurrentCourseID = SCOPE_IDENTITY();
END
ELSE
BEGIN
    SELECT @CurrentCourseID = CourseID FROM LMS_Courses WHERE Code = 'STCI';
END

IF NOT EXISTS (SELECT 1 FROM CourseModes WHERE CourseID = @CurrentCourseID AND TrainingMode = 'CILT')
    INSERT INTO CourseModes (CourseID, TrainingMode) VALUES (@CurrentCourseID, 'CILT');

IF NOT EXISTS (SELECT 1 FROM CourseModes WHERE CourseID = @CurrentCourseID AND TrainingMode = 'VILT')
    INSERT INTO CourseModes (CourseID, TrainingMode) VALUES (@CurrentCourseID, 'VILT');

PRINT '--- Seeding STEG ---';
IF NOT EXISTS (SELECT 1 FROM LMS_Courses WHERE Code = 'STEG')
BEGIN
    INSERT INTO LMS_Courses (Title, Code, Duration, Status, Mode)
    VALUES ('STARDOM NCS Engineering', 'STEG', '5 Days', 'ACTIVE', 'CILT');
    SET @CurrentCourseID = SCOPE_IDENTITY();
END
ELSE
BEGIN
    SELECT @CurrentCourseID = CourseID FROM LMS_Courses WHERE Code = 'STEG';
END

IF NOT EXISTS (SELECT 1 FROM CourseModes WHERE CourseID = @CurrentCourseID AND TrainingMode = 'CILT')
    INSERT INTO CourseModes (CourseID, TrainingMode) VALUES (@CurrentCourseID, 'CILT');

IF NOT EXISTS (SELECT 1 FROM CourseModes WHERE CourseID = @CurrentCourseID AND TrainingMode = 'VILT')
    INSERT INTO CourseModes (CourseID, TrainingMode) VALUES (@CurrentCourseID, 'VILT');

PRINT '--- Seeding FTOP ---';
IF NOT EXISTS (SELECT 1 FROM LMS_Courses WHERE Code = 'FTOP')
BEGIN
    INSERT INTO LMS_Courses (Title, Code, Duration, Status, Mode)
    VALUES ('FAST/TOOLS SCADA Operations', 'FTOP', '2 Days', 'ACTIVE', 'CILT');
    SET @CurrentCourseID = SCOPE_IDENTITY();
END
ELSE
BEGIN
    SELECT @CurrentCourseID = CourseID FROM LMS_Courses WHERE Code = 'FTOP';
END

IF NOT EXISTS (SELECT 1 FROM CourseModes WHERE CourseID = @CurrentCourseID AND TrainingMode = 'CILT')
    INSERT INTO CourseModes (CourseID, TrainingMode) VALUES (@CurrentCourseID, 'CILT');

IF NOT EXISTS (SELECT 1 FROM CourseModes WHERE CourseID = @CurrentCourseID AND TrainingMode = 'VILT')
    INSERT INTO CourseModes (CourseID, TrainingMode) VALUES (@CurrentCourseID, 'VILT');

PRINT '--- Seeding FTEG ---';
IF NOT EXISTS (SELECT 1 FROM LMS_Courses WHERE Code = 'FTEG')
BEGIN
    INSERT INTO LMS_Courses (Title, Code, Duration, Status, Mode)
    VALUES ('FAST/TOOLS SCADA Engineering', 'FTEG', '5 Days', 'ACTIVE', 'CILT');
    SET @CurrentCourseID = SCOPE_IDENTITY();
END
ELSE
BEGIN
    SELECT @CurrentCourseID = CourseID FROM LMS_Courses WHERE Code = 'FTEG';
END

IF NOT EXISTS (SELECT 1 FROM CourseModes WHERE CourseID = @CurrentCourseID AND TrainingMode = 'CILT')
    INSERT INTO CourseModes (CourseID, TrainingMode) VALUES (@CurrentCourseID, 'CILT');

IF NOT EXISTS (SELECT 1 FROM CourseModes WHERE CourseID = @CurrentCourseID AND TrainingMode = 'VILT')
    INSERT INTO CourseModes (CourseID, TrainingMode) VALUES (@CurrentCourseID, 'VILT');

PRINT '--- Seeding CIOP ---';
IF NOT EXISTS (SELECT 1 FROM LMS_Courses WHERE Code = 'CIOP')
BEGIN
    INSERT INTO LMS_Courses (Title, Code, Duration, Status, Mode)
    VALUES ('CI Server Operations', 'CIOP', '2 Days', 'ACTIVE', 'CILT');
    SET @CurrentCourseID = SCOPE_IDENTITY();
END
ELSE
BEGIN
    SELECT @CurrentCourseID = CourseID FROM LMS_Courses WHERE Code = 'CIOP';
END

IF NOT EXISTS (SELECT 1 FROM CourseModes WHERE CourseID = @CurrentCourseID AND TrainingMode = 'CILT')
    INSERT INTO CourseModes (CourseID, TrainingMode) VALUES (@CurrentCourseID, 'CILT');

IF NOT EXISTS (SELECT 1 FROM CourseModes WHERE CourseID = @CurrentCourseID AND TrainingMode = 'VILT')
    INSERT INTO CourseModes (CourseID, TrainingMode) VALUES (@CurrentCourseID, 'VILT');

PRINT '--- Seeding CIEG ---';
IF NOT EXISTS (SELECT 1 FROM LMS_Courses WHERE Code = 'CIEG')
BEGIN
    INSERT INTO LMS_Courses (Title, Code, Duration, Status, Mode)
    VALUES ('CI Server Engineering', 'CIEG', '5 Days', 'ACTIVE', 'CILT');
    SET @CurrentCourseID = SCOPE_IDENTITY();
END
ELSE
BEGIN
    SELECT @CurrentCourseID = CourseID FROM LMS_Courses WHERE Code = 'CIEG';
END

IF NOT EXISTS (SELECT 1 FROM CourseModes WHERE CourseID = @CurrentCourseID AND TrainingMode = 'CILT')
    INSERT INTO CourseModes (CourseID, TrainingMode) VALUES (@CurrentCourseID, 'CILT');

IF NOT EXISTS (SELECT 1 FROM CourseModes WHERE CourseID = @CurrentCourseID AND TrainingMode = 'VILT')
    INSERT INTO CourseModes (CourseID, TrainingMode) VALUES (@CurrentCourseID, 'VILT');

PRINT '--- Seeding FFEG ---';
IF NOT EXISTS (SELECT 1 FROM LMS_Courses WHERE Code = 'FFEG')
BEGIN
    INSERT INTO LMS_Courses (Title, Code, Duration, Status, Mode)
    VALUES ('Field Bus basics & Engineering', 'FFEG', '3 Days', 'ACTIVE', 'CILT');
    SET @CurrentCourseID = SCOPE_IDENTITY();
END
ELSE
BEGIN
    SELECT @CurrentCourseID = CourseID FROM LMS_Courses WHERE Code = 'FFEG';
END

IF NOT EXISTS (SELECT 1 FROM CourseModes WHERE CourseID = @CurrentCourseID AND TrainingMode = 'CILT')
    INSERT INTO CourseModes (CourseID, TrainingMode) VALUES (@CurrentCourseID, 'CILT');

IF NOT EXISTS (SELECT 1 FROM CourseModes WHERE CourseID = @CurrentCourseID AND TrainingMode = 'VILT')
    INSERT INTO CourseModes (CourseID, TrainingMode) VALUES (@CurrentCourseID, 'VILT');

PRINT '--- Seeding FPRM ---';
IF NOT EXISTS (SELECT 1 FROM LMS_Courses WHERE Code = 'FPRM')
BEGIN
    INSERT INTO LMS_Courses (Title, Code, Duration, Status, Mode)
    VALUES ('Field Bus Engineering & PRM', 'FPRM', '5 Days', 'ACTIVE', 'CILT');
    SET @CurrentCourseID = SCOPE_IDENTITY();
END
ELSE
BEGIN
    SELECT @CurrentCourseID = CourseID FROM LMS_Courses WHERE Code = 'FPRM';
END

IF NOT EXISTS (SELECT 1 FROM CourseModes WHERE CourseID = @CurrentCourseID AND TrainingMode = 'CILT')
    INSERT INTO CourseModes (CourseID, TrainingMode) VALUES (@CurrentCourseID, 'CILT');

IF NOT EXISTS (SELECT 1 FROM CourseModes WHERE CourseID = @CurrentCourseID AND TrainingMode = 'VILT')
    INSERT INTO CourseModes (CourseID, TrainingMode) VALUES (@CurrentCourseID, 'VILT');

PRINT '--- Seeding PBUS ---';
IF NOT EXISTS (SELECT 1 FROM LMS_Courses WHERE Code = 'PBUS')
BEGIN
    INSERT INTO LMS_Courses (Title, Code, Duration, Status, Mode)
    VALUES ('PROFIBUS Basics and Engineering', 'PBUS', '2 Days', 'ACTIVE', 'CILT');
    SET @CurrentCourseID = SCOPE_IDENTITY();
END
ELSE
BEGIN
    SELECT @CurrentCourseID = CourseID FROM LMS_Courses WHERE Code = 'PBUS';
END

IF NOT EXISTS (SELECT 1 FROM CourseModes WHERE CourseID = @CurrentCourseID AND TrainingMode = 'CILT')
    INSERT INTO CourseModes (CourseID, TrainingMode) VALUES (@CurrentCourseID, 'CILT');

IF NOT EXISTS (SELECT 1 FROM CourseModes WHERE CourseID = @CurrentCourseID AND TrainingMode = 'VILT')
    INSERT INTO CourseModes (CourseID, TrainingMode) VALUES (@CurrentCourseID, 'VILT');

PRINT '--- Seeding INCP ---';
IF NOT EXISTS (SELECT 1 FROM LMS_Courses WHERE Code = 'INCP')
BEGIN
    INSERT INTO LMS_Courses (Title, Code, Duration, Status, Mode)
    VALUES ('Industrial Communication Protocols', 'INCP', '3 Days', 'ACTIVE', 'CILT');
    SET @CurrentCourseID = SCOPE_IDENTITY();
END
ELSE
BEGIN
    SELECT @CurrentCourseID = CourseID FROM LMS_Courses WHERE Code = 'INCP';
END

IF NOT EXISTS (SELECT 1 FROM CourseModes WHERE CourseID = @CurrentCourseID AND TrainingMode = 'CILT')
    INSERT INTO CourseModes (CourseID, TrainingMode) VALUES (@CurrentCourseID, 'CILT');

IF NOT EXISTS (SELECT 1 FROM CourseModes WHERE CourseID = @CurrentCourseID AND TrainingMode = 'VILT')
    INSERT INTO CourseModes (CourseID, TrainingMode) VALUES (@CurrentCourseID, 'VILT');

PRINT '--- Seeding FIPC ---';
IF NOT EXISTS (SELECT 1 FROM LMS_Courses WHERE Code = 'FIPC')
BEGIN
    INSERT INTO LMS_Courses (Title, Code, Duration, Status, Mode)
    VALUES ('Field Instruments for Process Control', 'FIPC', '5 Days', 'ACTIVE', 'CILT');
    SET @CurrentCourseID = SCOPE_IDENTITY();
END
ELSE
BEGIN
    SELECT @CurrentCourseID = CourseID FROM LMS_Courses WHERE Code = 'FIPC';
END

IF NOT EXISTS (SELECT 1 FROM CourseModes WHERE CourseID = @CurrentCourseID AND TrainingMode = 'CILT')
    INSERT INTO CourseModes (CourseID, TrainingMode) VALUES (@CurrentCourseID, 'CILT');

PRINT '--- Seeding PRMB ---';
IF NOT EXISTS (SELECT 1 FROM LMS_Courses WHERE Code = 'PRMB')
BEGIN
    INSERT INTO LMS_Courses (Title, Code, Duration, Status, Mode)
    VALUES ('Asset Management Software- PRM', 'PRMB', '3 Days', 'ACTIVE', 'CILT');
    SET @CurrentCourseID = SCOPE_IDENTITY();
END
ELSE
BEGIN
    SELECT @CurrentCourseID = CourseID FROM LMS_Courses WHERE Code = 'PRMB';
END

IF NOT EXISTS (SELECT 1 FROM CourseModes WHERE CourseID = @CurrentCourseID AND TrainingMode = 'CILT')
    INSERT INTO CourseModes (CourseID, TrainingMode) VALUES (@CurrentCourseID, 'CILT');

IF NOT EXISTS (SELECT 1 FROM CourseModes WHERE CourseID = @CurrentCourseID AND TrainingMode = 'VILT')
    INSERT INTO CourseModes (CourseID, TrainingMode) VALUES (@CurrentCourseID, 'VILT');

PRINT '--- Seeding CSIC ---';
IF NOT EXISTS (SELECT 1 FROM LMS_Courses WHERE Code = 'CSIC')
BEGIN
    INSERT INTO LMS_Courses (Title, Code, Duration, Status, Mode)
    VALUES ('Cyber Security for Industrial Control System', 'CSIC', '3 Days', 'ACTIVE', 'CILT');
    SET @CurrentCourseID = SCOPE_IDENTITY();
END
ELSE
BEGIN
    SELECT @CurrentCourseID = CourseID FROM LMS_Courses WHERE Code = 'CSIC';
END

IF NOT EXISTS (SELECT 1 FROM CourseModes WHERE CourseID = @CurrentCourseID AND TrainingMode = 'CILT')
    INSERT INTO CourseModes (CourseID, TrainingMode) VALUES (@CurrentCourseID, 'CILT');

IF NOT EXISTS (SELECT 1 FROM CourseModes WHERE CourseID = @CurrentCourseID AND TrainingMode = 'VILT')
    INSERT INTO CourseModes (CourseID, TrainingMode) VALUES (@CurrentCourseID, 'VILT');

PRINT '--- Seeding RSOP ---';
IF NOT EXISTS (SELECT 1 FROM LMS_Courses WHERE Code = 'RSOP')
BEGIN
    INSERT INTO LMS_Courses (Title, Code, Duration, Status, Mode)
    VALUES ('PROSAFE RS Operations', 'RSOP', '2 Days', 'ACTIVE', 'CILT');
    SET @CurrentCourseID = SCOPE_IDENTITY();
END
ELSE
BEGIN
    SELECT @CurrentCourseID = CourseID FROM LMS_Courses WHERE Code = 'RSOP';
END

IF NOT EXISTS (SELECT 1 FROM CourseModes WHERE CourseID = @CurrentCourseID AND TrainingMode = 'CILT')
    INSERT INTO CourseModes (CourseID, TrainingMode) VALUES (@CurrentCourseID, 'CILT');

IF NOT EXISTS (SELECT 1 FROM CourseModes WHERE CourseID = @CurrentCourseID AND TrainingMode = 'VILT')
    INSERT INTO CourseModes (CourseID, TrainingMode) VALUES (@CurrentCourseID, 'VILT');

PRINT '--- Seeding RSFT ---';
IF NOT EXISTS (SELECT 1 FROM LMS_Courses WHERE Code = 'RSFT')
BEGIN
    INSERT INTO LMS_Courses (Title, Code, Duration, Status, Mode)
    VALUES ('PROSAFE-RS Engineering with FAST/TOOLS SCADA', 'RSFT', '5 Days', 'ACTIVE', 'CILT');
    SET @CurrentCourseID = SCOPE_IDENTITY();
END
ELSE
BEGIN
    SELECT @CurrentCourseID = CourseID FROM LMS_Courses WHERE Code = 'RSFT';
END

IF NOT EXISTS (SELECT 1 FROM CourseModes WHERE CourseID = @CurrentCourseID AND TrainingMode = 'CILT')
    INSERT INTO CourseModes (CourseID, TrainingMode) VALUES (@CurrentCourseID, 'CILT');

IF NOT EXISTS (SELECT 1 FROM CourseModes WHERE CourseID = @CurrentCourseID AND TrainingMode = 'VILT')
    INSERT INTO CourseModes (CourseID, TrainingMode) VALUES (@CurrentCourseID, 'VILT');

PRINT '--- Seeding RSCI ---';
IF NOT EXISTS (SELECT 1 FROM LMS_Courses WHERE Code = 'RSCI')
BEGIN
    INSERT INTO LMS_Courses (Title, Code, Duration, Status, Mode)
    VALUES ('PROSAFE-RS Engineering with CI Server', 'RSCI', '5 Days', 'ACTIVE', 'CILT');
    SET @CurrentCourseID = SCOPE_IDENTITY();
END
ELSE
BEGIN
    SELECT @CurrentCourseID = CourseID FROM LMS_Courses WHERE Code = 'RSCI';
END

IF NOT EXISTS (SELECT 1 FROM CourseModes WHERE CourseID = @CurrentCourseID AND TrainingMode = 'CILT')
    INSERT INTO CourseModes (CourseID, TrainingMode) VALUES (@CurrentCourseID, 'CILT');

IF NOT EXISTS (SELECT 1 FROM CourseModes WHERE CourseID = @CurrentCourseID AND TrainingMode = 'VILT')
    INSERT INTO CourseModes (CourseID, TrainingMode) VALUES (@CurrentCourseID, 'VILT');

PRINT '--- Seeding PPRS ---';
IF NOT EXISTS (SELECT 1 FROM LMS_Courses WHERE Code = 'PPRS')
BEGIN
    INSERT INTO LMS_Courses (Title, Code, Duration, Status, Mode)
    VALUES ('PROSAFE RS Engineering', 'PPRS', '5 Days', 'ACTIVE', 'CILT');
    SET @CurrentCourseID = SCOPE_IDENTITY();
END
ELSE
BEGIN
    SELECT @CurrentCourseID = CourseID FROM LMS_Courses WHERE Code = 'PPRS';
END

IF NOT EXISTS (SELECT 1 FROM CourseModes WHERE CourseID = @CurrentCourseID AND TrainingMode = 'CILT')
    INSERT INTO CourseModes (CourseID, TrainingMode) VALUES (@CurrentCourseID, 'CILT');

IF NOT EXISTS (SELECT 1 FROM CourseModes WHERE CourseID = @CurrentCourseID AND TrainingMode = 'VILT')
    INSERT INTO CourseModes (CourseID, TrainingMode) VALUES (@CurrentCourseID, 'VILT');

PRINT '--- Seeding RSAE ---';
IF NOT EXISTS (SELECT 1 FROM LMS_Courses WHERE Code = 'RSAE')
BEGIN
    INSERT INTO LMS_Courses (Title, Code, Duration, Status, Mode)
    VALUES ('PROSAFE-RS Advanced Engineering', 'RSAE', '5 Days', 'ACTIVE', 'CILT');
    SET @CurrentCourseID = SCOPE_IDENTITY();
END
ELSE
BEGIN
    SELECT @CurrentCourseID = CourseID FROM LMS_Courses WHERE Code = 'RSAE';
END

IF NOT EXISTS (SELECT 1 FROM CourseModes WHERE CourseID = @CurrentCourseID AND TrainingMode = 'CILT')
    INSERT INTO CourseModes (CourseID, TrainingMode) VALUES (@CurrentCourseID, 'CILT');

IF NOT EXISTS (SELECT 1 FROM CourseModes WHERE CourseID = @CurrentCourseID AND TrainingMode = 'VILT')
    INSERT INTO CourseModes (CourseID, TrainingMode) VALUES (@CurrentCourseID, 'VILT');

PRINT '--- Seeding RSAD ---';
IF NOT EXISTS (SELECT 1 FROM LMS_Courses WHERE Code = 'RSAD')
BEGIN
    INSERT INTO LMS_Courses (Title, Code, Duration, Status, Mode)
    VALUES ('PROSAFE-RS with ADsuite Engineering', 'RSAD', '2 Days', 'ACTIVE', 'CILT');
    SET @CurrentCourseID = SCOPE_IDENTITY();
END
ELSE
BEGIN
    SELECT @CurrentCourseID = CourseID FROM LMS_Courses WHERE Code = 'RSAD';
END

IF NOT EXISTS (SELECT 1 FROM CourseModes WHERE CourseID = @CurrentCourseID AND TrainingMode = 'CILT')
    INSERT INTO CourseModes (CourseID, TrainingMode) VALUES (@CurrentCourseID, 'CILT');

IF NOT EXISTS (SELECT 1 FROM CourseModes WHERE CourseID = @CurrentCourseID AND TrainingMode = 'VILT')
    INSERT INTO CourseModes (CourseID, TrainingMode) VALUES (@CurrentCourseID, 'VILT');

PRINT '--- Seeding FSUS ---';
IF NOT EXISTS (SELECT 1 FROM LMS_Courses WHERE Code = 'FSUS')
BEGIN
    INSERT INTO LMS_Courses (Title, Code, Duration, Status, Mode)
    VALUES ('Functional Safety for End Users', 'FSUS', '2 Days', 'ACTIVE', 'CILT');
    SET @CurrentCourseID = SCOPE_IDENTITY();
END
ELSE
BEGIN
    SELECT @CurrentCourseID = CourseID FROM LMS_Courses WHERE Code = 'FSUS';
END

IF NOT EXISTS (SELECT 1 FROM CourseModes WHERE CourseID = @CurrentCourseID AND TrainingMode = 'CILT')
    INSERT INTO CourseModes (CourseID, TrainingMode) VALUES (@CurrentCourseID, 'CILT');

PRINT '--- Seeding CENTUM VP TEST ---';
IF EXISTS (SELECT 1 FROM LMS_Courses WHERE Code = 'TEST-21')
BEGIN
    SELECT @CurrentCourseID = CourseID FROM LMS_Courses WHERE Code = 'TEST-21';
END
ELSE IF NOT EXISTS (SELECT 1 FROM LMS_Courses WHERE CourseID = 21)
BEGIN
    SET IDENTITY_INSERT LMS_Courses ON;
    INSERT INTO LMS_Courses (CourseID, Title, Code, Duration, Status, Mode)
    VALUES (21, 'CENTUM VP TEST', 'TEST-21', '10 Minutes', 'ACTIVE', 'CILT');
    SET IDENTITY_INSERT LMS_Courses OFF;
    SET @CurrentCourseID = 21;
END
ELSE
BEGIN
    -- If CourseID 21 belongs to another course, DO NOT overwrite it. Insert safely.
    INSERT INTO LMS_Courses (Title, Code, Duration, Status, Mode)
    VALUES ('CENTUM VP TEST', 'TEST-21', '10 Minutes', 'ACTIVE', 'CILT');
    SET @CurrentCourseID = SCOPE_IDENTITY();
END

-- Ensure TEST course has all 4 modes
IF NOT EXISTS (SELECT 1 FROM CourseModes WHERE CourseID = @CurrentCourseID AND TrainingMode = 'CILT')
    INSERT INTO CourseModes (CourseID, TrainingMode) VALUES (@CurrentCourseID, 'CILT');
IF NOT EXISTS (SELECT 1 FROM CourseModes WHERE CourseID = @CurrentCourseID AND TrainingMode = 'VILT')
    INSERT INTO CourseModes (CourseID, TrainingMode) VALUES (@CurrentCourseID, 'VILT');
IF NOT EXISTS (SELECT 1 FROM CourseModes WHERE CourseID = @CurrentCourseID AND TrainingMode = 'SITE')
    INSERT INTO CourseModes (CourseID, TrainingMode) VALUES (@CurrentCourseID, 'SITE');
IF NOT EXISTS (SELECT 1 FROM CourseModes WHERE CourseID = @CurrentCourseID AND TrainingMode = 'ELEARNING')
    INSERT INTO CourseModes (CourseID, TrainingMode) VALUES (@CurrentCourseID, 'ELEARNING');

PRINT '--- Seeding Complete ---';
GO
